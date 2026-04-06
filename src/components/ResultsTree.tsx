import { FACILITY_MAP, ITEM_MAP } from "@/data/loader";
import type { ProductionNode } from "@/types";
import { ChevronDown, ChevronRight, Dot } from "lucide-react";
import { useState } from "react";

const MAX_VISUAL_DEPTH = 2;

const ResultsTree = ({ nodes }: { nodes: ProductionNode[] }) => {
  if (nodes.length === 0) return null;

  return (
    <div className="panel">
      <div className="panel-header">Production Plan — Data Readout</div>
      <div className="panel-body">
        <div className="space-y-0.5">
          {nodes.map((node, i) => (
            <NodeRow key={i} node={node} depth={0} />
          ))}
        </div>
      </div>
    </div>
  );
};

const NodeRow = ({
  node,
  depth = 0,
}: {
  node: ProductionNode;
  depth?: number;
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.dependencies && node.dependencies.length > 0;
  const item = ITEM_MAP.get(node.item.id);
  const facility = node.facility ? FACILITY_MAP.get(node.facility.id) : null;
  const isExternal = node.isExternalSupply;

  // Cap visual indentation to prevent horizontal squeeze at deep levels
  const visualDepth = Math.min(depth, MAX_VISUAL_DEPTH);

  const nodeClass = [
    "tree-node",
    node.isRawMaterial ? "raw" : "",
    node.isTarget ? "target" : "",
    isExternal ? "external" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const utilPct =
    node.utilization !== undefined && !isNaN(node.utilization)
      ? Math.round(node.utilization * 100)
      : null;
  const overVal =
    node.overproductionRate !== undefined && node.overproductionRate > 0.01
      ? node.overproductionRate.toFixed(2)
      : null;

  const hasMetrics =
    !node.isRawMaterial &&
    node.exactFacilityCount !== undefined &&
    (utilPct !== null || overVal !== null);

  return (
    <div className="tree-node-wrapper">
      <div className={nodeClass} style={{ paddingLeft: visualDepth * 16 + 8 }}>
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-4 h-4 flex items-center justify-center text-text-muted hover:text-accent transition-colors shrink-0"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" strokeWidth={2} />
            ) : (
              <ChevronRight className="w-4 h-4" strokeWidth={2} />
            )}
          </button>
        ) : (
          <span className="w-4 flex items-center justify-center text-dim shrink-0">
            <Dot className="w-4 h-4" strokeWidth={3} />
          </span>
        )}

        {/* Primary row: item name */}
        <div className="node-primary">
          <span className="item-name">
            {item?.displayName ?? node.item.id}
          </span>
          {depth > MAX_VISUAL_DEPTH && (
            <span className="depth-badge">·{depth - MAX_VISUAL_DEPTH}·</span>
          )}
        </div>
      </div>

      {/* Secondary row: facility / count / rate / metrics */}
      {!node.isRawMaterial && (
        <div
          className="tree-node-secondary"
          style={{ paddingLeft: visualDepth * 16 + 8 + 24 }}
        >
          <span className="node-facility">
            {isExternal
              ? `[imported]`
              : `→ ${facility?.displayName ?? node.facility?.id ?? "?"}`}
          </span>
          <span className="node-count font-display text-accent">
            ×{node.facilityCount}
          </span>
          <span className="node-rate">@ {node.targetRate.toFixed(2)}/min</span>
          {hasMetrics && (
            <div className="node-metrics">
              <span className="metric-chip metric-exact">
                {(node.exactFacilityCount ?? 0).toFixed(2)} exact
              </span>
              {utilPct !== null && (
                <span className="metric-chip metric-util">
                  {utilPct}% util
                </span>
              )}
              {overVal !== null && (
                <span className="metric-chip metric-over">
                  +{overVal} over
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {node.isRawMaterial && (
        <div
          className="tree-node-secondary"
          style={{ paddingLeft: visualDepth * 16 + 8 + 24 }}
        >
          <span className="node-rate">@ {node.targetRate.toFixed(2)}/min</span>
          {isExternal && (
            <span className="node-facility text-accent/60">[imported]</span>
          )}
        </div>
      )}

      {hasChildren && (
        <div className={`tree-children ${expanded ? "expanded" : ""}`}>
          <div className="tree-children-inner">
            <div className="border-l border-border ml-6">
              {node.dependencies!.map((child, i) => (
                <NodeRow key={i} node={child} depth={depth + 1} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsTree;