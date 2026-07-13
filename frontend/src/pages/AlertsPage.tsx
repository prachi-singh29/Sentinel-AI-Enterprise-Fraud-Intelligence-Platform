import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import RiskMeter from "@/components/dashboard/RiskMeter";
import TransactionDetailDialog from "@/components/dashboard/TransactionDetailDialog";
import { api } from "@/lib/api";
import { formatCurrency, timeAgo } from "@/lib/utils";
import type { Transaction } from "@/types";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function AlertsPage() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.getTransactions({ status: "blocked", page_size: 25 }),
      api.getTransactions({ status: "flagged", page_size: 25 }),
    ])
      .then(([blocked, flagged]) => {
        const merged = [...blocked.items, ...flagged.items].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setItems(merged);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Fraud Alerts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Transactions flagged or auto-blocked by the model, awaiting analyst decision.
        </p>
      </div>

      <Card>
        <CardContent className="p-2">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
              <ShieldAlert className="h-6 w-6" />
              <p className="text-sm">No active alerts. All clear.</p>
            </div>
          ) : (
            <div className="divide-y divide-foreground/[0.05]">
              {items.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => {
                    setSelected(tx);
                    setOpen(true);
                  }}
                  className="grid w-full grid-cols-2 items-center gap-3 px-3 py-3 text-left text-sm transition-colors hover:bg-foreground/[0.03] sm:grid-cols-[1fr_auto_auto_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{tx.merchant}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      •••• {tx.card_last4} · {tx.city}, {tx.country} · {timeAgo(tx.created_at)}
                    </p>
                  </div>
                  <span className="font-mono text-sm tabular-nums">{formatCurrency(tx.amount, tx.currency)}</span>
                  <RiskMeter score={tx.fraud_score} compact />
                  <StatusBadge status={tx.status} />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionDetailDialog transaction={selected} open={open} onOpenChange={setOpen} onReviewed={load} />
    </div>
  );
}
