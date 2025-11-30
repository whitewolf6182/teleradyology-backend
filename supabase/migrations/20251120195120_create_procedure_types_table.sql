/*
  # Procedure Types (Prosedür/Tetkik Tipleri) Tablosu Oluşturma

  ## Genel Bakış
  Radyolojik tetkik ve işlem tiplerini kategorize etmek için
  Her modalite için farklı prosedür tipleri
  Acil durum prosedürleri işaretlenebilir
  
  ## Yeni Tablo
  
  ### procedure_types (Prosedür Tipleri)
  Radyolojik tetkik ve işlem tiplerinin tanımları
  
  **Kolonlar:**
  - `proc_type_id` (uuid, primary key)
  - `proc_code` (text, unique) - Prosedür kodu (kısa kod)
  - `name` (text) - Prosedür adı
  - `name_en` (text) - İngilizce ad
  - `description` (text) - Detaylı açıklama
  - `modality` (text) - Hangi modalite (CT, MR, US, XR vb.)
  - `body_part` (text) - Vücut bölgesi
  - `category` (text) - Kategori (diagnostic, interventional, screening)
  - `is_emergency` (boolean) - Acil prosedür mü
  - `is_contrast` (boolean) - Kontrast madde gerekir mi
  - `requires_preparation` (boolean) - Hazırlık gerekir mi
  - `preparation_instructions` (text) - Hazırlık talimatları
  - `typical_duration` (integer) - Tipik süre (dakika)
  - `radiation_dose` (text) - Radyasyon dozu (low, medium, high)
  - `price` (decimal) - Fiyat
  - `cpt_code` (text) - CPT kodu (faturalandırma)
  - `icd_codes` (text[]) - İlişkili ICD kodları
  - `tags` (text[]) - Arama için etiketler
  - `is_active` (boolean) - Aktif mi
  - `usage_count` (integer) - Kaç kez kullanıldı
  - `created_by` (uuid, FK)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## İndeksler
  - modality, body_part, category için indeksler
  - is_emergency, is_active için indeksler
  
  ## RLS Politikaları
  - Herkes aktif prosedür tiplerini görebilir
  - Adminler tüm işlemleri yapabilir
  
  ## Örnek Prosedürler
  - Akciğer Grafisi
  - Kontrastlı Beyin BT
  - Lomber MR
  - Abdomen USG
  - Mamografi
*/

-- procedure_types tablosu
CREATE TABLE IF NOT EXISTS procedure_types (
  proc_type_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proc_code text UNIQUE NOT NULL,
  name text NOT NULL,
  name_en text,
  description text,
  modality text NOT NULL,
  body_part text,
  category text NOT NULL DEFAULT 'diagnostic' CHECK (category IN ('diagnostic', 'interventional', 'screening', 'therapeutic')),
  is_emergency boolean DEFAULT false,
  is_contrast boolean DEFAULT false,
  requires_preparation boolean DEFAULT false,
  preparation_instructions text,
  typical_duration integer DEFAULT 15,
  radiation_dose text CHECK (radiation_dose IN ('none', 'low', 'medium', 'high', 'very_high')),
  price decimal(10,2),
  cpt_code text,
  icd_codes text[] DEFAULT ARRAY[]::text[],
  tags text[] DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_procedure_types_modality ON procedure_types(modality);
CREATE INDEX IF NOT EXISTS idx_procedure_types_body_part ON procedure_types(body_part);
CREATE INDEX IF NOT EXISTS idx_procedure_types_category ON procedure_types(category);
CREATE INDEX IF NOT EXISTS idx_procedure_types_is_emergency ON procedure_types(is_emergency);
CREATE INDEX IF NOT EXISTS idx_procedure_types_is_active ON procedure_types(is_active);
CREATE INDEX IF NOT EXISTS idx_procedure_types_tags ON procedure_types USING GIN(tags);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_procedure_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_procedure_types_updated_at ON procedure_types;
CREATE TRIGGER trigger_procedure_types_updated_at
  BEFORE UPDATE ON procedure_types
  FOR EACH ROW
  EXECUTE FUNCTION update_procedure_types_updated_at();

-- RLS aktif et
ALTER TABLE procedure_types ENABLE ROW LEVEL SECURITY;

-- Procedure Types RLS Politikaları
CREATE POLICY "Everyone can view active procedure types"
  ON procedure_types FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all procedure types"
  ON procedure_types FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Admins can insert procedure types"
  ON procedure_types FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Admins can update procedure types"
  ON procedure_types FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Admins can delete procedure types"
  ON procedure_types FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

-- Örnek prosedür tipleri
INSERT INTO procedure_types (proc_code, name, name_en, description, modality, body_part, category, is_emergency, is_contrast, requires_preparation, preparation_instructions, typical_duration, radiation_dose, tags) VALUES

-- X-Ray (Röntgen) Prosedürleri
('XR_CHEST_PA', 'PA Akciğer Grafisi', 'Chest X-Ray PA', 'Posteroanterior akciğer radyografisi', 'XR', 'chest', 'diagnostic', false, false, false, null, 5, 'low', 
ARRAY['röntgen', 'akciğer', 'göğüs', 'chest', 'xray', 'grafi']),

('XR_CHEST_LATERAL', 'Lateral Akciğer Grafisi', 'Chest X-Ray Lateral', 'Yan akciğer radyografisi', 'XR', 'chest', 'diagnostic', false, false, false, null, 5, 'low',
ARRAY['röntgen', 'akciğer', 'lateral', 'chest']),

('XR_ABDOMEN', 'Ayakta Direkt Batın Grafisi', 'Abdomen X-Ray Standing', 'Ayakta direkt karın grafisi', 'XR', 'abdomen', 'diagnostic', true, false, false, null, 5, 'low',
ARRAY['röntgen', 'batın', 'karın', 'abdomen', 'acil']),

('XR_BONE', 'Kemik Grafisi', 'Bone X-Ray', 'Ekstremite ve kemik radyografisi', 'XR', 'extremity', 'diagnostic', false, false, false, null, 5, 'low',
ARRAY['röntgen', 'kemik', 'kırık', 'bone', 'fracture']),

('XR_SPINE_LUMBAR', 'Lomber Omurga Grafisi', 'Lumbar Spine X-Ray', 'Bel omurgası radyografisi', 'XR', 'spine', 'diagnostic', false, false, false, null, 10, 'medium',
ARRAY['röntgen', 'omurga', 'bel', 'lomber', 'spine']),

-- CT (Bilgisayarlı Tomografi) Prosedürleri
('CT_BRAIN_PLAIN', 'Beyin BT (Kontrastsız)', 'Brain CT Non-Contrast', 'Kranial bilgisayarlı tomografi kontrastsız', 'CT', 'brain', 'diagnostic', true, false, false, null, 10, 'medium',
ARRAY['bt', 'beyin', 'kafa', 'brain', 'cranial', 'acil']),

('CT_BRAIN_CONTRAST', 'Beyin BT (Kontrastlı)', 'Brain CT With Contrast', 'Kranial bilgisayarlı tomografi kontrastlı', 'CT', 'brain', 'diagnostic', false, true, true, 
'4 saat açlık. Böbrek fonksiyon testleri gereklidir.', 15, 'medium',
ARRAY['bt', 'beyin', 'kontrast', 'brain', 'contrast']),

('CT_CHEST', 'Toraks BT', 'Chest CT', 'Göğüs bilgisayarlı tomografisi', 'CT', 'chest', 'diagnostic', false, false, false, null, 10, 'medium',
ARRAY['bt', 'toraks', 'göğüs', 'akciğer', 'chest', 'lung']),

('CT_ABDOMEN_PELVIS', 'Abdomen-Pelvis BT (Kontrastlı)', 'Abdomen-Pelvis CT With Contrast', 'Karın ve pelvis BT oral ve IV kontrast', 'CT', 'abdomen', 'diagnostic', false, true, true,
'Tetkikten 2 saat önce 1 litre oral kontrast içilmelidir. 4 saat açlık. Böbrek fonksiyonları kontrol edilmelidir.', 20, 'medium',
ARRAY['bt', 'karın', 'abdomen', 'pelvis', 'kontrast']),

('CT_ANGIO_BRAIN', 'Beyin BT Anjiyografi', 'Brain CT Angiography', 'Serebral vasküler görüntüleme', 'CT', 'brain', 'diagnostic', true, true, true,
'4 saat açlık. Böbrek fonksiyonları normal olmalı.', 15, 'medium',
ARRAY['bt', 'anjio', 'beyin', 'damar', 'aneurysm', 'acil']),

-- MR (Manyetik Rezonans) Prosedürleri
('MR_BRAIN_PLAIN', 'Beyin MR (Kontrastsız)', 'Brain MRI Non-Contrast', 'Kranial manyetik rezonans görüntüleme', 'MR', 'brain', 'diagnostic', false, false, false, null, 30, 'none',
ARRAY['mr', 'mri', 'beyin', 'brain', 'cranial']),

('MR_BRAIN_CONTRAST', 'Beyin MR (Kontrastlı)', 'Brain MRI With Contrast', 'Kranial MR gadolinium kontrastlı', 'MR', 'brain', 'diagnostic', false, true, true,
'2 saat açlık önerilir. Böbrek fonksiyonları kontrol edilmelidir.', 40, 'none',
ARRAY['mr', 'mri', 'beyin', 'kontrast', 'gadolinium']),

('MR_SPINE_LUMBAR', 'Lomber MR', 'Lumbar Spine MRI', 'Bel omurgası manyetik rezonans', 'MR', 'spine', 'diagnostic', false, false, false, null, 30, 'none',
ARRAY['mr', 'mri', 'omurga', 'bel', 'lomber', 'herni']),

('MR_SPINE_CERVICAL', 'Servikal MR', 'Cervical Spine MRI', 'Boyun omurgası manyetik rezonans', 'MR', 'spine', 'diagnostic', false, false, false, null, 30, 'none',
ARRAY['mr', 'mri', 'omurga', 'boyun', 'servikal']),

('MR_KNEE', 'Diz MR', 'Knee MRI', 'Diz eklemi manyetik rezonans', 'MR', 'extremity', 'diagnostic', false, false, false, null, 30, 'none',
ARRAY['mr', 'mri', 'diz', 'knee', 'menisküs']),

('MR_SHOULDER', 'Omuz MR', 'Shoulder MRI', 'Omuz eklemi manyetik rezonans', 'MR', 'extremity', 'diagnostic', false, false, false, null, 30, 'none',
ARRAY['mr', 'mri', 'omuz', 'shoulder', 'rotator']),

-- Ultrason (USG) Prosedürleri
('US_ABDOMEN', 'Üst Abdomen USG', 'Upper Abdomen Ultrasound', 'Karaciğer, safra kesesi, pankreas, dalak ve böbrek ultrasonografisi', 'US', 'abdomen', 'diagnostic', false, false, true,
'6-8 saat açlık gereklidir. Gaz yapan yiyeceklerden kaçınılmalıdır.', 20, 'none',
ARRAY['usg', 'ultrason', 'abdomen', 'karın', 'karaciğer']),

('US_THYROID', 'Tiroid USG', 'Thyroid Ultrasound', 'Tiroid bezi ultrasonografisi', 'US', 'neck', 'diagnostic', false, false, false, null, 15, 'none',
ARRAY['usg', 'ultrason', 'tiroid', 'boyun', 'thyroid']),

('US_BREAST', 'Meme USG', 'Breast Ultrasound', 'Meme dokusu ultrasonografisi', 'US', 'breast', 'screening', false, false, false, null, 20, 'none',
ARRAY['usg', 'ultrason', 'meme', 'breast', 'kitle']),

('US_DOPPLER_CAROTID', 'Karotis Doppler USG', 'Carotid Doppler Ultrasound', 'Boyun damarları doppler ultrasonografisi', 'US', 'neck', 'diagnostic', false, false, false, null, 30, 'none',
ARRAY['usg', 'doppler', 'karotis', 'damar', 'carotid']),

('US_OBSTETRIC', 'Obstetrik USG', 'Obstetric Ultrasound', 'Gebelik takibi ultrasonografisi', 'US', 'obstetric', 'diagnostic', false, false, false, null, 20, 'none',
ARRAY['usg', 'ultrason', 'gebelik', 'obstetrik', 'bebek']),

-- Mamografi Prosedürleri
('MG_SCREENING', 'Tarama Mamografisi', 'Screening Mammography', 'Rutin meme tarama mamografisi', 'MG', 'breast', 'screening', false, false, false,
'Tetkik gününde deodorant, pudra veya krem kullanmayınız.', 15, 'low',
ARRAY['mamografi', 'meme', 'tarama', 'mammography', 'breast']),

('MG_DIAGNOSTIC', 'Tanısal Mamografi', 'Diagnostic Mammography', 'Problem odaklı mamografi tetkiki', 'MG', 'breast', 'diagnostic', false, false, false,
'Tetkik gününde deodorant, pudra veya krem kullanmayınız.', 20, 'low',
ARRAY['mamografi', 'meme', 'tanısal', 'mammography']),

-- Girişimsel Prosedürler
('IR_BIOPSY_LIVER', 'Karaciğer Biyopsisi (USG Eşliğinde)', 'Liver Biopsy US-Guided', 'Ultrason eşliğinde karaciğer biyopsisi', 'US', 'abdomen', 'interventional', false, false, true,
'6-8 saat açlık. Kanama testleri normal olmalı. İşlem öncesi onam formu.', 30, 'none',
ARRAY['biyopsi', 'girişimsel', 'karaciğer', 'biopsy']),

('IR_DRAINAGE', 'Drenaj (Görüntüleme Eşliğinde)', 'Image-Guided Drainage', 'Abse veya sıvı koleksiyonu drenajı', 'CT', 'abdomen', 'interventional', false, false, true,
'6 saat açlık. Kanama testleri. Antibiyotik profilaksisi.', 45, 'medium',
ARRAY['drenaj', 'girişimsel', 'abse', 'drainage']);
