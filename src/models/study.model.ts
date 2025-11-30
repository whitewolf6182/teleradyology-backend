/**
 * Study (Hasta Çalışması/İnceleme) Model
 * Radyolojik inceleme ve hasta bilgilerini temsil eder
 */

export type StudyStatus = 'pending' | 'assigned' | 'in_progress' | 'reported' | 'completed' | 'cancelled';
export type StudyPriority = 'routine' | 'urgent' | 'stat';
export type PatientSex = 'M' | 'F' | 'O';
export type Modality = 'CT' | 'MR' | 'XR' | 'US' | 'MG' | 'PT' | 'NM' | 'DX' | 'CR' | 'DR' | 'Other';

export interface Study {
  study_id: string;
  study_instance_uid: string;
  accession_number?: string;
  patient_id: string;
  patient_name: string;
  patient_birth_date?: Date;
  patient_sex?: PatientSex;
  study_date: Date;
  study_time?: string;
  study_description?: string;
  modality: string;
  // body_part?: string;
  institution_id?: string;
  device_id?: string;
  referring_physician?: string;
  performing_physician?: string;
  // study_status: StudyStatus;
  priority: StudyPriority;
  assigned_to?: string;
  num_images: number;
  num_series: number;
  is_urgent: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface StudyWithDetails extends Study {
  institution_name?: string;
  institution_code?: string;
  device_name?: string;
  device_code?: string;
  assigned_radiologist_name?: string;
  assigned_radiologist_email?: string;
}

export interface CreateStudyDTO {
  study_instance_uid: string;
  accession_number?: string;
  patient_id: string;
  patient_name: string;
  patient_birth_date?: string;
  patient_sex?: PatientSex;
  study_date: string;
  study_time?: string;
  study_description?: string;
  modality: string;
  // body_part?: string;
  institution_id?: string;
  device_id?: string;
  referring_physician?: string;
  performing_physician?: string;
  priority?: StudyPriority;
  num_images?: number;
  num_series?: number;
  // storage_path?: string;
  is_urgent?: boolean;
}

export interface UpdateStudyDTO {
  accession_number?: string;
  patient_name?: string;
  patient_birth_date?: string;
  patient_sex?: PatientSex;
  study_date?: string;
  study_time?: string;
  study_description?: string;
  modality?: string;
  institution_id?: string;
  device_id?: string;
  referring_physician?: string;
  performing_physician?: string;
  study_status?: StudyStatus;
  priority?: StudyPriority;
  assigned_to?: string;
  num_images?: number;
  num_series?: number;
  is_urgent?: boolean;
}

export interface AssignStudyDTO {
  study_id: string;
  assigned_to: string;
}

export interface ReportStudyDTO {
  study_id: string;
  report_text: string;
}

export interface StudyFilters {
  study_status?: StudyStatus;
  priority?: StudyPriority;
  modality?: string;
  institution_id?: string;
  device_id?: string;
  assigned_to?: string;
  patient_id?: string;
  study_date_from?: string;
  study_date_to?: string;
  is_urgent?: boolean;
  search?: string;
}

export interface StudyStatistics {
  total: number;
  pending: number;
  assigned: number;
  in_progress: number;
  reported: number;
  completed: number;
  cancelled: number;
  urgent: number;
}
