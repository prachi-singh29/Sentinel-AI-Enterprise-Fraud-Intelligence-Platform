import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import RiskMeter from "@/components/dashboard/RiskMeter";
import TransactionDetailDialog from "@/components/dashboard/TransactionDetailDialog";
import { api } from "@/lib/api";
import { formatCurrency, timeAgo } from "@/lib/utils";
import type { Transaction } from "@/types";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const STATUSES = ["all", "approved", "review", "flagged", "blocked"];

export default function TransactionsTable() {
  const [data, setData] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [open, setOpen] = useState(false);
  const pageSize = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getTransactions({
        page,
        page_size: pageSize,
        status: status === "all" ? undefined : status,
        search: search || undefined,
      });
      setData(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-foreground/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search merchant or card..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/[0.06] text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Merchant</th>
              <th className="px-4 py-3 font-medium">Card</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Risk Score</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-muted-foreground">
                  No transactions match these filters.
                </td>
              </tr>
            ) : (
              data.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => {
                    setSelected(tx);
                    setOpen(true);
                  }}
                  className="cursor-pointer border-b border-foreground/[0.04] transition-colors hover:bg-foreground/[0.03]"
                >
                  <td className="px-4 py-3 font-medium">{tx.merchant}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">•••• {tx.card_last4}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{formatCurrency(tx.amount, tx.currency)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{tx.city}, {tx.country}</td>
                  <td className="px-4 py-3"><RiskMeter score={tx.fraud_score} /></td>
                  <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(tx.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4 text-xs text-muted-foreground">
        <span>
          Showing {data.length ? (page - 1) * pageSize + 1 : 0}–{(page - 1) * pageSize + data.length} of {total}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>Page {page} / {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <TransactionDetailDialog transaction={selected} open={open} onOpenChange={setOpen} onReviewed={load} />
    </Card>
  );
}
