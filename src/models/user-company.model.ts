export interface UserCompany {
  id: string;
  user_id: string;
  company_id: string;
  role_in_company: string;
  department?: string;
  is_active: boolean;
  start_date: Date;
  end_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserCompanyWithDetails extends UserCompany {
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  company_name: string;
  company_code: string;
  company_status: string;
}

export interface CreateUserCompanyDTO {
  user_id: string;
  company_id: string;
  role_in_company?: string;
  department?: string;
  start_date?: string;
}

export interface UpdateUserCompanyDTO {
  role_in_company?: string;
  department?: string;
  is_active?: boolean;
  end_date?: string;
}

export interface CompanyWithUsers {
  company_id: string;
  company_name: string;
  company_code: string;
  users: UserCompanyWithDetails[];
}

export interface UserWithCompanies {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  companies: UserCompanyWithDetails[];
}
