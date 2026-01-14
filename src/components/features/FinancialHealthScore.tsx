// FinancialHealthScore - Visual display of financial health with breakdown and history
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { calculateFinancialHealthScore, getScoreHistory } from "../../services/scoring";
import type { HealthScoreResult, ScoreHistoryPoint } from "../../services/scoring";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";

// ============== TYPES ==============

interface FinancialHealthScoreProps {
  startDate: string;
  endDate: string;
}

// ============== HELPER FUNCTIONS ==============

function getScoreColor(score: number): string {
  if (score <= 40) return "#ef4444"; // red-500
  if (score <= 70) return "#eab308"; // yellow-500
  return "#22c55e"; // green-500
}

function getScoreLabel(score: number): string {
  if (score <= 40) return "Needs Attention";
  if (score <= 70) return "Good";
  return "Excellent";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============== CIRCULAR PROGRESS COMPONENT ==============

function CircularProgress({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Score text in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-sm text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

// ============== SCORE FACTOR ROW COMPONENT ==============

interface ScoreFactorProps {
  label: string;
  score: number;
  maxScore: number;
  details: string;
  icon: string;
}

function ScoreFactor({ label, score, maxScore, details, icon }: ScoreFactorProps) {
  const percentage = (score / maxScore) * 100;
  const barColor = getScoreColor((percentage / 100) * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-gray-300">{label}</span>
        </div>
        <span className="text-sm font-semibold" style={{ color: barColor }}>
          {score}/{maxScore}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
      <p className="text-xs text-gray-500">{details}</p>
    </div>
  );
}

// ============== HISTORY CHART COMPONENT ==============

interface HistoryChartProps {
  data: ScoreHistoryPoint[];
  loading: boolean;
}

function HistoryChart({ data, loading }: HistoryChartProps) {
  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading history...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Not enough data for history</p>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((point) => ({
    date: format(parseISO(point.date), "MMM"),
    score: point.score,
  }));

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 10 }}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 10 }}
            width={25}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "0.375rem",
              color: "#fff",
            }}
            formatter={(value) => [`${value}`, "Score"]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: "#22c55e", strokeWidth: 0, r: 3 }}
            activeDot={{ fill: "#22c55e", strokeWidth: 0, r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============== MAIN COMPONENT ==============

export function FinancialHealthScore({ startDate, endDate }: FinancialHealthScoreProps) {
  const [scoreData, setScoreData] = useState<HealthScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const [history, setHistory] = useState<ScoreHistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch score data
  const fetchScore = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await calculateFinancialHealthScore(startDate, endDate);

    if (result.success && result.data) {
      setScoreData(result.data);
    } else {
      setError(result.error || "Failed to calculate score");
    }

    setLoading(false);
  }, [startDate, endDate]);

  // Fetch history data
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);

    const result = await getScoreHistory(6);

    if (result.success && result.data) {
      setHistory(result.data);
    }

    setHistoryLoading(false);
  }, []);

  // Load data on mount and when dates change
  useEffect(() => {
    fetchScore();
    fetchHistory();
  }, [fetchScore, fetchHistory]);

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Financial Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-40 h-40 rounded-full border-4 border-gray-700 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="text-3xl font-bold text-gray-500">--</span>
              </div>
              <p className="text-gray-400">Calculating...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !scoreData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Financial Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-40 h-40 rounded-full border-4 border-gray-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-gray-400">--</span>
              </div>
              <p className="text-red-400">{error || "Unable to calculate score"}</p>
              <p className="text-sm text-gray-500 mt-1">Try adding more transactions and goals</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totalScore, breakdown, tips } = scoreData;
  const scoreColor = getScoreColor(totalScore);
  const scoreLabel = getScoreLabel(totalScore);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Financial Health Score</CardTitle>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showBreakdown ? "Hide Details" : "Show Details"}
        </button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Score Display */}
          <div className="flex flex-col items-center">
            <CircularProgress score={totalScore} />
            <p className="mt-2 text-lg font-semibold" style={{ color: scoreColor }}>
              {scoreLabel}
            </p>
            <p className="text-sm text-gray-500">For selected period</p>
          </div>

          {/* Score Breakdown (when expanded) */}
          {showBreakdown && (
            <div className="flex-1 space-y-4">
              <ScoreFactor
                label="Spending vs Goals"
                score={breakdown.spendingVsGoals.score}
                maxScore={breakdown.spendingVsGoals.maxScore}
                details={breakdown.spendingVsGoals.details}
                icon="💰"
              />
              <ScoreFactor
                label="Savings Rate"
                score={breakdown.savingsRate.score}
                maxScore={breakdown.savingsRate.maxScore}
                details={breakdown.savingsRate.details}
                icon="📊"
              />
              <ScoreFactor
                label="Saving Goals Progress"
                score={breakdown.savingGoalsProgress.score}
                maxScore={breakdown.savingGoalsProgress.maxScore}
                details={breakdown.savingGoalsProgress.details}
                icon="🎯"
              />
              <ScoreFactor
                label="Net Worth Trend"
                score={breakdown.netWorthTrend.score}
                maxScore={breakdown.netWorthTrend.maxScore}
                details={
                  breakdown.netWorthTrend.changeAmount !== 0
                    ? `${breakdown.netWorthTrend.details} (${formatCurrency(breakdown.netWorthTrend.changeAmount)})`
                    : breakdown.netWorthTrend.details
                }
                icon="📈"
              />
            </div>
          )}

          {/* Tips and History (when collapsed) */}
          {!showBreakdown && (
            <div className="flex-1 flex flex-col gap-4">
              {/* Quick Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Spending</p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: getScoreColor((breakdown.spendingVsGoals.score / 40) * 100) }}
                  >
                    {breakdown.spendingVsGoals.score}/40
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Savings</p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: getScoreColor((breakdown.savingsRate.score / 30) * 100) }}
                  >
                    {breakdown.savingsRate.score}/30
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Goals</p>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: getScoreColor((breakdown.savingGoalsProgress.score / 20) * 100),
                    }}
                  >
                    {breakdown.savingGoalsProgress.score}/20
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Net Worth</p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: getScoreColor((breakdown.netWorthTrend.score / 10) * 100) }}
                  >
                    {breakdown.netWorthTrend.score}/10
                  </p>
                </div>
              </div>

              {/* Tips */}
              {tips.length > 0 && (
                <div className="bg-gray-800/30 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-2">Tips for Improvement</p>
                  <ul className="space-y-1">
                    {tips.map((tip, index) => (
                      <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">*</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* History Chart */}
        {showBreakdown && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Score History (Last 6 Months)</p>
            <HistoryChart data={history} loading={historyLoading} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
