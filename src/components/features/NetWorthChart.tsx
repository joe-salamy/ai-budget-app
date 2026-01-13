// NetWorthChart - Line chart showing net worth over time using Recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { NetWorthDataPoint } from "../../services/charts";
import type { AccountType } from "../../types";

interface NetWorthChartProps {
  data: NetWorthDataPoint[];
  accounts: Array<{ name: string; type: AccountType }>;
  loading?: boolean;
}

// Color palette for account lines
const ASSET_COLORS = [
  "#22c55e", // green-500
  "#4ade80", // green-400
  "#86efac", // green-300
  "#16a34a", // green-600
  "#15803d", // green-700
];

const LIABILITY_COLORS = [
  "#ef4444", // red-500
  "#f87171", // red-400
  "#fca5a5", // red-300
  "#dc2626", // red-600
  "#b91c1c", // red-700
];

const NET_WORTH_COLOR = "#3b82f6"; // blue-500

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatYAxis(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
      <p className="text-gray-300 font-medium mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-300">{entry.name}</span>
            </div>
            <span
              className={`text-sm font-medium ${
                entry.dataKey === "netWorth"
                  ? entry.value >= 0
                    ? "text-blue-400"
                    : "text-red-400"
                  : "text-white"
              }`}
            >
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NetWorthChart({ data, accounts, loading }: NetWorthChartProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed border-gray-600 rounded-lg">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-500 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
          <p className="text-gray-400">No data available</p>
          <p className="text-sm text-gray-500">
            Add transactions to see your net worth over time
          </p>
        </div>
      </div>
    );
  }

  // Separate assets and liabilities for coloring
  const assetAccounts = accounts.filter((a) => a.type === "asset");
  const liabilityAccounts = accounts.filter((a) => a.type === "liability");

  // Get color for account
  const getAccountColor = (accountName: string): string => {
    const assetIndex = assetAccounts.findIndex((a) => a.name === accountName);
    if (assetIndex >= 0) {
      return ASSET_COLORS[assetIndex % ASSET_COLORS.length];
    }
    const liabilityIndex = liabilityAccounts.findIndex(
      (a) => a.name === accountName
    );
    if (liabilityIndex >= 0) {
      return LIABILITY_COLORS[liabilityIndex % LIABILITY_COLORS.length];
    }
    return "#9ca3af"; // gray-400 fallback
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="formattedDate"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          tickLine={{ stroke: "#4b5563" }}
          axisLine={{ stroke: "#4b5563" }}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          tickLine={{ stroke: "#4b5563" }}
          axisLine={{ stroke: "#4b5563" }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 10 }}
          formatter={(value) => (
            <span className="text-gray-300 text-sm">{value}</span>
          )}
        />

        {/* Net Worth line - always shown prominently */}
        <Line
          type="monotone"
          dataKey="netWorth"
          name="Net Worth"
          stroke={NET_WORTH_COLOR}
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, fill: NET_WORTH_COLOR }}
        />

        {/* Account lines */}
        {accounts.map((account) => (
          <Line
            key={account.name}
            type="monotone"
            dataKey={account.name}
            name={account.name}
            stroke={getAccountColor(account.name)}
            strokeWidth={1.5}
            strokeDasharray={account.type === "liability" ? "5 5" : undefined}
            dot={false}
            activeDot={{ r: 4, fill: getAccountColor(account.name) }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
