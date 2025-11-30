export interface Login {
  id: string;
  username: string;
  password: string;
  is_active: boolean;
  role: 'admin' | 'radiologist' | 'technician' | 'user';
  created_at: Date;
  last_login_at?: Date;
  updated_at: Date;
  refresh_token?: string;
  password_reset_token?: string;
  password_reset_expires_at?: Date;
  login_attempt_count: number;
  locked_until?: Date;
}

export interface LoginDTO {
  username: string;
  password: string;
}

export interface CreateLoginDTO {
  username: string;
  password: string;
  role?: 'admin' | 'radiologist' | 'technician' | 'user';
}
