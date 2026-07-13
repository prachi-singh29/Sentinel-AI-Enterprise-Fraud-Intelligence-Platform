from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict


# ---------- Auth ----------
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    full_name: str
    role: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Transactions ----------
class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    card_last4: str
    merchant: str
    category: str
    amount: float
    currency: str
    country: str
    city: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    device: Optional[str] = None
    ip_address: Optional[str] = None
    fraud_score: float
    anomaly_score: float
    is_fraud_predicted: bool
    status: str
    shap_top_features: Optional[str] = None
    created_at: datetime


class TransactionPage(BaseModel):
    items: List[TransactionOut]
    total: int
    page: int
    page_size: int


class ReviewCreate(BaseModel):
    transaction_id: str
    decision: str  # confirmed_fraud | false_positive
    notes: Optional[str] = None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    transaction_id: str
    decision: str
    notes: Optional[str] = None
    created_at: datetime


# ---------- Dashboard ----------
class KPIStats(BaseModel):
    total_transactions: int
    total_volume: float
    flagged_count: int
    blocked_count: int
    fraud_rate_pct: float
    avg_fraud_score: float
    transactions_last_hour: int
    amount_saved: float


class TimeseriesPoint(BaseModel):
    bucket: str
    total: int
    fraud: int
    volume: float


class CategoryBreakdown(BaseModel):
    category: str
    total: int
    fraud: int


class CountryBreakdown(BaseModel):
    country: str
    total: int
    fraud: int
    avg_score: float
