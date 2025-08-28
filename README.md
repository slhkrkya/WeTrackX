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

## Demo Kullanıcılar (Seed)
`npm run seed` yalnızca demo kullanıcıları oluşturur:

- demo@demo.com / Demo123!
- salih@example.com / 12345678

Hesap, kategori ve işlem verileri UI üzerinden eklenecektir.