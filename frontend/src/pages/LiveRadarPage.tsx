import { useOutletContext } from "react-router-dom";
import LiveTransactionFeed from "@/components/dashboard/LiveTransactionFeed";
import type { Transaction } from "@/types";

export default function LiveRadarPage() {
  const { feed, connected } = useOutletContext<{ feed: Transaction[]; connected: boolean }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Live Radar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every transaction is scored the instant it arrives — click any row for the full model explanation.
        </p>
      </div>
      <LiveTransactionFeed feed={feed} connected={connected} />
    </div>
  );
}
