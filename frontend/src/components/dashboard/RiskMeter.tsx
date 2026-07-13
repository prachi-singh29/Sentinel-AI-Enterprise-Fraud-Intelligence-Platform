import { cn } from "@/lib/utils";
import { riskMeterColor, riskLabel } from "./StatusBadge";

export default function RiskMeter({ score, compact = false }: { score: number; compact?: boolean }) {
  const pct = Math.round(score * 100);
  return (
    <div className={cn("flex items-center gap-2", compact ? "w-24" : "w-32")}>
      <div className="risk-meter-track">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out", riskMeterColor(score))}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!compact && (
        <span className="w-16 shrink-0 font-mono text-[11px] text-muted-foreground">
          {pct}% <span className="opacity-60">· {riskLabel(score)}</span>
        </span>
      )}
    </div>
  );
}
