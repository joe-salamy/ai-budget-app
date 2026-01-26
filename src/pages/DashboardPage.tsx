// DashboardPage - Main dashboard with summaries and visualizations
import { useDashboard } from "../hooks/useDashboard";
import { usePrefetchOtherPages } from "../hooks/usePrefetchOtherPages";
import { AccountSummary } from "../components/features/AccountSummary";
import { CategorySummary } from "../components/features/CategorySummary";
import { NetWorthChart } from "../components/features/NetWorthChart";
import { SankeyDiagram } from "../components/features/SankeyDiagram";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { DateRangePicker } from "../components/ui/DateRangePicker";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

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
    label: "Last 365 days",
    getValue: () => ({
      startDate: format(subDays(new Date(), 365), "yyyy-MM-dd"),
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
    label: "This year",
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
    hasUncategorizedTransactions,
    netWorth,
    metrics,
    metricsLoading,
    netWorthChartData,
    netWorthChartAccounts,
    netWorthChartLoading,
    sankeyData,
    sankeyLoading,
  } = useDashboard();

  // Prefetch other pages' data in the background after dashboard loads
  const dashboardLoading =
    accountSummaryLoading ||
    categorySummaryLoading ||
    metricsLoading ||
    netWorthChartLoading ||
    sankeyLoading;
  usePrefetchOtherPages(dashboardLoading);

  const handleDateRangeChange = (range: { startDate: string; endDate: string }) => {
    setDateRange(range);
  };

  const handlePresetClick = (preset: (typeof DATE_PRESETS)[0]) => {
    setDateRange(preset.getValue());
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>

      {/* Date Selection Card */}
      <Card>
        <CardContent className="pt-3 pb-3 px-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Presets */}
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className="px-3 py-1 text-sm rounded-full border border-border text-foreground hover:bg-muted hover:text-white hover:border-border"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Date Range Picker */}
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateChange={handleDateRangeChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Net Worth Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">Net Worth</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {accountSummaryLoading ? (
              <div className="h-8 bg-muted/50 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(netWorth?.net_worth ?? 0)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Assets - Liabilities</p>
          </CardContent>
        </Card>

        {/* Income Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">Income</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">Expenses</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">Net Change</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {metricsLoading ? (
              <div className="h-8 bg-muted/50 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {(metrics?.netChange ?? 0) >= 0 ? "+" : ""}
                {formatCurrency(metrics?.netChange ?? 0)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Account Summary */}
      <AccountSummary
        accounts={accountSummary}
        netWorth={netWorth}
        loading={accountSummaryLoading}
      />

      {/* Category Summary */}
      <CategorySummary
        categories={categorySummary}
        loading={categorySummaryLoading}
        hasUncategorizedTransactions={hasUncategorizedTransactions}
      />

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
