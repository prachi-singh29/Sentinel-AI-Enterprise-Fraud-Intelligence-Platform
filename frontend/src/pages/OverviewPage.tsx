import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import StatsCards from "@/components/dashboard/StatsCards";
import FraudTrendChart from "@/components/dashboard/FraudTrendChart";
import CategoryChart from "@/components/dashboard/CategoryChart";
import CountryRiskTable from "@/components/dashboard/CountryRiskTable";
import LiveTransactionFeed from "@/components/dashboard/LiveTransactionFeed";
import { api } from "@/lib/api";
import type { KPIStats, TimeseriesPoint, CategoryBreakdown, CountryBreakdown, Transaction } from "@/types";

export default function OverviewPage() {
  const { feed, connected } = useOutletContext<{ feed: Transaction[]; connected: boolean }>();
  const [kpis, setKpis] = useState<KPIStats | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [byCategory, setByCategory] = useState<CategoryBreakdown[]>([]);
  const [byCountry, setByCountry] = useState<CountryBreakdown[]>([]);

  useEffect(() => {
    const load = () => {
      api.getKpis().then(setKpis).catch(console.error);
      api.getTimeseries(24).then(setTimeseries).catch(console.error);
      api.getByCategory().then(setByCategory).catch(console.error);
      api.getByCountry().then(setByCountry).catch(console.error);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Fraud Operations Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time monitoring powered by XGBoost, Isolation Forest & SHAP explainability.
        </p>
      </div>

      <StatsCards kpis={kpis} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <FraudTrendChart data={timeseries} />
        <CountryRiskTable data={byCountry} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <CategoryChart data={byCategory} />
        </div>
        <div className="xl:col-span-2">
          <LiveTransactionFeed feed={feed} connected={connected} />
        </div>
      </div>
    </div>
  );
}
