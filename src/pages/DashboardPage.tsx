// DashboardPage - Main dashboard with summaries and visualizations
import { useDashboard } from "../hooks/useDashboard";
import { AccountSummary } from "../components/features/AccountSummary";
import { CategorySummary } from "../components/features/CategorySummary";
import { NetWorthChart } from "../components/features/NetWorthChart";
import { SankeyDiagram } from "../components/features/SankeyDiagram";
import { FinancialHealthScore } from "../components/features/FinancialHealthScore";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

// ============== HELPERS ==============

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Quick date range presets
const DATE_PRESETS = [
  {
    label: "Last 30 days",
    getValue: () => ({
      startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    }),
  },
  {
    label: "Last 90 days",
    getValue: () => ({
      startDate: format(subDays(new Date(), 90), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    }),
  },
  {
    label: "This month",
    getValue: () => ({
      startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    }),
  },
  {
    label: "Last month",
    getValue: () => ({
      startDate: format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd"),
      endDate: format(endOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd"),
    }),
  },
  {
    label: "Last 6 months",
    getValue: () => ({
      startDate: format(subMonths(new Date(), 6), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    }),
  },
  {
    label: "Year to date",
    getValue: () => ({
      startDate: format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    }),
  },
];

// ============== MAIN COMPONENT ==============

function DashboardPage() {
  const {
    dateRange,
    setDateRange,
    accountSummary,
    accountSummaryLoading,
    categorySummary,
    categorySummaryLoading,
    netWorth,
    metrics,
    metricsLoading,
    netWorthChartData,
    netWorthChartAccounts,
    netWorthChartLoading,
    sankeyData,
    sankeyLoading,
  } = useDashboard();

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange((prev) => ({ ...prev, startDate: e.target.value }));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange((prev) => ({ ...prev, endDate: e.target.value }));
  };

  const handlePresetClick = (preset: (typeof DATE_PRESETS)[0]) => {
    setDateRange(preset.getValue());
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>

        {/* Date Range Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">From:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={handleStartDateChange}
              className="px-3 py-1.5 bg-card border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">To:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={handleEndDateChange}
              className="px-3 py-1.5 bg-card border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
            />
          </div>
        </div>
      </div>

      {/* Date Presets */}
      <div className="flex flex-wrap gap-2">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset)}
            className="px-3 py-1 text-xs rounded-full border border-border text-foreground hover:bg-muted hover:text-white hover:border-border"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Net Worth Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Net Worth</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {accountSummaryLoading ? (
              <div className="h-8 bg-muted/50 rounded animate-pulse"></div>
            ) : (
              <p
                className={`text-2xl font-bold ${
                  (netWorth?.net_worth ?? 0) >= 0 ? "text-foreground" : "text-foreground"
                }`}
              >
                {formatCurrency(netWorth?.net_worth ?? 0)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Assets - Liabilities</p>
          </CardContent>
        </Card>

        {/* Income Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Income</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {metricsLoading ? (
              <div className="h-8 bg-muted/50 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-foreground">
                +{formatCurrency(metrics?.totalIncome ?? 0)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">In selected period</p>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Expenses</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {metricsLoading ? (
              <div className="h-8 bg-muted/50 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-foreground">
                -{formatCurrency(metrics?.totalExpenses ?? 0)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">In selected period</p>
          </CardContent>
        </Card>

        {/* Net Change Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Net Change</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {metricsLoading ? (
              <div className="h-8 bg-muted/50 rounded animate-pulse"></div>
            ) : (
              <p
                className={`text-2xl font-bold ${
                  (metrics?.netChange ?? 0) >= 0 ? "text-foreground" : "text-foreground"
                }`}
              >
                {(metrics?.netChange ?? 0) >= 0 ? "+" : ""}
                {formatCurrency(metrics?.netChange ?? 0)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health Score */}
      <FinancialHealthScore startDate={dateRange.startDate} endDate={dateRange.endDate} />

      {/* Account Summary */}
      <AccountSummary
        accounts={accountSummary}
        netWorth={netWorth}
        loading={accountSummaryLoading}
      />

      {/* Category Summary */}
      <CategorySummary categories={categorySummary} loading={categorySummaryLoading} />

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Net Worth Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <NetWorthChart
              data={netWorthChartData}
              accounts={netWorthChartAccounts}
              loading={netWorthChartLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cash Flow (Sankey Diagram)</CardTitle>
          </CardHeader>
          <CardContent>
            <SankeyDiagram data={sankeyData || { nodes: [], links: [] }} loading={sankeyLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
