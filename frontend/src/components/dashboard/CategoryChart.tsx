import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import type { CategoryBreakdown } from "@/types";

export default function CategoryChart({ data }: { data: CategoryBreakdown[] }) {
  const sorted = [...data].sort((a, b) => b.total - a.total).slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk by Merchant Category</CardTitle>
        <CardDescription>Fraud incidence across spending categories</CardDescription>
      </CardHeader>
      <CardContent className="h-72 pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="category"
              type="category"
              width={100}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "hsla(222, 20%, 60%, 0.15)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as CategoryBreakdown;
                return (
                  <div className="glass-panel-solid rounded-lg border border-foreground/10 px-3 py-2 text-xs">
                    <p className="font-medium">{d.category}</p>
                    <p className="text-muted-foreground">
                      {d.total} total · <span className="text-destructive">{d.fraud} fraud</span>
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={14}>
              {sorted.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.fraud / Math.max(entry.total, 1) > 0.08 ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                  fillOpacity={0.75}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
