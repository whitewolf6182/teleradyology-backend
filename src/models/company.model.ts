export interface Company {
  company_id: string;
  company_title: string;
  company_name: string;
  company_code: string;
  tax_number?: string;
  tax_office?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  license_type?: 'hospital' | 'imaging_center' | 'telemedicine' | 'other';
  health_license_number?: string;
  license_expiry_date?: Date;
  service_level?: 'basic' | 'standard' | 'premium' | 'custom';
  sla_agreement_url?: string;
  contract_start_date?: Date;
  contract_end_date?: Date;
  billing_cycle?: 'monthly' | 'quarterly' | 'annually';
  currency: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  timezone: string;
  language: string;
  created_by?: string;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface CreateCompanyDTO {
  company_title: string;
  company_name: string;
  company_code: string;
  tax_number?: string;
  tax_office?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  license_type?: 'hospital' | 'imaging_center' | 'telemedicine' | 'other';
  health_license_number?: string;
  license_expiry_date?: string;
  service_level?: 'basic' | 'standard' | 'premium' | 'custom';
  sla_agreement_url?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  billing_cycle?: 'monthly' | 'quarterly' | 'annually';
  currency?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  timezone?: string;
  language?: string;
}

export interface UpdateCompanyDTO {
  company_title?: string;
  company_name?: string;
  tax_number?: string;
  tax_office?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  license_type?: 'hospital' | 'imaging_center' | 'telemedicine' | 'other';
  health_license_number?: string;
  license_expiry_date?: string;
  service_level?: 'basic' | 'standard' | 'premium' | 'custom';
  sla_agreement_url?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  billing_cycle?: 'monthly' | 'quarterly' | 'annually';
  currency?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  timezone?: string;
  language?: string;
}

export interface CompanyFilters {
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  license_type?: 'hospital' | 'imaging_center' | 'telemedicine' | 'other';
  service_level?: 'basic' | 'standard' | 'premium' | 'custom';
  city?: string;
  country?: string;
}

export interface CompanyStatistics {
  total: number;
  activeCount: number;
  statusCount: {
    active: number;
    inactive: number;
    suspended: number;
    pending: number;
  };
  licenseTypeCount: {
    hospital: number;
    imaging_center: number;
    telemedicine: number;
    other: number;
  };
  serviceLevelCount: {
    basic: number;
    standard: number;
    premium: number;
    custom: number;
  };
}
