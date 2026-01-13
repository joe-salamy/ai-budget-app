// SankeyDiagram - Cash flow visualization using @nivo/sankey
import { ResponsiveSankey } from "@nivo/sankey";
import type { SankeyData } from "../../services/charts";

interface SankeyDiagramProps {
  data: SankeyData;
  loading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Extract display name from node ID
// Node IDs are formatted like "Income:Salary:Base Pay" or "Total Income"
function getDisplayName(nodeId: string): string {
  const parts = nodeId.split(":");
  if (parts.length === 1) {
    return nodeId; // "Total Income", "Total Expenses", "Savings"
  }
  if (parts.length === 2) {
    return parts[1]; // Category name
  }
  return parts[parts.length - 1]; // Subcategory name
}

interface CustomNodeProps {
  node: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    label: string;
  };
}

function CustomNodeTooltip({ node }: CustomNodeProps) {
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 shadow-lg">
      <span className="text-white font-medium">{getDisplayName(node.id)}</span>
    </div>
  );
}

interface CustomLinkProps {
  link: {
    source: { id: string };
    target: { id: string };
    value: number;
    color: string;
  };
}

function CustomLinkTooltip({ link }: CustomLinkProps) {
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-300">{getDisplayName(link.source.id)}</span>
        <span className="text-gray-500">→</span>
        <span className="text-gray-300">{getDisplayName(link.target.id)}</span>
      </div>
      <div className="text-white font-medium mt-1">
        {formatCurrency(link.value)}
      </div>
    </div>
  );
}

export function SankeyDiagram({ data, loading }: SankeyDiagramProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data || data.nodes.length === 0 || data.links.length === 0) {
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
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          <p className="text-gray-400">No cash flow data</p>
          <p className="text-sm text-gray-500">
            Add categorized transactions to see your cash flow
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: 320 }}>
      <ResponsiveSankey
        data={data}
        margin={{ top: 20, right: 140, bottom: 20, left: 140 }}
        align="justify"
        colors={(node) => node.nodeColor || "#4b5563"}
        nodeOpacity={1}
        nodeHoverOpacity={1}
        nodeHoverOthersOpacity={0.35}
        nodeThickness={18}
        nodeSpacing={24}
        nodeBorderWidth={0}
        nodeBorderRadius={3}
        linkOpacity={0.5}
        linkHoverOpacity={0.8}
        linkHoverOthersOpacity={0.1}
        linkContract={3}
        enableLinkGradient={true}
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={12}
        labelTextColor="#9ca3af"
        label={(node) => getDisplayName(node.id)}
        nodeTooltip={CustomNodeTooltip}
        linkTooltip={CustomLinkTooltip}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}
