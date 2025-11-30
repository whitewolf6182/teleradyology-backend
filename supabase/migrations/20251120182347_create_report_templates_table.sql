/*
  # Report Templates (Rapor Şablonları) Tablosu Oluşturma

  ## Genel Bakış
  Radyologların hızlı rapor yazabilmesi için önceden tanımlanmış rapor şablonları
  Modaliteye, vücut bölgesine ve tanıya göre şablonlar
  
  ## Yeni Tablo
  
  ### report_templates (Rapor Şablonları)
  Önceden tanımlanmış rapor şablonları
  
  **Kolonlar:**
  - `template_id` (uuid, primary key)
  - `template_name` (text) - Şablon adı
  - `template_code` (text, unique) - Şablon kodu (kısa kod)
  - `category` (text) - Kategori (normal, pathological, emergency)
  - `modality` (text) - Hangi modalite için (CT, MR, US, XR, vb.)
  - `body_part` (text) - Hangi vücut bölgesi (chest, abdomen, brain, vb.)
  - `diagnosis` (text) - Tanı/durum (pneumonia, fracture, normal, vb.)
  - `report_text` (text) - Ana rapor metni şablonu
  - `findings` (text) - Bulgular şablonu
  - `impression` (text) - İzlenim şablonu
  - `recommendations` (text) - Öneriler şablonu
  - `tags` (text[]) - Arama için etiketler
  - `language` (text) - Dil (tr, en)
  - `is_active` (boolean) - Aktif mi
  - `is_default` (boolean) - Varsayılan şablon mu
  - `usage_count` (integer) - Kaç kez kullanıldı
  - `created_by` (uuid, FK) - Oluşturan kişi
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## İndeksler
  - modality, body_part, category için indeksler
  - Full-text search için tsvector indeksi
  
  ## RLS Politikaları
  - Herkes aktif şablonları görebilir
  - Adminler tüm işlemleri yapabilir
  - Radyologlar kendi oluşturdukları şablonları düzenleyebilir
  
  ## Örnek Şablonlar
  - Normal Akciğer Grafisi
  - Pnömoni (Zatürre)
  - Kemik Kırığı
  - Normal BT
  - Normal MR
*/

-- report_templates tablosu
CREATE TABLE IF NOT EXISTS report_templates (
  template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  template_code text UNIQUE NOT NULL,
  category text NOT NULL DEFAULT 'normal' CHECK (category IN ('normal', 'pathological', 'emergency', 'followup')),
  modality text NOT NULL,
  body_part text,
  diagnosis text,
  report_text text NOT NULL,
  findings text,
  impression text,
  recommendations text,
  tags text[] DEFAULT ARRAY[]::text[],
  language text DEFAULT 'tr',
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_report_templates_modality ON report_templates(modality);
CREATE INDEX IF NOT EXISTS idx_report_templates_body_part ON report_templates(body_part);
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category);
CREATE INDEX IF NOT EXISTS idx_report_templates_diagnosis ON report_templates(diagnosis);
CREATE INDEX IF NOT EXISTS idx_report_templates_is_active ON report_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_report_templates_language ON report_templates(language);
CREATE INDEX IF NOT EXISTS idx_report_templates_created_by ON report_templates(created_by);

-- Full-text search için GIN indeksi (tags için)
CREATE INDEX IF NOT EXISTS idx_report_templates_tags ON report_templates USING GIN(tags);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_report_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_report_templates_updated_at ON report_templates;
CREATE TRIGGER trigger_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_report_templates_updated_at();

-- RLS aktif et
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- Report Templates RLS Politikaları
CREATE POLICY "Everyone can view active templates"
  ON report_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all templates"
  ON report_templates FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Users can view their own templates"
  ON report_templates FOR SELECT
  TO authenticated
  USING (
    created_by IN (
      SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
    )
  );

CREATE POLICY "Admins can insert templates"
  ON report_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Radiologists can insert templates"
  ON report_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) IN ('radiologist', 'admin')
    AND created_by IN (
      SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
    )
  );

CREATE POLICY "Admins can update templates"
  ON report_templates FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Users can update their own templates"
  ON report_templates FOR UPDATE
  TO authenticated
  USING (
    created_by IN (
      SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
    )
  )
  WITH CHECK (
    created_by IN (
      SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
    )
  );

CREATE POLICY "Admins can delete templates"
  ON report_templates FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

-- Örnek şablonlar (Türkçe)
INSERT INTO report_templates (template_name, template_code, category, modality, body_part, diagnosis, report_text, findings, impression, recommendations, tags, language, is_default) VALUES

-- Normal şablonlar
('Normal Akciğer Grafisi', 'XR_CHEST_NORMAL', 'normal', 'XR', 'chest', 'normal', 
'PA akciğer grafisinde bilateral akciğer parankimi doğal havalanmada, patolojik infiltrasyon, konsolidasyon, nodül veya kitle izlenmemektedir. Kalp gölgesi normal kardiyotorasik orana sahiptir. Hiler yapılar doğaldır. Hemidiyafragmalar düzenli konturludur. Mediastinal genişleme yoktur.',
'Bilateral akciğer parankimi doğal havalanmada. Patolojik infiltrasyon, konsolidasyon, nodül veya kitle izlenmemektedir.',
'Normal PA akciğer grafisi.',
'Klinik korelasyon önerilir.',
ARRAY['normal', 'akciğer', 'göğüs', 'chest', 'xray', 'grafi'],
'tr', true),

('Normal Kranial BT', 'CT_BRAIN_NORMAL', 'normal', 'CT', 'brain', 'normal',
'Serebral parankimde akut enfarkt veya kanama bulgusuna rastlanmadı. Ventriküler sistem normal boyut ve konfigürasyonda. Orta hat yapıları santraldir. Bazal ganglia, talamus ve beyin sapı doğaldır. Serebellar parankimde patoloji saptanmadı.',
'Serebral parankimde akut patoloji yok. Ventriküler sistem normal. Orta hat yapıları santral.',
'Normal kranial BT bulguları.',
'Klinik korelasyon önerilir.',
ARRAY['normal', 'beyin', 'kafa', 'brain', 'cranial', 'ct'],
'tr', true),

-- Patolojik şablonlar
('Pnömoni (Zatürre)', 'XR_CHEST_PNEUMONIA', 'pathological', 'XR', 'chest', 'pneumonia',
'PA akciğer grafisinde [SOL/SAĞ/BİLATERAL] akciğer [ALT/ORTA/ÜST] zon(lar)da hava bronkogramı içeren konsolidasyon alanı/alanları izlenmektedir. Plevral effüzyon [VAR/YOK]. Kalp gölgesi normal kardiyotorasik orana sahiptir.',
'[Lokalizasyon] akciğer zonlarında konsolidasyon alanları. Hava bronkogramı pozitif.',
'Radyolojik bulgular pnömoni ile uyumludur.',
'Klinik ve laboratuvar bulguları ile korele edilmesi önerilir. Gerekirse kontrol grafisi çekilebilir.',
ARRAY['pnömoni', 'zatürre', 'pneumonia', 'konsolidasyon', 'akciğer'],
'tr', true),

('Kemik Kırığı', 'XR_BONE_FRACTURE', 'pathological', 'XR', 'extremity', 'fracture',
'[KEMİK ADI] [LOKALIZASYON]''da [TİP] fraktür hattı izlenmektedir. Fraktür uçları [ALIGNED/DISPLACED]. [Ek bulgular: Parça sayısı, açılanma, kısalık vb.]',
'[Kemik] [lokalizasyon]''da fraktür hattı. [Deplasман durumu].',
'[Kemik adı] fraktürü.',
'Ortopedi konsültasyonu önerilir. Gerekirse ileri tetkik planlanabilir.',
ARRAY['kırık', 'fraktür', 'fracture', 'kemik', 'travma'],
'tr', true),

('Akut İskemik İnme', 'CT_BRAIN_STROKE', 'emergency', 'CT', 'brain', 'stroke',
'[LOKALIZASYON] serebral arterin sulama alanında akut iskemik enfarkt ile uyumlu hipodens alan izlenmektedir. Lezyon boyutu yaklaşık [BOYUT] cm. Orta hat yapılarında [SHIFT VAR/YOK]. Hemoraji komponenti izlenmemektedir.',
'[Lokalizasyon] sulama alanında akut iskemik enfarkt bulguları.',
'Akut iskemik inme bulguları.',
'ACİL! Nöroloji konsültasyonu önerilir. MR Difüzyon ve perfüzyon görüntüleme planlanabilir.',
ARRAY['inme', 'stroke', 'enfarkt', 'iskemi', 'acil', 'emergency'],
'tr', true),

-- Abdomen şablonları
('Normal Abdomen USG', 'US_ABDOMEN_NORMAL', 'normal', 'US', 'abdomen', 'normal',
'Karaciğer normal boyut ve ekojenitede, konturları düzenlidir. İntrahepatik safra yolları dilate değildir. Portal ven çapı normaldedir. Safra kesesi duvar kalınlığı normaldedir, taş izlenmez. Pankreas normal görünümdedir. Dalak normal boyuttadır. Her iki böbrek normal boyut ve parankim ekojenitesindedir, PCS dilate değildir, taş izlenmez.',
'Karaciğer, safra kesesi, pankreas, dalak ve böbrekler normal USG bulgularına sahiptir.',
'Normal üst abdomen USG bulguları.',
'Klinik korelasyon önerilir.',
ARRAY['normal', 'abdomen', 'karın', 'usg', 'ultrason', 'karaciğer'],
'tr', true),

('Safra Kesesi Taşı', 'US_GALLBLADDER_STONE', 'pathological', 'US', 'abdomen', 'cholelithiasis',
'Karaciğer normal boyut ve ekojenitededir. Safra kesesi duvarı [KALIN/NORMAL]. Safra kesesi lümeninde en büyüğü [BOYUT] mm çapında, arka akustik gölge veren, postür değişikliği ile hareketli, multiple kalkül görünümü mevcuttur. İntrahepatik safra yolları dilate değildir. Ana safra yolu çapı normal sınırlardadır.',
'Safra kesesinde multiple kalkül. [Ek bulgular].',
'Kolelithiazis (safra kesesi taşı).',
'Klinik korelasyon önerilir. Gerekirse cerrahi konsültasyon planlanabilir.',
ARRAY['safra', 'taş', 'kalkül', 'kolelithiazis', 'gallstone', 'usg'],
'tr', true),

-- MR şablonları
('Normal Lomber MR', 'MR_LUMBAR_NORMAL', 'normal', 'MR', 'spine', 'normal',
'Lomber vertebra korpusları normal sinyal intensitesinde ve dizilimdedir. Vertebra korpus yükseklikleri korunmuştur. Disk aralıkları normaldedir. Disk hernisi izlenmemektedir. Spinal kanal normal genişliktedir. Konus medullaris normal yerleşimde ve sinyalde. Kauda ekuina lifleri doğaldır.',
'Lomber vertebralar ve diskler normal MR görünümündedir. Disk hernisi yok.',
'Normal lomber MR bulguları.',
'Klinik korelasyon önerilir.',
ARRAY['normal', 'lomber', 'bel', 'omurga', 'spine', 'mr', 'mri'],
'tr', true),

('Disk Hernisi', 'MR_LUMBAR_HERNIA', 'pathological', 'MR', 'spine', 'disc_herniation',
'[SEVİYE] disk aralığında posterior [ORTA/PARAMEDYAN SOL/SAĞ] [PROTRÜZYON/EKSTRÜZYON] izlenmektedir. Herniasyon [DUYU SINIRI]''nü komprese etmektedir. Disk hernisi boyutu yaklaşık [BOYUT] mm. Spinal kanal [DARALMASI VAR/YOK]. [Diğer seviyeler normal/patolojik].',
'[Seviye] disk hernisi. [Sinir köki basısı].',
'Disk hernisi ve sinir köki basısı.',
'Nöroşirürji veya beyin cerrahi konsültasyonu önerilir.',
ARRAY['herni', 'hernia', 'disk', 'lomber', 'bel', 'ağrı', 'mr'],
'tr', true);
