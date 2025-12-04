/**
 * Device (Tıbbi Cihaz) Model
 * Hastane ve kurumların tıbbi görüntüleme cihazlarını temsil eder (MR, BT, US, vb.)
 */

export interface Device {
  device_id: string;
  device_name: string;
  modality: string;
  partition_table_name ?: string;
  device_type: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  institution_id?: string;
  aet_title?: string;
  ip_address?: string;
  port: number;
  urgent ?: boolean;
  location?: string;
  pacs_integration_key?: string;
  installation_date?: Date;
  last_maintenance_date?: Date;
  next_maintenance_date?: Date;
  is_active: boolean;
  is_online: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DeviceWithInstitution extends Device {
  institution_name?: string;
  institution_code?: string;
}

export interface CreateDeviceDTO {
  device_code: string;
  device_name: string;
  modality: string;
  manufacturer?: string;
  model?: string;
  urgent ?: boolean;
  serial_number?: string;
  institution_id: string;
  aet_title?: string;
  ip_address?: string;
  port?: number;
  location?: string;
  installation_date?: string;
  notes?: string;
}

export interface UpdateDeviceDTO {
  device_name?: string;
  device_type?: string;
  manufacturer?: string;
  modality: string;
  model?: string;
  urgent ?: boolean;
  serial_number?: string;
  institution_id?: string;
  aet_title?: string;
  ip_address?: string;
  port?: number;
  location?: string;
  installation_date?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  is_active?: boolean;
  is_online?: boolean;
  notes?: string;
}

export interface DeviceFilters {
  device_type?: string;
  institution_id?: string;
  is_active?: boolean;
  is_online?: boolean;
  search?: string;
}

export interface DeviceStatistics {
  total_studies: number;
  pending_studies: number;
  completed_studies: number;
  last_study_date?: Date;
}
