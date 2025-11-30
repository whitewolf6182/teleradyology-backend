import db from '../config/database';
import type {
  AudioRecording,
  AudioRecordingWithDetails,
  CreateAudioRecordingDTO,
  UpdateAudioRecordingDTO,
  AudioRecordingFilters
} from '../models';

/**
 * AudioRecordingRepository
 * Ses kayıtları için veri erişim katmanı
 * Study'lere ait ses kayıtlarını (sesli raporlama, notlar, dictation) yönetir
 */
export class AudioRecordingRepository {
  /**
   * ID'ye göre ses kaydı getirir
   * @param id - Kayıt ID'si (UUID)
   * @returns AudioRecording veya null
   */
  async findById(id: string): Promise<AudioRecording | null> {
    const result = await db`
      SELECT * FROM study_audio_recordings
      WHERE recording_id = ${id}
    `;
    return result[0] || null;
  }

  /**
   * Detaylı bilgilerle ses kaydı getirir (kullanıcı, study, report bilgileriyle)
   * @param id - Kayıt ID'si (UUID)
   * @returns AudioRecordingWithDetails veya null
   */
  async findByIdWithDetails(id: string): Promise<AudioRecordingWithDetails | null> {
    const result = await db`
      SELECT
        ar.*,
        u.first_name || ' ' || u.last_name as recorded_by_name,
        u.email as recorded_by_email,
        s.patient_name as study_patient_name,
        s.accession_number as study_accession_number,
        sr.report_type
      FROM study_audio_recordings ar
      LEFT JOIN users u ON u.id = ar.recorded_by
      LEFT JOIN studies s ON s.study_id = ar.study_id
      LEFT JOIN study_reports sr ON sr.report_id = ar.report_id
      WHERE ar.recording_id = ${id}
    `;
    return result[0] || null;
  }

  /**
   * Belirli bir study'nin tüm ses kayıtlarını getirir
   * @param studyId - Study ID'si (UUID)
   * @returns AudioRecordingWithDetails dizisi
   */
  async findByStudyId(studyId: string): Promise<AudioRecordingWithDetails[]> {
    return await db`
      SELECT
        ar.*,
        u.first_name || ' ' || u.last_name as recorded_by_name,
        u.email as recorded_by_email,
        s.patient_name as study_patient_name,
        s.accession_number as study_accession_number,
        sr.report_type
      FROM study_audio_recordings ar
      LEFT JOIN users u ON u.id = ar.recorded_by
      LEFT JOIN studies s ON s.study_id = ar.study_id
      LEFT JOIN study_reports sr ON sr.report_id = ar.report_id
      WHERE ar.study_id = ${studyId}
      ORDER BY ar.recorded_at DESC
    `;
  }

  /**
   * Belirli bir rapora ait ses kayıtlarını getirir
   * @param reportId - Report ID'si (UUID)
   * @returns AudioRecordingWithDetails dizisi
   */
  async findByReportId(reportId: string): Promise<AudioRecordingWithDetails[]> {
    return await db`
      SELECT
        ar.*,
        u.first_name || ' ' || u.last_name as recorded_by_name,
        u.email as recorded_by_email,
        s.patient_name as study_patient_name,
        s.accession_number as study_accession_number,
        sr.report_type
      FROM study_audio_recordings ar
      LEFT JOIN users u ON u.id = ar.recorded_by
      LEFT JOIN studies s ON s.study_id = ar.study_id
      LEFT JOIN study_reports sr ON sr.report_id = ar.report_id
      WHERE ar.report_id = ${reportId}
      ORDER BY ar.recorded_at DESC
    `;
  }

  /**
   * Belirli bir kullanıcının ses kayıtlarını getirir
   * @param userId - Kullanıcı ID'si (UUID)
   * @returns AudioRecordingWithDetails dizisi
   */
  async findByUser(userId: string): Promise<AudioRecordingWithDetails[]> {
    return await db`
      SELECT
        ar.*,
        u.first_name || ' ' || u.last_name as recorded_by_name,
        u.email as recorded_by_email,
        s.patient_name as study_patient_name,
        s.accession_number as study_accession_number,
        sr.report_type
      FROM study_audio_recordings ar
      LEFT JOIN users u ON u.id = ar.recorded_by
      LEFT JOIN studies s ON s.study_id = ar.study_id
      LEFT JOIN study_reports sr ON sr.report_id = ar.report_id
      WHERE ar.recorded_by = ${userId}
      ORDER BY ar.recorded_at DESC
    `;
  }

  /**
   * Tüm ses kayıtlarını filtrelerle birlikte getirir
   * @param filters - Filtreleme kriterleri
   * @returns AudioRecordingWithDetails dizisi
   */
  async findAll(filters?: AudioRecordingFilters): Promise<AudioRecordingWithDetails[]> {
    let whereConditions: string[] = ['1=1'];

    if (filters?.study_id) {
      whereConditions.push(`ar.study_id = '${filters.study_id}'`);
    }

    if (filters?.report_id) {
      whereConditions.push(`ar.report_id = '${filters.report_id}'`);
    }

    if (filters?.recording_type) {
      whereConditions.push(`ar.recording_type = '${filters.recording_type}'`);
    }

    if (filters?.recorded_by) {
      whereConditions.push(`ar.recorded_by = '${filters.recorded_by}'`);
    }

    if (filters?.transcription_status) {
      whereConditions.push(`ar.transcription_status = '${filters.transcription_status}'`);
    }

    if (filters?.is_processed !== undefined) {
      whereConditions.push(`ar.is_processed = ${filters.is_processed}`);
    }

    if (filters?.is_archived !== undefined) {
      whereConditions.push(`ar.is_archived = ${filters.is_archived}`);
    }

    if (filters?.language) {
      whereConditions.push(`ar.language = '${filters.language}'`);
    }

    if (filters?.recorded_date_from) {
      whereConditions.push(`ar.recorded_at >= '${filters.recorded_date_from}'`);
    }

    if (filters?.recorded_date_to) {
      whereConditions.push(`ar.recorded_at <= '${filters.recorded_date_to}'`);
    }

    const whereClause = whereConditions.join(' AND ');

    return await db`
      SELECT
        ar.*,
        u.first_name || ' ' || u.last_name as recorded_by_name,
        u.email as recorded_by_email,
        s.patient_name as study_patient_name,
        s.accession_number as study_accession_number,
        sr.report_type
      FROM study_audio_recordings ar
      LEFT JOIN users u ON u.id = ar.recorded_by
      LEFT JOIN studies s ON s.study_id = ar.study_id
      LEFT JOIN study_reports sr ON sr.report_id = ar.report_id
      WHERE ${db.raw(whereClause)}
      ORDER BY ar.recorded_at DESC
    `;
  }

  /**
   * Transkript bekleyen ses kayıtlarını getirir
   * @returns AudioRecordingWithDetails dizisi
   */
  async findPendingTranscription(): Promise<AudioRecordingWithDetails[]> {
    return await db`
      SELECT
        ar.*,
        u.first_name || ' ' || u.last_name as recorded_by_name,
        u.email as recorded_by_email,
        s.patient_name as study_patient_name,
        s.accession_number as study_accession_number
      FROM study_audio_recordings ar
      LEFT JOIN users u ON u.id = ar.recorded_by
      LEFT JOIN studies s ON s.study_id = ar.study_id
      WHERE ar.transcription_status IN ('pending', 'processing')
        AND ar.is_archived = false
      ORDER BY ar.recorded_at ASC
    `;
  }

  /**
   * Arşivlenmemiş ses kayıtlarını getirir
   * @returns AudioRecordingWithDetails dizisi
   */
  async findActive(): Promise<AudioRecordingWithDetails[]> {
    return await db`
      SELECT
        ar.*,
        u.first_name || ' ' || u.last_name as recorded_by_name,
        u.email as recorded_by_email,
        s.patient_name as study_patient_name,
        s.accession_number as study_accession_number,
        sr.report_type
      FROM study_audio_recordings ar
      LEFT JOIN users u ON u.id = ar.recorded_by
      LEFT JOIN studies s ON s.study_id = ar.study_id
      LEFT JOIN study_reports sr ON sr.report_id = ar.report_id
      WHERE ar.is_archived = false
      ORDER BY ar.recorded_at DESC
    `;
  }

  /**
   * Belirli bir tipe göre ses kayıtlarını getirir
   * @param recordingType - Kayıt tipi (dictation, voice_note, vb.)
   * @returns AudioRecordingWithDetails dizisi
   */
  async findByType(recordingType: string): Promise<AudioRecordingWithDetails[]> {
    return await db`
      SELECT
        ar.*,
        u.first_name || ' ' || u.last_name as recorded_by_name,
        u.email as recorded_by_email,
        s.patient_name as study_patient_name,
        s.accession_number as study_accession_number
      FROM study_audio_recordings ar
      LEFT JOIN users u ON u.id = ar.recorded_by
      LEFT JOIN studies s ON s.study_id = ar.study_id
      WHERE ar.recording_type = ${recordingType}
      ORDER BY ar.recorded_at DESC
    `;
  }

  /**
   * Yeni ses kaydı oluşturur
   * @param data - Ses kaydı bilgileri
   * @returns Oluşturulan AudioRecording
   */
  async create(data: CreateAudioRecordingDTO): Promise<AudioRecording> {
    const result = await db`
      INSERT INTO study_audio_recordings (
        study_id, report_id, recording_type, file_path,
        file_name, file_size, mime_type, duration,
        recorded_by, language, notes
      )
      VALUES (
        ${data.study_id}, ${data.report_id || null}, ${data.recording_type},
        ${data.file_path}, ${data.file_name}, ${data.file_size || 0},
        ${data.mime_type || 'audio/mpeg'}, ${data.duration || 0},
        ${data.recorded_by}, ${data.language || 'tr'}, ${data.notes || null}
      )
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Ses kaydı bilgilerini günceller
   * @param id - Kayıt ID'si
   * @param data - Güncellenecek alanlar
   * @returns Güncellenmiş AudioRecording
   * @throws Kayıt bulunamazsa hata fırlatır
   */
  async update(id: string, data: UpdateAudioRecordingDTO): Promise<AudioRecording> {
    const fields = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key} = ${db.escape(value)}`)
      .join(', ');

    if (!fields) {
      throw new Error('No fields to update');
    }

    const result = await db`
      UPDATE study_audio_recordings
      SET ${db.raw(fields)}
      WHERE recording_id = ${id}
      RETURNING *
    `;

    if (!result[0]) {
      throw new Error('Audio recording not found');
    }

    return result[0];
  }

  /**
   * Ses kaydına transkript ekler
   * @param id - Kayıt ID'si
   * @param transcription - Transkript metni
   * @returns Güncellenmiş AudioRecording
   */
  async addTranscription(id: string, transcription: string): Promise<AudioRecording> {
    const result = await db`
      UPDATE study_audio_recordings
      SET transcription = ${transcription},
          transcription_status = 'completed',
          is_processed = true
      WHERE recording_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Transkript durumunu günceller
   * @param id - Kayıt ID'si
   * @param status - Yeni durum
   * @returns Güncellenmiş AudioRecording
   */
  async updateTranscriptionStatus(id: string, status: string): Promise<AudioRecording> {
    const result = await db`
      UPDATE study_audio_recordings
      SET transcription_status = ${status}
      WHERE recording_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Ses kaydını arşivler
   * @param id - Kayıt ID'si
   * @returns Güncellenmiş AudioRecording
   */
  async archive(id: string): Promise<AudioRecording> {
    const result = await db`
      UPDATE study_audio_recordings
      SET is_archived = true
      WHERE recording_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Ses kaydını arşivden çıkarır
   * @param id - Kayıt ID'si
   * @returns Güncellenmiş AudioRecording
   */
  async unarchive(id: string): Promise<AudioRecording> {
    const result = await db`
      UPDATE study_audio_recordings
      SET is_archived = false
      WHERE recording_id = ${id}
      RETURNING *
    `;
    return result[0];
  }

  /**
   * Ses kaydını kalıcı olarak siler
   * @param id - Kayıt ID'si
   */
  async delete(id: string): Promise<void> {
    await db`
      DELETE FROM study_audio_recordings
      WHERE recording_id = ${id}
    `;
  }

  /**
   * Genel ses kaydı istatistiklerini getirir
   * @returns İstatistik bilgileri
   */
  async getStatistics() {
    const result = await db`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE transcription_status = 'pending') as pending_transcription,
        COUNT(*) FILTER (WHERE transcription_status = 'completed') as completed_transcription,
        SUM(duration) as total_duration,
        SUM(file_size) as total_size
      FROM study_audio_recordings
      WHERE is_archived = false
    `;
    return result[0];
  }

  /**
   * Kayıt tiplerine göre istatistikleri getirir
   * @returns Tip bazlı istatistikler
   */
  async getStatisticsByType() {
    return await db`
      SELECT
        recording_type,
        COUNT(*) as total,
        SUM(duration) as total_duration,
        SUM(file_size) as total_size,
        COUNT(*) FILTER (WHERE transcription_status = 'completed') as transcribed
      FROM study_audio_recordings
      WHERE is_archived = false
      GROUP BY recording_type
      ORDER BY total DESC
    `;
  }

  /**
   * Belirli bir kullanıcının ses kaydı istatistiklerini getirir
   * @param userId - Kullanıcı ID'si
   * @returns İstatistik bilgileri
   */
  async getUserStatistics(userId: string) {
    const result = await db`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE transcription_status = 'completed') as transcribed,
        SUM(duration) as total_duration,
        SUM(file_size) as total_size
      FROM study_audio_recordings
      WHERE recorded_by = ${userId} AND is_archived = false
    `;
    return result[0];
  }

  /**
   * Belirli bir study'nin ses kaydı istatistiklerini getirir
   * @param studyId - Study ID'si
   * @returns İstatistik bilgileri
   */
  async getStudyStatistics(studyId: string) {
    const result = await db`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE transcription_status = 'completed') as transcribed,
        SUM(duration) as total_duration,
        COUNT(DISTINCT recorded_by) as recorder_count
      FROM study_audio_recordings
      WHERE study_id = ${studyId}
    `;
    return result[0];
  }
}
