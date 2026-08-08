# Amanat — Islom Banki Bitimlarini Boshqarish Platformasi

> B2B Fintech Platforma: O'zbekiston Islom banklari uchun Murabaha/Musharaka bitimlarini boshqarish, Shariat komplaens landing page, JWT Autentifikatsiya, Shariat kengashi workflow'i, Hisobotlar generatori (PDF/Excel), MongoDB Atlas (Motor/Beanie) hamda Rol va Foydalanuvchilar boshqaruvi.

---

## 📁 Loyiha strukturasi

```
amanat/
├── frontend/          ← React + Vite + Tailwind CSS ilovasi
│   ├── src/
│   │   ├── api/           # Axios API client (JWT Interceptor)
│   │   ├── components/    # Sidebar (Role-based), Badges, Modal
│   │   ├── pages/         # Landing, Login, Dashboard, Transactions, Detail, Workflow, Reports, UsersManagement
│   │   └── utils/         # format.js
│   ├── package.json
│   └── vite.config.js
├── backend/           ← FastAPI + MongoDB Atlas (Motor / Beanie async)
│   ├── app/
│   │   ├── main.py        # FastAPI app, CORS, Lifespan Beanie init
│   │   ├── database.py    # Async Motor client & Dotenv config
│   │   ├── models/        # User, Transaction, AuditLog, Report Beanie Document modellari
│   │   ├── schemas/       # Pydantic API sxemalari
│   │   ├── routers/       # auth, transactions, workflow, reports, users routerlari
│   │   └── services/      # auth (JWT/PBKDF2), aml_kyc mock, seed_service
│   ├── .env               # MONGODB_URL, JWT_SECRET_KEY
│   ├── .env.example
│   └── requirements.txt
└── README.md
```

---

## 🌐 Routelar va Navigatsiya

| Path | Sahifa | Kirish Huquqi |
|------|--------|---------------|
| `/` | **Landing Page** | Ochiq (Omaviy) |
| `/login` | **Login Sahifasi** | Ochiq (Omaviy) |
| `/dashboard` | **Dashboard** | Himoyalangan (JWT Auth) |
| `/transactions` | **Bitim Reestri** | Himoyalangan (JWT Auth) |
| `/workflow` | **Shariat Workflow** | Himoyalangan (Admin / Shariat Kengashi) |
| `/reports` | **Hisobotlar Generatori** | Himoyalangan (JWT Auth) |
| `/users` | **Foydalanuvchilar & Rollar** | Himoyalangan (Faqat Admin) |

---

## 🔑 Demo Foydalanuvchilar (Login ma'lumotlari)

| Rol | Email | Parol | Huquqlar |
|-----|-------|-------|----------|
| **Admin** | `admin@amanat.uz` | `admin123` | Barcha amallar + Foydalanuvchilar boshqaruvi |
| **Shariat Kengashi** | `kengash@amanat.uz` | `kengash123` | Workflow ko'rish, tasdiqlash va rad etish |
| **Auditor** | `auditor@amanat.uz` | `auditor123` | Faqat o'qish rejimida ko'rish va hisobot yuklash |

---

## 🚀 Ishga tushirish yo'riqnomasi

### 1. Backend (FastAPI + MongoDB Atlas)

```bash
cd amanat/backend

# Virtual muhit va dependencylar
python3 -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Serverni ishga tushirish (Beanie avtomatik seed qiladi)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- Backend API: **http://localhost:8000**  
- Swagger API Hujjatlari: **http://localhost:8000/api/docs**

---

### 2. Frontend (React + Vite + Tailwind CSS)

```bash
cd amanat/frontend

npm install
npm run dev
```

- Frontend: **http://localhost:5173**

---

## ✨ Landing Page Tarkibi (`src/pages/Landing.jsx`)

1. **Navbar**: Sticky navigation, "Amanat Islom Moliyasi" brending, hamburger menu (mobile), va `/login` ga o'tuvchi "Kirish" tugmasi.
2. **Hero Section**: 2-qatorli sarlavha, Islom bankchiligi dashboard illyustratsiyasi, "Platformaga kirish" (`/login`) va "Demo so'rash" (smooth scroll) tugmalari.
3. **Statistika Band**: 4 ta karta (`10+` Tashkilot, `$2 mlrd+` Hajm, `99.2%` Komplaens, `29.06.2026` Qonun sanasi).
4. **Xususiyatlar**: Bitim reestri, Shariat Workflow va AML/KYC nazorati kartalari.
5. **Qanday Ishlaydi**: 4 qadamli gorizontal workflow chizig'i.
6. **Taqqoslash (Muammo / Yechim)**: Qizilroq muammolar va yashil yechimlar ustunlari.
7. **Contact / CTA Section**: Hamkorlik murojaat formasi (Ism, Bank nomi, Email, Telefon, Xabar).
8. **Footer**: Mualliflik huquqi, 29.06.2026 qonuni havolasi va Platformaga kirish havolasi.
