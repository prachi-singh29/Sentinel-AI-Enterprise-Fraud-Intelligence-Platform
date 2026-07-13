from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.get("", response_model=schemas.TransactionPage)
def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = None,
    country: Optional[str] = None,
    min_score: Optional[float] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Transaction)

    if status_filter:
        q = q.filter(models.Transaction.status == status_filter)
    if category:
        q = q.filter(models.Transaction.category == category)
    if country:
        q = q.filter(models.Transaction.country == country)
    if min_score is not None:
        q = q.filter(models.Transaction.fraud_score >= min_score)
    if search:
        like = f"%{search}%"
        q = q.filter(
            (models.Transaction.merchant.ilike(like))
            | (models.Transaction.card_last4.ilike(like))
        )

    total = q.count()
    items = (
        q.order_by(desc(models.Transaction.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return schemas.TransactionPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/{transaction_id}", response_model=schemas.TransactionOut)
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    tx = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@router.post("/review", response_model=schemas.ReviewOut, status_code=201)
def review_transaction(
    payload: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    tx = db.query(models.Transaction).filter(models.Transaction.id == payload.transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    review = models.Review(
        transaction_id=payload.transaction_id,
        reviewer_id=current_user.id,
        decision=payload.decision,
        notes=payload.notes,
    )
    db.add(review)

    if payload.decision == "confirmed_fraud":
        tx.status = models.TransactionStatus.blocked
    elif payload.decision == "false_positive":
        tx.status = models.TransactionStatus.approved

    db.commit()
    db.refresh(review)
    return review
