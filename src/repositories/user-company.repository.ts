import db from '../config/database';
import type {
  UserCompany,
  UserCompanyWithDetails,
  CreateUserCompanyDTO,
  UpdateUserCompanyDTO
} from '../models';

/**
 * UserCompanyRepository
 * Kullanıcı-Firma ilişkilerini yöneten repository sınıfı
 * Many-to-many ilişki için veri erişim katmanı
 */
export class UserCompanyRepository {
  /**
   * ID'ye göre kullanıcı-firma ilişkisini getirir
   * @param id - İlişki ID'si (UUID)
   * @returns UserCompany veya null
   */
  async findById(id: string): Promise<UserCompany | null> {
    const result = await db`
      SELECT * FROM user_companies
      WHERE id = ${id}
    `;
    return result[0] || null;
  }

  /**
   * Belirli bir kullanıcı ve firma için ilişkiyi getirir
   * Aynı kullanıcının aynı firmada birden fazla ilişkisi olamayacağı için kullanılır
   * @param userId - Kullanıcı ID'si (UUID)
   * @param companyId - Firma ID'si (UUID)
   * @returns UserCompany veya null
   */
  async findByUserAndCompany(userId: string, companyId: string): Promise<UserCompany | null> {
    const result = await db`
      SELECT * FROM user_companies
      WHERE user_id = ${userId} AND company_id = ${companyId}
    `;
    return result[0] || null;
  }

  /**
   * Bir kullanıcının tüm firma ilişkilerini detaylı olarak getirir
   * Kullanıcı ve firma bilgilerini JOIN ile birlikte döndürür
   * @param userId - Kullanıcı ID'si (UUID)
   * @returns UserCompanyWithDetails dizisi (aktif olanlar önce gelir)
   */
  async findByUserId(userId: string): Promise<UserCompanyWithDetails[]> {
    return await db`
      SELECT
        uc.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        c.company_name,
        c.company_code,
        c.status as company_status
      FROM user_companies uc
      INNER JOIN users u ON u.id = uc.user_id
      INNER JOIN companies c ON c.company_id = uc.company_id
      WHERE uc.user_id = ${userId}
      ORDER BY uc.is_active DESC, uc.created_at DESC
    `;
  }

  /**
   * Bir firmanın tüm kullanıcı ilişkilerini detaylı olarak getirir
   * Kullanıcı ve firma bilgilerini JOIN ile birlikte döndürür
   * @param companyId - Firma ID'si (UUID)
   * @returns UserCompanyWithDetails dizisi (aktif olanlar önce gelir)
   */
  async findByCompanyId(companyId: string): Promise<UserCompanyWithDetails[]> {
    return await db`
      SELECT
        uc.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        c.company_name,
        c.company_code,
        c.status as company_status
      FROM user_companies uc
      INNER JOIN users u ON u.id = uc.user_id
      INNER JOIN companies c ON c.company_id = uc.company_id
      WHERE uc.company_id = ${companyId}
      ORDER BY uc.is_active DESC, uc.created_at DESC
    `;
  }

  /**
   * Bir kullanıcının sadece aktif firma ilişkilerini getirir
   * @param userId - Kullanıcı ID'si (UUID)
   * @returns Aktif UserCompanyWithDetails dizisi
   */
  async getActiveByUserId(userId: string): Promise<UserCompanyWithDetails[]> {
    return await db`
      SELECT
        uc.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        c.company_name,
        c.company_code,
        c.status as company_status
      FROM user_companies uc
      INNER JOIN users u ON u.id = uc.user_id
      INNER JOIN companies c ON c.company_id = uc.company_id
      WHERE uc.user_id = ${userId} AND uc.is_active = true
      ORDER BY uc.created_at DESC
    `;
  }

  /**
   * Bir firmanın sadece aktif kullanıcı ilişkilerini getirir
   * @param companyId - Firma ID'si (UUID)
   * @returns Aktif UserCompanyWithDetails dizisi
   */
  async getActiveByCompanyId(companyId: string): Promise<UserCompanyWithDetails[]> {
    return await db`
      SELECT
        uc.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        c.company_name,
        c.company_code,
        c.status as company_status
      FROM user_companies uc
      INNER JOIN users u ON u.id = uc.user_id
      INNER JOIN companies c ON c.company_id = uc.company_id
      WHERE uc.company_id = ${companyId} AND uc.is_active = true
      ORDER BY uc.created_at DESC
    `;
  }

  /**
   * Yeni kullanıcı-firma ilişkisi oluşturur
   * @param data - Oluşturulacak ilişki bilgileri (user_id, company_id, role_in_company, vb.)
   * @returns Oluşturulan UserCompany nesnesi
   */
  async create(data: CreateUserCompanyDTO): Promise<UserCompany> {
    const result = await db`
      INSERT INTO user_companies (
        user_id, company_id, role_in_company, department, start_date
      )
      VALUES (
        ${data.user_id}, ${data.company_id},
        ${data.role_in_company || 'employee'},
        ${data.department || null},
        ${data.start_date || null}
      )
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Kullanıcı-firma ilişkisini günceller
   * @param id - İlişki ID'si (UUID)
   * @param data - Güncellenecek alanlar (role_in_company, department, is_active, end_date)
   * @returns Güncellenmiş UserCompany nesnesi
   * @throws İlişki bulunamazsa veya güncellenecek alan yoksa hata fırlatır
   */
  async update(id: string, data: UpdateUserCompanyDTO): Promise<UserCompany> {
    const fields = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key} = ${db.escape(value)}`)
      .join(', ');

    if (!fields) {
      throw new Error('No fields to update');
    }

    const result = await db`
      UPDATE user_companies
      SET ${db.raw(fields)}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!result[0]) {
      throw new Error('User-Company relationship not found');
    }

    return result[0];
  }

  /**
   * Kullanıcı-firma ilişkisini kalıcı olarak siler
   * Genellikle deactivate() tercih edilir
   * @param id - İlişki ID'si (UUID)
   */
  async delete(id: string): Promise<void> {
    await db`
      DELETE FROM user_companies
      WHERE id = ${id}
    `;
  }

  /**
   * Kullanıcı-firma ilişkisini pasif yapar (soft delete)
   * is_active = false yapar ve end_date'i bugünün tarihine set eder
   * @param id - İlişki ID'si (UUID)
   * @returns Güncellenmiş UserCompany nesnesi
   */
  async deactivate(id: string): Promise<UserCompany> {
    const result = await db`
      UPDATE user_companies
      SET is_active = false, end_date = CURRENT_DATE
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Pasif yapılmış kullanıcı-firma ilişkisini tekrar aktif yapar
   * is_active = true yapar ve end_date'i null yapar
   * @param id - İlişki ID'si (UUID)
   * @returns Güncellenmiş UserCompany nesnesi
   */
  async activate(id: string): Promise<UserCompany> {
    const result = await db`
      UPDATE user_companies
      SET is_active = true, end_date = NULL
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Bir firmanın sadece manager rolündeki aktif kullanıcılarını getirir
   * Firma yöneticilerini listelemek için kullanılır
   * @param companyId - Firma ID'si (UUID)
   * @returns Manager rolündeki UserCompanyWithDetails dizisi
   */
  async getManagersByCompany(companyId: string): Promise<UserCompanyWithDetails[]> {
    return await db`
      SELECT
        uc.*,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        c.company_name,
        c.company_code,
        c.status as company_status
      FROM user_companies uc
      INNER JOIN users u ON u.id = uc.user_id
      INNER JOIN companies c ON c.company_id = uc.company_id
      WHERE uc.company_id = ${companyId}
        AND uc.role_in_company = 'manager'
        AND uc.is_active = true
      ORDER BY uc.created_at DESC
    `;
  }
}
