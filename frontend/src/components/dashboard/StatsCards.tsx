import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import type { KPIStats } from "@/types";
import { Activity, ShieldAlert, ShieldX, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardDef {
  label: string;
  value: string;
  sub: string;
  icon: any;
  glow?: string;
  accent: string;
}

export default function StatsCards({ kpis }: { kpis: KPIStats | null }) {
  const cards: StatCardDef[] = [
    {
      label: "Transactions Processed",
      value: kpis ? formatCompactNumber(kpis.total_transactions) : "—",
      sub: kpis ? `${kpis.transactions_last_hour} in the last hour` : "Loading...",
      icon: Activity,
      accent: "text-primary",
    },
    {
      label: "Flagged for Review",
      value: kpis ? formatCompactNumber(kpis.flagged_count) : "—",
      sub: kpis ? `${kpis.fraud_rate_pct}% overall fraud rate` : "Loading...",
      icon: ShieldAlert,
      accent: "text-warning",
    },
    {
      label: "Blocked Transactions",
      value: kpis ? formatCompactNumber(kpis.blocked_count) : "—",
      sub: "Auto-blocked by model threshold",
      icon: ShieldX,
      glow: "stat-glow-destructive",
      accent: "text-destructive",
    },
    {
      label: "Est. Fraud Prevented",
      value: kpis ? formatCurrency(kpis.amount_saved) : "—",
      sub: "Value of blocked transactions",
      icon: PiggyBank,
      glow: "stat-glow-primary",
      accent: "text-success",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c, i) => (
        <Card
          key={c.label}
          className={cn("animate-fade-up hover:-translate-y-0.5", c.glow)}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <CardContent className="flex items-start justify-between p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <p className="mt-2 font-display text-2xl font-semibold">{c.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
            </div>
            <div className={cn("rounded-lg bg-foreground/[0.04] p-2.5", c.accent)}>
              <c.icon className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
