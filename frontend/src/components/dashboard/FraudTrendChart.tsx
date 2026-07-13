import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import type { TimeseriesPoint } from "@/types";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = new Date(label);
  return (
    <div className="glass-panel-solid rounded-lg border border-foreground/10 px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-1">
        {d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric" })}
      </p>
      <p className="text-foreground">
        Total: <span className="font-mono">{payload[0]?.payload.total}</span>
      </p>
      <p className="text-destructive">
        Fraud: <span className="font-mono">{payload[0]?.payload.fraud}</span>
      </p>
    </div>
  );
}

export default function FraudTrendChart({ data }: { data: TimeseriesPoint[] }) {
  return (
    <Card className="col-span-1 xl:col-span-2">
      <CardHeader>
        <CardTitle>Transaction & Fraud Volume</CardTitle>
        <CardDescription>Hourly throughput vs. flagged/blocked activity</CardDescription>
      </CardHeader>
      <CardContent className="h-72 pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fraudGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.45} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="bucket"
              tickFormatter={(v) => new Date(v).toLocaleTimeString(undefined, { hour: "numeric" })}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={36} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#totalGradient)" />
            <Area type="monotone" dataKey="fraud" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#fraudGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
