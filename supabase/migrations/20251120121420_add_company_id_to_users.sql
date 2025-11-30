/*
  # Users tablosuna company_id ekleme

  ## Genel Bakış
  Kullanıcıları firmalara bağlamak için users tablosuna company_id kolonu ekleniyor.

  ## Değişiklikler
  
  ### 1. Kolon Eklemeleri
  - `company_id` (uuid, foreign key) - Kullanıcının bağlı olduğu firma
  
  ### 2. Foreign Key
  - users.company_id -> companies.company_id ilişkisi
  
  ### 3. İndeksler
  - company_id için indeks eklendi (firma bazlı sorgular için)
  
  ## Notlar
  - Mevcut kullanıcılar için company_id NULL olabilir
  - Admin kullanıcıların company_id'si NULL olabilir (firma bağımsız)
  - RLS politikaları firma bazlı erişimi kontrol edecek
*/

-- users tablosuna company_id ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE users ADD COLUMN company_id uuid REFERENCES companies(company_id);
  END IF;
END $$;

-- İndeks ekle
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- RLS politikalarını güncelle
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Kullanıcılar kendi profillerini görebilir
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (
    login_id = (current_setting('app.current_user_id', true))::uuid
  );

-- Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (login_id = (current_setting('app.current_user_id', true))::uuid)
  WITH CHECK (login_id = (current_setting('app.current_user_id', true))::uuid);

-- Adminler tüm kullanıcıları görebilir
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

-- Adminler tüm kullanıcıları güncelleyebilir
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

-- Adminler kullanıcı oluşturabilir
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

-- Firma yöneticileri kendi firmalarının kullanıcılarını görebilir
CREATE POLICY "Company managers can view company users"
  ON users FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT u.company_id 
      FROM users u 
      WHERE u.login_id = (current_setting('app.current_user_id', true))::uuid
        AND u.company_id IS NOT NULL
    )
  );