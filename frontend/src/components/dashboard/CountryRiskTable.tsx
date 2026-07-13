import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import RiskMeter from "./RiskMeter";
import type { CountryBreakdown } from "@/types";

export default function CountryRiskTable({ data }: { data: CountryBreakdown[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Geographic Risk Exposure</CardTitle>
        <CardDescription>Top origin countries by transaction volume</CardDescription>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="space-y-3">
          {data.slice(0, 7).map((c) => (
            <div key={c.country} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2.5 w-28 shrink-0">
                <span className="font-mono text-xs text-muted-foreground">{c.country}</span>
              </div>
              <div className="flex-1 text-xs text-muted-foreground text-right w-16 shrink-0">
                {c.total} tx
              </div>
              <RiskMeter score={c.avg_score} compact />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
