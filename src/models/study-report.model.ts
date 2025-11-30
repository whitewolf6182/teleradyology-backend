/**
 * StudyReport (Çalışma Raporu) Model
 * Bir study'e ait birden fazla rapor kaydı
 * Ön rapor, nihai rapor, revize rapor, ikinci görüş vb.
 */

export type ReportType = 'preliminary' | 'final' | 'revised' | 'second_opinion' | 'addendum';
export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface StudyReport {
  report_id: string;
  study_id: string;
  report_type: ReportType;
  report_status: ReportStatus;
  report_text: string;
  storage_path: string;
  radiologist_id: string;
  reporter_id: string;
  reviewer_id?: string;
  reported_at: Date;
  submitted_at?: Date;
  approved_at?: Date;
  version: number;
  is_final: boolean;
  is_signed: boolean;
  signature?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface StudyReportWithDetails extends StudyReport {
  radiologist_name?: string;
  radiologist_email?: string;
  reviewer_name?: string;
  reviewer_email?: string;
  study_patient_name?: string;
  study_accession_number?: string;
}

export interface CreateStudyReportDTO {
  study_id: string;
  report_type: ReportType;
  report_text: string;
  findings?: string;
  impression?: string;
  recommendations?: string;
  radiologist_id: string;
  notes?: string;
}

export interface UpdateStudyReportDTO {
  report_type?: ReportType;
  report_status?: ReportStatus;
  report_text?: string;
  findings?: string;
  impression?: string;
  recommendations?: string;
  reviewer_id?: string;
  is_final?: boolean;
  notes?: string;
}

export interface SubmitReportDTO {
  report_id: string;
}

export interface ApproveReportDTO {
  report_id: string;
  reviewer_id: string;
}

export interface SignReportDTO {
  report_id: string;
  signature: string;
}

export interface StudyReportFilters {
  study_id?: string;
  report_type?: ReportType;
  report_status?: ReportStatus;
  radiologist_id?: string;
  reviewer_id?: string;
  is_final?: boolean;
  is_signed?: boolean;
  reported_date_from?: string;
  reported_date_to?: string;
}

export interface StudyReportStatistics {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
  signed: number;
  by_type: Record<ReportType, number>;
}
