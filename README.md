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
PostgreSQL’e bağlanıp boş bir veritabanı aç:
```sql
CREATE DATABASE wetrackx;
```

### 3) Backend kurulumu
```bash
cd backend
cp .env.example .env   # (yoksa dosyayı elle oluşturabilirsiniz)
npm install
npm run migration:run  # tabloları oluşturur
npm run seed           # demo kullanıcıları ekler
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

## Demo Kullanıcılar
Seed script çalıştırıldığında aşağıdaki kullanıcılar oluşur:

**Demo User**
- Email: `demo@demo.com`
- Şifre: `Demo123!`

**Salih Karakaya**
- Email: `salih@example.com`
- Şifre: `12345678`

---

## Özellikler

- Kullanıcı kayıt & giriş  
- Hesap yönetimi (BANK, CASH, CARD, WALLET)  
- Kategori yönetimi (INCOME, EXPENSE)  
- İşlem ekleme (INCOME, EXPENSE, TRANSFER)  
- İşlem listesi + filtreleme (tarih, tür, hesap, kategori, arama)  
- Dashboard raporları:  
  - Hesap bakiyeleri  
  - Aylık gelir/gider grafiği  
  - Gelir/Gider kategori toplamları  
  - Son işlemler listesi  

---

## Proje Yapısı
```bash
WeTrackX/
  backend/      # NestJS API (port 4000)
  frontend/     # Next.js arayüz (port 3000)
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

## Notlar

- Docker kullanılmamaktadır. PostgreSQL lokal kurulu olmalıdır.
- `migration:run` ve `seed` sonrası demo kullanıcılarla giriş yapılabilir.
- `NEXT_PUBLIC_API_BASE_URL` değeri backend’in çalıştığı URL’yi işaret etmelidir.