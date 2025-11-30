import db from '../config/database';
import type {
  ProcedureType,
  ProcedureTypeWithCreator,
  CreateProcedureTypeDTO,
  UpdateProcedureTypeDTO,
  ProcedureTypeFilters
} from '../models';

/**
 * ProcedureTypeRepository
 * Prosedür/tetkik tipleri için veri erişim katmanı
 * Radyolojik tetkik ve işlem tiplerinin yönetimi
 */
export class ProcedureTypeRepository {
  /**
   * ID'ye göre prosedür tipi getirir
   * @param id - ProcedureType ID'si (UUID)
   * @returns ProcedureType veya null
   */
  async findById(id: string): Promise<ProcedureType | null> {
    const result = await db`
      SELECT * FROM procedure_types
      WHERE proc_type_id = ${id}
    `;
    return result[0] || null;
  }

  /**
   * Detaylı bilgilerle prosedür tipi getirir (oluşturan kişi dahil)
   * @param id - ProcedureType ID'si (UUID)
   * @returns ProcedureTypeWithCreator veya null
   */
  async findByIdWithCreator(id: string): Promise<ProcedureTypeWithCreator | null> {
    const result = await db`
      SELECT
        pt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM procedure_types pt
      LEFT JOIN users u ON u.id = pt.created_by
      WHERE pt.proc_type_id = ${id}
    `;
    return result[0] || null;
  }

  /**
   * Prosedür koduna göre prosedür tipi bulur
   * @param code - Prosedür kodu (unique)
   * @returns ProcedureType veya null
   */
  async findByCode(code: string): Promise<ProcedureType | null> {
    const result = await db`
      SELECT * FROM procedure_types
      WHERE proc_code = ${code}
    `;
    return result[0] || null;
  }

  /**
   * Tüm prosedür tiplerini filtrelerle getirir
   * @param filters - Filtreleme kriterleri
   * @returns ProcedureTypeWithCreator dizisi
   */
  async findAll(filters?: ProcedureTypeFilters): Promise<ProcedureTypeWithCreator[]> {
    let whereConditions: string[] = ['1=1'];

    if (filters?.modality) {
      whereConditions.push(`pt.modality = '${filters.modality}'`);
    }

    if (filters?.body_part) {
      whereConditions.push(`pt.body_part = '${filters.body_part}'`);
    }

    if (filters?.category) {
      whereConditions.push(`pt.category = '${filters.category}'`);
    }

    if (filters?.is_emergency !== undefined) {
      whereConditions.push(`pt.is_emergency = ${filters.is_emergency}`);
    }

    if (filters?.is_contrast !== undefined) {
      whereConditions.push(`pt.is_contrast = ${filters.is_contrast}`);
    }

    if (filters?.requires_preparation !== undefined) {
      whereConditions.push(`pt.requires_preparation = ${filters.requires_preparation}`);
    }

    if (filters?.radiation_dose) {
      whereConditions.push(`pt.radiation_dose = '${filters.radiation_dose}'`);
    }

    if (filters?.is_active !== undefined) {
      whereConditions.push(`pt.is_active = ${filters.is_active}`);
    }

    if (filters?.min_price !== undefined) {
      whereConditions.push(`pt.price >= ${filters.min_price}`);
    }

    if (filters?.max_price !== undefined) {
      whereConditions.push(`pt.price <= ${filters.max_price}`);
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      whereConditions.push(`(
        LOWER(pt.name) LIKE '%${searchTerm}%' OR
        LOWER(pt.name_en) LIKE '%${searchTerm}%' OR
        LOWER(pt.proc_code) LIKE '%${searchTerm}%' OR
        LOWER(pt.description) LIKE '%${searchTerm}%'
      )`);
    }

    if (filters?.tags && filters.tags.length > 0) {
      const tagsCondition = filters.tags.map(tag => `'${tag}'`).join(',');
      whereConditions.push(`pt.tags && ARRAY[${tagsCondition}]`);
    }

    const whereClause = whereConditions.join(' AND ');

    return await db`
      SELECT
        pt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM procedure_types pt
      LEFT JOIN users u ON u.id = pt.created_by
      WHERE ${db.raw(whereClause)}
      ORDER BY pt.name
    `;
  }

  /**
   * Aktif prosedür tiplerini getirir
   * @returns ProcedureTypeWithCreator dizisi
   */
  async findActive(): Promise<ProcedureTypeWithCreator[]> {
    return await db`
      SELECT
        pt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM procedure_types pt
      LEFT JOIN users u ON u.id = pt.created_by
      WHERE pt.is_active = true
      ORDER BY pt.name
    `;
  }

  /**
   * Modaliteye göre prosedür tiplerini getirir
   * @param modality - Modalite (CT, MR, US, XR vb.)
   * @returns ProcedureTypeWithCreator dizisi
   */
  async findByModality(modality: string): Promise<ProcedureTypeWithCreator[]> {
    return await db`
      SELECT
        pt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM procedure_types pt
      LEFT JOIN users u ON u.id = pt.created_by
      WHERE pt.modality = ${modality} AND pt.is_active = true
      ORDER BY pt.usage_count DESC, pt.name
    `;
  }

  /**
   * Vücut bölgesine göre prosedür tiplerini getirir
   * @param bodyPart - Vücut bölgesi (chest, abdomen, brain vb.)
   * @returns ProcedureTypeWithCreator dizisi
   */
  async findByBodyPart(bodyPart: string): Promise<ProcedureTypeWithCreator[]> {
    return await db`
      SELECT
        pt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM procedure_types pt
      LEFT JOIN users u ON u.id = pt.created_by
      WHERE pt.body_part = ${bodyPart} AND pt.is_active = true
      ORDER BY pt.usage_count DESC
    `;
  }

  /**
   * Kategoriye göre prosedür tiplerini getirir
   * @param category - Kategori (diagnostic, interventional, screening, therapeutic)
   * @returns ProcedureTypeWithCreator dizisi
   */
  async findByCategory(category: string): Promise<ProcedureTypeWithCreator[]> {
    return await db`
      SELECT
        pt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM procedure_types pt
      LEFT JOIN users u ON u.id = pt.created_by
      WHERE pt.category = ${category} AND pt.is_active = true
      ORDER BY pt.name
    `;
  }

  /**
   * Acil prosedürleri getirir
   * @returns ProcedureTypeWithCreator dizisi
   */
  async findEmergency(): Promise<ProcedureTypeWithCreator[]> {
    return await db`
      SELECT
        pt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM procedure_types pt
      LEFT JOIN users u ON u.id = pt.created_by
      WHERE pt.is_emergency = true AND pt.is_active = true
      ORDER BY pt.modality, pt.name
    `;
  }

  /**
   * Kontrast gerektiren prosedürleri getirir
   * @returns ProcedureTypeWithCreator dizisi
   */
  async findWithContrast(): Promise<ProcedureTypeWithCreator[]> {
    return await db`
      SELECT
        pt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM procedure_types pt
      LEFT JOIN users u ON u.id = pt.created_by
      WHERE pt.is_contrast = true AND pt.is_active = true
      ORDER BY pt.modality, pt.name
    `;
  }

  /**
   * Hazırlık gerektiren prosedürleri getirir
   * @returns ProcedureTypeWithCreator dizisi
   */
  async findRequiringPreparation(): Promise<ProcedureTypeWithCreator[]> {
    return await db`
      SELECT
        pt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM procedure_types pt
      LEFT JOIN users u ON u.id = pt.created_by
      WHERE pt.requires_preparation = true AND pt.is_active = true
      ORDER BY pt.modality, pt.name
    `;
  }

  /**
   * Radyasyon dozuna göre prosedürleri getirir
   * @param dose - Radyasyon dozu (none, low, medium, high, very_high)
   * @returns ProcedureTypeWithCreator dizisi
   */
  async findByRadiationDose(dose: string): Promise<ProcedureTypeWithCreator[]> {
    return await db`
      SELECT
        pt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM procedure_types pt
      LEFT JOIN users u ON u.id = pt.created_by
      WHERE pt.radiation_dose = ${dose} AND pt.is_active = true
      ORDER BY pt.name
    `;
  }

  /**
   * En çok kullanılan prosedür tiplerini getirir
   * @param limit - Kaç adet (varsayılan: 10)
   * @returns ProcedureTypeWithCreator dizisi
   */
  async findMostUsed(limit: number = 10): Promise<ProcedureTypeWithCreator[]> {
    return await db`
      SELECT
        pt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM procedure_types pt
      LEFT JOIN users u ON u.id = pt.created_by
      WHERE pt.is_active = true
      ORDER BY pt.usage_count DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Etiketlere göre prosedürleri arar
   * @param tags - Etiket dizisi
   * @returns ProcedureTypeWithCreator dizisi
   */
  async findByTags(tags: string[]): Promise<ProcedureTypeWithCreator[]> {
    return await db`
      SELECT
        pt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM procedure_types pt
      LEFT JOIN users u ON u.id = pt.created_by
      WHERE pt.tags && ${tags} AND pt.is_active = true
      ORDER BY pt.usage_count DESC
    `;
  }

  /**
   * Yeni prosedür tipi oluşturur
   * @param data - Prosedür tipi bilgileri
   * @returns Oluşturulan ProcedureType
   */
  async create(data: CreateProcedureTypeDTO): Promise<ProcedureType> {
    const result = await db`
      INSERT INTO procedure_types (
        proc_code, name, name_en, description, modality,
        body_part, category, is_emergency, is_contrast,
        requires_preparation, preparation_instructions,
        typical_duration, radiation_dose, price, cpt_code,
        icd_codes, tags, created_by
      )
      VALUES (
        ${data.proc_code}, ${data.name}, ${data.name_en || null},
        ${data.description || null}, ${data.modality},
        ${data.body_part || null}, ${data.category},
        ${data.is_emergency || false}, ${data.is_contrast || false},
        ${data.requires_preparation || false},
        ${data.preparation_instructions || null},
        ${data.typical_duration || 15}, ${data.radiation_dose || null},
        ${data.price || null}, ${data.cpt_code || null},
        ${data.icd_codes || []}, ${data.tags || []},
        ${data.created_by || null}
      )
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Prosedür tipi bilgilerini günceller
   * @param id - ProcedureType ID'si
   * @param data - Güncellenecek alanlar
   * @returns Güncellenmiş ProcedureType
   */
  async update(id: string, data: UpdateProcedureTypeDTO): Promise<ProcedureType> {
    const fields = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key} = ${db.escape(value)}`)
      .join(', ');

    if (!fields) {
      throw new Error('No fields to update');
    }

    const result = await db`
      UPDATE procedure_types
      SET ${db.raw(fields)}
      WHERE proc_type_id = ${id}
      RETURNING *
    `;

    if (!result[0]) {
      throw new Error('Procedure type not found');
    }

    return result[0];
  }

  /**
   * Prosedür tipini aktif hale getirir
   * @param id - ProcedureType ID'si
   * @returns Güncellenmiş ProcedureType
   */
  async activate(id: string): Promise<ProcedureType> {
    const result = await db`
      UPDATE procedure_types
      SET is_active = true
      WHERE proc_type_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Prosedür tipini pasif hale getirir
   * @param id - ProcedureType ID'si
   * @returns Güncellenmiş ProcedureType
   */
  async deactivate(id: string): Promise<ProcedureType> {
    const result = await db`
      UPDATE procedure_types
      SET is_active = false
      WHERE proc_type_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Prosedür tipinin kullanım sayacını artırır
   * @param id - ProcedureType ID'si
   * @returns Güncellenmiş ProcedureType
   */
  async incrementUsage(id: string): Promise<ProcedureType> {
    const result = await db`
      UPDATE procedure_types
      SET usage_count = usage_count + 1
      WHERE proc_type_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Prosedür tipini kalıcı olarak siler
   * @param id - ProcedureType ID'si
   */
  async delete(id: string): Promise<void> {
    await db`
      DELETE FROM procedure_types
      WHERE proc_type_id = ${id}
    `;
  }

  /**
   * Genel prosedür tipi istatistiklerini getirir
   * @returns İstatistik bilgileri
   */
  async getStatistics() {
    const result = await db`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_emergency = true) as emergency,
        COUNT(*) FILTER (WHERE is_contrast = true) as with_contrast,
        COUNT(*) FILTER (WHERE requires_preparation = true) as requires_prep,
        AVG(typical_duration) as avg_duration,
        SUM(usage_count) as total_usage,
        SUM(price * usage_count) as total_revenue
      FROM procedure_types
    `;
    return result[0];
  }

  /**
   * Modalitelere göre prosedür sayılarını getirir
   * @returns Modalite bazlı istatistikler
   */
  async getStatisticsByModality() {
    return await db`
      SELECT
        modality,
        COUNT(*) as total,
        SUM(usage_count) as total_usage,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_emergency = true) as emergency_count,
        AVG(typical_duration) as avg_duration,
        SUM(price * usage_count) as revenue
      FROM procedure_types
      GROUP BY modality
      ORDER BY total_usage DESC
    `;
  }

  /**
   * Kategorilere göre prosedür sayılarını getirir
   * @returns Kategori bazlı istatistikler
   */
  async getStatisticsByCategory() {
    return await db`
      SELECT
        category,
        COUNT(*) as total,
        SUM(usage_count) as total_usage,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        AVG(typical_duration) as avg_duration
      FROM procedure_types
      GROUP BY category
      ORDER BY total DESC
    `;
  }

  /**
   * Vücut bölgelerine göre prosedür sayılarını getirir
   * @returns Vücut bölgesi bazlı istatistikler
   */
  async getStatisticsByBodyPart() {
    return await db`
      SELECT
        body_part,
        COUNT(*) as total,
        SUM(usage_count) as total_usage,
        AVG(typical_duration) as avg_duration
      FROM procedure_types
      WHERE body_part IS NOT NULL
      GROUP BY body_part
      ORDER BY total_usage DESC
    `;
  }

  /**
   * Radyasyon dozuna göre prosedür sayılarını getirir
   * @returns Radyasyon dozu bazlı istatistikler
   */
  async getStatisticsByRadiationDose() {
    return await db`
      SELECT
        radiation_dose,
        COUNT(*) as total,
        SUM(usage_count) as total_usage
      FROM procedure_types
      WHERE radiation_dose IS NOT NULL
      GROUP BY radiation_dose
      ORDER BY
        CASE radiation_dose
          WHEN 'none' THEN 1
          WHEN 'low' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'high' THEN 4
          WHEN 'very_high' THEN 5
        END
    `;
  }

  /**
   * Tüm benzersiz modaliteleri getirir
   * @returns Modalite dizisi
   */
  async getUniqueModalities(): Promise<string[]> {
    const result = await db`
      SELECT DISTINCT modality
      FROM procedure_types
      WHERE modality IS NOT NULL AND is_active = true
      ORDER BY modality
    `;
    return result.map((r: any) => r.modality);
  }

  /**
   * Tüm benzersiz vücut bölgelerini getirir
   * @returns Vücut bölgesi dizisi
   */
  async getUniqueBodyParts(): Promise<string[]> {
    const result = await db`
      SELECT DISTINCT body_part
      FROM procedure_types
      WHERE body_part IS NOT NULL AND is_active = true
      ORDER BY body_part
    `;
    return result.map((r: any) => r.body_part);
  }

  /**
   * Tüm etiketleri getirir
   * @returns Etiket dizisi
   */
  async getAllTags(): Promise<string[]> {
    const result = await db`
      SELECT DISTINCT UNNEST(tags) as tag
      FROM procedure_types
      WHERE is_active = true
      ORDER BY tag
    `;
    return result.map((r: any) => r.tag);
  }

  /**
   * Fiyat aralığına göre prosedürleri getirir
   * @param minPrice - Minimum fiyat
   * @param maxPrice - Maximum fiyat
   * @returns ProcedureTypeWithCreator dizisi
   */
  async findByPriceRange(minPrice: number, maxPrice: number): Promise<ProcedureTypeWithCreator[]> {
    return await db`
      SELECT
        pt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM procedure_types pt
      LEFT JOIN users u ON u.id = pt.created_by
      WHERE pt.price >= ${minPrice}
        AND pt.price <= ${maxPrice}
        AND pt.is_active = true
      ORDER BY pt.price
    `;
  }

  /**
   * Süre aralığına göre prosedürleri getirir
   * @param minDuration - Minimum süre (dakika)
   * @param maxDuration - Maximum süre (dakika)
   * @returns ProcedureTypeWithCreator dizisi
   */
  async findByDurationRange(minDuration: number, maxDuration: number): Promise<ProcedureTypeWithCreator[]> {
    return await db`
      SELECT
        pt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM procedure_types pt
      LEFT JOIN users u ON u.id = pt.created_by
      WHERE pt.typical_duration >= ${minDuration}
        AND pt.typical_duration <= ${maxDuration}
        AND pt.is_active = true
      ORDER BY pt.typical_duration
    `;
  }
}
