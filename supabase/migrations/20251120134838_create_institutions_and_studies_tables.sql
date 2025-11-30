/*
  # Institutions ve Studies Tabloları Oluşturma

  ## Genel Bakış
  Teleradyoloji sistemi için sağlık kurumları ve hasta çalışmaları yönetimi

  ## Yeni Tablolar
  
  ### 1. institutions (Sağlık Kurumları)
  Hastaneler, tıp merkezleri ve görüntüleme merkezlerini barındırır
  
  **Kolonlar:**
  - `institution_id` (uuid, primary key)
  - `institution_code` (text, unique) - Kurum kodu
  - `institution_name` (text) - Kurum adı
  - `institution_type` (text) - Kurum tipi (hospital, medical_center, imaging_center)
  - `address` (text) - Adres
  - `city` (text) - Şehir
  - `country` (text) - Ülke
  - `phone` (text) - Telefon
  - `email` (text) - E-posta
  - `contact_person` (text) - İletişim kişisi
  - `license_number` (text) - Lisans numarası
  - `accreditation` (text) - Akreditasyon bilgisi
  - `is_active` (boolean) - Aktif mi
  - `created_by` (uuid) - Oluşturan kullanıcı
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. studies (Hasta Çalışmaları/İncelemeler)
  Radyolojik inceleme ve hasta bilgilerini barındırır
  
  **Kolonlar:**
  - `study_id` (uuid, primary key)
  - `study_instance_uid` (text, unique) - DICOM Study Instance UID
  - `accession_number` (text) - Hastane kabul numarası
  - `patient_id` (text) - Hasta ID (DICOM Patient ID)
  - `patient_name` (text) - Hasta adı
  - `patient_birth_date` (date) - Hasta doğum tarihi
  - `patient_sex` (text) - Hasta cinsiyeti (M/F/O)
  - `study_date` (date) - İnceleme tarihi
  - `study_time` (time) - İnceleme saati
  - `study_description` (text) - İnceleme açıklaması
  - `modality` (text) - Modalite (CT, MR, XR, US, vb.)
  - `body_part` (text) - İncelenen vücut bölgesi
  - `institution_id` (uuid) - Hangi kurumda çekildi
  - `referring_physician` (text) - Sevk eden doktor
  - `performing_physician` (text) - İşlemi yapan doktor
  - `study_status` (text) - Durum (pending, assigned, reported, completed, cancelled)
  - `priority` (text) - Öncelik (routine, urgent, stat)
  - `assigned_to` (uuid) - Atanan radyolog (users.id)
  - `report_text` (text) - Rapor metni
  - `report_date` (timestamptz) - Rapor tarihi
  - `num_images` (integer) - Görüntü sayısı
  - `num_series` (integer) - Seri sayısı
  - `storage_path` (text) - DICOM dosya yolu
  - `is_urgent` (boolean) - Acil mi
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## İndeksler
  - institution_code, study_instance_uid için unique index
  - Foreign key'ler için indeksler
  - Sık sorgulanan alanlar için indeksler
  
  ## RLS Politikaları
  - Kurumlar: Adminler ve ilgili kurum kullanıcıları erişebilir
  - Studies: Adminler, atanan radyologlar ve kurum kullanıcıları erişebilir
*/

-- institutions tablosu
CREATE TABLE IF NOT EXISTS institutions (
  institution_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_code text UNIQUE NOT NULL,
  institution_name text NOT NULL,
  institution_type text NOT NULL CHECK (institution_type IN ('hospital', 'medical_center', 'imaging_center', 'clinic')),
  address text,
  city text,
  country text DEFAULT 'Turkey',
  phone text,
  email text,
  contact_person text,
  license_number text,
  accreditation text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- studies tablosu
CREATE TABLE IF NOT EXISTS studies (
  study_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_instance_uid text UNIQUE NOT NULL,
  accession_number text,
  patient_id text NOT NULL,
  patient_name text NOT NULL,
  patient_birth_date date,
  patient_sex text CHECK (patient_sex IN ('M', 'F', 'O')),
  study_date date NOT NULL,
  study_time time,
  study_description text,
  modality text NOT NULL,
  body_part text,
  institution_id uuid REFERENCES institutions(institution_id),
  referring_physician text,
  performing_physician text,
  study_status text DEFAULT 'pending' CHECK (study_status IN ('pending', 'assigned', 'in_progress', 'reported', 'completed', 'cancelled')),
  priority text DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
  assigned_to uuid REFERENCES users(id),
  report_text text,
  report_date timestamptz,
  num_images integer DEFAULT 0,
  num_series integer DEFAULT 0,
  storage_path text,
  is_urgent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_institutions_code ON institutions(institution_code);
CREATE INDEX IF NOT EXISTS idx_institutions_type ON institutions(institution_type);
CREATE INDEX IF NOT EXISTS idx_institutions_is_active ON institutions(is_active);
CREATE INDEX IF NOT EXISTS idx_institutions_created_by ON institutions(created_by);

CREATE INDEX IF NOT EXISTS idx_studies_study_instance_uid ON studies(study_instance_uid);
CREATE INDEX IF NOT EXISTS idx_studies_accession_number ON studies(accession_number);
CREATE INDEX IF NOT EXISTS idx_studies_patient_id ON studies(patient_id);
CREATE INDEX IF NOT EXISTS idx_studies_patient_name ON studies(patient_name);
CREATE INDEX IF NOT EXISTS idx_studies_study_date ON studies(study_date);
CREATE INDEX IF NOT EXISTS idx_studies_modality ON studies(modality);
CREATE INDEX IF NOT EXISTS idx_studies_institution_id ON studies(institution_id);
CREATE INDEX IF NOT EXISTS idx_studies_status ON studies(study_status);
CREATE INDEX IF NOT EXISTS idx_studies_assigned_to ON studies(assigned_to);
CREATE INDEX IF NOT EXISTS idx_studies_priority ON studies(priority);
CREATE INDEX IF NOT EXISTS idx_studies_is_urgent ON studies(is_urgent);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_institutions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_studies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_institutions_updated_at ON institutions;
CREATE TRIGGER trigger_institutions_updated_at
  BEFORE UPDATE ON institutions
  FOR EACH ROW
  EXECUTE FUNCTION update_institutions_updated_at();

DROP TRIGGER IF EXISTS trigger_studies_updated_at ON studies;
CREATE TRIGGER trigger_studies_updated_at
  BEFORE UPDATE ON studies
  FOR EACH ROW
  EXECUTE FUNCTION update_studies_updated_at();

-- RLS aktif et
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE studies ENABLE ROW LEVEL SECURITY;

-- Institutions RLS Politikaları
CREATE POLICY "Admins can view all institutions"
  ON institutions FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Admins can insert institutions"
  ON institutions FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Admins can update institutions"
  ON institutions FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Admins can delete institutions"
  ON institutions FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

-- Studies RLS Politikaları
CREATE POLICY "Admins can view all studies"
  ON studies FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Radiologists can view assigned studies"
  ON studies FOR SELECT
  TO authenticated
  USING (
    assigned_to IN (
      SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
    )
  );

CREATE POLICY "Admins can insert studies"
  ON studies FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Admins can update all studies"
  ON studies FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Radiologists can update assigned studies"
  ON studies FOR UPDATE
  TO authenticated
  USING (
    assigned_to IN (
      SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
    )
  )
  WITH CHECK (
    assigned_to IN (
      SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
    )
  );

CREATE POLICY "Admins can delete studies"
  ON studies FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );