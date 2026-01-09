function TransactionInputPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Add Transactions</h1>
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border">
          <div className="flex gap-4 p-4">
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Income
            </button>
            <button className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Expense
            </button>
            <button className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Transfer
            </button>
          </div>
        </div>
        <div className="p-6">
          <p className="text-muted-foreground">Transaction forms coming in Phase 4</p>
        </div>
      </div>
    </div>
  );
}

export default TransactionInputPage;
