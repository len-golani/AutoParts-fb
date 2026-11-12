# 🔧 AutoParts — Proprietary Exploded Parts Viewer

> A proprietary automotive OEM parts catalog modeled after 7zap.com — a React + TypeScript SPA with zero paid dependencies.

![Phase](https://img.shields.io/badge/Phase-1%20Complete-brightgreen)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20TypeScript%20%2B%20Vite-informational)

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
| Frontend | React 19 + TypeScript + Vite | Free |
| Routing | React Router v7 | Free |
| VIN API | NHTSA vPIC (US Gov) | Free |
| Catalog data | Bundled JSON (`src/data/`) | Free |
| Database | Supabase PostgreSQL | Free tier |
| Auth | Supabase Auth | Free tier |
| Storage | Supabase Storage | Free tier |
| 3D Viewer | Three.js | Free |
| CAD | FreeCAD + Blender | Free |
| Hosting | Vercel (static SPA) | Free tier |

> Phase 1 has no server component. VIN decoding calls NHTSA vPIC directly from the browser, and catalog data is bundled from `src/data/` — there is no separate API service or duplicated seed data.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ and npm

### Install and run

```bash
npm install
npm run dev
```

Then open: **http://localhost:5173**

No environment variables or API keys are needed — NHTSA vPIC is public.

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

### Automated smoke tests

The Playwright smoke tests cover VIN decoding (including check-digit advisories and undecodable VINs), catalog search, and the header/mobile quick search.

```bash
# Install dependencies (includes @playwright/test)
npm install

# Install Playwright's bundled Chromium
npx playwright install chromium

# Run the suite (NHTSA responses are stubbed)
npm run test:e2e

# Optional: run the VIN tests against the live NHTSA API
LIVE_NHTSA=1 npm run test:e2e
```

By default the VIN tests intercept NHTSA vPIC requests with deterministic fixtures, and all tests stub Google Fonts, so the suite makes no external network requests and can run offline. Set `LIVE_NHTSA=1` to disable the stubs and check the real API (network required; on PowerShell use `$env:LIVE_NHTSA=1; npm run test:e2e`).

The suite starts or reuses the Vite dev server on `http://127.0.0.1:5173` and uses Playwright's bundled Chromium. On Linux CI, run `npx playwright install --with-deps chromium` to install the browser and its system dependencies. If Playwright's browser download is blocked locally, opt into an installed browser instead: `PLAYWRIGHT_CHANNEL=msedge npm run test:e2e`.

---

## 🌐 Deployment

### Frontend → Vercel

```bash
npm run build
# Push to GitHub, connect the repo to Vercel — the project root is the app root
```

Build output is the static `dist/` folder. Because routing is client-side, configure a rewrite from `/*` to `/index.html` so deep links resolve.

---

## 📁 Project Structure

```
autoparts/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-level pages
│   ├── services/       # NHTSA client + local catalog data access
│   ├── data/           # brands.json, popular-models.json (single source)
│   ├── types/          # TypeScript interfaces
│   └── styles/         # Global CSS
├── public/
├── index.html
├── vite.config.ts
└── package.json
```

---

## 📜 License

Proprietary software — all rights reserved.
