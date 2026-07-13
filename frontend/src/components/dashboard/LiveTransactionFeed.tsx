import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import RiskMeter from "./RiskMeter";
import TransactionDetailDialog from "./TransactionDetailDialog";
import { formatCurrency, timeAgo } from "@/lib/utils";
import type { Transaction } from "@/types";
import { Radar } from "lucide-react";

export default function LiveTransactionFeed({ feed, connected }: { feed: Transaction[]; connected: boolean }) {
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <Card className="relative overflow-hidden">
      {connected && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] scan-shimmer" />
      )}
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-primary" />
            Live Transaction Radar
          </CardTitle>
          <CardDescription>Streaming in real time via WebSocket</CardDescription>
        </div>
      </CardHeader>

      <div className="max-h-[420px] overflow-y-auto px-2 pb-3">
        {feed.length === 0 && (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Waiting for incoming transactions...
          </div>
        )}
        <div className="space-y-1">
          {feed.map((tx) => (
            <button
              key={tx.id}
              onClick={() => {
                setSelected(tx);
                setOpen(true);
              }}
              className="grid w-full grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-foreground/[0.04] animate-row-enter"
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
      </div>

      <TransactionDetailDialog transaction={selected} open={open} onOpenChange={setOpen} />
    </Card>
  );
}
