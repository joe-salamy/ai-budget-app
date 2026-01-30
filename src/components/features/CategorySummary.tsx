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

function getDifferenceColor(difference: number | null): string {
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
      <div className="rounded-lg border border-border bg-card overflow-hidden hover:border-foreground/30 hover:shadow-lg">
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
      <div className="rounded-lg border border-border bg-card overflow-hidden hover:border-foreground/30 hover:shadow-lg">
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

  // Group categories by type and sort alphabetically
  const incomeCategories = categories
    .filter((c) => c.category_type === "income")
    .sort((a, b) => a.category_name.localeCompare(b.category_name));
  const expenseCategories = categories
    .filter((c) => c.category_type === "expense")
    .sort((a, b) => a.category_name.localeCompare(b.category_name));

  // Calculate totals
  const totalIncome = incomeCategories.reduce((sum, c) => sum + c.total, 0);
  const totalExpenses = expenseCategories.reduce((sum, c) => sum + Math.abs(c.total), 0);
  const netIncome = totalIncome - totalExpenses;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden hover:border-foreground/30 hover:shadow-lg">
      <div className="px-4 py-3 bg-card/50 border-b border-border">
        <h3 className="text-lg font-semibold text-white">Category Summary</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700 table-fixed">
          <thead className="bg-card/30">
            <tr>
              <th className="w-[4%] px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {/* Expand icon */}
              </th>
              <th className="w-[26%] px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Category
              </th>
              <th className="w-[14%] px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Subcategories
              </th>
              <th className="w-[19%] px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total
              </th>
              <th className="w-[18%] px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Goal
              </th>
              <th className="w-[19%] px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
        <td className="w-[4%] px-4 py-3 text-muted-foreground">
          {hasSubcategories &&
            (isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            ))}
        </td>
        <td className="w-[26%] px-4 py-3 text-sm text-gray-200 font-medium">
          {category.category_name}
        </td>
        <td className="w-[14%] px-4 py-3 text-sm text-center text-muted-foreground">
          {hasSubcategories ? category.subcategories.length : "-"}
        </td>
        <td className={`w-[19%] px-4 py-3 text-sm text-right font-medium ${totalColor}`}>
          {category.category_type === "income" ? "+" : ""}
          {formatCurrency(Math.abs(category.total))}
        </td>
        <td className="w-[18%] px-4 py-3 text-sm text-right text-muted-foreground">
          {category.goal !== null ? formatCurrency(category.goal) : "-"}
        </td>
        <td
          className={`w-[19%] px-4 py-3 text-sm text-right ${getDifferenceColor(category.difference)}`}
        >
          {getDifferenceLabel(category.difference, category.category_type)}
        </td>
      </tr>

      {/* Expanded subcategories */}
      {isExpanded && hasSubcategories && (
        <tr>
          <td colSpan={6} className="px-0 py-0">
            <div className="bg-background/50 border-y border-border/50">
              <table className="min-w-full table-fixed">
                <thead className="bg-card/20">
                  <tr>
                    <th className="w-[4%] px-8 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                      {/* Spacer */}
                    </th>
                    <th className="w-[40%] px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                      Subcategory
                    </th>
                    <th className="w-[19%] px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">
                      Total
                    </th>
                    <th className="w-[18%] px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">
                      Goal
                    </th>
                    <th className="w-[19%] px-4 py-2 text-right text-xs font-medium text-muted-foreground uppercase">
                      Difference
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {category.subcategories
                    .slice()
                    .sort((a, b) => a.subcategory_name.localeCompare(b.subcategory_name))
                    .map((subcategory) => {
                      const subTotalColor = "text-foreground";

                      return (
                        <tr key={subcategory.subcategory_id} className="hover:bg-card/20">
                          <td className="w-[4%] px-8 py-2">{/* Spacer */}</td>
                          <td className="w-[40%] px-4 py-2 text-sm text-foreground">
                            {subcategory.subcategory_name}
                          </td>
                          <td className={`w-[19%] px-4 py-2 text-sm text-right ${subTotalColor}`}>
                            {category.category_type === "income" ? "+" : ""}
                            {formatCurrency(Math.abs(subcategory.total))}
                          </td>
                          <td className="w-[18%] px-4 py-2 text-sm text-right text-muted-foreground">
                            {subcategory.goal !== null ? formatCurrency(subcategory.goal) : "-"}
                          </td>
                          <td
                            className={`w-[19%] px-4 py-2 text-sm text-right ${getDifferenceColor(
                              subcategory.difference
                            )}`}
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
