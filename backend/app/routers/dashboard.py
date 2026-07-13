from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Integer

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/kpis", response_model=schemas.KPIStats)
def kpis(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    T = models.Transaction
    total = db.query(func.count(T.id)).scalar() or 0
    volume = db.query(func.coalesce(func.sum(T.amount), 0.0)).scalar() or 0.0
    flagged = db.query(func.count(T.id)).filter(T.status == "flagged").scalar() or 0
    blocked = db.query(func.count(T.id)).filter(T.status == "blocked").scalar() or 0
    avg_score = db.query(func.coalesce(func.avg(T.fraud_score), 0.0)).scalar() or 0.0

    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    last_hour = db.query(func.count(T.id)).filter(T.created_at >= one_hour_ago).scalar() or 0

    blocked_volume = (
        db.query(func.coalesce(func.sum(T.amount), 0.0))
        .filter(T.status == "blocked")
        .scalar() or 0.0
    )

    fraud_rate = (flagged + blocked) / total * 100 if total else 0.0

    return schemas.KPIStats(
        total_transactions=total,
        total_volume=round(volume, 2),
        flagged_count=flagged,
        blocked_count=blocked,
        fraud_rate_pct=round(fraud_rate, 2),
        avg_fraud_score=round(avg_score, 4),
        transactions_last_hour=last_hour,
        amount_saved=round(blocked_volume, 2),
    )


@router.get("/timeseries", response_model=list[schemas.TimeseriesPoint])
def timeseries(hours: int = 24, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    T = models.Transaction
    since = datetime.utcnow() - timedelta(hours=hours)

    bucket = func.date_trunc("hour", T.created_at)
    rows = (
        db.query(
            bucket.label("bucket"),
            func.count(T.id).label("total"),
            func.sum(cast(T.status.in_(["flagged", "blocked"]), Integer)).label("fraud"),
            func.coalesce(func.sum(T.amount), 0.0).label("volume"),
        )
        .filter(T.created_at >= since)
        .group_by(bucket)
        .order_by(bucket)
        .all()
    )

    return [
        schemas.TimeseriesPoint(
            bucket=r.bucket.strftime("%Y-%m-%dT%H:00:00"),
            total=r.total,
            fraud=r.fraud or 0,
            volume=round(r.volume, 2),
        )
        for r in rows
    ]


@router.get("/by-category", response_model=list[schemas.CategoryBreakdown])
def by_category(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    T = models.Transaction
    rows = (
        db.query(
            T.category,
            func.count(T.id).label("total"),
            func.sum(cast(T.status.in_(["flagged", "blocked"]), Integer)).label("fraud"),
        )
        .group_by(T.category)
        .order_by(func.count(T.id).desc())
        .all()
    )
    return [
        schemas.CategoryBreakdown(category=r.category, total=r.total, fraud=r.fraud or 0)
        for r in rows
    ]


@router.get("/by-country", response_model=list[schemas.CountryBreakdown])
def by_country(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    T = models.Transaction
    rows = (
        db.query(
            T.country,
            func.count(T.id).label("total"),
            func.sum(cast(T.status.in_(["flagged", "blocked"]), Integer)).label("fraud"),
            func.coalesce(func.avg(T.fraud_score), 0.0).label("avg_score"),
        )
        .group_by(T.country)
        .order_by(func.count(T.id).desc())
        .limit(15)
        .all()
    )
    return [
        schemas.CountryBreakdown(
            country=r.country, total=r.total, fraud=r.fraud or 0, avg_score=round(r.avg_score, 4)
        )
        for r in rows
    ]
