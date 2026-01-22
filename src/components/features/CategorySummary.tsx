// CategorySummary component - Expandable category summary table
import { useState } from "react";
import type { CategorySummary as CategorySummaryType } from "../../services/dashboard";
import { ChevronDown, ChevronRight } from "lucide-react";

// ============== TYPES ==============

interface CategorySummaryProps {
  categories: CategorySummaryType[];
  loading: boolean;
}

// ============== HELPERS ==============

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getCategoryTypeLabel(type: string): string {
  return type === "income" ? "Income" : "Expense";
}

function getCategoryTypeColor(type: string): string {
  return type === "income" ? "text-green-400" : "text-red-400";
}

function getDifferenceColor(difference: number | null, categoryType: string): string {
  if (difference === null) return "text-gray-500";

  // For expenses: positive difference = under budget (good), negative = over budget (bad)
  // For income: positive difference = under goal (bad), negative = over goal (good)
  if (categoryType === "expense") {
    return difference >= 0 ? "text-green-400" : "text-red-400";
  } else {
    return difference <= 0 ? "text-green-400" : "text-yellow-400";
  }
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

export function CategorySummary({ categories, loading }: CategorySummaryProps) {
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
        <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Category Summary</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-700/50"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-800/30 border-t border-gray-700/50"></div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Category Summary</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No categories found</p>
          <p className="text-sm text-gray-500 mt-2">
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
      <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Category Summary</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-10">
                {/* Expand icon */}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Goal
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Difference
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {/* Income Categories */}
            {incomeCategories.length > 0 && (
              <>
                <tr className="bg-gray-800/20">
                  <td colSpan={6} className="px-4 py-2 text-xs font-medium text-green-400 uppercase">
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
                <tr className="bg-gray-800/20">
                  <td colSpan={6} className="px-4 py-2 text-xs font-medium text-red-400 uppercase">
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
          <tfoot className="bg-gray-800/50 border-t-2 border-gray-600">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-white">
                Summary
              </td>
              <td className="px-4 py-3 text-right">
                <div className="space-y-1">
                  <div className="text-sm text-green-400">
                    Income: {formatCurrency(totalIncome)}
                  </div>
                  <div className="text-sm text-red-400">
                    Expenses: {formatCurrency(totalExpenses)}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"></td>
              <td
                className={`px-4 py-3 text-right text-sm font-bold ${
                  netIncome >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                Net: {netIncome >= 0 ? "+" : ""}{formatCurrency(netIncome)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
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
  const totalColor = category.category_type === "income" ? "text-green-400" : "text-red-400";

  return (
    <>
      {/* Main category row */}
      <tr
        className={`hover:bg-gray-800/50 ${
          hasSubcategories ? "cursor-pointer" : ""
        }`}
        onClick={hasSubcategories ? onToggle : undefined}
      >
        <td className="px-4 py-3 text-gray-400">
          {hasSubcategories && (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          )}
        </td>
        <td className={`px-4 py-3 text-sm ${getCategoryTypeColor(category.category_type)}`}>
          {getCategoryTypeLabel(category.category_type)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-200 font-medium">
          {category.category_name}
          {hasSubcategories && (
            <span className="ml-2 text-xs text-gray-500">
              ({category.subcategories.length} subcategories)
            </span>
          )}
        </td>
        <td className={`px-4 py-3 text-sm text-right font-medium ${totalColor}`}>
          {category.category_type === "income" ? "+" : ""}
          {formatCurrency(Math.abs(category.total))}
        </td>
        <td className="px-4 py-3 text-sm text-right text-gray-400">
          {category.goal !== null ? formatCurrency(category.goal) : "-"}
        </td>
        <td
          className={`px-4 py-3 text-sm text-right ${getDifferenceColor(
            category.difference,
            category.category_type
          )}`}
        >
          {getDifferenceLabel(category.difference, category.category_type)}
        </td>
      </tr>

      {/* Expanded subcategories */}
      {isExpanded && hasSubcategories && (
        <tr>
          <td colSpan={6} className="px-0 py-0">
            <div className="bg-gray-900/50 border-y border-gray-700/50">
              <table className="min-w-full">
                <thead className="bg-gray-800/20">
                  <tr>
                    <th className="px-8 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10">
                      {/* Spacer */}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {/* Type spacer */}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Subcategory
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Goal
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Difference
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {category.subcategories.map((subcategory) => {
                    const subTotalColor =
                      category.category_type === "income" ? "text-green-400" : "text-red-400";

                    return (
                      <tr key={subcategory.subcategory_id} className="hover:bg-gray-800/20">
                        <td className="px-8 py-2">
                          {/* Spacer */}
                        </td>
                        <td className="px-4 py-2">
                          {/* Type spacer */}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-300">
                          {subcategory.subcategory_name}
                        </td>
                        <td className={`px-4 py-2 text-sm text-right ${subTotalColor}`}>
                          {category.category_type === "income" ? "+" : ""}
                          {formatCurrency(Math.abs(subcategory.total))}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-400">
                          {subcategory.goal !== null ? formatCurrency(subcategory.goal) : "-"}
                        </td>
                        <td
                          className={`px-4 py-2 text-sm text-right ${getDifferenceColor(
                            subcategory.difference,
                            category.category_type
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
