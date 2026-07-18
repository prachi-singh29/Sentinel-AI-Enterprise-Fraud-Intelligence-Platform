# Sentinel — Credit Card Fraud Detection Dashboard

A full-stack, real-time fraud detection console. Transactions stream in over
WebSockets, get scored by an XGBoost classifier and an Isolation Forest
anomaly detector, and are explained with SHAP — all visualized in a dark,
glassmorphic React dashboard.

![stack](https://img.shields.io/badge/frontend-React%20%2B%20TS%20%2B%20Tailwind-06B6D4)
![stack](https://img.shields.io/badge/backend-FastAPI%20%2B%20PostgreSQL-009688)
![stack](https://img.shields.io/badge/ml-XGBoost%20%2B%20SHAP%20%2B%20IsolationForest-8B5CF6)

## Architecture

```
fraud-detection-dashboard/
├── backend/                 FastAPI + PostgreSQL + JWT + WebSockets
│   ├── app/
│   │   ├── main.py          App entrypoint, live-feed simulator, startup seeding
│   │   ├── config.py        Settings (env-driven)
│   │   ├── database.py      SQLAlchemy engine/session
│   │   ├── models.py        User / Transaction / Review ORM models
│   │   ├── schemas.py       Pydantic request/response models
│   │   ├── auth.py          JWT + bcrypt password hashing
│   │   ├── websocket_manager.py
│   │   ├── ml/
│   │   │   ├── generate_data.py   Synthetic transaction generator
│   │   │   ├── train_model.py     Trains XGBoost + Isolation Forest
│   │   │   └── model.py           Inference + SHAP explanations
│   │   └── routers/
│   │       ├── auth.py, transactions.py, dashboard.py, websocket.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── render.yaml          One-click Render blueprint (API + Postgres)
│
├── frontend/                 React 18 + TypeScript + Tailwind + shadcn/ui
│   ├── src/
│   │   ├── components/ui/    Button, Card, Badge, Dialog, Select, Tabs...
│   │   ├── components/dashboard/  Stats, charts, live feed, SHAP explainer
│   │   ├── components/layout/     Sidebar, header
│   │   ├── pages/             Overview, Transactions, Alerts, Live Radar
│   │   ├── hooks/              useAuth, useLiveFeed (WebSocket)
│   │   └── lib/                 api client, utils
│   └── vercel.json
│
├── docker-compose.yml         Full local stack: Postgres + API + Vite dev server
└── .github/workflows/ci.yml   Lint/build backend & frontend, build Docker image
```

## Machine Learning

There's no dataset to download — `app/ml/generate_data.py` synthesizes
realistic transactions with known fraud signals (odd hours, high-risk
countries/categories, velocity, distance-from-home, amount anomalies).

- **XGBoost classifier** — supervised `fraud_score` (probability 0–1)
- **Isolation Forest** — unsupervised `anomaly_score`, catches novel patterns
  the classifier hasn't seen
- **SHAP TreeExplainer** — per-transaction feature attribution, shown in the
  dashboard as a red/green contribution chart

On first boot the API trains both models automatically (a few seconds) and
caches the artifacts to `app/ml/artifacts/`. You can also pre-train locally:

```bash
cd backend
python -m app.ml.train_model
```

## Local development

### Option A — Docker Compose (recommended)

```bash
docker compose up --build
```
- API: http://localhost:8000 (Swagger docs at `/api/docs`)
- Frontend: http://localhost:5173
- Postgres: localhost:5432

### Option B — Run manually

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # edit DATABASE_URL to point at your local Postgres
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:8000
npm run dev
```

### Default login

The API seeds an admin account on first boot:
- **Email:** `admin@frauddetect.io`
- **Password:** `Admin123!`

(Change `ADMIN_EMAIL` / `ADMIN_PASSWORD` in your env before deploying publicly.)

## API documentation

FastAPI generates interactive docs automatically:
- Swagger UI: `/api/docs`
- ReDoc: `/api/redoc`
- Raw OpenAPI schema: `/api/openapi.json`

## Real-time transaction feed

A background task in `app/main.py` generates a new synthetic transaction
every 2–5 seconds, scores it through the ML pipeline, persists it, and
broadcasts it to every connected client over `/ws/live-feed`. The frontend's
`useLiveFeed` hook auto-reconnects with exponential backoff.

To feed **real** transactions instead of the simulator, POST to a new
ingestion endpoint that calls `ml_model.score_transaction()` and reuses the
same broadcast logic — the scoring and WebSocket plumbing is already wired up.

## CI

`.github/workflows/ci.yml` runs on every push/PR:
- Backend: installs dependencies, byte-compiles and syntax-checks all modules
- Frontend: installs dependencies, type-checks and builds
- Docker: builds the backend production image

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui (Radix primitives), Recharts |
| Backend | FastAPI, SQLAlchemy, PostgreSQL, JWT (python-jose), bcrypt |
| ML | XGBoost, scikit-learn (Isolation Forest), SHAP |
| Real-time | Native WebSockets (FastAPI + browser WebSocket API) |
| Deployment | Vercel (frontend), Render (backend + Postgres), Railway (alt. Postgres) |
| Tooling | Docker, Docker Compose, GitHub Actions, Swagger/OpenAPI |
