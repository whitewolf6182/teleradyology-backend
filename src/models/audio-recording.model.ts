/**
 * AudioRecording (Ses Kaydı) Model
 * Study'lere ait ses kayıtları (sesli raporlama, notlar, dictation)
 */

export type RecordingType = 'dictation' | 'voice_note' | 'consultation' | 'annotation';
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AudioRecording {
  recording_id: string;
  study_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  duration: number;
  transcription?: string;
  transcription_status: TranscriptionStatus;
  recorded_by: string;
  recorded_at: Date;
  is_processed: boolean;
  is_archived: boolean;
  language: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AudioRecordingWithDetails extends AudioRecording {
  recorded_by_name?: string;
  recorded_by_email?: string;
  study_patient_name?: string;
  study_accession_number?: string;
  report_type?: string;
}

export interface CreateAudioRecordingDTO {
  study_id: string;
  report_id?: string;
  recording_type: RecordingType;
  file_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  duration?: number;
  recorded_by: string;
  language?: string;
  notes?: string;
}

export interface UpdateAudioRecordingDTO {
  recording_type?: RecordingType;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  duration?: number;
  transcription?: string;
  transcription_status?: TranscriptionStatus;
  is_processed?: boolean;
  is_archived?: boolean;
  language?: string;
  notes?: string;
}

export interface TranscribeAudioDTO {
  recording_id: string;
  transcription: string;
}

export interface AudioRecordingFilters {
  study_id?: string;
  report_id?: string;
  recording_type?: RecordingType;
  recorded_by?: string;
  transcription_status?: TranscriptionStatus;
  is_processed?: boolean;
  is_archived?: boolean;
  language?: string;
  recorded_date_from?: string;
  recorded_date_to?: string;
}

export interface AudioRecordingStatistics {
  total: number;
  by_type: Record<RecordingType, number>;
  pending_transcription: number;
  completed_transcription: number;
  total_duration: number;
  total_size: number;
}
