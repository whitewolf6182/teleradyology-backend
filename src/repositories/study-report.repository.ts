import db from '../config/database';
import type {
  StudyReport,
  StudyReportWithDetails,
  CreateStudyReportDTO,
  UpdateStudyReportDTO,
  StudyReportFilters
} from '../models';

/**
 * StudyReportRepository
 * Çalışma raporları için veri erişim katmanı
 * Bir study'e ait birden fazla rapor (ön rapor, nihai rapor, revize, ikinci görüş) yönetimi
 */
export class StudyReportRepository {
  /**
   * ID'ye göre rapor getirir
   * @param id - Rapor ID'si (UUID)
   * @returns StudyReport veya null
   */
  async findById(id: string): Promise<StudyReport | null> {
    const result = await db`
      SELECT * FROM study_reports
      WHERE report_id = ${id}
    `;
    return result[0] || null;
  }

  /**
   * Detaylı bilgilerle rapor getirir (radyolog, reviewer, study bilgileriyle)
   * @param id - Rapor ID'si (UUID)
   * @returns StudyReportWithDetails veya null
   */
  async findByIdWithDetails(id: string): Promise<StudyReportWithDetails | null> {
    const result = await db`
      SELECT
        sr.*,
        u1.first_name || ' ' || u1.last_name as radiologist_name,
        u1.email as radiologist_email,
        u2.first_name || ' ' || u2.last_name as reviewer_name,
        u2.email as reviewer_email,
        s.patient_name as study_patient_name,
        s.accession_number as study_accession_number
      FROM study_reports sr
      LEFT JOIN users u1 ON u1.id = sr.radiologist_id
      LEFT JOIN users u2 ON u2.id = sr.reviewer_id
      LEFT JOIN studies s ON s.study_id = sr.study_id
      WHERE sr.report_id = ${id}
    `;
    return result[0] || null;
  }

  /**
   * Belirli bir study'nin tüm raporlarını getirir
   * @param studyId - Study ID'si (UUID)
   * @returns StudyReportWithDetails dizisi (version'a göre sıralı)
   */
  async findByStudyId(studyId: string): Promise<StudyReportWithDetails[]> {
    return await db`
      SELECT
        sr.*,
        u1.first_name || ' ' || u1.last_name as radiologist_name,
        u1.email as radiologist_email,
        u2.first_name || ' ' || u2.last_name as reviewer_name,
        u2.email as reviewer_email,
        s.patient_name as study_patient_name,
        s.accession_number as study_accession_number
      FROM study_reports sr
      LEFT JOIN users u1 ON u1.id = sr.radiologist_id
      LEFT JOIN users u2 ON u2.id = sr.reviewer_id
      LEFT JOIN studies s ON s.study_id = sr.study_id
      WHERE sr.study_id = ${studyId}
      ORDER BY sr.version DESC, sr.created_at DESC
    `;
  }

  /**
   * Bir study'nin son (en güncel) raporunu getirir
   * @param studyId - Study ID'si (UUID)
   * @returns StudyReportWithDetails veya null
   */
  async findLatestByStudyId(studyId: string): Promise<StudyReportWithDetails | null> {
    const result = await db`
      SELECT
        sr.*,
        u1.first_name || ' ' || u1.last_name as radiologist_name,
        u1.email as radiologist_email,
        u2.first_name || ' ' || u2.last_name as reviewer_name,
        u2.email as reviewer_email,
        s.patient_name as study_patient_name,
        s.accession_number as study_accession_number
      FROM study_reports sr
      LEFT JOIN users u1 ON u1.id = sr.radiologist_id
      LEFT JOIN users u2 ON u2.id = sr.reviewer_id
      LEFT JOIN studies s ON s.study_id = sr.study_id
      WHERE sr.study_id = ${studyId}
      ORDER BY sr.version DESC, sr.created_at DESC
      LIMIT 1
    `;
    return result[0] || null;
  }

  /**
   * Bir study'nin nihai (final) raporunu getirir
   * @param studyId - Study ID'si (UUID)
   * @returns StudyReportWithDetails veya null
   */
  async findFinalByStudyId(studyId: string): Promise<StudyReportWithDetails | null> {
    const result = await db`
      SELECT
        sr.*,
        u1.first_name || ' ' || u1.last_name as radiologist_name,
        u1.email as radiologist_email,
        u2.first_name || ' ' || u2.last_name as reviewer_name,
        u2.email as reviewer_email,
        s.patient_name as study_patient_name,
        s.accession_number as study_accession_number
      FROM study_reports sr
      LEFT JOIN users u1 ON u1.id = sr.radiologist_id
      LEFT JOIN users u2 ON u2.id = sr.reviewer_id
      LEFT JOIN studies s ON s.study_id = sr.study_id
      WHERE sr.study_id = ${studyId} AND sr.is_final = true
      ORDER BY sr.version DESC
      LIMIT 1
    `;
    return result[0] || null;
  }

  /**
   * Belirli bir radyologun raporlarını getirir
   * @param radiologistId - Radyolog ID'si (UUID)
   * @returns StudyReportWithDetails dizisi
   */
  async findByRadiologist(radiologistId: string): Promise<StudyReportWithDetails[]> {
    return await db`
      SELECT
        sr.*,
        u1.first_name || ' ' || u1.last_name as radiologist_name,
        u1.email as radiologist_email,
        u2.first_name || ' ' || u2.last_name as reviewer_name,
        u2.email as reviewer_email,
        s.patient_name as study_patient_name,
        s.accession_number as study_accession_number
      FROM study_reports sr
      LEFT JOIN users u1 ON u1.id = sr.radiologist_id
      LEFT JOIN users u2 ON u2.id = sr.reviewer_id
      LEFT JOIN studies s ON s.study_id = sr.study_id
      WHERE sr.radiologist_id = ${radiologistId}
      ORDER BY sr.reported_at DESC
    `;
  }

  /**
   * Tüm raporları filtrelerle birlikte getirir
   * @param filters - Filtreleme kriterleri
   * @returns StudyReportWithDetails dizisi
   */
  async findAll(filters?: StudyReportFilters): Promise<StudyReportWithDetails[]> {
    let whereConditions: string[] = ['1=1'];

    if (filters?.study_id) {
      whereConditions.push(`sr.study_id = '${filters.study_id}'`);
    }

    if (filters?.report_type) {
      whereConditions.push(`sr.report_type = '${filters.report_type}'`);
    }

    if (filters?.report_status) {
      whereConditions.push(`sr.report_status = '${filters.report_status}'`);
    }

    if (filters?.radiologist_id) {
      whereConditions.push(`sr.radiologist_id = '${filters.radiologist_id}'`);
    }

    if (filters?.reviewer_id) {
      whereConditions.push(`sr.reviewer_id = '${filters.reviewer_id}'`);
    }

    if (filters?.is_final !== undefined) {
      whereConditions.push(`sr.is_final = ${filters.is_final}`);
    }

    if (filters?.is_signed !== undefined) {
      whereConditions.push(`sr.is_signed = ${filters.is_signed}`);
    }

    if (filters?.reported_date_from) {
      whereConditions.push(`sr.reported_at >= '${filters.reported_date_from}'`);
    }

    if (filters?.reported_date_to) {
      whereConditions.push(`sr.reported_at <= '${filters.reported_date_to}'`);
    }

    const whereClause = whereConditions.join(' AND ');

    return await db`
      SELECT
        sr.*,
        u1.first_name || ' ' || u1.last_name as radiologist_name,
        u1.email as radiologist_email,
        u2.first_name || ' ' || u2.last_name as reviewer_name,
        u2.email as reviewer_email,
        s.patient_name as study_patient_name,
        s.accession_number as study_accession_number
      FROM study_reports sr
      LEFT JOIN users u1 ON u1.id = sr.radiologist_id
      LEFT JOIN users u2 ON u2.id = sr.reviewer_id
      LEFT JOIN studies s ON s.study_id = sr.study_id
      WHERE ${db.raw(whereClause)}
      ORDER BY sr.reported_at DESC
    `;
  }

  /**
   * Taslak (draft) raporları getirir
   * @param radiologistId - Opsiyonel: Belirli bir radyologun taslakları
   * @returns StudyReportWithDetails dizisi
   */
  async findDrafts(radiologistId?: string): Promise<StudyReportWithDetails[]> {
    if (radiologistId) {
      return await db`
        SELECT
          sr.*,
          u1.first_name || ' ' || u1.last_name as radiologist_name,
          u1.email as radiologist_email,
          s.patient_name as study_patient_name,
          s.accession_number as study_accession_number
        FROM study_reports sr
        LEFT JOIN users u1 ON u1.id = sr.radiologist_id
        LEFT JOIN studies s ON s.study_id = sr.study_id
        WHERE sr.report_status = 'draft' AND sr.radiologist_id = ${radiologistId}
        ORDER BY sr.updated_at DESC
      `;
    }

    return await db`
      SELECT
        sr.*,
        u1.first_name || ' ' || u1.last_name as radiologist_name,
        u1.email as radiologist_email,
        s.patient_name as study_patient_name,
        s.accession_number as study_accession_number
      FROM study_reports sr
      LEFT JOIN users u1 ON u1.id = sr.radiologist_id
      LEFT JOIN studies s ON s.study_id = sr.study_id
      WHERE sr.report_status = 'draft'
      ORDER BY sr.updated_at DESC
    `;
  }

  /**
   * Gönderilmiş (submitted) raporları getirir (onay bekleyen)
   * @returns StudyReportWithDetails dizisi
   */
  async findPendingApproval(): Promise<StudyReportWithDetails[]> {
    return await db`
      SELECT
        sr.*,
        u1.first_name || ' ' || u1.last_name as radiologist_name,
        u1.email as radiologist_email,
        s.patient_name as study_patient_name,
        s.accession_number as study_accession_number
      FROM study_reports sr
      LEFT JOIN users u1 ON u1.id = sr.radiologist_id
      LEFT JOIN studies s ON s.study_id = sr.study_id
      WHERE sr.report_status = 'submitted'
      ORDER BY sr.submitted_at ASC
    `;
  }

  /**
   * Yeni rapor oluşturur
   * Version numarası otomatik olarak artırılır
   * @param data - Rapor bilgileri
   * @returns Oluşturulan StudyReport
   */
  async create(data: CreateStudyReportDTO): Promise<StudyReport> {
    const result = await db`
      INSERT INTO study_reports (
        study_id, report_type, report_text, findings,
        impression, recommendations, radiologist_id, notes
      )
      VALUES (
        ${data.study_id}, ${data.report_type}, ${data.report_text},
        ${data.findings || null}, ${data.impression || null},
        ${data.recommendations || null}, ${data.radiologist_id},
        ${data.notes || null}
      )
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Rapor bilgilerini günceller
   * @param id - Rapor ID'si
   * @param data - Güncellenecek alanlar
   * @returns Güncellenmiş StudyReport
   * @throws Rapor bulunamazsa hata fırlatır
   */
  async update(id: string, data: UpdateStudyReportDTO): Promise<StudyReport> {
    const fields = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key} = ${db.escape(value)}`)
      .join(', ');

    if (!fields) {
      throw new Error('No fields to update');
    }

    const result = await db`
      UPDATE study_reports
      SET ${db.raw(fields)}
      WHERE report_id = ${id}
      RETURNING *
    `;

    if (!result[0]) {
      throw new Error('Report not found');
    }

    return result[0];
  }

  /**
   * Raporu gönderir (submit)
   * @param id - Rapor ID'si
   * @returns Güncellenmiş StudyReport
   */
  async submit(id: string): Promise<StudyReport> {
    const result = await db`
      UPDATE study_reports
      SET report_status = 'submitted', submitted_at = now()
      WHERE report_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Raporu onaylar (approve)
   * @param id - Rapor ID'si
   * @param reviewerId - Onaylayan kişi ID'si
   * @returns Güncellenmiş StudyReport
   */
  async approve(id: string, reviewerId: string): Promise<StudyReport> {
    const result = await db`
      UPDATE study_reports
      SET report_status = 'approved',
          reviewer_id = ${reviewerId},
          approved_at = now()
      WHERE report_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Raporu reddeder (reject)
   * @param id - Rapor ID'si
   * @param reviewerId - Reddeden kişi ID'si
   * @returns Güncellenmiş StudyReport
   */
  async reject(id: string, reviewerId: string): Promise<StudyReport> {
    const result = await db`
      UPDATE study_reports
      SET report_status = 'rejected',
          reviewer_id = ${reviewerId}
      WHERE report_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Raporu nihai (final) olarak işaretler
   * @param id - Rapor ID'si
   * @returns Güncellenmiş StudyReport
   */
  async markAsFinal(id: string): Promise<StudyReport> {
    const result = await db`
      UPDATE study_reports
      SET is_final = true
      WHERE report_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Raporu imzalar
   * @param id - Rapor ID'si
   * @param signature - Dijital imza
   * @returns Güncellenmiş StudyReport
   */
  async sign(id: string, signature: string): Promise<StudyReport> {
    const result = await db`
      UPDATE study_reports
      SET is_signed = true, signature = ${signature}
      WHERE report_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Raporu siler
   * @param id - Rapor ID'si
   */
  async delete(id: string): Promise<void> {
    await db`
      DELETE FROM study_reports
      WHERE report_id = ${id}
    `;
  }

  /**
   * Genel rapor istatistiklerini getirir
   * @returns İstatistik bilgileri
   */
  async getStatistics() {
    const result = await db`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE report_status = 'draft') as draft,
        COUNT(*) FILTER (WHERE report_status = 'submitted') as submitted,
        COUNT(*) FILTER (WHERE report_status = 'approved') as approved,
        COUNT(*) FILTER (WHERE report_status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE is_signed = true) as signed
      FROM study_reports
    `;
    return result[0];
  }

  /**
   * Rapor tipine göre istatistikleri getirir
   * @returns Tip bazlı istatistikler
   */
  async getStatisticsByType() {
    return await db`
      SELECT
        report_type,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE report_status = 'approved') as approved,
        COUNT(*) FILTER (WHERE is_final = true) as final
      FROM study_reports
      GROUP BY report_type
      ORDER BY total DESC
    `;
  }

  /**
   * Belirli bir radyologun rapor istatistiklerini getirir
   * @param radiologistId - Radyolog ID'si
   * @returns İstatistik bilgileri
   */
  async getRadiologistStatistics(radiologistId: string) {
    const result = await db`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE report_status = 'draft') as draft,
        COUNT(*) FILTER (WHERE report_status = 'submitted') as submitted,
        COUNT(*) FILTER (WHERE report_status = 'approved') as approved,
        COUNT(*) FILTER (WHERE is_final = true) as final,
        COUNT(*) FILTER (WHERE is_signed = true) as signed
      FROM study_reports
      WHERE radiologist_id = ${radiologistId}
    `;
    return result[0];
  }
}
