function TransactionHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search transactions..."
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-center text-muted-foreground">
          Transaction history table coming in Phase 4
        </p>
      </div>
    </div>
  );
}

export default TransactionHistoryPage;
