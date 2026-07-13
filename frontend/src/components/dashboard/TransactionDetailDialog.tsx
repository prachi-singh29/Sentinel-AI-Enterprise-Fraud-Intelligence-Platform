import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import RiskMeter from "./RiskMeter";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Transaction, ShapFeature } from "@/types";
import { MapPin, Smartphone, Globe, CreditCard, CheckCircle2, XCircle } from "lucide-react";

const FEATURE_LABELS: Record<string, string> = {
  amount: "Transaction Amount",
  hour_of_day: "Time of Day",
  velocity_1h: "Transaction Velocity (1h)",
  distance_from_home_km: "Distance From Home",
  amount_to_category_avg_ratio: "Amount vs. Category Norm",
  is_high_risk_country: "High-Risk Country",
  is_high_risk_category: "High-Risk Category",
  category_enc: "Merchant Category",
  country_enc: "Origin Country",
  device_enc: "Device Type",
};

export default function TransactionDetailDialog({
  transaction,
  open,
  onOpenChange,
  onReviewed,
}: {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onReviewed?: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  if (!transaction) return null;
  let shapFeatures: ShapFeature[] = [];
  try {
    shapFeatures = transaction.shap_top_features ? JSON.parse(transaction.shap_top_features) : [];
  } catch {
    shapFeatures = [];
  }
  const maxImpact = Math.max(...shapFeatures.map((f) => Math.abs(f.impact)), 0.01);

  async function handleReview(decision: "confirmed_fraud" | "false_positive") {
    if (!transaction) return;
    setSubmitting(true);
    try {
      await api.reviewTransaction(transaction.id, decision);
      onReviewed?.();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="font-mono">{transaction.id.slice(0, 8)}</DialogTitle>
            <StatusBadge status={transaction.status} />
          </div>
          <DialogDescription>
            {transaction.merchant} · {timeAgo(transaction.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-4 w-4" /> Card ending {transaction.card_last4}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Smartphone className="h-4 w-4" /> {transaction.device}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" /> {transaction.city}, {transaction.country}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4" /> {transaction.ip_address}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg border border-foreground/10 bg-foreground/[0.02] p-4">
          <div>
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="font-display text-2xl font-semibold">{formatCurrency(transaction.amount, transaction.currency)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1.5">Fraud Score</p>
            <RiskMeter score={transaction.fraud_score} />
          </div>
        </div>

        {shapFeatures.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2.5">
              Model Explanation (SHAP)
            </p>
            <div className="space-y-2.5">
              {shapFeatures.map((f) => {
                const positive = f.impact > 0;
                const widthPct = (Math.abs(f.impact) / maxImpact) * 100;
                return (
                  <div key={f.feature} className="flex items-center gap-3 text-xs">
                    <span className="w-40 shrink-0 text-muted-foreground truncate">
                      {FEATURE_LABELS[f.feature] || f.feature}
                    </span>
                    <div className="relative h-4 flex-1 overflow-hidden rounded-sm bg-foreground/[0.04]">
                      <div
                        className={`absolute inset-y-0 ${positive ? "left-1/2 bg-destructive/70" : "right-1/2 bg-success/70"}`}
                        style={{ width: `${widthPct / 2}%` }}
                      />
                      <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/20" />
                    </div>
                    <span className={`w-12 shrink-0 text-right font-mono ${positive ? "text-destructive" : "text-success"}`}>
                      {positive ? "+" : ""}{f.impact.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground/70">
              Red bars push the prediction toward fraud; green bars push toward legitimate.
            </p>
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-success/30 text-success hover:bg-success/10"
            disabled={submitting}
            onClick={() => handleReview("false_positive")}
          >
            <CheckCircle2 className="h-4 w-4" /> Mark Legitimate
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={submitting}
            onClick={() => handleReview("confirmed_fraud")}
          >
            <XCircle className="h-4 w-4" /> Confirm Fraud
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
