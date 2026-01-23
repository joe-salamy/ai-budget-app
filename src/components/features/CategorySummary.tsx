// CategorySummary component - Expandable category summary table
import { useState } from "react";
import type { CategorySummary as CategorySummaryType } from "../../services/dashboard";
import { ChevronDown, ChevronRight } from "lucide-react";

// ============== TYPES ==============

interface CategorySummaryProps {
  categories: CategorySummaryType[];
  loading: boolean;
  hasUncategorizedTransactions?: boolean;
}

// ============== HELPERS ==============

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getDifferenceColor(difference: number | null, categoryType: string): string {
  if (difference === null) return "text-muted-foreground";

  // For expenses: positive difference = under budget (good), negative = over budget (bad)
  // For income: positive difference = under goal (bad), negative = over goal (good)
  return "text-foreground";
}

function getDifferenceLabel(difference: number | null, categoryType: string): string {
  if (difference === null) return "-";

  if (categoryType === "expense") {
    if (difference > 0) return `${formatCurrency(difference)} under`;
    if (difference < 0) return `${formatCurrency(Math.abs(difference))} over`;
    return "On budget";
  } else {
    if (difference < 0) return `${formatCurrency(Math.abs(difference))} over`;
    if (difference > 0) return `${formatCurrency(difference)} under`;
    return "On target";
  }
}

// ============== MAIN COMPONENT ==============

export function CategorySummary({
  categories,
  loading,
  hasUncategorizedTransactions = false,
}: CategorySummaryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 bg-card/50 border-b border-border">
          <h3 className="text-lg font-semibold text-white">Category Summary</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-12 bg-muted/50"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-card/30 border-t border-border/50"></div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 bg-card/50 border-b border-border">
          <h3 className="text-lg font-semibold text-white">Category Summary</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No categories found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Add some categories to see your summary
          </p>
        </div>
      </div>
    );
  }

  // Group categories by type
  const incomeCategories = categories.filter((c) => c.category_type === "income");
  const expenseCategories = categories.filter((c) => c.category_type === "expense");

  // Calculate totals
  const totalIncome = incomeCategories.reduce((sum, c) => sum + c.total, 0);
  const totalExpenses = expenseCategories.reduce((sum, c) => sum + Math.abs(c.total), 0);
  const netIncome = totalIncome - totalExpenses;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 bg-card/50 border-b border-border">
        <h3 className="text-lg font-semibold text-white">Category Summary</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700" style={{ tableLayout: "fixed" }}>
          <thead className="bg-card/30">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                style={{ width: "4%" }}
              >
                {/* Expand icon */}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                style={{ width: "26%" }}
              >
                Category
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
                style={{ width: "14%" }}
              >
                Subcategories
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
                style={{ width: "19%" }}
              >
                Total
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
                style={{ width: "18%" }}
              >
                Goal
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
                style={{ width: "19%" }}
              >
                Difference
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {/* Income Categories */}
            {incomeCategories.length > 0 && (
              <>
                <tr className="bg-card/20">
                  <td
                    colSpan={6}
                    className="px-4 py-2 text-xs font-medium text-foreground uppercase"
                  >
                    Income
                  </td>
                </tr>
                {incomeCategories.map((category) => (
                  <CategoryRow
                    key={category.category_id}
                    category={category}
                    isExpanded={expandedCategories.has(category.category_id)}
                    onToggle={() => toggleCategory(category.category_id)}
                  />
                ))}
              </>
            )}

            {/* Expense Categories */}
            {expenseCategories.length > 0 && (
              <>
                <tr className="bg-card/20">
                  <td
                    colSpan={6}
                    className="px-4 py-2 text-xs font-medium text-foreground uppercase"
                  >
                    Expenses
                  </td>
                </tr>
                {expenseCategories.map((category) => (
                  <CategoryRow
                    key={category.category_id}
                    category={category}
                    isExpanded={expandedCategories.has(category.category_id)}
                    onToggle={() => toggleCategory(category.category_id)}
                  />
                ))}
              </>
            )}
          </tbody>

          {/* Totals Footer */}
          <tfoot className="bg-card/50 border-t-2 border-border">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-white">
                Summary
              </td>
              <td className="px-4 py-3 text-right">
                <div className="space-y-1">
                  <div className="text-sm text-foreground">
                    Income: {formatCurrency(totalIncome)}
                  </div>
                  <div className="text-sm text-foreground">
                    Expenses: {formatCurrency(totalExpenses)}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3 text-right text-sm font-bold text-foreground">
                Net{hasUncategorizedTransactions ? "*" : ""}: {netIncome >= 0 ? "+" : ""}
                {formatCurrency(netIncome)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {hasUncategorizedTransactions && (
        <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border/50">
          * Net amount only includes categorized transactions. The Net Change card includes all
          transactions.
        </div>
      )}
    </div>
  );
}

// ============== CATEGORY ROW COMPONENT ==============

interface CategoryRowProps {
  category: CategorySummaryType;
  isExpanded: boolean;
  onToggle: () => void;
}

function CategoryRow({ category, isExpanded, onToggle }: CategoryRowProps) {
  const hasSubcategories = category.subcategories.length > 0;
  const totalColor = "text-foreground";

  return (
    <>
      {/* Main category row */}
      <tr
        className={`hover:bg-card/50 ${hasSubcategories ? "cursor-pointer" : ""}`}
        onClick={hasSubcategories ? onToggle : undefined}
      >
        <td className="px-4 py-3 text-muted-foreground" style={{ width: "4%" }}>
          {hasSubcategories &&
            (isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            ))}
        </td>
        <td className="px-4 py-3 text-sm text-gray-200 font-medium" style={{ width: "26%" }}>
          {category.category_name}
        </td>
        <td
          className="px-4 py-3 text-sm text-center text-muted-foreground"
          style={{ width: "14%" }}
        >
          {hasSubcategories ? category.subcategories.length : "-"}
        </td>
        <td
          className={`px-4 py-3 text-sm text-right font-medium ${totalColor}`}
          style={{ width: "19%" }}
        >
          {category.category_type === "income" ? "+" : ""}
          {formatCurrency(Math.abs(category.total))}
        </td>
        <td className="px-4 py-3 text-sm text-right text-muted-foreground" style={{ width: "18%" }}>
          {category.goal !== null ? formatCurrency(category.goal) : "-"}
        </td>
        <td
          className={`px-4 py-3 text-sm text-right ${getDifferenceColor(
            category.difference,
            category.category_type
          )}`}
          style={{ width: "19%" }}
        >
          {getDifferenceLabel(category.difference, category.category_type)}
        </td>
      </tr>

      {/* Expanded subcategories */}
      {isExpanded && hasSubcategories && (
        <tr>
          <td colSpan={6} className="px-0 py-0">
            <div className="bg-background/50 border-y border-border/50">
              <table className="min-w-full" style={{ tableLayout: "fixed" }}>
                <thead className="bg-card/20">
                  <tr>
                    <th
                      className="px-8 py-2 text-left text-xs font-medium text-muted-foreground uppercase"
                      style={{ width: "4%" }}
                    >
                      {/* Spacer */}
                    </th>
                    <th
                      className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase"
                      style={{ width: "40%" }}
                    >
                      Subcategory
                    </th>
                    <th
                      className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase"
                      style={{ width: "19%" }}
                    >
                      Total
                    </th>
                    <th
                      className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase"
                      style={{ width: "18%" }}
                    >
                      Goal
                    </th>
                    <th
                      className="px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase"
                      style={{ width: "19%" }}
                    >
                      Difference
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {category.subcategories.map((subcategory) => {
                    const subTotalColor = "text-foreground";

                    return (
                      <tr key={subcategory.subcategory_id} className="hover:bg-card/20">
                        <td className="px-8 py-2" style={{ width: "4%" }}>
                          {/* Spacer */}
                        </td>
                        <td className="px-4 py-2 text-sm text-foreground" style={{ width: "40%" }}>
                          {subcategory.subcategory_name}
                        </td>
                        <td
                          className={`px-4 py-2 text-sm text-right ${subTotalColor}`}
                          style={{ width: "19%" }}
                        >
                          {category.category_type === "income" ? "+" : ""}
                          {formatCurrency(Math.abs(subcategory.total))}
                        </td>
                        <td
                          className="px-4 py-2 text-sm text-right text-muted-foreground"
                          style={{ width: "18%" }}
                        >
                          {subcategory.goal !== null ? formatCurrency(subcategory.goal) : "-"}
                        </td>
                        <td
                          className={`px-4 py-2 text-sm text-right ${getDifferenceColor(
                            subcategory.difference,
                            category.category_type
                          )}`}
                          style={{ width: "19%" }}
                        >
                          {getDifferenceLabel(subcategory.difference, category.category_type)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
