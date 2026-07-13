import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, ShieldX, Eye } from "lucide-react";
import type { TransactionStatus } from "@/types";

const CONFIG: Record<TransactionStatus, { variant: "success" | "warning" | "destructive" | "outline"; icon: any; label: string }> = {
  approved: { variant: "success", icon: ShieldCheck, label: "Approved" },
  review: { variant: "outline", icon: Eye, label: "In Review" },
  flagged: { variant: "warning", icon: ShieldAlert, label: "Flagged" },
  blocked: { variant: "destructive", icon: ShieldX, label: "Blocked" },
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const cfg = CONFIG[status] ?? CONFIG.approved;
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

export function riskMeterColor(score: number) {
  if (score >= 0.7) return "bg-destructive shadow-glow-destructive";
  if (score >= 0.4) return "bg-warning shadow-glow-warning";
  return "bg-success";
}

export function riskLabel(score: number) {
  if (score >= 0.7) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
}
