/*
  # Companies Tablosu - Şirket/Kurum Yönetimi
  
  ## Genel Bakış
  Teleradyoloji sisteminde hizmet alan kurum ve şirketleri yönetmek için companies tablosu.
  
  ## 1. Yeni Tablo
  
  ### `companies` tablosu
  - `company_id` (uuid, primary key) - Benzersiz şirket kimliği
  - `company_title` (varchar(50)) - Şirket unvanı (kısa)
  - `company_name` (varchar(255)) - Şirket adı (tam)
  - `company_code` (varchar(50), unique) - Şirket kodu
  - `tax_number` (varchar(100), unique) - Vergi numarası
  - `tax_office` (varchar(100)) - Vergi dairesi
  - `email` (varchar(255)) - E-posta
  - `phone` (varchar(20)) - Telefon
  - `website` (varchar(255)) - Web sitesi
  - `address` (text) - Adres
  - `city` (varchar(100)) - Şehir
  - `state` (varchar(100)) - İl/Bölge
  - `country` (varchar(100), default: 'Türkiye') - Ülke
  - `postal_code` (varchar(20)) - Posta kodu
  - `license_type` (varchar(50)) - Lisans tipi
  - `health_license_number` (varchar(100)) - Sağlık lisans numarası
  - `license_expiry_date` (date) - Lisans bitiş tarihi
  - `service_level` (varchar(50)) - Hizmet seviyesi
  - `sla_agreement_url` (text) - SLA anlaşma dökümanı URL
  - `contract_start_date` (date) - Sözleşme başlangıç
  - `contract_end_date` (date) - Sözleşme bitiş
  - `billing_cycle` (varchar(20)) - Fatura dönemi
  - `currency` (varchar(3), default: 'TRY') - Para birimi
  - `status` (varchar(20), default: 'pending') - Durum
  - `timezone` (varchar(50), default: 'Europe/Istanbul') - Saat dilimi
  - `language` (varchar(10), default: 'tr') - Dil
  - `created_by` (uuid) - Oluşturan kullanıcı
  - `updated_by` (uuid) - Güncelleyen kullanıcı
  - `created_at` (timestamptz) - Oluşturulma zamanı
  - `updated_at` (timestamptz) - Güncellenme zamanı
  - `deleted_at` (timestamptz) - Silinme zamanı (soft delete)
  
  ## 2. Güvenlik (RLS)
  - RLS etkinleştirildi
  - Admin ve authorized kullanıcılar tüm şirketleri görebilir
  - Normal kullanıcılar sadece kendi şirketini görebilir
  
  ## 3. İndeksler
  - company_code, tax_number, status için indeksler
*/

-- companies tablosu
CREATE TABLE IF NOT EXISTS companies (
    company_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_title varchar(50) NOT NULL,
    company_name varchar(255) NOT NULL,
    company_code varchar(50) UNIQUE NOT NULL,
    tax_number varchar(100) UNIQUE,
    tax_office varchar(100),
    email varchar(255),
    phone varchar(20),
    website varchar(255),
    address text,
    city varchar(100),
    state varchar(100),
    country varchar(100) DEFAULT 'Türkiye',
    postal_code varchar(20),
    license_type varchar(50),
    health_license_number varchar(100),
    license_expiry_date date,
    service_level varchar(50),
    sla_agreement_url text,
    contract_start_date date,
    contract_end_date date,
    billing_cycle varchar(20),
    currency varchar(3) DEFAULT 'TRY',
    status varchar(20) DEFAULT 'pending',
    timezone varchar(50) DEFAULT 'Europe/Istanbul',
    language varchar(10) DEFAULT 'tr',
    created_by uuid,
    updated_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT companies_license_type_check CHECK (license_type IN ('hospital', 'imaging_center', 'telemedicine', 'other')),
    CONSTRAINT companies_service_level_check CHECK (service_level IN ('basic', 'standard', 'premium', 'custom')),
    CONSTRAINT companies_status_check CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    CONSTRAINT companies_billing_cycle_check CHECK (billing_cycle IN ('monthly', 'quarterly', 'annually')),
    CONSTRAINT companies_created_by_fkey FOREIGN KEY (created_by) REFERENCES logins(id),
    CONSTRAINT companies_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES logins(id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_companies_company_code ON companies(company_code);
CREATE INDEX IF NOT EXISTS idx_companies_tax_number ON companies(tax_number);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_deleted_at ON companies(deleted_at);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);

-- Trigger
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları
CREATE POLICY "Admins can view all companies"
    ON companies FOR SELECT
    TO authenticated
    USING ((SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin');

CREATE POLICY "Admins can insert companies"
    ON companies FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin');

CREATE POLICY "Admins can update companies"
    ON companies FOR UPDATE
    TO authenticated
    USING ((SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin')
    WITH CHECK ((SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin');

CREATE POLICY "Admins can delete companies"
    ON companies FOR DELETE
    TO authenticated
    USING ((SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin');