import db from '../config/database';
import type {
  ReportTemplate,
  ReportTemplateWithCreator,
  CreateReportTemplateDTO,
  UpdateReportTemplateDTO,
  ReportTemplateFilters
} from '../models';

/**
 * ReportTemplateRepository
 * Rapor şablonları için veri erişim katmanı
 * Radyologların hızlı rapor yazabilmesi için önceden tanımlanmış şablonlar
 */
export class ReportTemplateRepository {
  /**
   * ID'ye göre şablon getirir
   * @param id - Template ID'si (UUID)
   * @returns ReportTemplate veya null
   */
  async findById(id: string): Promise<ReportTemplate | null> {
    const result = await db`
      SELECT * FROM report_templates
      WHERE template_id = ${id}
    `;
    return result[0] || null;
  }

  /**
   * Detaylı bilgilerle şablon getirir (oluşturan kişi dahil)
   * @param id - Template ID'si (UUID)
   * @returns ReportTemplateWithCreator veya null
   */
  async findByIdWithCreator(id: string): Promise<ReportTemplateWithCreator | null> {
    const result = await db`
      SELECT
        rt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM report_templates rt
      LEFT JOIN users u ON u.id = rt.created_by
      WHERE rt.template_id = ${id}
    `;
    return result[0] || null;
  }

  /**
   * Şablon koduna göre şablon bulur
   * @param code - Template kodu (unique)
   * @returns ReportTemplate veya null
   */
  async findByCode(code: string): Promise<ReportTemplate | null> {
    const result = await db`
      SELECT * FROM report_templates
      WHERE template_code = ${code}
    `;
    return result[0] || null;
  }

  /**
   * Tüm şablonları filtrelerle getirir
   * @param filters - Filtreleme kriterleri
   * @returns ReportTemplateWithCreator dizisi
   */
  async findAll(filters?: ReportTemplateFilters): Promise<ReportTemplateWithCreator[]> {
    let whereConditions: string[] = ['1=1'];

    if (filters?.category) {
      whereConditions.push(`rt.category = '${filters.category}'`);
    }

    if (filters?.modality) {
      whereConditions.push(`rt.modality = '${filters.modality}'`);
    }

    if (filters?.body_part) {
      whereConditions.push(`rt.body_part = '${filters.body_part}'`);
    }

    if (filters?.diagnosis) {
      whereConditions.push(`rt.diagnosis = '${filters.diagnosis}'`);
    }

    if (filters?.language) {
      whereConditions.push(`rt.language = '${filters.language}'`);
    }

    if (filters?.is_active !== undefined) {
      whereConditions.push(`rt.is_active = ${filters.is_active}`);
    }

    if (filters?.is_default !== undefined) {
      whereConditions.push(`rt.is_default = ${filters.is_default}`);
    }

    if (filters?.created_by) {
      whereConditions.push(`rt.created_by = '${filters.created_by}'`);
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      whereConditions.push(`(
        LOWER(rt.template_name) LIKE '%${searchTerm}%' OR
        LOWER(rt.template_code) LIKE '%${searchTerm}%' OR
        LOWER(rt.diagnosis) LIKE '%${searchTerm}%' OR
        LOWER(rt.report_text) LIKE '%${searchTerm}%'
      )`);
    }

    if (filters?.tags && filters.tags.length > 0) {
      const tagsCondition = filters.tags.map(tag => `'${tag}'`).join(',');
      whereConditions.push(`rt.tags && ARRAY[${tagsCondition}]`);
    }

    const whereClause = whereConditions.join(' AND ');

    return await db`
      SELECT
        rt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM report_templates rt
      LEFT JOIN users u ON u.id = rt.created_by
      WHERE ${db.raw(whereClause)}
      ORDER BY rt.usage_count DESC, rt.created_at DESC
    `;
  }

  /**
   * Aktif şablonları getirir
   * @returns ReportTemplateWithCreator dizisi
   */
  async findActive(): Promise<ReportTemplateWithCreator[]> {
    return await db`
      SELECT
        rt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM report_templates rt
      LEFT JOIN users u ON u.id = rt.created_by
      WHERE rt.is_active = true
      ORDER BY rt.usage_count DESC
    `;
  }

  /**
   * Varsayılan şablonları getirir
   * @returns ReportTemplateWithCreator dizisi
   */
  async findDefaults(): Promise<ReportTemplateWithCreator[]> {
    return await db`
      SELECT
        rt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM report_templates rt
      LEFT JOIN users u ON u.id = rt.created_by
      WHERE rt.is_default = true AND rt.is_active = true
      ORDER BY rt.template_name
    `;
  }

  /**
   * Modaliteye göre şablonları getirir
   * @param modality - Modalite (CT, MR, US, XR vb.)
   * @returns ReportTemplateWithCreator dizisi
   */
  async findByModality(modality: string): Promise<ReportTemplateWithCreator[]> {
    return await db`
      SELECT
        rt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM report_templates rt
      LEFT JOIN users u ON u.id = rt.created_by
      WHERE rt.modality = ${modality} AND rt.is_active = true
      ORDER BY rt.usage_count DESC
    `;
  }

  /**
   * Vücut bölgesine göre şablonları getirir
   * @param bodyPart - Vücut bölgesi (chest, abdomen, brain vb.)
   * @returns ReportTemplateWithCreator dizisi
   */
  async findByBodyPart(bodyPart: string): Promise<ReportTemplateWithCreator[]> {
    return await db`
      SELECT
        rt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM report_templates rt
      LEFT JOIN users u ON u.id = rt.created_by
      WHERE rt.body_part = ${bodyPart} AND rt.is_active = true
      ORDER BY rt.usage_count DESC
    `;
  }

  /**
   * Kategoriye göre şablonları getirir
   * @param category - Kategori (normal, pathological, emergency, followup)
   * @returns ReportTemplateWithCreator dizisi
   */
  async findByCategory(category: string): Promise<ReportTemplateWithCreator[]> {
    return await db`
      SELECT
        rt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM report_templates rt
      LEFT JOIN users u ON u.id = rt.created_by
      WHERE rt.category = ${category} AND rt.is_active = true
      ORDER BY rt.usage_count DESC
    `;
  }

  /**
   * Tanıya göre şablonları getirir
   * @param diagnosis - Tanı (pneumonia, fracture, normal vb.)
   * @returns ReportTemplateWithCreator dizisi
   */
  async findByDiagnosis(diagnosis: string): Promise<ReportTemplateWithCreator[]> {
    return await db`
      SELECT
        rt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM report_templates rt
      LEFT JOIN users u ON u.id = rt.created_by
      WHERE rt.diagnosis = ${diagnosis} AND rt.is_active = true
      ORDER BY rt.usage_count DESC
    `;
  }

  /**
   * Etiketlere göre şablonları arar
   * @param tags - Etiket dizisi
   * @returns ReportTemplateWithCreator dizisi
   */
  async findByTags(tags: string[]): Promise<ReportTemplateWithCreator[]> {
    return await db`
      SELECT
        rt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM report_templates rt
      LEFT JOIN users u ON u.id = rt.created_by
      WHERE rt.tags && ${tags} AND rt.is_active = true
      ORDER BY rt.usage_count DESC
    `;
  }

  /**
   * En çok kullanılan şablonları getirir
   * @param limit - Kaç adet (varsayılan: 10)
   * @returns ReportTemplateWithCreator dizisi
   */
  async findMostUsed(limit: number = 10): Promise<ReportTemplateWithCreator[]> {
    return await db`
      SELECT
        rt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM report_templates rt
      LEFT JOIN users u ON u.id = rt.created_by
      WHERE rt.is_active = true
      ORDER BY rt.usage_count DESC
      LIMIT ${limit}
    `;
  }

  /**
   * En son eklenen şablonları getirir
   * @param limit - Kaç adet (varsayılan: 10)
   * @returns ReportTemplateWithCreator dizisi
   */
  async findRecent(limit: number = 10): Promise<ReportTemplateWithCreator[]> {
    return await db`
      SELECT
        rt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM report_templates rt
      LEFT JOIN users u ON u.id = rt.created_by
      WHERE rt.is_active = true
      ORDER BY rt.created_at DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Belirli bir kullanıcının oluşturduğu şablonları getirir
   * @param userId - Kullanıcı ID'si
   * @returns ReportTemplateWithCreator dizisi
   */
  async findByCreator(userId: string): Promise<ReportTemplateWithCreator[]> {
    return await db`
      SELECT
        rt.*,
        u.first_name || ' ' || u.last_name as creator_name,
        u.email as creator_email
      FROM report_templates rt
      LEFT JOIN users u ON u.id = rt.created_by
      WHERE rt.created_by = ${userId}
      ORDER BY rt.created_at DESC
    `;
  }

  /**
   * Yeni şablon oluşturur
   * @param data - Şablon bilgileri
   * @returns Oluşturulan ReportTemplate
   */
  async create(data: CreateReportTemplateDTO): Promise<ReportTemplate> {
    const result = await db`
      INSERT INTO report_templates (
        template_name, template_code, category, modality,
        body_part, diagnosis, report_text, findings,
        impression, recommendations, tags, language,
        is_default, created_by
      )
      VALUES (
        ${data.template_name}, ${data.template_code}, ${data.category},
        ${data.modality}, ${data.body_part || null}, ${data.diagnosis || null},
        ${data.report_text}, ${data.findings || null},
        ${data.impression || null}, ${data.recommendations || null},
        ${data.tags || []}, ${data.language || 'tr'},
        ${data.is_default || false}, ${data.created_by || null}
      )
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Şablon bilgilerini günceller
   * @param id - Template ID'si
   * @param data - Güncellenecek alanlar
   * @returns Güncellenmiş ReportTemplate
   */
  async update(id: string, data: UpdateReportTemplateDTO): Promise<ReportTemplate> {
    const fields = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key} = ${db.escape(value)}`)
      .join(', ');

    if (!fields) {
      throw new Error('No fields to update');
    }

    const result = await db`
      UPDATE report_templates
      SET ${db.raw(fields)}
      WHERE template_id = ${id}
      RETURNING *
    `;

    if (!result[0]) {
      throw new Error('Template not found');
    }

    return result[0];
  }

  /**
   * Şablonu aktif hale getirir
   * @param id - Template ID'si
   * @returns Güncellenmiş ReportTemplate
   */
  async activate(id: string): Promise<ReportTemplate> {
    const result = await db`
      UPDATE report_templates
      SET is_active = true
      WHERE template_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Şablonu pasif hale getirir
   * @param id - Template ID'si
   * @returns Güncellenmiş ReportTemplate
   */
  async deactivate(id: string): Promise<ReportTemplate> {
    const result = await db`
      UPDATE report_templates
      SET is_active = false
      WHERE template_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Şablonun kullanım sayacını artırır
   * @param id - Template ID'si
   * @returns Güncellenmiş ReportTemplate
   */
  async incrementUsage(id: string): Promise<ReportTemplate> {
    const result = await db`
      UPDATE report_templates
      SET usage_count = usage_count + 1
      WHERE template_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Şablonu varsayılan yapar
   * @param id - Template ID'si
   * @returns Güncellenmiş ReportTemplate
   */
  async setAsDefault(id: string): Promise<ReportTemplate> {
    const result = await db`
      UPDATE report_templates
      SET is_default = true
      WHERE template_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Şablonun varsayılan özelliğini kaldırır
   * @param id - Template ID'si
   * @returns Güncellenmiş ReportTemplate
   */
  async unsetDefault(id: string): Promise<ReportTemplate> {
    const result = await db`
      UPDATE report_templates
      SET is_default = false
      WHERE template_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Şablonu kalıcı olarak siler
   * @param id - Template ID'si
   */
  async delete(id: string): Promise<void> {
    await db`
      DELETE FROM report_templates
      WHERE template_id = ${id}
    `;
  }

  /**
   * Genel şablon istatistiklerini getirir
   * @returns İstatistik bilgileri
   */
  async getStatistics() {
    const result = await db`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_default = true) as defaults,
        SUM(usage_count) as total_usage
      FROM report_templates
    `;
    return result[0];
  }

  /**
   * Kategorilere göre şablon sayılarını getirir
   * @returns Kategori bazlı istatistikler
   */
  async getStatisticsByCategory() {
    return await db`
      SELECT
        category,
        COUNT(*) as total,
        SUM(usage_count) as total_usage,
        COUNT(*) FILTER (WHERE is_active = true) as active
      FROM report_templates
      GROUP BY category
      ORDER BY total DESC
    `;
  }

  /**
   * Modalitelere göre şablon sayılarını getirir
   * @returns Modalite bazlı istatistikler
   */
  async getStatisticsByModality() {
    return await db`
      SELECT
        modality,
        COUNT(*) as total,
        SUM(usage_count) as total_usage,
        COUNT(*) FILTER (WHERE is_active = true) as active
      FROM report_templates
      GROUP BY modality
      ORDER BY total_usage DESC
    `;
  }

  /**
   * Vücut bölgelerine göre şablon sayılarını getirir
   * @returns Vücut bölgesi bazlı istatistikler
   */
  async getStatisticsByBodyPart() {
    return await db`
      SELECT
        body_part,
        COUNT(*) as total,
        SUM(usage_count) as total_usage
      FROM report_templates
      WHERE body_part IS NOT NULL
      GROUP BY body_part
      ORDER BY total_usage DESC
    `;
  }

  /**
   * Belirli bir kullanıcının şablon istatistiklerini getirir
   * @param userId - Kullanıcı ID'si
   * @returns İstatistik bilgileri
   */
  async getCreatorStatistics(userId: string) {
    const result = await db`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_default = true) as defaults,
        SUM(usage_count) as total_usage
      FROM report_templates
      WHERE created_by = ${userId}
    `;
    return result[0];
  }

  /**
   * Tüm benzersiz modaliteleri getirir
   * @returns Modalite dizisi
   */
  async getUniqueModalities(): Promise<string[]> {
    const result = await db`
      SELECT DISTINCT modality
      FROM report_templates
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
      FROM report_templates
      WHERE body_part IS NOT NULL AND is_active = true
      ORDER BY body_part
    `;
    return result.map((r: any) => r.body_part);
  }

  /**
   * Tüm benzersiz tanıları getirir
   * @returns Tanı dizisi
   */
  async getUniqueDiagnoses(): Promise<string[]> {
    const result = await db`
      SELECT DISTINCT diagnosis
      FROM report_templates
      WHERE diagnosis IS NOT NULL AND is_active = true
      ORDER BY diagnosis
    `;
    return result.map((r: any) => r.diagnosis);
  }

  /**
   * Tüm etiketleri getirir (tüm şablonlardan)
   * @returns Etiket dizisi
   */
  async getAllTags(): Promise<string[]> {
    const result = await db`
      SELECT DISTINCT UNNEST(tags) as tag
      FROM report_templates
      WHERE is_active = true
      ORDER BY tag
    `;
    return result.map((r: any) => r.tag);
  }
}
