/**
 * ProcedureType (Prosedür/Tetkik Tipi) Model
 * Radyolojik tetkik ve işlem tiplerinin tanımları
 */

export type ProcedureCategory = 'diagnostic' | 'interventional' | 'screening' | 'therapeutic';
export type RadiationDose = 'none' | 'low' | 'medium' | 'high' | 'very_high';

export interface ProcedureType {
  proc_type_id: string;
  proc_code: string;
  name: string;
  name_en?: string;
  description?: string;
  modality: string;
  body_part?: string;
  category: ProcedureCategory;
  is_emergency: boolean;
  is_contrast: boolean;
  requires_preparation: boolean;
  preparation_instructions?: string;
  typical_duration: number;
  radiation_dose?: RadiationDose;
  price?: number;
  cpt_code?: string;
  icd_codes: string[];
  tags: string[];
  is_active: boolean;
  usage_count: number;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProcedureTypeWithCreator extends ProcedureType {
  creator_name?: string;
  creator_email?: string;
}

export interface CreateProcedureTypeDTO {
  proc_code: string;
  name: string;
  name_en?: string;
  description?: string;
  modality: string;
  body_part?: string;
  category: ProcedureCategory;
  is_emergency?: boolean;
  is_contrast?: boolean;
  requires_preparation?: boolean;
  preparation_instructions?: string;
  typical_duration?: number;
  radiation_dose?: RadiationDose;
  price?: number;
  cpt_code?: string;
  icd_codes?: string[];
  tags?: string[];
  created_by?: string;
}

export interface UpdateProcedureTypeDTO {
  proc_code?: string;
  name?: string;
  name_en?: string;
  description?: string;
  modality?: string;
  body_part?: string;
  category?: ProcedureCategory;
  is_emergency?: boolean;
  is_contrast?: boolean;
  requires_preparation?: boolean;
  preparation_instructions?: string;
  typical_duration?: number;
  radiation_dose?: RadiationDose;
  price?: number;
  cpt_code?: string;
  icd_codes?: string[];
  tags?: string[];
  is_active?: boolean;
}

export interface ProcedureTypeFilters {
  modality?: string;
  body_part?: string;
  category?: ProcedureCategory;
  is_emergency?: boolean;
  is_contrast?: boolean;
  requires_preparation?: boolean;
  radiation_dose?: RadiationDose;
  is_active?: boolean;
  search?: string;
  tags?: string[];
  min_price?: number;
  max_price?: number;
}

export interface ProcedureTypeStatistics {
  total: number;
  by_modality: Record<string, number>;
  by_category: Record<ProcedureCategory, number>;
  emergency_count: number;
  contrast_count: number;
  most_used: ProcedureType[];
  average_duration: number;
  total_revenue?: number;
}

export interface ProcedureUsageLog {
  proc_type_id: string;
  used_at: Date;
  study_id?: string;
  institution_id?: string;
  performed_by?: string;
}
