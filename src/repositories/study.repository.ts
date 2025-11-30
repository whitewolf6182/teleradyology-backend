import db from '../config/database';
import type {
  Study,
  StudyWithDetails,
  CreateStudyDTO,
  UpdateStudyDTO,
  StudyFilters
} from '../models';

/**
 * StudyRepository
 * Hasta çalışmaları (radyolojik incelemeler) için veri erişim katmanı
 */
export class StudyRepository {
  /**
   * ID'ye göre çalışma getirir
   * @param id - Çalışma ID'si (UUID)
   * @returns Study veya null
   */
  async findById(id: string): Promise<Study | null> {
    const result = await db`
      SELECT * FROM studies
      WHERE study_id = ${id}
    `;
    return result[0] || null;
  }

  /**
   * Detaylı bilgilerle çalışma getirir (kurum ve radyolog bilgileriyle)
   * @param id - Çalışma ID'si (UUID)
   * @returns StudyWithDetails veya null
   */
  async findByIdWithDetails(id: string): Promise<StudyWithDetails | null> {
    const result = await db`
      SELECT
        s.*,
        i.institution_name,
        i.institution_code,
        d.device_name,
        d.device_code,
        u.first_name || ' ' || u.last_name as assigned_radiologist_name,
        u.email as assigned_radiologist_email
      FROM studies s
      LEFT JOIN institutions i ON i.institution_id = s.institution_id
      LEFT JOIN devices d ON d.device_id = s.device_id
      LEFT JOIN users u ON u.id = s.assigned_to
      WHERE s.study_id = ${id}
    `;
    return result[0] || null;
  }

  /**
   * Study Instance UID'ye göre çalışma getirir
   * @param uid - DICOM Study Instance UID (unique)
   * @returns Study veya null
   */
  async findByStudyInstanceUid(uid: string): Promise<Study | null> {
    const result = await db`
      SELECT * FROM studies
      WHERE study_instance_uid = ${uid}
    `;
    return result[0] || null;
  }

  /**
   * Hasta ID'sine göre çalışmaları getirir
   * @param patientId - Hasta ID'si
   * @returns StudyWithDetails dizisi
   */
  async findByPatientId(patientId: string): Promise<StudyWithDetails[]> {
    return await db`
      SELECT
        s.*,
        i.institution_name,
        i.institution_code,
        u.first_name || ' ' || u.last_name as assigned_radiologist_name,
        u.email as assigned_radiologist_email
      FROM studies s
      LEFT JOIN institutions i ON i.institution_id = s.institution_id
      LEFT JOIN users u ON u.id = s.assigned_to
      WHERE s.patient_id = ${patientId}
      ORDER BY s.study_date DESC, s.created_at DESC
    `;
  }

  /**
   * Tüm çalışmaları filtrelerle birlikte getirir
   * @param filters - Filtreleme kriterleri
   * @returns StudyWithDetails dizisi
   */
  async findAll(filters?: StudyFilters): Promise<StudyWithDetails[]> {
    let whereConditions: string[] = ['1=1'];
    let params: any = {};

    if (filters?.study_status) {
      whereConditions.push('s.study_status = ${study_status}');
      params.study_status = filters.study_status;
    }

    if (filters?.priority) {
      whereConditions.push('s.priority = ${priority}');
      params.priority = filters.priority;
    }

    if (filters?.modality) {
      whereConditions.push('s.modality = ${modality}');
      params.modality = filters.modality;
    }

    if (filters?.institution_id) {
      whereConditions.push('s.institution_id = ${institution_id}');
      params.institution_id = filters.institution_id;
    }

    if (filters?.assigned_to) {
      whereConditions.push('s.assigned_to = ${assigned_to}');
      params.assigned_to = filters.assigned_to;
    }

    if (filters?.patient_id) {
      whereConditions.push('s.patient_id = ${patient_id}');
      params.patient_id = filters.patient_id;
    }

    if (filters?.study_date_from) {
      whereConditions.push('s.study_date >= ${study_date_from}');
      params.study_date_from = filters.study_date_from;
    }

    if (filters?.study_date_to) {
      whereConditions.push('s.study_date <= ${study_date_to}');
      params.study_date_to = filters.study_date_to;
    }

    if (filters?.is_urgent !== undefined) {
      whereConditions.push('s.is_urgent = ${is_urgent}');
      params.is_urgent = filters.is_urgent;
    }

    if (filters?.search) {
      whereConditions.push(`(
        s.patient_name ILIKE ${'%' + filters.search + '%'} OR
        s.patient_id ILIKE ${'%' + filters.search + '%'} OR
        s.accession_number ILIKE ${'%' + filters.search + '%'}
      )`);
    }

    const whereClause = whereConditions.join(' AND ');

    return await db`
      SELECT
        s.*,
        i.institution_name,
        i.institution_code,
        u.first_name || ' ' || u.last_name as assigned_radiologist_name,
        u.email as assigned_radiologist_email
      FROM studies s
      LEFT JOIN institutions i ON i.institution_id = s.institution_id
      LEFT JOIN users u ON u.id = s.assigned_to
      WHERE ${db.raw(whereClause)}
      ORDER BY s.is_urgent DESC, s.study_date DESC, s.created_at DESC
    `;
  }

  /**
   * Belirli bir radyologa atanmış çalışmaları getirir
   * @param radiologistId - Radyolog ID'si (users.id)
   * @returns StudyWithDetails dizisi
   */
  async findByRadiologist(radiologistId: string): Promise<StudyWithDetails[]> {
    return await db`
      SELECT
        s.*,
        i.institution_name,
        i.institution_code,
        u.first_name || ' ' || u.last_name as assigned_radiologist_name,
        u.email as assigned_radiologist_email
      FROM studies s
      LEFT JOIN institutions i ON i.institution_id = s.institution_id
      LEFT JOIN users u ON u.id = s.assigned_to
      WHERE s.assigned_to = ${radiologistId}
      ORDER BY s.is_urgent DESC, s.study_date DESC
    `;
  }

  /**
   * Bekleyen (atanmamış) çalışmaları getirir
   * @returns StudyWithDetails dizisi
   */
  async findPending(): Promise<StudyWithDetails[]> {
    return await db`
      SELECT
        s.*,
        i.institution_name,
        i.institution_code
      FROM studies s
      LEFT JOIN institutions i ON i.institution_id = s.institution_id
      WHERE s.study_status = 'pending'
      ORDER BY s.is_urgent DESC, s.created_at ASC
    `;
  }

  /**
   * Acil çalışmaları getirir
   * @returns StudyWithDetails dizisi
   */
  async findUrgent(): Promise<StudyWithDetails[]> {
    return await db`
      SELECT
        s.*,
        i.institution_name,
        i.institution_code,
        u.first_name || ' ' || u.last_name as assigned_radiologist_name,
        u.email as assigned_radiologist_email
      FROM studies s
      LEFT JOIN institutions i ON i.institution_id = s.institution_id
      LEFT JOIN users u ON u.id = s.assigned_to
      WHERE s.is_urgent = true AND s.study_status NOT IN ('completed', 'cancelled')
      ORDER BY s.created_at ASC
    `;
  }

  /**
   * Yeni çalışma oluşturur
   * @param data - Çalışma bilgileri
   * @returns Oluşturulan Study
   */
  async create(data: CreateStudyDTO): Promise<Study> {
    const result = await db`
      INSERT INTO studies (
        study_instance_uid, accession_number, patient_id, patient_name,
        patient_birth_date, patient_sex, study_date, study_time,
        study_description, modality, body_part, institution_id,
        referring_physician, performing_physician, priority,
        num_images, num_series, storage_path, is_urgent
      )
      VALUES (
        ${data.study_instance_uid}, ${data.accession_number || null},
        ${data.patient_id}, ${data.patient_name},
        ${data.patient_birth_date || null}, ${data.patient_sex || null},
        ${data.study_date}, ${data.study_time || null},
        ${data.study_description || null}, ${data.modality}, ${data.body_part || null},
        ${data.institution_id || null}, ${data.referring_physician || null},
        ${data.performing_physician || null}, ${data.priority || 'routine'},
        ${data.num_images || 0}, ${data.num_series || 0},
        ${data.storage_path || null}, ${data.is_urgent || false}
      )
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Çalışma bilgilerini günceller
   * @param id - Çalışma ID'si
   * @param data - Güncellenecek alanlar
   * @returns Güncellenmiş Study
   * @throws Çalışma bulunamazsa hata fırlatır
   */
  async update(id: string, data: UpdateStudyDTO): Promise<Study> {
    const fields = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key} = ${db.escape(value)}`)
      .join(', ');

    if (!fields) {
      throw new Error('No fields to update');
    }

    const result = await db`
      UPDATE studies
      SET ${db.raw(fields)}
      WHERE study_id = ${id}
      RETURNING *
    `;

    if (!result[0]) {
      throw new Error('Study not found');
    }

    return result[0];
  }

  /**
   * Çalışmayı radyologa atar
   * @param studyId - Çalışma ID'si
   * @param radiologistId - Radyolog ID'si
   * @returns Güncellenmiş Study
   */
  async assignToRadiologist(studyId: string, radiologistId: string): Promise<Study> {
    const result = await db`
      UPDATE studies
      SET assigned_to = ${radiologistId}, study_status = 'assigned'
      WHERE study_id = ${studyId}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Çalışmaya rapor ekler
   * @param studyId - Çalışma ID'si
   * @param reportText - Rapor metni
   * @returns Güncellenmiş Study
   */
  async addReport(studyId: string, reportText: string): Promise<Study> {
    const result = await db`
      UPDATE studies
      SET report_text = ${reportText},
          report_date = now(),
          study_status = 'reported'
      WHERE study_id = ${studyId}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Çalışmanın durumunu değiştirir
   * @param studyId - Çalışma ID'si
   * @param status - Yeni durum
   * @returns Güncellenmiş Study
   */
  async updateStatus(studyId: string, status: string): Promise<Study> {
    const result = await db`
      UPDATE studies
      SET study_status = ${status}
      WHERE study_id = ${studyId}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Çalışmayı siler
   * @param id - Çalışma ID'si
   */
  async delete(id: string): Promise<void> {
    await db`
      DELETE FROM studies
      WHERE study_id = ${id}
    `;
  }

  /**
   * Genel istatistikleri getirir
   * @returns İstatistik bilgileri
   */
  async getStatistics() {
    const result = await db`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE study_status = 'pending') as pending,
        COUNT(*) FILTER (WHERE study_status = 'assigned') as assigned,
        COUNT(*) FILTER (WHERE study_status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE study_status = 'reported') as reported,
        COUNT(*) FILTER (WHERE study_status = 'completed') as completed,
        COUNT(*) FILTER (WHERE study_status = 'cancelled') as cancelled,
        COUNT(*) FILTER (WHERE is_urgent = true) as urgent
      FROM studies
    `;
    return result[0];
  }

  /**
   * Belirli bir radyologun istatistiklerini getirir
   * @param radiologistId - Radyolog ID'si
   * @returns İstatistik bilgileri
   */
  async getRadiologistStatistics(radiologistId: string) {
    const result = await db`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE study_status = 'assigned') as assigned,
        COUNT(*) FILTER (WHERE study_status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE study_status = 'reported') as reported,
        COUNT(*) FILTER (WHERE study_status = 'completed') as completed
      FROM studies
      WHERE assigned_to = ${radiologistId}
    `;
    return result[0];
  }
}
