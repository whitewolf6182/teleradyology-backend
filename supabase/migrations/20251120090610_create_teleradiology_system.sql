/*
  # Teleradyoloji Sistemi - Kullanıcı Yönetimi
  
  ## Genel Bakış
  Bu migrasyon teleradyoloji sistemi için kullanıcı kimlik doğrulama ve profil yönetimi tablolarını oluşturur.
  
  ## 1. Yeni Tablolar
  
  ### `logins` tablosu
  Kullanıcıların kimlik doğrulama bilgilerini tutar:
  - `id` (uuid, primary key) - Benzersiz kullanıcı kimliği
  - `username` (varchar, unique, not null) - Kullanıcı adı
  - `password` (varchar, not null) - Hash'lenmiş parola
  - `is_active` (boolean, default: true) - Hesap aktif durumu
  - `role` (varchar, default: 'user') - Kullanıcı rolü (admin, radiologist, technician, user)
  - `created_at` (timestamptz) - Oluşturulma zamanı
  - `last_login_at` (timestamptz) - Son giriş zamanı
  - `updated_at` (timestamptz) - Son güncellenme zamanı
  - `refresh_token` (text) - JWT yenileme token'ı
  - `password_reset_token` (varchar) - Parola sıfırlama token'ı
  - `password_reset_expires_at` (timestamptz) - Token son kullanma tarihi
  - `login_attempt_count` (int, default: 0) - Başarısız giriş denemesi sayısı
  - `locked_until` (timestamptz) - Hesap kilitleme bitiş zamanı
  
  ### `users` tablosu
  Kullanıcıların detaylı profil bilgilerini tutar:
  - `id` (uuid, primary key) - Benzersiz profil kimliği
  - `login_id` (uuid, foreign key) - logins tablosuyla ilişki
  - `first_name` (varchar, not null) - Ad
  - `last_name` (varchar, not null) - Soyad
  - `email` (varchar, unique, not null) - E-posta adresi
  - `phone` (varchar) - Telefon numarası
  - `license_number` (varchar) - Lisans/sertifika numarası (radyolog için)
  - `specialization` (varchar) - Uzmanlık alanı
  - `hospital_name` (varchar) - Hastane adı
  - `department` (varchar) - Departman
  - `profile_image_url` (text) - Profil fotoğrafı URL'i
  - `created_at` (timestamptz) - Oluşturulma zamanı
  - `updated_at` (timestamptz) - Son güncellenme zamanı
  
  ## 2. Güvenlik (RLS)
  
  ### Row Level Security Politikaları:
  - Tüm tablolarda RLS etkinleştirildi
  - Her kullanıcı sadece kendi verilerine erişebilir
  - Admin rolü tüm verilere erişebilir
  - Yeni kayıtlar sadece authenticated kullanıcılar tarafından oluşturulabilir
  
  ## 3. Önemli Notlar
  
  ### Güvenlik:
  1. Parolalar mutlaka hash'lenmiş olarak saklanmalı (bcrypt/argon2)
  2. Refresh token'lar güvenli şekilde yönetilmeli
  3. Başarısız giriş denemeleri izlenmeli ve hesap kilitleme aktif olmalı
  4. HTTPS kullanımı zorunlu
  
  ### İlişkiler:
  - `users.login_id` → `logins.id` (ONE-TO-ONE)
  - Bir login kaydına bir user kaydı karşılık gelir
  
  ### İndeksler:
  - Username, email ve login_id için indeksler eklendi
  - Performans optimizasyonu için gerekli
*/

-- logins tablosu
CREATE TABLE IF NOT EXISTS logins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username varchar(255) UNIQUE NOT NULL,
    password varchar(255) NOT NULL,
    is_active boolean DEFAULT true,
    role varchar(50) DEFAULT 'user',
    created_at timestamptz DEFAULT now(),
    last_login_at timestamptz,
    updated_at timestamptz DEFAULT now(),
    refresh_token text,
    password_reset_token varchar(255),
    password_reset_expires_at timestamptz,
    login_attempt_count integer DEFAULT 0,
    locked_until timestamptz,
    CONSTRAINT logins_role_check CHECK (role IN ('admin', 'radiologist', 'technician', 'user'))
);

-- users tablosu
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    login_id uuid UNIQUE NOT NULL,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    email varchar(255) UNIQUE NOT NULL,
    phone varchar(20),
    license_number varchar(100),
    specialization varchar(100),
    hospital_name varchar(255),
    department varchar(100),
    profile_image_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT users_login_id_fkey FOREIGN KEY (login_id) REFERENCES logins(id) ON DELETE CASCADE
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_logins_username ON logins(username);
CREATE INDEX IF NOT EXISTS idx_logins_role ON logins(role);
CREATE INDEX IF NOT EXISTS idx_users_login_id ON users(login_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Otomatik güncelleme için trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'lar
CREATE TRIGGER update_logins_updated_at BEFORE UPDATE ON logins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları - logins tablosu
CREATE POLICY "Users can view own login data"
    ON logins FOR SELECT
    TO authenticated
    USING (id = (current_setting('app.current_user_id', true))::uuid OR 
           (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin');

CREATE POLICY "Users can update own login data"
    ON logins FOR UPDATE
    TO authenticated
    USING (id = (current_setting('app.current_user_id', true))::uuid)
    WITH CHECK (id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Admins can view all logins"
    ON logins FOR SELECT
    TO authenticated
    USING ((SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin');

-- RLS Politikaları - users tablosu
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    TO authenticated
    USING (login_id = (current_setting('app.current_user_id', true))::uuid OR
           (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin');

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (login_id = (current_setting('app.current_user_id', true))::uuid)
    WITH CHECK (login_id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    TO authenticated
    USING ((SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin');

CREATE POLICY "System can insert new users"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "System can insert new logins"
    ON logins FOR INSERT
    TO authenticated
    WITH CHECK (true);