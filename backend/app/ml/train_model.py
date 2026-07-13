"""
Trains the fraud detection models:
  1. XGBoost classifier -> supervised fraud probability (fraud_score)
  2. Isolation Forest    -> unsupervised anomaly score (anomaly_score)

Artifacts are saved to backend/app/ml/artifacts/ so the API can load
them at startup without retraining. Run this once locally / during
the Docker build:

    python -m app.ml.train_model
"""
import os
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb

from app.ml.generate_data import generate_transactions

ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
os.makedirs(ARTIFACT_DIR, exist_ok=True)

FEATURE_COLUMNS = [
    "amount",
    "hour_of_day",
    "velocity_1h",
    "distance_from_home_km",
    "amount_to_category_avg_ratio",
    "is_high_risk_country",
    "is_high_risk_category",
    "category_enc",
    "country_enc",
    "device_enc",
]


def build_features(df):
    df = df.copy()
    encoders = {}
    for col in ["category", "country", "device"]:
        le = LabelEncoder()
        df[f"{col}_enc"] = le.fit_transform(df[col])
        encoders[col] = le
    return df, encoders


def main():
    print("Generating synthetic training data...")
    df = generate_transactions(n=20000, fraud_rate=0.035)
    df, encoders = build_features(df)

    X = df[FEATURE_COLUMNS]
    y = df["is_fraud"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training XGBoost classifier...")
    scale_pos_weight = (y_train == 0).sum() / max((y_train == 1).sum(), 1)
    clf = xgb.XGBClassifier(
        n_estimators=250,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        scale_pos_weight=scale_pos_weight,
        eval_metric="auc",
        random_state=42,
    )
    clf.fit(X_train, y_train)

    preds = clf.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, preds)
    print(f"XGBoost ROC-AUC: {auc:.4f}")
    print(classification_report(y_test, (preds > 0.5).astype(int)))

    print("Training Isolation Forest for anomaly detection...")
    iso = IsolationForest(
        n_estimators=200, contamination=0.035, random_state=42
    )
    iso.fit(X_train)

    joblib.dump(clf, os.path.join(ARTIFACT_DIR, "xgb_classifier.joblib"))
    joblib.dump(iso, os.path.join(ARTIFACT_DIR, "isolation_forest.joblib"))
    joblib.dump(encoders, os.path.join(ARTIFACT_DIR, "encoders.joblib"))
    joblib.dump(FEATURE_COLUMNS, os.path.join(ARTIFACT_DIR, "feature_columns.joblib"))

    print(f"Artifacts saved to {ARTIFACT_DIR}")


if __name__ == "__main__":
    main()
