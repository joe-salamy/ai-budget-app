// RecentActivityPanel component - Shows recent transaction activity for each account
import { formatDistanceToNow } from "date-fns";
import type { RecentActivity } from "../../hooks/useTransactions";

interface RecentActivityPanelProps {
  recentActivity: RecentActivity[];
  loading: boolean;
  error: string | null;
}

/**
 * Formats a number as currency (USD)
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Panel showing the most recent transaction for each account
 * Helps users know which transactions to add next
 */
export function RecentActivityPanel({
  recentActivity,
  loading,
  error,
}: RecentActivityPanelProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
        <h2 className="text-lg font-semibold text-foreground mb-2">Recent Activity</h2>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (recentActivity.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-lg font-semibold text-foreground mb-2">Recent Activity</h2>
        <p className="text-muted-foreground text-sm">
          No accounts yet. Create an account in Settings to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {recentActivity.map((activity) => (
          <AccountActivityCard key={activity.account_id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

interface AccountActivityCardProps {
  activity: RecentActivity;
}

function AccountActivityCard({ activity }: AccountActivityCardProps) {
  const isAsset = activity.account_type === "asset";
  const balanceColor = activity.current_balance >= 0 ? "text-green-400" : "text-red-400";

  return (
    <div className="p-3 rounded-md bg-gray-800/50 border border-gray-700/50">
      {/* Account header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              isAsset
                ? "bg-green-500/20 text-green-400"
                : "bg-orange-500/20 text-orange-400"
            }`}
          >
            {isAsset ? "Asset" : "Liability"}
          </span>
          <span className="font-medium text-gray-100">{activity.account_name}</span>
        </div>
        <span className={`font-semibold ${balanceColor}`}>
          {formatCurrency(activity.current_balance)}
        </span>
      </div>

      {/* Recent transaction */}
      {activity.recent_transaction ? (
        <div className="flex items-center justify-between text-sm">
          <div className="flex-1 min-w-0">
            <p className="text-gray-300 truncate">
              {activity.recent_transaction.name}
            </p>
            <p className="text-gray-500 text-xs">
              {formatDistanceToNow(new Date(activity.recent_transaction.date), {
                addSuffix: true,
              })}
            </p>
          </div>
          <span
            className={`ml-2 font-medium ${
              activity.recent_transaction.amount >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {activity.recent_transaction.amount >= 0 ? "+" : ""}
            {formatCurrency(activity.recent_transaction.amount)}
          </span>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No transactions yet</p>
      )}
    </div>
  );
}
