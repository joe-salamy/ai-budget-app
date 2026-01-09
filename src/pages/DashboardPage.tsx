function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-card-foreground">Net Worth</h3>
          <p className="mt-2 text-2xl font-bold">$0.00</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-card-foreground">This Month's Income</h3>
          <p className="mt-2 text-2xl font-bold">$0.00</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-card-foreground">This Month's Expenses</h3>
          <p className="mt-2 text-2xl font-bold">$0.00</p>
        </div>
      </div>
      <p className="text-muted-foreground">Full dashboard coming in Phase 5</p>
    </div>
  );
}

export default DashboardPage;
