# Teleradyoloji Backend API

Bun.js, Elysia ve PostgreSQL kullanılarak geliştirilmiş teleradyoloji sistemi backend API'si.

## Özellikler

- ✅ JWT tabanlı kimlik doğrulama (Access & Refresh Token)
- ✅ Rol bazlı yetkilendirme (Admin, Radiologist, Technician, User)
- ✅ Güvenli parola hashleme (bcrypt)
- ✅ Başarısız giriş denemesi takibi ve hesap kilitleme
- ✅ Kullanıcı profil yönetimi
- ✅ Repository pattern ile temiz mimari
- ✅ TypeScript desteği
- ✅ Validation ile güvenli veri girişi

## Teknolojiler

- **Runtime**: Bun.js
- **Framework**: Elysia
- **Database**: PostgreSQL (Bun native SQL driver)
- **Authentication**: JWT (@elysiajs/jwt)
- **Validation**: Zod (Elysia ile entegre)

## Veritabanı Yapısı

### logins tablosu
Kullanıcı kimlik doğrulama bilgilerini tutar:
- Kullanıcı adı ve şifre
- Rol yönetimi (admin, radiologist, technician, user)
- Refresh token yönetimi
- Başarısız giriş denemesi takibi
- Hesap kilitleme mekanizması

### users tablosu
Kullanıcı profil bilgilerini tutar:
- Kişisel bilgiler (ad, soyad, email, telefon)
- Mesleki bilgiler (lisans no, uzmanlık, hastane, departman)
- Profil fotoğrafı

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
bun install
```

2. `.env` dosyası oluşturun:
```bash
cp .env.example .env
```

3. `.env` dosyasını düzenleyin:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/teleradiology
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
PORT=3000
NODE_ENV=development
```

4. Veritabanı migrasyonlarını çalıştırın (Supabase kullanıyorsanız otomatik uygulanmıştır)

5. Uygulamayı başlatın:
```bash
bun run dev
```

## API Endpoints

### Authentication

#### Kullanıcı Kaydı
```http
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "password": "secure123",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+905551234567",
  "role": "radiologist",
  "license_number": "RAD-12345",
  "specialization": "Neuroradiology",
  "hospital_name": "City Hospital",
  "department": "Radiology"
}
```

#### Giriş Yapma
```http
POST /auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "secure123"
}
```

Yanıt:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "userId": "uuid",
      "username": "john_doe",
      "role": "radiologist",
      "profile": {...}
    }
  }
}
```

#### Token Yenileme
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### Çıkış Yapma
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

#### Mevcut Kullanıcı Bilgisi
```http
GET /auth/me
Authorization: Bearer <access_token>
```

### User Management

#### Profil Görüntüleme
```http
GET /users/profile
Authorization: Bearer <access_token>
```

#### Profil Güncelleme
```http
PUT /users/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "newemail@example.com",
  "phone": "+905559876543",
  "specialization": "Interventional Radiology"
}
```

#### Tüm Kullanıcıları Listeleme (Sadece Admin)
```http
GET /users
Authorization: Bearer <access_token>
```

## Güvenlik Özellikleri

### Parola Güvenliği
- Bcrypt ile hashleme (cost: 10)
- Minimum 6 karakter uzunluğu

### Hesap Güvenliği
- 5 başarısız giriş denemesinden sonra 30 dakika hesap kilitleme
- Başarılı girişten sonra sayaç sıfırlanır

### Token Yönetimi
- Access Token: 15 dakika (kısa ömürlü)
- Refresh Token: 7 gün (uzun ömürlü)
- Çıkış yapıldığında refresh token silinir

### Rol Bazlı Erişim
- `user`: Temel kullanıcı
- `technician`: Teknisyen
- `radiologist`: Radyolog
- `admin`: Sistem yöneticisi (tüm yetkilere sahip)

## Mimari Yapı

```
src/
├── config/
│   └── database.ts              # Veritabanı bağlantısı (Bun SQL)
├── middleware/
│   └── auth.middleware.ts       # JWT doğrulama ve yetkilendirme
├── models/                      # TypeScript interface'leri
│   ├── index.ts                 # Model exports
│   ├── login.model.ts           # Login interface'leri
│   ├── user.model.ts            # User interface'leri
│   ├── company.model.ts         # Company interface'leri
│   └── jwt.model.ts             # JWT interface'leri
├── repositories/                # Data Access Layer
│   ├── login.repository.ts      # Login veri erişimi
│   ├── user.repository.ts       # User veri erişimi
│   └── company.repository.ts    # Company veri erişimi
├── services/                    # Business Logic Layer
│   ├── auth.service.ts          # Kimlik doğrulama iş mantığı
│   ├── user.service.ts          # Kullanıcı iş mantığı
│   └── company.service.ts       # Şirket iş mantığı
├── routes/                      # API Endpoints
│   ├── auth.routes.ts           # Kimlik doğrulama endpoint'leri
│   ├── user.routes.ts           # Kullanıcı endpoint'leri
│   └── company.routes.ts        # Şirket endpoint'leri
├── utils/
│   └── password.ts              # Parola işlemleri
└── index.ts                     # Ana uygulama dosyası
```

## Örnek Kullanım Senaryosu

1. **Kayıt Olma**: Yeni bir radyolog hesabı oluştur
2. **Giriş Yapma**: Kullanıcı adı ve şifre ile giriş yap, token'ları al
3. **Profil Görüntüleme**: Access token ile profilini görüntüle
4. **Profil Güncelleme**: Uzmanlık alanını güncelle
5. **Token Yenileme**: Access token süresi dolduğunda refresh token ile yenile
6. **Çıkış Yapma**: Güvenli şekilde çıkış yap, refresh token'ı geçersiz kıl

## Test

```bash
bun test
```

## Geliştirme

Hot reload ile geliştirme:
```bash
bun run dev
```

Production build:
```bash
bun run start
```

## Lisans

Bu proje özel bir teleradyoloji sistemi için geliştirilmiştir.
