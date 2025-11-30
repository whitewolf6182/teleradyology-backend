import db from '../config/database';
import type {
  Institution,
  CreateInstitutionDTO,
  UpdateInstitutionDTO,
  InstitutionFilters
} from '../models';

/**
 * InstitutionRepository
 * Sağlık kurumları (hastaneler, tıp merkezleri, görüntüleme merkezleri) için veri erişim katmanı
 */
export class InstitutionRepository {
  /**
   * ID'ye göre kurum getirir
   * @param id - Kurum ID'si (UUID)
   * @returns Institution veya null
   */
  async findById(id: string): Promise<Institution | null> {
    const result = await db`
      SELECT * FROM institutions
      WHERE institution_id = ${id}
    `;
    return result[0] || null;
  }


  /**
   * Kurum koduna göre kurum getirir
   * @param code - Kurum kodu (unique)
   * @returns Institution veya null
   */
  async findByCode(code: string): Promise<Institution | null> {
    const result = await db`
      SELECT * FROM institutions
      WHERE institution_code = ${code}
    `;
    return result[0] || null;
  }

  /**
   * Tüm kurumları filtrelerle birlikte getirir
   * @param filters - Filtreleme kriterleri (type, city, country, is_active, search)
   * @returns Institution dizisi
   */
  async findAll(filters?: InstitutionFilters): Promise<Institution[]> {
    let query = db`SELECT * FROM institutions WHERE 1=1`;

    if (filters?.institution_type) {
      query = db`${query} AND institution_type = ${filters.institution_type}`;
    }

    if (filters?.city) {
      query = db`${query} AND city = ${filters.city}`;
    }

    if (filters?.country) {
      query = db`${query} AND country = ${filters.country}`;
    }

    if (filters?.is_active !== undefined) {
      query = db`${query} AND is_active = ${filters.is_active}`;
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      query = db`${query} AND (
        institution_name ILIKE ${searchTerm} OR
        institution_code ILIKE ${searchTerm} OR
        city ILIKE ${searchTerm}
      )`;
    }

    query = db`${query} ORDER BY institution_name ASC`;

    return await query;
  }

  /**
   * Sadece aktif kurumları getirir
   * @returns Aktif Institution dizisi
   */
  async findActive(): Promise<Institution[]> {
    return await db`
      SELECT * FROM institutions
      WHERE is_active = true
      ORDER BY institution_name ASC
    `;
  }

  /**
   * Kurum tipine göre kurumları getirir
   * @param type - Kurum tipi (hospital, medical_center, imaging_center, clinic)
   * @returns Institution dizisi
   */
  async findByType(type: string): Promise<Institution[]> {
    return await db`
      SELECT * FROM institutions
      WHERE institution_type = ${type} AND is_active = true
      ORDER BY institution_name ASC
    `;
  }

  /**
   * Yeni kurum oluşturur
   * @param data - Kurum bilgileri
   * @param userId - Oluşturan kullanıcı ID'si
   * @returns Oluşturulan Institution
   */
  async create(data: CreateInstitutionDTO, userId: string): Promise<CreateInstitutionDTO> {
    const result = await db`
      INSERT INTO institutions (
        institution_name, institution_type, contact_person, email, phone, address, website, city, county,is_active
      )
      VALUES (
        ${data.institution_name}, ${data.institution_type}, ${data.contact_person},
        ${data.email || null}, ${data.phone || null}, ${data.address || null},
        ${data.website || null}, ${data.city || null}, ${data.county || null}, ${data.is_active || true}
      )
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Kurum bilgilerini günceller
   * @param id - Kurum ID'si
   * @param data - Güncellenecek alanlar
   * @returns Güncellenmiş Institution
   * @throws Kurum bulunamazsa hata fırlatır
   */
  async update(id: string, data: UpdateInstitutionDTO): Promise<Institution> {
    const fields = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key} = ${db.escape(value)}`)
      .join(', ');

    if (!fields) {
      throw new Error('No fields to update');
    }

    const result = await db`
      UPDATE institutions
      SET ${db.raw(fields)}
      WHERE institution_id = ${id}
      RETURNING *
    `;

    if (!result[0]) {
      throw new Error('Institution not found');
    }

    return result[0];
  }

  /**
   * Kurumu pasif yapar (soft delete)
   * @param id - Kurum ID'si
   * @returns Güncellenmiş Institution
   */
  async deactivate(id: string): Promise<Institution> {
    const result = await db`
      UPDATE institutions
      SET is_active = false
      WHERE institution_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Kurumu aktif yapar
   * @param id - Kurum ID'si
   * @returns Güncellenmiş Institution
   */
  async activate(id: string): Promise<Institution> {
    const result = await db`
      UPDATE institutions
      SET is_active = true
      WHERE institution_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Kurumu kalıcı olarak siler
   * @param id - Kurum ID'si
   */
  async delete(id: string): Promise<void> {
    await db`
      DELETE FROM institutions
      WHERE institution_id = ${id}
    `;
  }

  /**
   * Kurum istatistiklerini getirir
   * @param id - Kurum ID'si
   * @returns İstatistik bilgileri
   */
  async getStatistics(id: string) {
    const result = await db`
      SELECT
        COUNT(*) as total_studies,
        COUNT(*) FILTER (WHERE study_status = 'pending') as pending_studies,
        COUNT(*) FILTER (WHERE study_status = 'completed') as completed_studies
      FROM studies
      WHERE institution_id = ${id}
    `;
    return result[0];
  }
}
