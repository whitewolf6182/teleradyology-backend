export interface User {
  id: string;
  login_id: string;
  company_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  license_number?: string;
  specialization?: string;
  hospital_name?: string;
  department?: string;
  profile_image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDTO {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_id?: string;
  role?: 'admin' | 'radiologist' | 'technician' | 'user';
  license_number?: string;
  specialization?: string;
  hospital_name?: string;
  department?: string;
}

export interface UpdateUserDTO {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company_id?: string;
  license_number?: string;
  specialization?: string;
  hospital_name?: string;
  department?: string;
  profile_image_url?: string;
}

export interface UserProfile extends User {
  username: string;
  role: string;
  is_active: boolean;
  last_login_at?: Date;
  company_name?: string;
  company_code?: string;
}
