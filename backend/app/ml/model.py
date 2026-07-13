import os
import json
import joblib
import numpy as np
import pandas as pd
import shap

from app.ml.train_model import ARTIFACT_DIR, FEATURE_COLUMNS, main as train_main

_clf = None
_iso = None
_encoders = None
_explainer = None


def _load_or_train():
    global _clf, _iso, _encoders, _explainer

    clf_path = os.path.join(ARTIFACT_DIR, "xgb_classifier.joblib")
    iso_path = os.path.join(ARTIFACT_DIR, "isolation_forest.joblib")
    enc_path = os.path.join(ARTIFACT_DIR, "encoders.joblib")

    if not (os.path.exists(clf_path) and os.path.exists(iso_path) and os.path.exists(enc_path)):
        print("[ml] No trained artifacts found - training models now (first boot only)...")
        train_main()

    _clf = joblib.load(clf_path)
    _iso = joblib.load(iso_path)
    _encoders = joblib.load(enc_path)
    _explainer = shap.TreeExplainer(_clf)
    print("[ml] Models loaded successfully.")


def _safe_encode(col: str, value: str) -> int:
    le = _encoders[col]
    if value in le.classes_:
        return int(le.transform([value])[0])
    return 0  # unseen category fallback


def build_feature_row(tx: dict) -> pd.DataFrame:
    """tx is a dict with raw transaction fields (amount, category, country, device, etc.)"""
    if _clf is None:
        _load_or_train()

    row = {
        "amount": tx["amount"],
        "hour_of_day": tx["hour_of_day"],
        "velocity_1h": tx.get("velocity_1h", 1),
        "distance_from_home_km": tx.get("distance_from_home_km", 10.0),
        "amount_to_category_avg_ratio": tx.get("amount_to_category_avg_ratio", 1.0),
        "is_high_risk_country": tx.get("is_high_risk_country", 0),
        "is_high_risk_category": tx.get("is_high_risk_category", 0),
        "category_enc": _safe_encode("category", tx["category"]),
        "country_enc": _safe_encode("country", tx["country"]),
        "device_enc": _safe_encode("device", tx.get("device", "Web Chrome")),
    }
    return pd.DataFrame([row])[FEATURE_COLUMNS]


def score_transaction(tx: dict) -> dict:
    """Returns fraud_score, anomaly_score, is_fraud_predicted, and top SHAP features."""
    if _clf is None:
        _load_or_train()

    X = build_feature_row(tx)

    fraud_prob = float(_clf.predict_proba(X)[0, 1])
    anomaly_raw = float(_iso.decision_function(X)[0])  # higher = more normal
    anomaly_score = float(np.clip(0.5 - anomaly_raw, 0, 1))  # invert -> higher = more anomalous

    shap_values = _explainer.shap_values(X)
    contribs = list(zip(FEATURE_COLUMNS, shap_values[0].tolist()))
    contribs.sort(key=lambda x: abs(x[1]), reverse=True)
    top_features = [
        {"feature": f, "impact": round(v, 4)} for f, v in contribs[:4]
    ]

    is_fraud_predicted = fraud_prob >= 0.5

    if fraud_prob >= 0.85 or anomaly_score >= 0.9:
        status = "blocked"
    elif fraud_prob >= 0.5 or anomaly_score >= 0.7:
        status = "flagged"
    elif fraud_prob >= 0.3:
        status = "review"
    else:
        status = "approved"

    return {
        "fraud_score": round(fraud_prob, 4),
        "anomaly_score": round(anomaly_score, 4),
        "is_fraud_predicted": is_fraud_predicted,
        "status": status,
        "shap_top_features": json.dumps(top_features),
    }


# Warm the models at import time in a try/except so app startup doesn't crash
# if training takes a moment - main.py also calls _load_or_train() explicitly on startup.
