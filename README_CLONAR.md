# EVONGO_BASE_APP — Plantilla Fullstack (Backend + Frontend)

## Requisitos
- Node instalado
- MongoDB Atlas (o local)

---

## 1) Clonar para una nueva app (Taxi / Finanzas / etc.)
1. Copiar carpeta:
   - Duplica `EVONGO_BASE_APP` y renómbrala, por ejemplo:
     `EVO_TAXI_APP`

2. Backend:
   - Entra:
     `cd EVO_TAXI_APP/backend`
   - Crea `.env` (copiando `.env.example`) y edita:
     - MONGODB_URI (pon un DB name distinto, ej: evo_taxi_db)
     - JWT_SECRET (una frase larga distinta)
   - Instala y corre:
     `npm install`
     `npm run dev`

3. Frontend:
   - Entra:
     `cd ../frontend`
   - Crea `.env`:
     `VITE_API_BASE=http://localhost:5050/api`
   - Instala y corre:
     `npm install`
     `npm run dev`

---

## 2) Endpoints principales
- GET  /api/health
- POST /api/auth/register
- POST /api/auth/login
- GET  /api/auth/me
- POST /api/auth/register-admin  (solo admin)
- GET  /api/users (auth)
- CRUD users (solo admin en cambios)

---

## 3) Crear Admin (una vez)
Backend:
- `node scripts/make-admin.js user1@evongo.com`
