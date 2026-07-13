import uuid
import enum
from datetime import datetime

from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Enum, Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class TransactionStatus(str, enum.Enum):
    approved = "approved"
    flagged = "flagged"
    blocked = "blocked"
    review = "review"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="analyst")  # analyst | admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=gen_uuid)
    card_last4 = Column(String(4), nullable=False)
    merchant = Column(String, nullable=False)
    category = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    country = Column(String, nullable=False)
    city = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    device = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)

    fraud_score = Column(Float, nullable=False, default=0.0)   # XGBoost probability 0-1
    anomaly_score = Column(Float, nullable=False, default=0.0)  # Isolation Forest score
    is_fraud_predicted = Column(Boolean, default=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.approved)

    shap_top_features = Column(Text, nullable=True)  # JSON string of top SHAP contributors

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    reviews = relationship("Review", back_populates="transaction", cascade="all, delete-orphan")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=gen_uuid)
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=False)
    reviewer_id = Column(String, ForeignKey("users.id"), nullable=False)
    decision = Column(String, nullable=False)  # confirmed_fraud | false_positive
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="reviews")
