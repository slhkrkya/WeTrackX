# WeTrackX

Kullanıcıların kişisel finanslarını yönetebileceği, gelir ve giderlerini takip edebileceği, kategorize edebileceği ve raporlayabileceği bir web uygulaması.

---

## Kullanılan Teknolojiler

- **Backend:** NestJS, TypeORM  
- **Frontend:** Next.js (App Router), TailwindCSS  
- **Veritabanı:** PostgreSQL (lokal kurulum, Docker kullanılmıyor)  
- **Kimlik Doğrulama:** JWT tabanlı register/login  

---

## Gereksinimler

- Node.js 20+  
- npm 10+  
- PostgreSQL 15+  

---

## Kurulum Adımları

### 1) Depoyu klonla
```bash
git clone <repo-url> WeTrackX
cd WeTrackX
```

### 2) Veritabanını oluştur
PostgreSQL'e bağlanıp boş bir veritabanı aç:
```sql
CREATE DATABASE wetrackx;
```

### 3) Backend kurulumu
```bash
cd backend
cp .env.example .env   # (yoksa dosyayı elle oluşturabilirsiniz)
npm install
npm run migration:run  # tabloları oluşturur
npm run seed           # sistem kategorilerini oluşturur
npm run start:dev
```

**backend/.env örneği**
```ini
# PostgreSQL bağlantısı
DATABASE_URL=postgres://postgres:postgres@localhost:5432/wetrackx

# Uygulama ayarları
JWT_SECRET=supersecret
PORT=4000
```

### 4) Frontend kurulumu
Yeni bir terminal penceresinde:
```bash
cd frontend
cp .env.example .env.local   # (yoksa dosyayı elle oluşturabilirsiniz)
npm install
npm run dev
```

**frontend/.env.local örneği**
```ini
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### 5) Çalıştırma
- Frontend: http://localhost:3000  
- Backend API: http://localhost:4000

> Geliştirme ortamında backend ve frontend'i ayrı terminallerde çalıştırın.

---

## Özellikler

### 🔐 Kimlik Doğrulama
- Kullanıcı kayıt & giriş
- JWT tabanlı oturum yönetimi
- "Beni hatırla" özelliği

### 💰 Hesap Yönetimi
- Hesap türleri: BANK, CASH, CARD, WALLET
- Varsayılan para birimi: TL
- Hesap bakiyesi takibi

### 📊 Kategori Yönetimi
- **Sistem Kategorileri** (Öntanımlı):
  - 9 Gelir kategorisi (Maaş, Ek Gelir, Yatırım Geliri, vb.)
  - 12 Gider kategorisi (Market, Ulaşım, Faturalar, vb.)
  - Renk kodlaması ve öncelik sıralaması
  - Düzenlenemez/silinemez

- **Kullanıcı Kategorileri** (Özel):
  - Kullanıcılar kendi kategorilerini oluşturabilir
  - Renk seçimi ve öncelik ayarlama
  - Düzenlenebilir/silinebilir

### 💸 İşlem Yönetimi
- İşlem türleri: INCOME, EXPENSE, TRANSFER
- Kategori bazlı sınıflandırma
- Hesap bazlı işlemler
- Tarih ve tutar takibi

### 📈 Raporlama
- **Dashboard Raporları**:
  - Hesap bakiyeleri
  - Aylık gelir/gider grafiği (6 ay)
  - Gelir/Gider kategori toplamları
  - Son işlemler listesi
  - Nakit akışı özeti

- **API Raporları**:
  - Özet: `/reports/summary?from&to`
  - Kategori bazlı: `/reports/by-category?period=month&date=YYYY-MM`

### 🔍 İşlem Listesi
- Filtreleme (tarih, tür, hesap, kategori, arama)
- Sayfalama ve sıralama
- Detaylı işlem görüntüleme

---

## Proje Yapısı
```bash
WeTrackX/
  backend/      # NestJS API (port 4000)
    src/
      accounts/     # Hesap yönetimi
      auth/         # Kimlik doğrulama
      categories/   # Kategori yönetimi
      reports/      # Raporlama
      transactions/ # İşlem yönetimi
      users/        # Kullanıcı yönetimi
  frontend/     # Next.js arayüz (port 3000)
    src/
      app/          # Sayfa bileşenleri
      components/   # UI bileşenleri
      lib/          # API ve yardımcı fonksiyonlar
```

---

## Production Build

**Frontend (Next.js)**
```bash
cd frontend
npm run build
npm run start
# varsayılan port: 3000
```

**Backend (NestJS)**
```bash
cd backend
npm run build
npm run start:prod
# .env içindeki PORT=4000 kullanılacaktır
```

---

## Teknik Detaylar

### Para Birimi
- Backend'de tüm işlemler **TL** para birimi ile yapılır
- Frontend'de görüntüleme için **TRY** kullanılır (Intl.NumberFormat uyumluluğu)

### Kategori Sistemi
- Sistem kategorileri (`isSystem: true`) tüm kullanıcılar için mevcut
- Kullanıcı kategorileri (`isSystem: false`) kişisel
- Öncelik sırasına göre sıralama (yüksek öncelik üstte)

### Güvenlik
- Sistem kategorileri düzenlenemez/silinemez
- Kullanıcılar sadece kendi verilerine erişebilir
- JWT token tabanlı güvenlik

### Notlar
- Docker kullanılmamaktadır. PostgreSQL lokal kurulu olmalıdır.
- `migration:run` ve `seed` sonrası sistem kategorileri hazır olur.
- Transactions API sayfalı cevap döner: `{ items, total, page, pageSize }`.
- Categories API `type` parametresini kabul eder (INCOME/EXPENSE).
- `NEXT_PUBLIC_API_BASE_URL` değeri backend'in çalıştığı URL'yi işaret etmelidir.