function SetupPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Setup Your Account</h1>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">Step 1: Accounts</h2>
          <p className="mt-2 text-muted-foreground">
            Add your bank accounts, credit cards, and other financial accounts
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">Step 2: Categories</h2>
          <p className="mt-2 text-muted-foreground">
            Create categories for organizing your income and expenses
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground">Step 3: Subcategories</h2>
          <p className="mt-2 text-muted-foreground">Add subcategories and set spending goals</p>
        </div>
      </div>
      <p className="text-muted-foreground">Setup wizard coming in Phase 3</p>
    </div>
  );
}

export default SetupPage;
