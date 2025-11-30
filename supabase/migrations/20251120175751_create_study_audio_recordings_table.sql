/*
  # Study Audio Recordings (Ses Kayıtları) Tablosu Oluşturma

  ## Genel Bakış
  Radyologların study'ler için ses kaydı yapabilmesi için
  Sesli raporlama, notlar, dictation için kullanılır
  
  ## Yeni Tablo
  
  ### study_audio_recordings (Ses Kayıtları)
  Study'lere ait ses kayıtlarının dosya yollarını ve metadata'sını tutar
  
  **Kolonlar:**
  - `recording_id` (uuid, primary key)
  - `study_id` (uuid, FK) - Hangi study'e ait
  - `report_id` (uuid, FK) - Hangi rapora ait (opsiyonel)
  - `recording_type` (text) - Ses kaydı tipi (dictation, voice_note, consultation)
  - `file_path` (text) - Ses dosyası yolu/URL
  - `file_name` (text) - Orijinal dosya adı
  - `file_size` (bigint) - Dosya boyutu (bytes)
  - `mime_type` (text) - MIME tipi (audio/mpeg, audio/wav, vb.)
  - `duration` (integer) - Süre (saniye)
  - `transcription` (text) - Transkript/metin dönüşümü (opsiyonel)
  - `transcription_status` (text) - Transkript durumu (pending, processing, completed, failed)
  - `recorded_by` (uuid, FK) - Kaydı yapan kişi
  - `recorded_at` (timestamptz) - Kayıt tarihi
  - `is_processed` (boolean) - İşlendi mi (transcript yapıldı mı)
  - `is_archived` (boolean) - Arşivlendi mi
  - `language` (text) - Dil kodu (tr, en, vb.)
  - `notes` (text) - Notlar
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## İndeksler
  - study_id, report_id, recorded_by için indeksler
  - Sık sorgulanan alanlar için indeksler
  
  ## RLS Politikaları
  - Adminler tüm ses kayıtlarını görebilir
  - Radyologlar kendi yaptıkları kayıtları görebilir/yönetebilir
  - Atanan radyologlar ilgili study'nin ses kayıtlarını görebilir
*/

-- study_audio_recordings tablosu
CREATE TABLE IF NOT EXISTS study_audio_recordings (
  recording_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL REFERENCES studies(study_id) ON DELETE CASCADE,
  report_id uuid REFERENCES study_reports(report_id) ON DELETE SET NULL,
  recording_type text NOT NULL DEFAULT 'dictation' CHECK (recording_type IN ('dictation', 'voice_note', 'consultation', 'annotation')),
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint DEFAULT 0,
  mime_type text DEFAULT 'audio/mpeg',
  duration integer DEFAULT 0,
  transcription text,
  transcription_status text DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  recorded_by uuid NOT NULL REFERENCES users(id),
  recorded_at timestamptz DEFAULT now(),
  is_processed boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  language text DEFAULT 'tr',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_audio_recordings_study_id ON study_audio_recordings(study_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_report_id ON study_audio_recordings(report_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_recorded_by ON study_audio_recordings(recorded_by);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_recording_type ON study_audio_recordings(recording_type);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_transcription_status ON study_audio_recordings(transcription_status);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_is_processed ON study_audio_recordings(is_processed);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_recorded_at ON study_audio_recordings(recorded_at);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_audio_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audio_recordings_updated_at ON study_audio_recordings;
CREATE TRIGGER trigger_audio_recordings_updated_at
  BEFORE UPDATE ON study_audio_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_audio_recordings_updated_at();

-- RLS aktif et
ALTER TABLE study_audio_recordings ENABLE ROW LEVEL SECURITY;

-- Study Audio Recordings RLS Politikaları
CREATE POLICY "Admins can view all audio recordings"
  ON study_audio_recordings FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Users can view their own recordings"
  ON study_audio_recordings FOR SELECT
  TO authenticated
  USING (
    recorded_by IN (
      SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
    )
  );

CREATE POLICY "Radiologists can view recordings of assigned studies"
  ON study_audio_recordings FOR SELECT
  TO authenticated
  USING (
    study_id IN (
      SELECT study_id FROM studies 
      WHERE assigned_to IN (
        SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
      )
    )
  );

CREATE POLICY "Users can insert their own recordings"
  ON study_audio_recordings FOR INSERT
  TO authenticated
  WITH CHECK (
    recorded_by IN (
      SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
    )
  );

CREATE POLICY "Users can update their own recordings"
  ON study_audio_recordings FOR UPDATE
  TO authenticated
  USING (
    recorded_by IN (
      SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
    )
  )
  WITH CHECK (
    recorded_by IN (
      SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
    )
  );

CREATE POLICY "Admins can insert recordings"
  ON study_audio_recordings FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Admins can update recordings"
  ON study_audio_recordings FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Admins can delete recordings"
  ON study_audio_recordings FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM logins WHERE id = (current_setting('app.current_user_id', true))::uuid) = 'admin'
  );

CREATE POLICY "Users can delete their own recordings"
  ON study_audio_recordings FOR DELETE
  TO authenticated
  USING (
    recorded_by IN (
      SELECT id FROM users WHERE login_id = (current_setting('app.current_user_id', true))::uuid
    )
  );