"""
Generates realistic synthetic credit-card transaction data for model
training and for seeding the live demo feed. There is no public dataset
bundled in this repo (keeps the zip small), so we simulate one with
well-known fraud signal patterns:
  - Odd hours (2am-5am) correlate with higher fraud
  - High amounts relative to category norm correlate with fraud
  - Certain categories (electronics, crypto, gift cards) are riskier
  - New / rare countries for a card correlate with fraud
  - High velocity (many tx in short time) correlates with fraud
"""
import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

MERCHANTS = {
    "Electronics": ["ByteMart", "CircuitCity", "TechNova", "GadgetHub"],
    "Groceries": ["FreshMart", "GreenGrocer", "DailyFoods", "MarketPlace"],
    "Travel": ["SkyBooking", "GlobeTrek", "JetSet Air", "StaySuite Hotels"],
    "Dining": ["UrbanBistro", "SpiceRoute", "CafeLumen", "GrillHouse"],
    "Gift Cards": ["QuickGift", "CardVault", "InstantGC", "GiftFlow"],
    "Crypto": ["CoinBridge", "CryptoDock", "ChainSwap", "BitLane"],
    "Fashion": ["Threadline", "UrbanWear", "VogueBox", "StyleLoft"],
    "Utilities": ["PowerGrid Co", "AquaFlow", "NetLink ISP", "CityGas"],
    "Entertainment": ["StreamPlex", "PlayZone", "TicketWave", "ArcadeHub"],
    "Healthcare": ["MedCare Plus", "VitalPharmacy", "WellnessRx", "CarePoint"],
}

COUNTRIES = [
    ("US", "New York", 40.71, -74.01), ("US", "Los Angeles", 34.05, -118.24),
    ("US", "Chicago", 41.88, -87.63), ("GB", "London", 51.51, -0.13),
    ("DE", "Berlin", 52.52, 13.40), ("FR", "Paris", 48.86, 2.35),
    ("IN", "Mumbai", 19.08, 72.88), ("SG", "Singapore", 1.35, 103.82),
    ("AU", "Sydney", -33.87, 151.21), ("BR", "Sao Paulo", -23.55, -46.63),
    ("NG", "Lagos", 6.52, 3.38), ("RU", "Moscow", 55.75, 37.62),
    ("CN", "Shenzhen", 22.54, 114.05), ("AE", "Dubai", 25.20, 55.27),
    ("CA", "Toronto", 43.65, -79.38), ("JP", "Tokyo", 35.68, 139.69),
]

HIGH_RISK_COUNTRIES = {"NG", "RU"}
HIGH_RISK_CATEGORIES = {"Crypto", "Gift Cards", "Electronics"}
DEVICES = ["iOS App", "Android App", "Web Chrome", "Web Safari", "POS Terminal", "ATM"]

CATEGORY_BASE_AMOUNT = {
    "Electronics": 420, "Groceries": 65, "Travel": 650, "Dining": 48,
    "Gift Cards": 150, "Crypto": 900, "Fashion": 110, "Utilities": 90,
    "Entertainment": 55, "Healthcare": 180,
}


def _sample_amount(category: str, fraud: bool) -> float:
    base = CATEGORY_BASE_AMOUNT[category]
    amt = np.random.lognormal(mean=np.log(base), sigma=0.6)
    if fraud:
        amt *= np.random.uniform(1.8, 6.0)  # fraud tends to be higher value
    return round(max(amt, 1.0), 2)


def _sample_hour(fraud: bool) -> int:
    if fraud and random.random() < 0.55:
        return random.choice([1, 2, 3, 4, 5])  # odd hours
    return random.randint(6, 23)


def generate_transactions(n: int = 15000, fraud_rate: float = 0.035, seed: int = 42) -> pd.DataFrame:
    random.seed(seed)
    np.random.seed(seed)

    rows = []
    now = datetime.utcnow()

    for i in range(n):
        is_fraud = random.random() < fraud_rate
        category = (
            random.choice(list(HIGH_RISK_CATEGORIES))
            if is_fraud and random.random() < 0.6
            else random.choice(list(CATEGORY_BASE_AMOUNT.keys()))
        )
        merchant = random.choice(MERCHANTS[category])

        country, city, lat, lon = (
            random.choice([c for c in COUNTRIES if c[0] in HIGH_RISK_COUNTRIES])
            if is_fraud and random.random() < 0.4
            else random.choice(COUNTRIES)
        )

        hour = _sample_hour(is_fraud)
        days_ago = random.randint(0, 60)
        ts = (now - timedelta(days=days_ago)).replace(
            hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59)
        )

        amount = _sample_amount(category, is_fraud)
        velocity_1h = np.random.poisson(4 if is_fraud else 1)  # tx count in prior hour
        distance_from_home_km = (
            np.random.uniform(500, 9000) if is_fraud and random.random() < 0.5
            else np.random.uniform(0, 80)
        )
        device = random.choice(DEVICES)
        card_last4 = f"{random.randint(0, 9999):04d}"

        rows.append({
            "card_last4": card_last4,
            "merchant": merchant,
            "category": category,
            "amount": amount,
            "currency": "USD",
            "country": country,
            "city": city,
            "lat": lat + np.random.uniform(-0.05, 0.05),
            "lon": lon + np.random.uniform(-0.05, 0.05),
            "device": device,
            "ip_address": f"{random.randint(1,223)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(0,255)}",
            "hour_of_day": hour,
            "velocity_1h": velocity_1h,
            "distance_from_home_km": round(distance_from_home_km, 1),
            "amount_to_category_avg_ratio": round(amount / CATEGORY_BASE_AMOUNT[category], 2),
            "is_high_risk_country": 1 if country in HIGH_RISK_COUNTRIES else 0,
            "is_high_risk_category": 1 if category in HIGH_RISK_CATEGORIES else 0,
            "created_at": ts,
            "is_fraud": int(is_fraud),
        })

    df = pd.DataFrame(rows).sort_values("created_at").reset_index(drop=True)
    return df


if __name__ == "__main__":
    df = generate_transactions()
    print(df.head())
    print(f"\nGenerated {len(df)} rows, fraud rate: {df['is_fraud'].mean():.2%}")
