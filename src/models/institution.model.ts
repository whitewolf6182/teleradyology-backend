/**
 * Institution (Sağlık Kurumu) Model
 * Hastaneler, tıp merkezleri ve görüntüleme merkezlerini temsil eder
 */

export type InstitutionType = 'hospital' | 'medical_center' | 'imaging_center' | 'clinic';

export interface Institution {
  institution_id: string;
  institution_code: string;
  institution_name: string;
  institution_type: InstitutionType;
  address?: string;
  city?: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  county?: string;
  contact_person?: string;
  license_number?: string;
  accreditation?: string;
  is_active: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInstitutionDTO {
  institution_name: string;
  institution_type: InstitutionType;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  city?: string;
  county?: string;
  country?: string;
  is_active?: boolean;
}

export interface UpdateInstitutionDTO {
  institution_name?: string;
  institution_type?: InstitutionType;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  license_number?: string;
  accreditation?: string;
  is_active?: boolean;
}

export interface InstitutionFilters {
  institution_type?: InstitutionType;
  city?: string;
  country?: string;
  is_active?: boolean;
  search?: string;
}

export interface InstitutionStatistics {
  total_studies: number;
  pending_studies: number;
  completed_studies: number;
  total_radiologists: number;
}
