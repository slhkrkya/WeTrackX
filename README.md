# WeTrackX - Kişisel Finans Takip Uygulaması - https://drive.google.com/file/d/1cLDVjC5m9rcKJn3QRkS66Q7fbuTmkqQw/view?usp=sharing
WeTrackX, kullanıcıların kişisel finanslarını yönetebileceği, gelir ve giderlerini takip edebileceği, kategorize edebileceği ve detaylı raporlar alabileceği modern bir web uygulamasıdır.

## 🚀 Özellikler

### 💰 Finansal Yönetim
- **Hesap Yönetimi**: Banka, Nakit, Kart ve Cüzdan hesapları
- **İşlem Takibi**: Gelir, gider ve transfer işlemleri
- **Kategori Sistemi**: Sistem ve kullanıcı kategorileri
- **Bakiye Takibi**: Gerçek zamanlı hesap bakiyeleri
- **Hesap Silme Sistemi**: 7 günlük geri yükleme süresi ile soft delete
- **İşlem Cascade**: Hesap silindiğinde bağlı işlemler de geçici olarak gizlenir

### 📊 Raporlama ve Analiz
- **Dashboard**: Aylık gelir/gider grafikleri
- **Kategori Raporları**: Gelir/gider dağılımı
- **Nakit Akışı**: Detaylı finansal analiz
- **İşlem Geçmişi**: Filtrelenebilir işlem listesi

### 🔐 Güvenlik ve Kullanıcı Deneyimi
- **JWT Kimlik Doğrulama**: Güvenli giriş/kayıt sistemi
- **Profil Yönetimi**: Kullanıcı bilgileri ve şifre değiştirme
- **Modern UI**: Responsive tasarım ve sürükle-bırak özellikleri
- **Türkçe Arayüz**: Tam Türkçe dil desteği
- **Otomatik Temizleme**: 7 günlük otomatik hesap ve işlem temizleme

---

## 🛠️ Teknoloji Stack

### Backend
- **Framework**: NestJS (Node.js)
- **ORM**: TypeORM
- **Veritabanı**: PostgreSQL
- **Kimlik Doğrulama**: JWT
- **Dil**: TypeScript

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animasyonlar**: GSAP (GreenSock)
- **Sürükle-Bırak**: @dnd-kit
- **Dil**: TypeScript

---

## 📋 Gereksinimler

### Sistem Gereksinimleri
- **Node.js**: 20.0.0 veya üzeri
- **npm**: 10.0.0 veya üzeri
- **PostgreSQL**: 15.0 veya üzeri
- **Git**: En son sürüm

### Önerilen Geliştirme Ortamı
- **IDE**: Visual Studio Code
- **Tarayıcı**: Chrome, Firefox, Safari, Edge
- **İşletim Sistemi**: Windows 10+, macOS 10.15+, Ubuntu 20.04+

---

## 🚀 Kurulum Adımları

### 1. Projeyi İndirin

```bash
# GitHub'dan projeyi klonlayın
git clone https://github.com/slhkrkya/WeTrackX.git
cd WeTrackX

# Veya ZIP olarak indirip açın
# https://github.com/slhkrkya/WeTrackX/archive/main.zip
```

### 2. Gerekli Yazılımları Yükleyin

#### Node.js Kurulumu
```bash
# Windows için: https://nodejs.org/en/download/
# macOS için:
brew install node

# Ubuntu/Debian için:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Versiyon kontrolü
node --version  # v20.x.x olmalı
npm --version   # v10.x.x olmalı
```

#### PostgreSQL Kurulumu
```bash
# Windows için: https://www.postgresql.org/download/windows/
# macOS için:
brew install postgresql
brew services start postgresql

# Ubuntu/Debian için:
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Veritabanını Hazırlayın

```bash
# PostgreSQL'e bağlanın
sudo -u postgres psql

# Veritabanını oluşturun
CREATE DATABASE wetrackx;

# Kullanıcı oluşturun (isteğe bağlı)
CREATE USER wetrackx_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE wetrackx TO wetrackx_user;

# Çıkış yapın
\q
```
### 4. Visual Studio Code Extensions Önerileri

- DotENV
- ES7+ React/Redux/React-Native snippets
- NestJs Snippets
- Next.js snippets
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- ESLint
**Not**: Eğer lint hatası alırsanız, ESLint'i disable edip Prettier'i tekrar başlatın

### 5. Backend Kurulumu

```bash
# Backend klasörüne gidin
cd backend

# Bağımlılıkları yükleyin
npm install

# Ortam değişkenlerini ayarlayın -> .env dosyasını backend kökünde manuel oluşturun
```

#### Backend .env Dosyası
```env
# Veritabanı Bağlantısı
DATABASE_URL=postgres://postgres:postgres@localhost:5432/wetrackx
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wetrackx
DB_USER=postgres
DB_PASS=postgres

# Veya kullanıcı oluşturduysanız:
# DATABASE_URL=postgres://wetrackx_user:your_password@localhost:5432/wetrackx
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wetrackx
DB_USER=wetrackx_user
DB_PASS=your_password

# Uygulama Ayarları
PORT=4000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES=1d

```

```bash
# Veritabanı tablolarını oluşturun
npm run migration:run

# Sistem kategorilerini yükleyin
npm run seed

# Geliştirme sunucusunu başlatın
npm run start:dev
```

### 5. Frontend Kurulumu

```bash
# Yeni bir terminal penceresi açın
# Proje ana dizinine gidin
cd WeTrackX

# Frontend klasörüne gidin
cd frontend

# Bağımlılıkları yükleyin
npm install

# Ortam değişkenlerini ayarlayın -> .env.local dosyasını frontend kökünde manuel oluşturun
```

#### Frontend .env.local Dosyası
```env
# Backend API URL'si
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

```bash
# Geliştirme sunucusunu başlatın
npm run dev
```

**Frontend başarıyla çalışıyor mu kontrol edin:**
- http://localhost:3000 adresine gidin
- WeTrackX ana sayfasını görmelisiniz

---

## 🎯 İlk Kullanım

### 1. Hesap Oluşturun
- http://localhost:3000 adresine gidin
- "Kayıt Ol" butonuna tıklayın
- Gerekli bilgileri doldurun

### 2. İlk Hesabınızı Ekleyin
- Dashboard'a giriş yapın
- "Hesap Ekle" butonuna tıklayın
- Hesap türünü seçin (Banka, Nakit, Kart, Cüzdan)

### 3. İlk İşleminizi Kaydedin
- "İşlem Ekle" butonuna tıklayın
- Gelir veya gider işlemi oluşturun
- Kategori seçin ve kaydedin

### 4. Hesap Silme ve Geri Yükleme
- Hesap silindiğinde 7 gün boyunca geri yüklenebilir
- Silinmiş hesaplar "Silinmiş Hesaplar" bölümünde görünür
- Hesap geri yüklendiğinde bağlı tüm işlemler de geri gelir
- 7 gün sonra hesap ve işlemler kalıcı olarak silinir

---

## 🏗️ Proje Yapısı

```
WeTrackX/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── accounts/       # Hesap yönetimi
│   │   ├── auth/          # Kimlik doğrulama
│   │   ├── categories/    # Kategori yönetimi
│   │   ├── reports/      # Raporlama
│   │   ├── transactions/ # İşlem yönetimi
│   │   └── users/        # Kullanıcı yönetimi
│   ├── package.json
│   └── .env
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/          # Sayfa bileşenleri
│   │   ├── components/   # UI bileşenleri
│   │   └── lib/         # API ve yardımcı fonksiyonlar
│   ├── package.json
│   └── .env.local
└── README.md
```

---

## 🔧 Geliştirme Komutları

### Backend Komutları
```bash
cd backend

# Geliştirme sunucusu
npm run start:dev

# Production build
npm run build
npm run start:prod

# Veritabanı işlemleri
npm run migration:generate -- src/migrations/MigrationName
npm run migration:run
npm run migration:revert

# Seed verileri
npm run seed

# Test
npm run test
npm run test:e2e
```

### Frontend Komutları
```bash
cd frontend

# Geliştirme sunucusu
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint

# Type checking
npm run type-check
```

---

## 🐛 Sorun Giderme

### Yaygın Sorunlar

#### 1. "Port 4000 is already in use"
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:4000 | xargs kill -9
```

#### 2. "Port 3000 is already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

#### 3. "Database connection failed"
```bash
# PostgreSQL servisinin çalıştığını kontrol edin
# Windows
services.msc  # PostgreSQL servisini bulun

# macOS
brew services list | grep postgresql

# Ubuntu
sudo systemctl status postgresql
```

#### 4. "Module not found" hataları
```bash
# Backend için
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend için
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### 5. "Migration failed"
```bash
cd backend
npm run migration:revert
npm run migration:run
```

#### 6. "Hesap silindi ama işlemler görünüyor"
```bash
# Bu normal bir durumdur. İşlemler 7 gün sonra otomatik temizlenir
# Veya hesabı geri yükleyerek işlemleri tekrar görünür hale getirebilirsiniz
# "Silinmiş Hesaplar" bölümünden hesabı geri yükleyin
```

### Log Dosyaları
```bash
# Backend logları
cd backend
npm run start:dev  # Console'da görünür

# Frontend logları
cd frontend
npm run dev  # Console'da görünür
```

---

## 📦 Production Deployment

### Backend Deployment
```bash
cd backend

# Production build
npm run build

# Environment variables
# DATABASE_URL, JWT_SECRET, PORT ayarlayın

# Start production server
npm run start:prod
```

### Frontend Deployment
```bash
cd frontend

# Production build
npm run build

# Start production server
npm run start

# Veya Vercel/Netlify gibi platformlarda deploy edin
```

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

## 📞 Destek

- **GitHub Issues**: [Proje Issues Sayfası](https://github.com/slhkrkya/WeTrackX/issues)
- **Email**: slhkrkyh@gmail.com
- **Dokümantasyon**: [Wiki Sayfası](https://github.com/slhkrkya/WeTrackX/wiki)

---

**Not**: Bu README dosyası projenin güncel durumunu yansıtmaktadır. Herhangi bir sorun yaşarsanız lütfen GitHub Issues sayfasından bildirin.