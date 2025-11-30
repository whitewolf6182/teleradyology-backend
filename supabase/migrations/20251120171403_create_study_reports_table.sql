/*
  # Study Reports (Çalışma Raporları) Tablosu Oluşturma

  ## Genel Bakış
  Bir study'e ait birden fazla rapor olabilir (ön rapor, nihai rapor, revize rapor, ikinci görüş)
  
  ## Yeni Tablo
  
  ### study_reports (Çalışma Raporları)
  Her study için birden fazla rapor kaydı tutulur
  
  **Kolonlar:**
  - `report_id` (uuid, primary key)
  - `study_id` (uuid, FK) - Hangi study'e ait
  - `report_type` (text) - Rapor tipi (preliminary, final, revised, second_opinion, addendum)
  - `report_status` (text) - Rapor durumu (draft, submitted, approved, rejected)
  - `report_text` (text) - Rapor içeriği
  - `findings` (text) - Bulgular
  - `impression` (text) - İzlenim/Sonuç
  - `recommendations` (text) - Öneriler
  - `radiologist_id` (uuid, FK) - Raporu yazan radyolog
  - `reviewer_id` (uuid, FK) - Raporu inceleyen/onaylayan (opsiyonel)
  - `reported_at` (timestamptz) - Rapor tarihi
  - `submitted_at` (timestamptz) - Gönderim tarihi
  - `approved_at` (timestamptz) - Onay tarihi
  - `version` (integer) - Rapor versiyonu
  - `is_final` (boolean) - Nihai rapor mu
  - `is_signed` (boolean) - İmzalandı mı
  - `signature` (text) - Dijital imza
  - `notes` (text) - Dahili notlar
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## İndeksler
  - study_id, radiologist_id için indeksler
  - Sık sorgulanan alanlar için indeksler
  
  ## RLS Politikaları
  - Adminler tüm raporları görebilir
  - Radyologlar kendi yazdıkları raporları görebilir/düzenleyebilir
  - Atanan radyologlar ilgili study'nin tüm raporlarını görebilir
  
  ## Studies Tablosundaki Değişiklikler
  - report_text ve report_date alanları deprecated (backward compatibility için kalır)
  - Artık study_reports tablosu kullanılacak
*/

-- study_reports tablosu
CREATE TABLE IF NOT EXISTS study_reports (
  report_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL REFERENCES studies(study_id) ON DELETE CASCADE,
  report_type text NOT NULL DEFAULT 'final' CHECK (report_type IN ('preliminary', 'final', 'revised', 'second_opinion', 'addendum')),
  report_status text NOT NULL DEFAULT 'draft' CHECK (report_status IN ('draft', 'submitted', 'approved', 'rejected')),
  report_text text NOT NULL,
  findings text,
  impression text,
  recommendations text,
  radiologist_id uuid NOT NULL REFERENCES users(id),
  reviewer_id uuid REFERENCES users(id),
  reported_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  approved_at timestamptz,
  version integer DEFAULT 1,
  is_final boolean DEFAULT false,
  is_signed boolean DEFAULT false,
  signature text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_study_reports_study_id ON study_reports(study_id);
CREATE INDEX IF NOT EXISTS idx_study_reports_radiologist_id ON study_reports(radiologist_id);
CREATE INDEX IF NOT EXISTS idx_study_reports_reviewer_id ON study_reports(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_study_reports_report_type ON study_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_study_reports_report_status ON study_reports(report_status);
CREATE INDEX IF NOT EXISTS idx_study_reports_is_final ON study_reports(is_final);
CREATE INDEX IF NOT EXISTS idx_study_reports_reported_at ON study_reports(reported_at);

-- Unique constraint: Her study için bir version numarası sadece bir kez kullanılabilir
CREATE UNIQUE INDEX IF NOT EXISTS idx_study_reports_study_version 
  ON study_reports(study_id, version);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_study_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_study_reports_updated_at ON study_reports;
CREATE TRIGGER trigger_study_reports_updated_at
  BEFORE UPDATE ON study_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_study_reports_updated_at();

-- Otomatik version artırma trigger'ı
CREATE OR REPLACE FUNCTION increment_report_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Aynı study için son version numarasını bul ve 1 artır
  SELECT COALESCE(MAX(version), 0) + 1 INTO NEW.version
  FROM study_reports
  WHERE study_id = NEW.study_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_report_version ON study_reports;
CREATE TRIGGER trigger_increment_report_version
  BEFORE INSERT ON study_reports
  FOR EACH ROW
  WHEN (NEW.version IS NULL)
  EXECUTE FUNCTION increment_report_version();

-- RLS aktif et
ALTER TABLE study_reports ENABLE ROW LEVEL SECURITY;

-- Study Reports RLS Politikaları
CREATE POLICY "Admins can view all reports"
  ON study_reports FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Radiologists can view their own reports"
  ON study_reports FOR SELECT
  TO authenticated
  USING (
    radiologist_id IN (
      SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
    )
  );

CREATE POLICY "Radiologists can view reports of assigned studies"
  ON study_reports FOR SELECT
  TO authenticated
  USING (
    study_id IN (
      SELECT study_id FROM studies 
      WHERE assigned_to IN (
        SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
      )
    )
  );

CREATE POLICY "Radiologists can insert reports for assigned studies"
  ON study_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    study_id IN (
      SELECT study_id FROM studies 
      WHERE assigned_to IN (
        SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
      )
    )
    AND radiologist_id IN (
      SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
    )
  );

CREATE POLICY "Radiologists can update their own draft reports"
  ON study_reports FOR UPDATE
  TO authenticated
  USING (
    radiologist_id IN (
      SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
    )
    AND report_status = 'draft'
  )
  WITH CHECK (
    radiologist_id IN (
      SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
    )
  );

CREATE POLICY "Admins can insert reports"
  ON study_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Admins can update reports"
  ON study_reports FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Admins can delete reports"
  ON study_reports FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

-- View: Son raporları kolay erişim için
CREATE OR REPLACE VIEW study_latest_reports AS
SELECT DISTINCT ON (study_id)
  sr.*,
  u.first_name || ' ' || u.last_name as radiologist_name,
  u.email as radiologist_email
FROM study_reports sr
LEFT JOIN users u ON u.id = sr.radiologist_id
ORDER BY study_id, version DESC, created_at DESC;