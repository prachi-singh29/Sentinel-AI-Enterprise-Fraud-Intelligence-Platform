import TransactionsTable from "@/components/dashboard/TransactionsTable";

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full transaction history with fraud scores and analyst review actions.
        </p>
      </div>
      <TransactionsTable />
    </div>
  );
}
