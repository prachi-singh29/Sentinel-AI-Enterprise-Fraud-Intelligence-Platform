import asyncio
import random
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine, SessionLocal
from app import models
from app.auth import hash_password
from app.routers import auth, transactions, dashboard, websocket as ws_router
from app.websocket_manager import manager
from app.ml import model as ml_model
from app.ml.generate_data import MERCHANTS, COUNTRIES, HIGH_RISK_COUNTRIES, HIGH_RISK_CATEGORIES, DEVICES, CATEGORY_BASE_AMOUNT

app = FastAPI(
    title=settings.APP_NAME,
    description="Real-time credit card fraud detection API powered by XGBoost, "
                 "Isolation Forest, and SHAP explainability.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(dashboard.router)
app.include_router(ws_router.router)


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}


def _seed_admin():
    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == settings.ADMIN_EMAIL).first()
        if not existing:
            admin = models.User(
                email=settings.ADMIN_EMAIL,
                full_name="Admin Analyst",
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role="admin",
            )
            db.add(admin)
            db.commit()
            print(f"[startup] Created default admin user: {settings.ADMIN_EMAIL}")
    finally:
        db.close()


def _random_transaction_payload() -> dict:
    is_risky = random.random() < 0.12
    category = (
        random.choice(list(HIGH_RISK_CATEGORIES))
        if is_risky and random.random() < 0.6
        else random.choice(list(CATEGORY_BASE_AMOUNT.keys()))
    )
    merchant = random.choice(MERCHANTS[category])
    country, city, lat, lon = (
        random.choice([c for c in COUNTRIES if c[0] in HIGH_RISK_COUNTRIES])
        if is_risky and random.random() < 0.4
        else random.choice(COUNTRIES)
    )
    hour = datetime.utcnow().hour
    base = CATEGORY_BASE_AMOUNT[category]
    amount = round(max(random.lognormvariate(0, 0.6) * base * (3.5 if is_risky else 1), 1.0), 2)
    device = random.choice(DEVICES)

    return {
        "card_last4": f"{random.randint(0, 9999):04d}",
        "merchant": merchant,
        "category": category,
        "amount": amount,
        "currency": "USD",
        "country": country,
        "city": city,
        "lat": lat + random.uniform(-0.05, 0.05),
        "lon": lon + random.uniform(-0.05, 0.05),
        "device": device,
        "ip_address": f"{random.randint(1,223)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(0,255)}",
        "hour_of_day": hour,
        "velocity_1h": random.choices([1, 2, 3, 4, 8], weights=[50, 25, 15, 7, 3])[0],
        "distance_from_home_km": round(random.uniform(4000, 9000) if is_risky else random.uniform(0, 60), 1),
        "amount_to_category_avg_ratio": round(amount / base, 2),
        "is_high_risk_country": 1 if country in HIGH_RISK_COUNTRIES else 0,
        "is_high_risk_category": 1 if category in HIGH_RISK_CATEGORIES else 0,
    }


async def live_transaction_simulator():
    """Background task: generates a new synthetic transaction every few seconds,
    scores it with the ML pipeline, persists it, and broadcasts it over WebSocket."""
    await asyncio.sleep(3)
    while True:
        try:
            payload = _random_transaction_payload()
            scored = ml_model.score_transaction(payload)

            db = SessionLocal()
            try:
                tx = models.Transaction(
                    card_last4=payload["card_last4"],
                    merchant=payload["merchant"],
                    category=payload["category"],
                    amount=payload["amount"],
                    currency=payload["currency"],
                    country=payload["country"],
                    city=payload["city"],
                    lat=payload["lat"],
                    lon=payload["lon"],
                    device=payload["device"],
                    ip_address=payload["ip_address"],
                    fraud_score=scored["fraud_score"],
                    anomaly_score=scored["anomaly_score"],
                    is_fraud_predicted=scored["is_fraud_predicted"],
                    status=scored["status"],
                    shap_top_features=scored["shap_top_features"],
                )
                db.add(tx)
                db.commit()
                db.refresh(tx)

                await manager.broadcast({
                    "type": "transaction",
                    "data": {
                        "id": tx.id,
                        "card_last4": tx.card_last4,
                        "merchant": tx.merchant,
                        "category": tx.category,
                        "amount": tx.amount,
                        "currency": tx.currency,
                        "country": tx.country,
                        "city": tx.city,
                        "lat": tx.lat,
                        "lon": tx.lon,
                        "device": tx.device,
                        "fraud_score": tx.fraud_score,
                        "anomaly_score": tx.anomaly_score,
                        "is_fraud_predicted": tx.is_fraud_predicted,
                        "status": tx.status.value if hasattr(tx.status, "value") else tx.status,
                        "shap_top_features": tx.shap_top_features,
                        "created_at": tx.created_at.isoformat(),
                    },
                })
            finally:
                db.close()
        except Exception as e:
            print(f"[simulator] error: {e}")

        await asyncio.sleep(random.uniform(2, 5))


@app.on_event("startup")
async def on_startup():
    Base.metadata.create_all(bind=engine)
    _seed_admin()
    ml_model._load_or_train()

    # Seed a batch of historical transactions if the table is empty so the
    # dashboard has data to show immediately on first deploy.
    db = SessionLocal()
    try:
        count = db.query(models.Transaction).count()
        if count == 0:
            print("[startup] Seeding historical transactions for dashboard demo...")
            from app.ml.generate_data import generate_transactions
            df = generate_transactions(n=350, fraud_rate=0.045)
            for _, row in df.iterrows():
                scored = ml_model.score_transaction(row.to_dict())
                tx = models.Transaction(
                    card_last4=row["card_last4"],
                    merchant=row["merchant"],
                    category=row["category"],
                    amount=row["amount"],
                    currency=row["currency"],
                    country=row["country"],
                    city=row["city"],
                    lat=row["lat"],
                    lon=row["lon"],
                    device=row["device"],
                    ip_address=row["ip_address"],
                    fraud_score=scored["fraud_score"],
                    anomaly_score=scored["anomaly_score"],
                    is_fraud_predicted=scored["is_fraud_predicted"],
                    status=scored["status"],
                    shap_top_features=scored["shap_top_features"],
                    created_at=row["created_at"],
                )
                db.add(tx)
            db.commit()
            print(f"[startup] Seeded {len(df)} transactions.")
    finally:
        db.close()

    asyncio.create_task(live_transaction_simulator())
