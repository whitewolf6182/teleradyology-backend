# Teleradyoloji Backend - Fonksiyon Dokümantasyonu

Bu doküman, tüm repository katmanlarındaki fonksiyonların detaylı açıklamalarını içerir.

## İçindekiler
1. [Login Repository](#loginrepository)
2. [User Repository](#userrepository)
3. [Company Repository](#companyrepository)
4. [User-Company Repository](#user-companyrepository)
5. [Institution Repository](#institutionrepository)
6. [Device Repository](#devicerepository)
7. [Study Repository](#studyrepository)
8. [Study Report Repository](#studyreportrepository)
9. [Audio Recording Repository](#audiorecordingrepository)

---

## LoginRepository

Kullanıcı kimlik doğrulama ve oturum yönetimi için veri erişim katmanı.

### `findById(id: string): Promise<Login | null>`
- **Ne İşe Yarar:** Kullanıcı login bilgilerini ID ile getirir
- **Parametreler:** `id` - Login ID'si (UUID)
- **Döner:** Login bilgileri veya null
- **Kullanım:** Token'dan gelen user ID ile kullanıcı bilgilerini almak için

### `findByUsername(username: string): Promise<Login | null>`
- **Ne İşe Yarar:** Kullanıcıyı username ile arar
- **Parametreler:** `username` - Kullanıcı adı (unique)
- **Döner:** Login bilgileri veya null
- **Kullanım:** Giriş yaparken username kontrolü için

### `findByRefreshToken(token: string): Promise<Login | null>`
- **Ne İşe Yarar:** Refresh token ile kullanıcıyı bulur
- **Parametreler:** `token` - Refresh token string
- **Döner:** Login bilgileri veya null
- **Kullanım:** Token yenileme işlemi için

### `create(data: CreateLoginDTO): Promise<Login>`
- **Ne İşe Yarar:** Yeni login kaydı oluşturur
- **Parametreler:**
  - `username` - Kullanıcı adı (unique)
  - `password` - Hash'lenmiş şifre
  - `role` - Kullanıcı rolü (admin, radiologist, technician, user)
- **Döner:** Oluşturulan Login kaydı
- **Kullanım:** Yeni kullanıcı kaydı için

### `update(id: string, data: UpdateLoginDTO): Promise<Login>`
- **Ne İşe Yarar:** Login bilgilerini günceller
- **Parametreler:**
  - `id` - Login ID'si
  - `data` - Güncellenecek alanlar (password, role, is_active, refresh_token)
- **Döner:** Güncellenmiş Login kaydı
- **Kullanım:** Şifre değişikliği, rol güncelleme

### `updatePassword(id: string, hashedPassword: string): Promise<Login>`
- **Ne İşe Yarar:** Sadece şifreyi günceller
- **Parametreler:**
  - `id` - Login ID'si
  - `hashedPassword` - Hash'lenmiş yeni şifre
- **Döner:** Güncellenmiş Login kaydı
- **Kullanım:** Şifre değiştirme işlemi için

### `updateRefreshToken(id: string, token: string | null): Promise<Login>`
- **Ne İşe Yarar:** Refresh token'ı günceller veya temizler
- **Parametreler:**
  - `id` - Login ID'si
  - `token` - Yeni refresh token veya null (logout için)
- **Döner:** Güncellenmiş Login kaydı
- **Kullanım:** Login sonrası token kaydetme, logout sonrası temizleme

### `updateLastLogin(id: string): Promise<Login>`
- **Ne İşe Yarar:** Son giriş zamanını günceller
- **Parametreler:** `id` - Login ID'si
- **Döner:** Güncellenmiş Login kaydı
- **Kullanım:** Her başarılı giriş sonrası

### `deactivate(id: string): Promise<Login>`
- **Ne İşe Yarar:** Kullanıcıyı pasif yapar (soft delete)
- **Parametreler:** `id` - Login ID'si
- **Döner:** Güncellenmiş Login (is_active = false)
- **Kullanım:** Kullanıcı hesabını devre dışı bırakma

### `activate(id: string): Promise<Login>`
- **Ne İşe Yarar:** Pasif kullanıcıyı tekrar aktif yapar
- **Parametreler:** `id` - Login ID'si
- **Döner:** Güncellenmiş Login (is_active = true)
- **Kullanım:** Devre dışı bırakılmış hesabı yeniden açma

### `delete(id: string): Promise<void>`
- **Ne İşe Yarar:** Login kaydını kalıcı olarak siler
- **Parametreler:** `id` - Login ID'si
- **Not:** Genellikle deactivate() tercih edilir
- **Kullanım:** Kalıcı silme gerektiğinde

### `incrementLoginAttempts(id: string): Promise<Login>`
- **Ne İşe Yarar:** Başarısız giriş denemesi sayacını artırır
- **Parametreler:** `id` - Login ID'si
- **Döner:** Güncellenmiş Login
- **Kullanım:** Brute force koruması için

### `resetLoginAttempts(id: string): Promise<Login>`
- **Ne İşe Yarar:** Başarısız giriş denemesi sayacını sıfırlar
- **Parametreler:** `id` - Login ID'si
- **Döner:** Güncellenmiş Login
- **Kullanım:** Başarılı giriş sonrası

### `lockAccount(id: string, lockUntil: Date): Promise<Login>`
- **Ne İşe Yarar:** Hesabı belirli bir süre kilitler
- **Parametreler:**
  - `id` - Login ID'si
  - `lockUntil` - Kilit bitiş zamanı
- **Döner:** Güncellenmiş Login
- **Kullanım:** Çok fazla başarısız giriş denemesi sonrası

### `unlockAccount(id: string): Promise<Login>`
- **Ne İşe Yarar:** Kilitli hesabı açar
- **Parametreler:** `id` - Login ID'si
- **Döner:** Güncellenmiş Login
- **Kullanım:** Manuel kilit açma veya süre dolunca

---

## UserRepository

Kullanıcı profil bilgileri için veri erişim katmanı.

### `findById(id: string): Promise<User | null>`
- **Ne İşe Yarar:** Kullanıcı profil bilgilerini ID ile getirir
- **Parametreler:** `id` - User ID'si (UUID)
- **Döner:** User bilgileri veya null
- **Kullanım:** Profil görüntüleme

### `findByLoginId(loginId: string): Promise<User | null>`
- **Ne İşe Yarar:** Login ID'si ile user bilgilerini getirir
- **Parametreler:** `loginId` - Login ID'si
- **Döner:** User bilgileri veya null
- **Kullanım:** Token'dan user bilgilerine erişim

### `findByEmail(email: string): Promise<User | null>`
- **Ne İşe Yarar:** Email ile kullanıcı arar
- **Parametreler:** `email` - Email adresi (unique)
- **Döner:** User bilgileri veya null
- **Kullanım:** Email kontrolü, şifre sıfırlama

### `findAll(): Promise<User[]>`
- **Ne İşe Yarar:** Tüm kullanıcıları getirir
- **Döner:** User dizisi
- **Kullanım:** Admin panelinde kullanıcı listesi

### `create(data: CreateUserDTO): Promise<User>`
- **Ne İşe Yarar:** Yeni kullanıcı profili oluşturur
- **Parametreler:**
  - `login_id` - Login ID'si (FK)
  - `first_name` - Ad
  - `last_name` - Soyad
  - `email` - Email (unique)
  - `phone`, `license_number`, `specialization` vb. - Opsiyonel alanlar
- **Döner:** Oluşturulan User kaydı
- **Kullanım:** Kayıt sonrası profil oluşturma

### `update(id: string, data: UpdateUserDTO): Promise<User>`
- **Ne İşe Yarar:** Kullanıcı bilgilerini günceller
- **Parametreler:**
  - `id` - User ID'si
  - `data` - Güncellenecek alanlar
- **Döner:** Güncellenmiş User kaydı
- **Kullanım:** Profil düzenleme

### `delete(id: string): Promise<void>`
- **Ne İşe Yarar:** Kullanıcıyı kalıcı olarak siler
- **Parametreler:** `id` - User ID'si
- **Kullanım:** Kullanıcı silme işlemi

### `findWithLogin(id: string): Promise<UserWithLogin | null>`
- **Ne İşe Yarar:** Kullanıcı ve login bilgilerini birlikte getirir
- **Parametreler:** `id` - User ID'si
- **Döner:** User + Login bilgileri veya null
- **Kullanım:** Detaylı profil görüntüleme (username, role dahil)

---

## CompanyRepository

Firma/kurum yönetimi için veri erişim katmanı.

### `findById(id: string): Promise<Company | null>`
- **Ne İşe Yarar:** Firma bilgilerini ID ile getirir
- **Parametreler:** `id` - Company ID'si (UUID)
- **Döner:** Company bilgileri veya null
- **Kullanım:** Firma detaylarını görüntüleme

### `findByCode(code: string): Promise<Company | null>`
- **Ne İşe Yarar:** Firma koduna göre firma bulur
- **Parametreler:** `code` - Firma kodu (unique)
- **Döner:** Company bilgileri veya null
- **Kullanım:** Firma kodu ile arama

### `findByTaxNumber(taxNumber: string): Promise<Company | null>`
- **Ne İşe Yarar:** Vergi numarasına göre firma bulur
- **Parametreler:** `taxNumber` - Vergi numarası (unique)
- **Döner:** Company bilgileri veya null
- **Kullanım:** Vergi numarası kontrolü

### `findAll(): Promise<Company[]>`
- **Ne İşe Yarar:** Tüm firmaları getirir (soft delete edilmemişler)
- **Döner:** Company dizisi
- **Sıralama:** Firma adına göre A-Z
- **Kullanım:** Firma listesi

### `findActive(): Promise<Company[]>`
- **Ne İşe Yarar:** Sadece aktif firmaları getirir
- **Döner:** Aktif Company dizisi
- **Filtre:** status = 'active' ve deleted_at = null
- **Kullanım:** Çalışan firma listesi

### `create(data: CreateCompanyDTO): Promise<Company>`
- **Ne İşe Yarar:** Yeni firma oluşturur
- **Parametreler:**
  - `company_name` - Firma adı
  - `company_code` - Firma kodu (unique)
  - `tax_number`, `email`, `phone`, `address` vb. - Firma bilgileri
  - `created_by` - Oluşturan kişi ID'si
- **Döner:** Oluşturulan Company kaydı
- **Kullanım:** Yeni firma kaydı

### `update(id: string, data: UpdateCompanyDTO): Promise<Company>`
- **Ne İşe Yarar:** Firma bilgilerini günceller
- **Parametreler:**
  - `id` - Company ID'si
  - `data` - Güncellenecek alanlar
  - `updated_by` - Güncelleyen kişi ID'si
- **Döner:** Güncellenmiş Company kaydı
- **Kullanım:** Firma bilgisi düzenleme

### `softDelete(id: string): Promise<Company>`
- **Ne İşe Yarar:** Firmayı soft delete yapar (deleted_at işaretler)
- **Parametreler:** `id` - Company ID'si
- **Döner:** Güncellenmiş Company (deleted_at = now)
- **Kullanım:** Firmayı silme (geri alınabilir)

### `hardDelete(id: string): Promise<void>`
- **Ne İşe Yarar:** Firmayı kalıcı olarak siler
- **Parametreler:** `id` - Company ID'si
- **Not:** Genellikle softDelete tercih edilir
- **Kullanım:** Kalıcı silme

### `restore(id: string): Promise<Company>`
- **Ne İşe Yarar:** Soft delete edilmiş firmayı geri getirir
- **Parametreler:** `id` - Company ID'si
- **Döner:** Güncellenmiş Company (deleted_at = null)
- **Kullanım:** Silinen firmayı geri alma

### `activate(id: string): Promise<Company>`
- **Ne İşe Yarar:** Firmayı aktif duruma getirir
- **Parametreler:** `id` - Company ID'si
- **Döner:** Güncellenmiş Company (status = 'active')
- **Kullanım:** Firma aktivasyonu

### `deactivate(id: string): Promise<Company>`
- **Ne İşe Yarar:** Firmayı pasif duruma getirir
- **Parametreler:** `id` - Company ID'si
- **Döner:** Güncellenmiş Company (status = 'inactive')
- **Kullanım:** Firma deaktivasyonu

### `suspend(id: string): Promise<Company>`
- **Ne İşe Yarar:** Firmayı askıya alır
- **Parametreler:** `id` - Company ID'si
- **Döner:** Güncellenmiş Company (status = 'suspended')
- **Kullanım:** Firma askıya alma (ödeme sorunu vb.)

---

## User-CompanyRepository

Kullanıcı-Firma ilişkilerini yöneten many-to-many veri erişim katmanı.

### `findById(id: string): Promise<UserCompany | null>`
- **Ne İşe Yarar:** İlişki kaydını ID ile getirir
- **Parametreler:** `id` - İlişki ID'si (UUID)
- **Döner:** UserCompany bilgileri veya null
- **Kullanım:** Belirli bir ilişkiyi görüntüleme

### `findByUserAndCompany(userId: string, companyId: string): Promise<UserCompany | null>`
- **Ne İşe Yarar:** Kullanıcı ve firma için ilişki var mı kontrol eder
- **Parametreler:**
  - `userId` - Kullanıcı ID'si
  - `companyId` - Firma ID'si
- **Döner:** UserCompany veya null
- **Kullanım:** Aynı ilişki tekrar eklenmemeye kontrol

### `findByUserId(userId: string): Promise<UserCompanyWithDetails[]>`
- **Ne İşe Yarar:** Kullanıcının tüm firma ilişkilerini getirir
- **Parametreler:** `userId` - Kullanıcı ID'si
- **Döner:** İlişki dizisi (firma bilgileriyle birlikte)
- **Sıralama:** Aktif olanlar önce
- **Kullanım:** Kullanıcının çalıştığı/çalıştığı firmalar

### `findByCompanyId(companyId: string): Promise<UserCompanyWithDetails[]>`
- **Ne İşe Yarar:** Firmanın tüm kullanıcı ilişkilerini getirir
- **Parametreler:** `companyId` - Firma ID'si
- **Döner:** İlişki dizisi (kullanıcı bilgileriyle birlikte)
- **Kullanım:** Firmanın çalışanları

### `getActiveByUserId(userId: string): Promise<UserCompanyWithDetails[]>`
- **Ne İşe Yarar:** Kullanıcının sadece aktif ilişkilerini getirir
- **Parametreler:** `userId` - Kullanıcı ID'si
- **Döner:** Aktif ilişki dizisi
- **Filtre:** is_active = true
- **Kullanım:** Kullanıcının şu an çalıştığı firmalar

### `getActiveByCompanyId(companyId: string): Promise<UserCompanyWithDetails[]>`
- **Ne İşe Yarar:** Firmanın sadece aktif çalışanlarını getirir
- **Parametreler:** `companyId` - Firma ID'si
- **Döner:** Aktif ilişki dizisi
- **Kullanım:** Firmanın mevcut personeli

### `getManagersByCompany(companyId: string): Promise<UserCompanyWithDetails[]>`
- **Ne İşe Yarar:** Firmanın yöneticilerini getirir
- **Parametreler:** `companyId` - Firma ID'si
- **Döner:** Manager rolündeki ilişki dizisi
- **Filtre:** role_in_company = 'manager' ve is_active = true
- **Kullanım:** Firma yöneticileri listesi

### `create(data: CreateUserCompanyDTO): Promise<UserCompany>`
- **Ne İşe Yarar:** Kullanıcıyı firmaya bağlar (many-to-many)
- **Parametreler:**
  - `user_id` - Kullanıcı ID'si
  - `company_id` - Firma ID'si
  - `role_in_company` - Firmadaki rol (employee, manager, admin vb.)
  - `start_date`, `is_primary` - Opsiyonel alanlar
- **Döner:** Oluşturulan ilişki kaydı
- **Kullanım:** Kullanıcıyı firmaya ekleme

### `update(id: string, data: UpdateUserCompanyDTO): Promise<UserCompany>`
- **Ne İşe Yarar:** İlişki bilgilerini günceller
- **Parametreler:**
  - `id` - İlişki ID'si
  - `data` - Güncellenecek alanlar (role, end_date, is_active vb.)
- **Döner:** Güncellenmiş ilişki
- **Kullanım:** Rol değişikliği, çıkış tarihi ekleme

### `delete(id: string): Promise<void>`
- **Ne İşe Yarar:** İlişkiyi kalıcı olarak siler
- **Parametreler:** `id` - İlişki ID'si
- **Not:** Genellikle deactivate() tercih edilir
- **Kullanım:** Kalıcı silme

### `deactivate(id: string): Promise<UserCompany>`
- **Ne İşe Yarar:** İlişkiyi pasif yapar (soft delete)
- **Parametreler:** `id` - İlişki ID'si
- **Döner:** Güncellenmiş ilişki (is_active = false, end_date = today)
- **Kullanım:** Kullanıcı firmadan ayrıldığında

### `activate(id: string): Promise<UserCompany>`
- **Ne İşe Yarar:** Pasif ilişkiyi tekrar aktif yapar
- **Parametreler:** `id` - İlişki ID'si
- **Döner:** Güncellenmiş ilişki (is_active = true, end_date = null)
- **Kullanım:** Kullanıcı firmaya geri döndüğünde

---

## InstitutionRepository

Hastane/tıbbi kurum yönetimi için veri erişim katmanı.

### `findById(id: string): Promise<Institution | null>`
- **Ne İşe Yarar:** Kurum bilgilerini ID ile getirir
- **Parametreler:** `id` - Institution ID'si (UUID)
- **Döner:** Institution bilgileri veya null
- **Kullanım:** Kurum detaylarını görüntüleme

### `findByCode(code: string): Promise<Institution | null>`
- **Ne İşe Yarar:** Kurum koduna göre kurum bulur
- **Parametreler:** `code` - Kurum kodu (unique)
- **Döner:** Institution bilgileri veya null
- **Kullanım:** Kurum kodu ile arama

### `findAll(): Promise<Institution[]>`
- **Ne İşe Yarar:** Tüm kurumları getirir
- **Döner:** Institution dizisi
- **Sıralama:** Kurum adına göre A-Z
- **Kullanım:** Kurum listesi

### `findActive(): Promise<Institution[]>`
- **Ne İşe Yarar:** Sadece aktif kurumları getirir
- **Döner:** Aktif Institution dizisi
- **Filtre:** is_active = true
- **Kullanım:** Çalışan kurum listesi

### `findByType(type: string): Promise<Institution[]>`
- **Ne İşe Yarar:** Kurum tipine göre filtreler
- **Parametreler:** `type` - Kurum tipi (hospital, medical_center, imaging_center, clinic)
- **Döner:** Filtreli Institution dizisi
- **Kullanım:** Belirli tip kurumları listeleme

### `create(data: CreateInstitutionDTO): Promise<Institution>`
- **Ne İşe Yarar:** Yeni kurum oluşturur
- **Parametreler:**
  - `institution_code` - Kurum kodu (unique)
  - `institution_name` - Kurum adı
  - `institution_type` - Tip (hospital, medical_center, vb.)
  - `address`, `phone`, `email` vb. - İletişim bilgileri
  - `created_by` - Oluşturan kişi ID'si
- **Döner:** Oluşturulan Institution kaydı
- **Kullanım:** Yeni kurum kaydı

### `update(id: string, data: UpdateInstitutionDTO): Promise<Institution>`
- **Ne İşe Yarar:** Kurum bilgilerini günceller
- **Parametreler:**
  - `id` - Institution ID'si
  - `data` - Güncellenecek alanlar
- **Döner:** Güncellenmiş Institution kaydı
- **Kullanım:** Kurum bilgisi düzenleme

### `activate(id: string): Promise<Institution>`
- **Ne İşe Yarar:** Kurumu aktif duruma getirir
- **Parametreler:** `id` - Institution ID'si
- **Döner:** Güncellenmiş Institution (is_active = true)
- **Kullanım:** Kurum aktivasyonu

### `deactivate(id: string): Promise<Institution>`
- **Ne İşe Yarar:** Kurumu pasif duruma getirir
- **Parametreler:** `id` - Institution ID'si
- **Döner:** Güncellenmiş Institution (is_active = false)
- **Kullanım:** Kurum deaktivasyonu

### `delete(id: string): Promise<void>`
- **Ne İşe Yarar:** Kurumu kalıcı olarak siler
- **Parametreler:** `id` - Institution ID'si
- **Kullanım:** Kalıcı silme

---

## DeviceRepository

Tıbbi görüntüleme cihazları (MR, BT, US vb.) için veri erişim katmanı.

### `findById(id: string): Promise<Device | null>`
- **Ne İşe Yarar:** Cihaz bilgilerini ID ile getirir
- **Parametreler:** `id` - Device ID'si (UUID)
- **Döner:** Device bilgileri veya null
- **Kullanım:** Cihaz detaylarını görüntüleme

### `findByIdWithInstitution(id: string): Promise<DeviceWithInstitution | null>`
- **Ne İşe Yarar:** Cihaz ve kurum bilgilerini birlikte getirir
- **Parametreler:** `id` - Device ID'si
- **Döner:** Device + Institution bilgileri
- **Kullanım:** Detaylı cihaz görüntüleme (hangi hastanede olduğu dahil)

### `findByCode(code: string): Promise<Device | null>`
- **Ne İşe Yarar:** Cihaz koduna göre cihaz bulur
- **Parametreler:** `code` - Cihaz kodu (unique)
- **Döner:** Device bilgileri veya null
- **Kullanım:** Cihaz kodu ile arama

### `findByAETitle(aeTitle: string): Promise<Device | null>`
- **Ne İşe Yarar:** DICOM AE Title ile cihaz bulur
- **Parametreler:** `aeTitle` - DICOM Application Entity Title (unique)
- **Döner:** Device bilgileri veya null
- **Kullanım:** DICOM entegrasyonu için cihaz bulma

### `findAll(filters?: DeviceFilters): Promise<DeviceWithInstitution[]>`
- **Ne İşe Yarar:** Tüm cihazları filtrelerle getirir
- **Parametreler:** `filters` - Filtreleme kriterleri:
  - `device_type` - Cihaz tipi (CT, MR, US vb.)
  - `institution_id` - Kurum filtresi
  - `is_active` - Aktif/pasif
  - `is_online` - Online/offline
  - `search` - Arama terimi (ad, kod, konum)
- **Döner:** Filtreli Device dizisi
- **Kullanım:** Cihaz listesi, arama

### `findByInstitution(institutionId: string): Promise<DeviceWithInstitution[]>`
- **Ne İşe Yarar:** Belirli bir kurumun tüm cihazlarını getirir
- **Parametreler:** `institutionId` - Kurum ID'si
- **Döner:** Device dizisi
- **Kullanım:** Hastanedeki tüm cihazları listeleme

### `findActive(): Promise<DeviceWithInstitution[]>`
- **Ne İşe Yarar:** Sadece aktif cihazları getirir
- **Döner:** Aktif Device dizisi
- **Filtre:** is_active = true
- **Kullanım:** Çalışan cihaz listesi

### `findOnline(): Promise<DeviceWithInstitution[]>`
- **Ne İşe Yarar:** Online (bağlı) cihazları getirir
- **Döner:** Online Device dizisi
- **Filtre:** is_online = true ve is_active = true
- **Kullanım:** Şu an kullanılabilir cihazlar

### `findByType(deviceType: string): Promise<DeviceWithInstitution[]>`
- **Ne İşe Yarar:** Cihaz tipine göre filtreler
- **Parametreler:** `deviceType` - Modalite (CT, MR, XR, US vb.)
- **Döner:** Belirli tip cihazlar
- **Kullanım:** Örneğin sadece MR cihazlarını listeleme

### `findMaintenanceDue(daysAhead: number = 30): Promise<DeviceWithInstitution[]>`
- **Ne İşe Yarar:** Bakım tarihi yaklaşan cihazları getirir
- **Parametreler:** `daysAhead` - Kaç gün sonrası için kontrol (varsayılan: 30)
- **Döner:** Bakım gereken Device dizisi
- **Filtre:** next_maintenance_date <= bugün + daysAhead
- **Kullanım:** Bakım hatırlatıcısı, planlama

### `create(data: CreateDeviceDTO): Promise<Device>`
- **Ne İşe Yarar:** Yeni cihaz kaydı oluşturur
- **Parametreler:**
  - `device_code` - Cihaz kodu (unique)
  - `device_name` - Cihaz adı
  - `device_type` - Modalite (CT, MR vb.)
  - `institution_id` - Hangi kuruma ait
  - `manufacturer`, `model`, `serial_number` - Teknik bilgiler
  - `aet_title`, `ip_address`, `port` - DICOM bilgileri
  - `location` - Fiziksel konum
- **Döner:** Oluşturulan Device kaydı
- **Kullanım:** Yeni cihaz ekleme (örn: MR cihazı)

### `update(id: string, data: UpdateDeviceDTO): Promise<Device>`
- **Ne İşe Yarar:** Cihaz bilgilerini günceller
- **Parametreler:**
  - `id` - Device ID'si
  - `data` - Güncellenecek alanlar
- **Döner:** Güncellenmiş Device kaydı
- **Kullanım:** Cihaz bilgisi düzenleme

### `setOnline(id: string): Promise<Device>`
- **Ne İşe Yarar:** Cihazı online duruma getirir
- **Parametreler:** `id` - Device ID'si
- **Döner:** Güncellenmiş Device (is_online = true)
- **Kullanım:** Cihaz bağlandığında

### `setOffline(id: string): Promise<Device>`
- **Ne İşe Yarar:** Cihazı offline duruma getirir
- **Parametreler:** `id` - Device ID'si
- **Döner:** Güncellenmiş Device (is_online = false)
- **Kullanım:** Cihaz bağlantısı kesildiğinde

### `activate(id: string): Promise<Device>`
- **Ne İşe Yarar:** Cihazı aktif duruma getirir
- **Parametreler:** `id` - Device ID'si
- **Döner:** Güncellenmiş Device (is_active = true)
- **Kullanım:** Cihaz aktivasyonu

### `deactivate(id: string): Promise<Device>`
- **Ne İşe Yarar:** Cihazı pasif yapar (soft delete)
- **Parametreler:** `id` - Device ID'si
- **Döner:** Güncellenmiş Device (is_active = false, is_online = false)
- **Kullanım:** Cihaz devre dışı bırakma

### `updateMaintenance(id: string, maintenanceDate: string, nextMaintenanceDate?: string): Promise<Device>`
- **Ne İşe Yarar:** Cihaz bakım tarihlerini günceller
- **Parametreler:**
  - `id` - Device ID'si
  - `maintenanceDate` - Son bakım tarihi
  - `nextMaintenanceDate` - Sonraki bakım tarihi (opsiyonel)
- **Döner:** Güncellenmiş Device
- **Kullanım:** Bakım sonrası tarih güncelleme

### `delete(id: string): Promise<void>`
- **Ne İşe Yarar:** Cihazı kalıcı olarak siler
- **Parametreler:** `id` - Device ID'si
- **Kullanım:** Kalıcı silme

### `getStatistics(id: string): Promise<DeviceStatistics>`
- **Ne İşe Yarar:** Cihaz istatistiklerini getirir
- **Parametreler:** `id` - Device ID'si
- **Döner:**
  - `total_studies` - Toplam çalışma sayısı
  - `pending_studies` - Bekleyen çalışmalar
  - `completed_studies` - Tamamlanan çalışmalar
  - `last_study_date` - Son çalışma tarihi
- **Kullanım:** Cihaz performans takibi

### `getCountByInstitution(): Promise<object[]>`
- **Ne İşe Yarar:** Kurumlara göre cihaz sayılarını döner
- **Döner:** Her kurum için:
  - `institution_id`, `institution_name`
  - `device_count` - Toplam cihaz
  - `active_count` - Aktif cihaz
  - `online_count` - Online cihaz
- **Kullanım:** İstatistik raporları

### `getCountByType(): Promise<object[]>`
- **Ne İşe Yarar:** Cihaz tiplerine göre istatistikler
- **Döner:** Her tip için:
  - `device_type` - CT, MR, US vb.
  - `total` - Toplam sayı
  - `active` - Aktif sayı
  - `online` - Online sayı
- **Kullanım:** Cihaz envanter raporu

---

## StudyRepository

Hasta çalışmaları/incelemeleri için veri erişim katmanı.

### `findById(id: string): Promise<Study | null>`
- **Ne İşe Yarar:** Çalışma bilgilerini ID ile getirir
- **Parametreler:** `id` - Study ID'si (UUID)
- **Döner:** Study bilgileri veya null
- **Kullanım:** Çalışma detaylarını görüntüleme

### `findByIdWithDetails(id: string): Promise<StudyWithDetails | null>`
- **Ne İşe Yarar:** Çalışma + kurum + cihaz + radyolog bilgilerini getirir
- **Parametreler:** `id` - Study ID'si
- **Döner:** StudyWithDetails (tüm ilişkili bilgilerle)
- **Kullanım:** Detaylı çalışma görüntüleme

### `findByStudyInstanceUid(uid: string): Promise<Study | null>`
- **Ne İşe Yarar:** DICOM Study Instance UID ile çalışma bulur
- **Parametreler:** `uid` - DICOM Study Instance UID (unique)
- **Döner:** Study bilgileri veya null
- **Kullanım:** DICOM entegrasyonu için çalışma bulma

### `findByAccessionNumber(accessionNumber: string): Promise<Study | null>`
- **Ne İşe Yarar:** Accession Number ile çalışma bulur
- **Parametreler:** `accessionNumber` - Tetkik numarası
- **Döner:** Study bilgileri veya null
- **Kullanım:** Tetkik numarası ile arama

### `findAll(filters?: StudyFilters): Promise<StudyWithDetails[]>`
- **Ne İşe Yarar:** Tüm çalışmaları filtrelerle getirir
- **Parametreler:** `filters` - Filtreleme kriterleri:
  - `study_status` - Durum (pending, assigned, in_progress, reported, completed)
  - `priority` - Öncelik (routine, urgent, stat)
  - `modality` - Modalite (CT, MR vb.)
  - `institution_id` - Kurum filtresi
  - `device_id` - Cihaz filtresi
  - `assigned_to` - Radyolog filtresi
  - `patient_id` - Hasta filtresi
  - `study_date_from`, `study_date_to` - Tarih aralığı
  - `is_urgent` - Acil mi
  - `search` - Arama terimi
- **Döner:** Filtreli Study dizisi
- **Kullanım:** Çalışma listesi, arama, raporlama

### `findByPatientId(patientId: string): Promise<StudyWithDetails[]>`
- **Ne İşe Yarar:** Bir hastaya ait tüm çalışmaları getirir
- **Parametreler:** `patientId` - Hasta ID'si
- **Döner:** Study dizisi
- **Sıralama:** Yeniden eskiye
- **Kullanım:** Hasta geçmişi

### `findByInstitution(institutionId: string): Promise<StudyWithDetails[]>`
- **Ne İşe Yarar:** Bir kuruma ait çalışmaları getirir
- **Parametreler:** `institutionId` - Kurum ID'si
- **Döner:** Study dizisi
- **Kullanım:** Kurumun çalışmaları

### `findByDevice(deviceId: string): Promise<StudyWithDetails[]>`
- **Ne İşe Yarar:** Bir cihazla çekilen çalışmaları getirir
- **Parametreler:** `deviceId` - Cihaz ID'si
- **Döner:** Study dizisi
- **Kullanım:** Cihaz bazlı raporlama

### `findByRadiologist(radiologistId: string): Promise<StudyWithDetails[]>`
- **Ne İşe Yarar:** Bir radyologa atanan çalışmaları getirir
- **Parametreler:** `radiologistId` - Radyolog ID'si
- **Döner:** Study dizisi
- **Kullanım:** Radyologun iş listesi

### `findPending(): Promise<StudyWithDetails[]>`
- **Ne İşe Yarar:** Atanmamış bekleyen çalışmaları getirir
- **Döner:** Study dizisi (status = 'pending')
- **Sıralama:** Önceliğe göre (urgent önce)
- **Kullanım:** Atanacak çalışma havuzu

### `findUrgent(): Promise<StudyWithDetails[]>`
- **Ne İşe Yarar:** Acil çalışmaları getirir
- **Döner:** Study dizisi (is_urgent = true veya priority = 'stat')
- **Kullanım:** Acil çalışma listesi

### `create(data: CreateStudyDTO): Promise<Study>`
- **Ne İşe Yarar:** Yeni çalışma kaydı oluşturur
- **Parametreler:**
  - `study_instance_uid` - DICOM Study UID (unique)
  - `patient_id`, `patient_name` - Hasta bilgileri
  - `study_date` - Çalışma tarihi
  - `modality` - Modalite (CT, MR vb.)
  - `institution_id` - Hangi kurumda
  - `device_id` - Hangi cihazla çekildi
  - `study_description`, `body_part` - Açıklama
  - `priority` - Öncelik
- **Döner:** Oluşturulan Study kaydı
- **Kullanım:** Yeni çalışma ekleme (PACS'ten vb.)

### `update(id: string, data: UpdateStudyDTO): Promise<Study>`
- **Ne İşe Yarar:** Çalışma bilgilerini günceller
- **Parametreler:**
  - `id` - Study ID'si
  - `data` - Güncellenecek alanlar
- **Döner:** Güncellenmiş Study
- **Kullanım:** Çalışma bilgisi düzenleme

### `assignToRadiologist(id: string, radiologistId: string): Promise<Study>`
- **Ne İşe Yarar:** Çalışmayı radyologa atar
- **Parametreler:**
  - `id` - Study ID'si
  - `radiologistId` - Radyolog ID'si
- **Döner:** Güncellenmiş Study (status = 'assigned')
- **Kullanım:** Çalışma atama işlemi

### `updateStatus(id: string, status: string): Promise<Study>`
- **Ne İşe Yarar:** Çalışma durumunu günceller
- **Parametreler:**
  - `id` - Study ID'si
  - `status` - Yeni durum (pending, assigned, in_progress, reported, completed, cancelled)
- **Döner:** Güncellenmiş Study
- **Kullanım:** İş akışı yönetimi

### `markAsUrgent(id: string): Promise<Study>`
- **Ne İşe Yarar:** Çalışmayı acil olarak işaretler
- **Parametreler:** `id` - Study ID'si
- **Döner:** Güncellenmiş Study (is_urgent = true, priority = 'stat')
- **Kullanım:** Acil durum işaretleme

### `delete(id: string): Promise<void>`
- **Ne İşe Yarar:** Çalışmayı kalıcı olarak siler
- **Parametreler:** `id` - Study ID'si
- **Kullanım:** Kalıcı silme

### `getStatistics(): Promise<StudyStatistics>`
- **Ne İşe Yarar:** Genel çalışma istatistiklerini getirir
- **Döner:**
  - `total` - Toplam çalışma
  - `pending` - Bekleyen
  - `assigned` - Atanan
  - `in_progress` - İşlemde
  - `reported` - Raporlanan
  - `completed` - Tamamlanan
  - `cancelled` - İptal
  - `urgent` - Acil
- **Kullanım:** Dashboard, raporlama

### `getStatisticsByModality(): Promise<object[]>`
- **Ne İşe Yarar:** Modaliteye göre çalışma sayıları
- **Döner:** Her modalite için sayılar
- **Kullanım:** İstatistik raporları

### `getStatisticsByInstitution(): Promise<object[]>`
- **Ne İşe Yarar:** Kuruma göre çalışma sayıları
- **Döner:** Her kurum için sayılar
- **Kullanım:** Kurum bazlı raporlama

### `getRadiologistWorkload(radiologistId: string): Promise<object>`
- **Ne İşe Yarar:** Radyologun iş yükü istatistiği
- **Parametreler:** `radiologistId` - Radyolog ID'si
- **Döner:** Atanan, tamamlanan, bekleyen vb. sayılar
- **Kullanım:** İş yükü dengesi

---

## StudyReportRepository

Çalışma raporları için veri erişim katmanı (bir study'e birden fazla rapor olabilir).

### `findById(id: string): Promise<StudyReport | null>`
- **Ne İşe Yarar:** Rapor bilgilerini ID ile getirir
- **Parametreler:** `id` - Report ID'si (UUID)
- **Döner:** StudyReport bilgileri veya null
- **Kullanım:** Rapor detaylarını görüntüleme

### `findByIdWithDetails(id: string): Promise<StudyReportWithDetails | null>`
- **Ne İşe Yarar:** Rapor + radyolog + reviewer + study bilgilerini getirir
- **Parametreler:** `id` - Report ID'si
- **Döner:** StudyReportWithDetails (tüm ilişkili bilgilerle)
- **Kullanım:** Detaylı rapor görüntüleme

### `findByStudyId(studyId: string): Promise<StudyReportWithDetails[]>`
- **Ne İşe Yarar:** Bir çalışmanın tüm raporlarını getirir
- **Parametreler:** `studyId` - Study ID'si
- **Döner:** Rapor dizisi
- **Sıralama:** Versiyona göre (yeniden eskiye)
- **Kullanım:** Çalışmanın rapor geçmişi

### `findLatestByStudyId(studyId: string): Promise<StudyReportWithDetails | null>`
- **Ne İşe Yarar:** Bir çalışmanın en son raporunu getirir
- **Parametreler:** `studyId` - Study ID'si
- **Döner:** En yüksek version'lı rapor
- **Kullanım:** Güncel raporu görüntüleme

### `findFinalByStudyId(studyId: string): Promise<StudyReportWithDetails | null>`
- **Ne İşe Yarar:** Bir çalışmanın nihai (final) raporunu getirir
- **Parametreler:** `studyId` - Study ID'si
- **Döner:** is_final = true olan rapor
- **Kullanım:** Onaylanmış final raporu görüntüleme

### `findByRadiologist(radiologistId: string): Promise<StudyReportWithDetails[]>`
- **Ne İşe Yarar:** Bir radyologun yazdığı raporları getirir
- **Parametreler:** `radiologistId` - Radyolog ID'si
- **Döner:** Rapor dizisi
- **Kullanım:** Radyologun rapor geçmişi

### `findAll(filters?: StudyReportFilters): Promise<StudyReportWithDetails[]>`
- **Ne İşe Yarar:** Tüm raporları filtrelerle getirir
- **Parametreler:** `filters` - Filtreleme kriterleri:
  - `study_id` - Çalışma filtresi
  - `report_type` - Tip (preliminary, final, revised, second_opinion, addendum)
  - `report_status` - Durum (draft, submitted, approved, rejected)
  - `radiologist_id` - Radyolog filtresi
  - `reviewer_id` - Onaylayan filtresi
  - `is_final` - Final mi
  - `is_signed` - İmzalandı mı
  - `reported_date_from`, `reported_date_to` - Tarih aralığı
- **Döner:** Filtreli Rapor dizisi
- **Kullanım:** Rapor listesi, arama

### `findDrafts(radiologistId?: string): Promise<StudyReportWithDetails[]>`
- **Ne İşe Yarar:** Taslak raporları getirir
- **Parametreler:** `radiologistId` - Opsiyonel: Belirli radyolog
- **Döner:** Draft durumundaki raporlar
- **Kullanım:** Tamamlanmamış raporları gösterme

### `findPendingApproval(): Promise<StudyReportWithDetails[]>`
- **Ne İşe Yarar:** Onay bekleyen raporları getirir
- **Döner:** Submitted durumundaki raporlar
- **Sıralama:** Gönderim tarihine göre (eskiden yeniye)
- **Kullanım:** Onay kuyruğu

### `create(data: CreateStudyReportDTO): Promise<StudyReport>`
- **Ne İşe Yarar:** Yeni rapor oluşturur
- **Parametreler:**
  - `study_id` - Hangi çalışmaya ait
  - `report_type` - Rapor tipi (preliminary, final, vb.)
  - `report_text` - Rapor içeriği
  - `findings` - Bulgular (opsiyonel)
  - `impression` - İzlenim/sonuç (opsiyonel)
  - `recommendations` - Öneriler (opsiyonel)
  - `radiologist_id` - Raporu yazan
- **Döner:** Oluşturulan StudyReport
- **Not:** Version numarası otomatik artar (trigger)
- **Kullanım:** Yeni rapor yazma

### `update(id: string, data: UpdateStudyReportDTO): Promise<StudyReport>`
- **Ne İşe Yarar:** Rapor bilgilerini günceller
- **Parametreler:**
  - `id` - Report ID'si
  - `data` - Güncellenecek alanlar
- **Döner:** Güncellenmiş StudyReport
- **Kullanım:** Rapor düzenleme

### `submit(id: string): Promise<StudyReport>`
- **Ne İşe Yarar:** Raporu gönderir (onaya)
- **Parametreler:** `id` - Report ID'si
- **Döner:** Güncellenmiş StudyReport (status = 'submitted', submitted_at = now)
- **Kullanım:** Rapor tamamlanıp gönderildiğinde

### `approve(id: string, reviewerId: string): Promise<StudyReport>`
- **Ne İşe Yarar:** Raporu onaylar
- **Parametreler:**
  - `id` - Report ID'si
  - `reviewerId` - Onaylayan kişi ID'si
- **Döner:** Güncellenmiş StudyReport (status = 'approved', approved_at = now)
- **Kullanım:** Üst onay süreci

### `reject(id: string, reviewerId: string): Promise<StudyReport>`
- **Ne İşe Yarar:** Raporu reddeder
- **Parametreler:**
  - `id` - Report ID'si
  - `reviewerId` - Reddeden kişi ID'si
- **Döner:** Güncellenmiş StudyReport (status = 'rejected')
- **Kullanım:** Rapor red süreci

### `markAsFinal(id: string): Promise<StudyReport>`
- **Ne İşe Yarar:** Raporu nihai olarak işaretler
- **Parametreler:** `id` - Report ID'si
- **Döner:** Güncellenmiş StudyReport (is_final = true)
- **Kullanım:** Final rapor belirleme

### `sign(id: string, signature: string): Promise<StudyReport>`
- **Ne İşe Yarar:** Raporu dijital olarak imzalar
- **Parametreler:**
  - `id` - Report ID'si
  - `signature` - Dijital imza verisi
- **Döner:** Güncellenmiş StudyReport (is_signed = true)
- **Kullanım:** Rapor imzalama

### `delete(id: string): Promise<void>`
- **Ne İşe Yarar:** Raporu kalıcı olarak siler
- **Parametreler:** `id` - Report ID'si
- **Kullanım:** Kalıcı silme

### `getStatistics(): Promise<object>`
- **Ne İşe Yarar:** Genel rapor istatistiklerini getirir
- **Döner:**
  - `total` - Toplam rapor
  - `draft` - Taslak
  - `submitted` - Gönderilmiş
  - `approved` - Onaylanmış
  - `rejected` - Reddedilmiş
  - `signed` - İmzalanmış
- **Kullanım:** Dashboard, raporlama

### `getStatisticsByType(): Promise<object[]>`
- **Ne İşe Yarar:** Rapor tiplerine göre istatistikler
- **Döner:** Her tip için sayılar
- **Kullanım:** Rapor dağılım analizi

### `getRadiologistStatistics(radiologistId: string): Promise<object>`
- **Ne İşe Yarar:** Radyologun rapor istatistiklerini getirir
- **Parametreler:** `radiologistId` - Radyolog ID'si
- **Döner:** Draft, submitted, approved, final, signed sayıları
- **Kullanım:** Radyolog performans takibi

---

## AudioRecordingRepository

Ses kayıtları (sesli raporlama, dictation) için veri erişim katmanı.

### `findById(id: string): Promise<AudioRecording | null>`
- **Ne İşe Yarar:** Ses kaydı bilgilerini ID ile getirir
- **Parametreler:** `id` - Recording ID'si (UUID)
- **Döner:** AudioRecording bilgileri veya null
- **Kullanım:** Ses kaydı detaylarını görüntüleme

### `findByIdWithDetails(id: string): Promise<AudioRecordingWithDetails | null>`
- **Ne İşe Yarar:** Ses kaydı + kullanıcı + study + report bilgilerini getirir
- **Parametreler:** `id` - Recording ID'si
- **Döner:** AudioRecordingWithDetails (tüm ilişkili bilgilerle)
- **Kullanım:** Detaylı ses kaydı görüntüleme

### `findByStudyId(studyId: string): Promise<AudioRecordingWithDetails[]>`
- **Ne İşe Yarar:** Bir çalışmanın tüm ses kayıtlarını getirir
- **Parametreler:** `studyId` - Study ID'si
- **Döner:** Ses kaydı dizisi
- **Sıralama:** Kayıt tarihine göre (yeniden eskiye)
- **Kullanım:** Çalışmanın ses kayıt geçmişi

### `findByReportId(reportId: string): Promise<AudioRecordingWithDetails[]>`
- **Ne İşe Yarar:** Bir rapora ait ses kayıtlarını getirir
- **Parametreler:** `reportId` - Report ID'si
- **Döner:** Ses kaydı dizisi
- **Kullanım:** Raporla ilişkili ses kayıtları

### `findByUser(userId: string): Promise<AudioRecordingWithDetails[]>`
- **Ne İşe Yarar:** Bir kullanıcının yaptığı ses kayıtlarını getirir
- **Parametreler:** `userId` - Kullanıcı ID'si
- **Döner:** Ses kaydı dizisi
- **Kullanım:** Kullanıcının ses kayıt geçmişi

### `findAll(filters?: AudioRecordingFilters): Promise<AudioRecordingWithDetails[]>`
- **Ne İşe Yarar:** Tüm ses kayıtlarını filtrelerle getirir
- **Parametreler:** `filters` - Filtreleme kriterleri:
  - `study_id` - Çalışma filtresi
  - `report_id` - Rapor filtresi
  - `recording_type` - Tip (dictation, voice_note, consultation, annotation)
  - `recorded_by` - Kullanıcı filtresi
  - `transcription_status` - Transkript durumu (pending, processing, completed, failed)
  - `is_processed` - İşlendi mi
  - `is_archived` - Arşivlendi mi
  - `language` - Dil
  - `recorded_date_from`, `recorded_date_to` - Tarih aralığı
- **Döner:** Filtreli Ses kaydı dizisi
- **Kullanım:** Ses kaydı listesi, arama

### `findPendingTranscription(): Promise<AudioRecordingWithDetails[]>`
- **Ne İşe Yarar:** Transkript bekleyen ses kayıtlarını getirir
- **Döner:** pending veya processing durumundaki kayıtlar
- **Sıralama:** Kayıt tarihine göre (eskiden yeniye)
- **Kullanım:** Transkript işleme kuyruğu

### `findActive(): Promise<AudioRecordingWithDetails[]>`
- **Ne İşe Yarar:** Arşivlenmemiş ses kayıtlarını getirir
- **Döner:** is_archived = false olanlar
- **Kullanım:** Aktif ses kayıtları listesi

### `findByType(recordingType: string): Promise<AudioRecordingWithDetails[]>`
- **Ne İşe Yarar:** Kayıt tipine göre filtreler
- **Parametreler:** `recordingType` - dictation, voice_note, consultation, annotation
- **Döner:** Belirli tip kayıtlar
- **Kullanım:** Sadece dictation'ları listeleme gibi

### `create(data: CreateAudioRecordingDTO): Promise<AudioRecording>`
- **Ne İşe Yarar:** Yeni ses kaydı oluşturur
- **Parametreler:**
  - `study_id` - Hangi çalışmaya ait
  - `report_id` - Hangi rapora ait (opsiyonel)
  - `recording_type` - Kayıt tipi
  - `file_path` - Ses dosyası yolu/URL
  - `file_name` - Dosya adı
  - `file_size` - Dosya boyutu (bytes)
  - `mime_type` - MIME tipi (audio/mpeg, audio/wav vb.)
  - `duration` - Süre (saniye)
  - `recorded_by` - Kaydı yapan
  - `language` - Dil (tr, en vb.)
- **Döner:** Oluşturulan AudioRecording
- **Kullanım:** Yeni ses kaydı ekleme

### `update(id: string, data: UpdateAudioRecordingDTO): Promise<AudioRecording>`
- **Ne İşe Yarar:** Ses kaydı bilgilerini günceller
- **Parametreler:**
  - `id` - Recording ID'si
  - `data` - Güncellenecek alanlar
- **Döner:** Güncellenmiş AudioRecording
- **Kullanım:** Kayıt bilgisi düzenleme

### `addTranscription(id: string, transcription: string): Promise<AudioRecording>`
- **Ne İşe Yarar:** Ses kaydına transkript (metin dönüşümü) ekler
- **Parametreler:**
  - `id` - Recording ID'si
  - `transcription` - Transkript metni
- **Döner:** Güncellenmiş AudioRecording (status = 'completed', is_processed = true)
- **Kullanım:** Speech-to-text işlemi sonrası

### `updateTranscriptionStatus(id: string, status: string): Promise<AudioRecording>`
- **Ne İşe Yarar:** Transkript durumunu günceller
- **Parametreler:**
  - `id` - Recording ID'si
  - `status` - pending, processing, completed, failed
- **Döner:** Güncellenmiş AudioRecording
- **Kullanım:** Transkript süreç takibi

### `archive(id: string): Promise<AudioRecording>`
- **Ne İşe Yarar:** Ses kaydını arşivler
- **Parametreler:** `id` - Recording ID'si
- **Döner:** Güncellenmiş AudioRecording (is_archived = true)
- **Kullanım:** Eski kayıtları arşivleme

### `unarchive(id: string): Promise<AudioRecording>`
- **Ne İşe Yarar:** Arşivlenmiş kaydı geri getirir
- **Parametreler:** `id` - Recording ID'si
- **Döner:** Güncellenmiş AudioRecording (is_archived = false)
- **Kullanım:** Arşivden çıkarma

### `delete(id: string): Promise<void>`
- **Ne İşe Yarar:** Ses kaydını kalıcı olarak siler
- **Parametreler:** `id` - Recording ID'si
- **Not:** Dosya sisteminden de silinmeli
- **Kullanım:** Kalıcı silme

### `getStatistics(): Promise<object>`
- **Ne İşe Yarar:** Genel ses kaydı istatistiklerini getirir
- **Döner:**
  - `total` - Toplam kayıt
  - `pending_transcription` - Transkript bekleyen
  - `completed_transcription` - Transkript tamamlanan
  - `total_duration` - Toplam süre (saniye)
  - `total_size` - Toplam boyut (bytes)
- **Kullanım:** Dashboard, raporlama

### `getStatisticsByType(): Promise<object[]>`
- **Ne İşe Yarar:** Kayıt tiplerine göre istatistikler
- **Döner:** Her tip için:
  - `recording_type`
  - `total` - Toplam
  - `total_duration` - Toplam süre
  - `total_size` - Toplam boyut
  - `transcribed` - Transkript tamamlanan
- **Kullanım:** Tip bazlı analiz

### `getUserStatistics(userId: string): Promise<object>`
- **Ne İşe Yarar:** Kullanıcının ses kaydı istatistiklerini getirir
- **Parametreler:** `userId` - Kullanıcı ID'si
- **Döner:**
  - `total` - Toplam kayıt
  - `transcribed` - Transkript tamamlanan
  - `total_duration` - Toplam süre
  - `total_size` - Toplam boyut
- **Kullanım:** Kullanıcı performans takibi

### `getStudyStatistics(studyId: string): Promise<object>`
- **Ne İşe Yarar:** Çalışmanın ses kaydı istatistiklerini getirir
- **Parametreler:** `studyId` - Study ID'si
- **Döner:**
  - `total` - Toplam kayıt
  - `transcribed` - Transkript tamamlanan
  - `total_duration` - Toplam süre
  - `recorder_count` - Kaç farklı kişi kayıt yapmış
- **Kullanım:** Çalışma bazlı analiz

---

## Genel Notlar

### Hata Yönetimi
- Tüm repository fonksiyonları hata fırlatabilir
- Service katmanında uygun hata mesajları ile yakalanmalı
- HTTP durum kodları ile istemciye iletilmeli

### Güvenlik (RLS)
- Tüm tablolarda Row Level Security etkin
- Adminler tüm verilere erişebilir
- Kullanıcılar sadece yetkili oldukları verilere erişebilir
- Token'dan gelen user ID ile RLS politikaları çalışır

### Performans
- Sık kullanılan sorgular için indeksler mevcut
- JOIN'ler optimize edilmiş
- Filtreler WHERE clause'da

### Veri Bütünlüğü
- Foreign key constraint'ler mevcut
- Cascade delete uygun yerlerde tanımlı
- Unique constraint'ler veri tutarlılığını sağlıyor

### Soft Delete
- Login, Company gibi kritik tablolarda soft delete kullanılıyor
- Hard delete genellikle önerilmez
- Deleted kayıtlar raporlamada hariç tutulur
