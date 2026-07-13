export type TransactionStatus = "approved" | "flagged" | "blocked" | "review";

export interface Transaction {
  id: string;
  card_last4: string;
  merchant: string;
  category: string;
  amount: number;
  currency: string;
  country: string;
  city?: string | null;
  lat?: number | null;
  lon?: number | null;
  device?: string | null;
  ip_address?: string | null;
  fraud_score: number;
  anomaly_score: number;
  is_fraud_predicted: boolean;
  status: TransactionStatus;
  shap_top_features?: string | null;
  created_at: string;
}

export interface TransactionPage {
  items: Transaction[];
  total: number;
  page: number;
  page_size: number;
}

export interface KPIStats {
  total_transactions: number;
  total_volume: number;
  flagged_count: number;
  blocked_count: number;
  fraud_rate_pct: number;
  avg_fraud_score: number;
  transactions_last_hour: number;
  amount_saved: number;
}

export interface TimeseriesPoint {
  bucket: string;
  total: number;
  fraud: number;
  volume: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  fraud: number;
}

export interface CountryBreakdown {
  country: string;
  total: number;
  fraud: number;
  avg_score: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface ShapFeature {
  feature: string;
  impact: number;
}
