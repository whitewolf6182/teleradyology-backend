/*
  # User-Company Many-to-Many İlişkisi

  ## Genel Bakış
  Kullanıcılar ve firmalar arasında çoktan-çoğa ilişki kuruluyor.
  Bir kullanıcı birden fazla firmada çalışabilir, bir firmada birden fazla kullanıcı olabilir.

  ## Değişiklikler
  
  ### 1. Yeni Tablo: user_companies (Junction Table)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key -> users.id)
  - `company_id` (uuid, foreign key -> companies.company_id)
  - `role_in_company` (text) - Firmadaki rolü (manager, employee, viewer, etc.)
  - `department` (text) - Firmadaki departmanı
  - `is_active` (boolean) - Aktif mi
  - `start_date` (date) - İşe başlama tarihi
  - `end_date` (date) - İşten ayrılma tarihi
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. İndeksler
  - user_id ve company_id için composite unique index
  - Ayrı ayrı indeksler
  
  ### 3. RLS Politikaları
  - Kullanıcılar kendi firmalarını görebilir
  - Adminler tüm ilişkileri görebilir
  - Firma yöneticileri kendi firmalarının kullanıcılarını görebilir
  
  ## Notlar
  - users.company_id kolonu artık deprecated (geriye uyumluluk için kalabilir)
  - Yeni sistem user_companies tablosu üzerinden çalışacak
*/

-- user_companies junction table oluştur
CREATE TABLE IF NOT EXISTS user_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  role_in_company text DEFAULT 'employee',
  department text,
  is_active boolean DEFAULT true,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_company UNIQUE (user_id, company_id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_is_active ON user_companies(is_active);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_user_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_companies_updated_at ON user_companies;
CREATE TRIGGER trigger_user_companies_updated_at
  BEFORE UPDATE ON user_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_user_companies_updated_at();

-- RLS aktif et
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

-- Eski politikaları temizle
DROP POLICY IF EXISTS "Users can view own company relationships" ON user_companies;
DROP POLICY IF EXISTS "Users can update own company relationships" ON user_companies;
DROP POLICY IF EXISTS "Admins can view all user companies" ON user_companies;
DROP POLICY IF EXISTS "Admins can insert user companies" ON user_companies;
DROP POLICY IF EXISTS "Admins can update user companies" ON user_companies;
DROP POLICY IF EXISTS "Admins can delete user companies" ON user_companies;
DROP POLICY IF EXISTS "Company managers can view their company users" ON user_companies;
DROP POLICY IF EXISTS "Company managers can add users to their companies" ON user_companies;

-- Kullanıcılar kendi firma ilişkilerini görebilir
CREATE POLICY "Users can view own company relationships"
  ON user_companies FOR SELECT
  TO authenticated
  USING (
    user_id = (current_setting('app.current_user_id', true))::uuid
  );

-- Kullanıcılar kendi firma ilişkilerini güncelleyebilir (is_active durumunu değiştirebilir)
CREATE POLICY "Users can update own company relationships"
  ON user_companies FOR UPDATE
  TO authenticated
  USING (user_id = (current_setting('app.current_user_id', true))::uuid)
  WITH CHECK (user_id = (current_setting('app.current_user_id', true))::uuid);

-- Adminler tüm ilişkileri görebilir
CREATE POLICY "Admins can view all user companies"
  ON user_companies FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

-- Adminler tüm ilişkileri yönetebilir
CREATE POLICY "Admins can insert user companies"
  ON user_companies FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Admins can update user companies"
  ON user_companies FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Admins can delete user companies"
  ON user_companies FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

-- Firma yöneticileri kendi firmalarının kullanıcılarını görebilir
CREATE POLICY "Company managers can view their company users"
  ON user_companies FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT uc.company_id 
      FROM user_companies uc
      INNER JOIN users u ON u.id = uc.user_id
      WHERE u.login_id = (current_setting('app.current_user_id', true))::uuid
        AND uc.role_in_company = 'manager'
        AND uc.is_active = true
    )
  );

-- Firma yöneticileri kendi firmalarına kullanıcı ekleyebilir
CREATE POLICY "Company managers can add users to their companies"
  ON user_companies FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT uc.company_id 
      FROM user_companies uc
      INNER JOIN users u ON u.id = uc.user_id
      WHERE u.login_id = (current_setting('app.current_user_id', true))::uuid
        AND uc.role_in_company = 'manager'
        AND uc.is_active = true
    )
  );