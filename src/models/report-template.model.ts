/**
 * ReportTemplate (Rapor Şablonu) Model
 * Radyologların hızlı rapor yazabilmesi için önceden tanımlanmış şablonlar
 */

export type TemplateCategory = 'normal' | 'pathological' | 'emergency' | 'followup';

export interface ReportTemplate {
  template_id: string;
  template_name: string;
  category: TemplateCategory;
  modality: string;
  content: string;
  description:boolean;
  gender: string;
  sort : number;
  language: string;
  is_active: boolean;
  is_default: boolean;
  usage_count: number;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ReportTemplateWithCreator extends ReportTemplate {
  creator_name?: string;
  creator_email?: string;
}

export interface CreateReportTemplateDTO {
  template_name: string;
  template_code: string;
  category: TemplateCategory;
  modality: string;
  content: string;
  language?: string;
  is_default?: boolean;
  created_by?: string;
}

export interface UpdateReportTemplateDTO {
  template_name?: string;
  template_code?: string;
  category?: TemplateCategory;
  modality?: string;
  content?: string;
  language?: string;
  is_active?: boolean;
  is_default?: boolean;
}

export interface ReportTemplateFilters {
  category?: TemplateCategory;
  modality?: string;
  body_part?: string;
  diagnosis?: string;
  language?: string;
  is_active?: boolean;
  is_default?: boolean;
  created_by?: string;
  search?: string;
  tags?: string[];
}

export interface ReportTemplateStatistics {
  total: number;
  by_category: Record<TemplateCategory, number>;
  by_modality: Record<string, number>;
  most_used: ReportTemplate[];
  recent: ReportTemplate[];
}

export interface TemplateUsageLog {
  template_id: string;
  used_by: string;
  used_at: Date;
  study_id?: string;
  report_id?: string;
}
