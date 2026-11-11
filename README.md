# 🔧 AutoParts — Proprietary Exploded Parts Viewer

> A proprietary automotive OEM parts catalog modeled after 7zap.com — built with React, FastAPI, and zero paid dependencies.

![Phase](https://img.shields.io/badge/Phase-1%20Complete-brightgreen)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20FastAPI%20%2B%20Supabase-informational)

---

## 🗺️ Project Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | VIN Decoder + Vehicle Lookup | ✅ Complete |
| 2 | Parts Catalog Database & Navigation | 🔜 Next |
| 3 | 2D Exploded Diagrams & Viewer | ⏳ Planned |
| 4 | 3D Exploded Views (Three.js + glTF) | ⏳ Planned |
| 5 | Advanced Search, Compatibility & AI | ⏳ Planned |
| 6 | User Accounts, Pricing & Marketplace | ⏳ Planned |
| 7 | Scaling, Performance & Polish | ⏳ Planned |

---

## 🧱 Tech Stack

| Layer | Tool | Cost |
|-------|------|------|
| Frontend | React 18 + TypeScript + Vite | Free |
| Routing | React Router v6 | Free |
| Backend | Python FastAPI + Uvicorn | Free |
| VIN API | NHTSA vPIC (US Gov) | Free |
| Database | Supabase PostgreSQL | Free tier |
| Auth | Supabase Auth | Free tier |
| Storage | Supabase Storage | Free tier |
| 3D Viewer | Three.js | Free |
| CAD | FreeCAD + Blender | Free |
| Hosting | Vercel (frontend) + Render (backend) | Free tier |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- (Optional) Supabase account for database

### 1. Clone and install

```bash
git clone https://github.com/your-username/autoparts.git
cd autoparts

# Install frontend
cd frontend && npm install && cd ..

# Install backend
cd backend && pip install -r requirements.txt && cd ..
```

### 2. Configure environment

```bash
# Frontend
cp frontend/.env.example frontend/.env

# Backend
cp backend/.env.example backend/.env
```

Edit `backend/.env` and `frontend/.env` — for Phase 1, no keys are needed (NHTSA is public).

### 3. Run both servers

**Terminal 1 — Backend (API on port 8000):**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend (UI on port 5173):**
```bash
cd frontend
npm run dev
```

Then open: **http://localhost:5173**

---

## 🧪 Testing Phase 1

1. Open the app at http://localhost:5173
2. Enter a real VIN number, e.g.:
   - Toyota Camry: `4T1BF3EK8AU561547`
   - Ford F-150: `1FTFW1ET5DFC43861`
   - Honda Civic: `2HGFC2F59JH531528`
3. Click **Decode VIN** — vehicle specs should appear
4. Or use the Make/Model/Year dropdowns
5. Check the "Popular Models" cards for quick navigation

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Push to GitHub, connect repo to Vercel — zero config needed
```

### Backend → Render
1. Connect your GitHub repo to Render
2. Set Root Directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
5. Update `frontend/.env` with Render URL

---

## 📁 Project Structure

```
autoparts/
├── frontend/               # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level pages
│   │   ├── services/       # API calls
│   │   ├── types/          # TypeScript interfaces
│   │   └── styles/         # Global CSS
│   └── public/
├── backend/                # Python FastAPI
│   ├── app/
│   │   ├── routers/        # API route handlers
│   │   ├── data/           # Seed JSON data
│   │   └── main.py
│   └── requirements.txt
├── data/
│   ├── seeds/              # Vehicle/parts JSON seeds
│   ├── diagrams/           # 2D exploded diagrams (Phase 3)
│   └── models/gltf/        # 3D glTF models (Phase 4)
├── scripts/                # Data import/utility scripts
├── docs/                   # Project documentation
└── .github/workflows/      # CI/CD
```

---

## 📜 License

Proprietary software — all rights reserved.

---

## 🗓️ Roadmap & Progress

See [docs/PHASES.md](docs/PHASES.md) for detailed phase plans.
