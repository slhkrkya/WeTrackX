# WeTrackX

Kişisel finans takibi (gelir/gider, kategori, basit analiz).  
**Stack:** Next.js (frontend), NestJS (backend), PostgreSQL (DB).

## Hızlı Başlangıç
- PostgreSQL’i yerel kurun (Docker yok).
- `/backend` → API
- `/frontend` → UI

Ayrıntılı kurulum adımları aşağıdadır.

### DB Migrations
```bash
cd backend
# .env hazır olmalı
npm run migration:generate   # ilk defa (gerekirse)
npm run migration:run        # şemayı uygula
npm run seed                 # örnek kullanıcı
npm run start:dev            # api 4000

## Demo Kullanıcılar & Seed

Seed script (`npm run seed`) çalıştırıldığında otomatik olarak aşağıdaki demo kullanıcılar ve veriler oluşturulur:

### Kullanıcılar
- **Demo User**  
  Email: `demo@demo.com`  
  Şifre: `Demo123!`

- **Salih Karakaya**  
  Email: `salih@example.com`  
  Şifre: `12345678`

### Kategoriler (her kullanıcı için)
- Maaş (INCOME)
- Yemek (EXPENSE)
- Ulaşım (EXPENSE)
- Eğlence (EXPENSE)

### İşlemler (son 30 gün içinde örnek)
- Aylık Maaş (+20.000 TRY)
- Yemek (kebap) (-150 TRY)
- Otobüs bileti (-40 TRY)
- Sinema (-120 TRY)
- Yemek (fastfood) (-200 TRY)

Bu sayede `/dashboard` ekranı açıldığında raporlar, grafikler ve son işlemler hazır gelir.