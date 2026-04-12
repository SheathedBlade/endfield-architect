import type { ProductionNode } from "@/types";
import { memo, useState } from "react";
import { ChevronDown, Dot } from "lucide-react";
import { FACILITY_MAP, ITEM_MAP } from "@/data/loader";
import { ItemIconSlot } from "./ItemIconSlot";

interface DependencyTreeProps {
  node: ProductionNode;
  depth: number;
  compact: boolean;
  initiallyExpanded?: boolean;
}

const MAX_VISUAL_DEPTH = 2;

export const DependencyTree = memo(function DependencyTree({
  node,
  depth = 0,
  compact = true,
  initiallyExpanded = false,
}: DependencyTreeProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const item = ITEM_MAP.get(node.item.id);
  const facility = node.facility ? FACILITY_MAP.get(node.facility.id) : null;

  const visualDepth = Math.min(depth, MAX_VISUAL_DEPTH);
  const hasChildren = node.dependencies && node.dependencies.length > 0;

  const utilPct =
    node.utilization !== undefined && !isNaN(node.utilization)
      ? Math.round(node.utilization * 100)
      : null;
  const overVal =
    node.overproductionRate !== undefined && node.overproductionRate > 0.01
      ? node.overproductionRate.toFixed(2)
      : null;

  const hasMetrics =
    !compact &&
    !node.isRawMaterial &&
    node.exactFacilityCount !== undefined &&
    (utilPct !== null || overVal !== null);

  const nodeClass = [
    "tree-node",
    node.isRawMaterial ? "raw" : "",
    node.isTarget ? "target" : "",
    node.isExternalSupply ? "external" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const primaryPaddingLeft = visualDepth * 16 + 8;
  const secondaryPaddingLeft = visualDepth * 16 + 8 + 24;

  return (
    <div className="tree-node-wrapper">
      <button
        type="button"
        className={`tree-node ${nodeClass}`}
        style={{ paddingLeft: primaryPaddingLeft, width: "100%", textAlign: "left" }}
        onClick={() => hasChildren && setExpanded((p) => !p)}
        aria-expanded={hasChildren ? expanded : undefined}
        aria-label={hasChildren ? (expanded ? "Collapse" : "Expand") : undefined}
      >
        {hasChildren ? (
          <ChevronDown
            className="w-4 h-4 shrink-0 transition-transform duration-200"
            style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
            strokeWidth={2}
          />
        ) : (
          <span className="tree-leaf-dot">
            <Dot className="w-4 h-4" strokeWidth={3} />
          </span>
        )}
        <ItemIconSlot itemId={node.item.id} size="sm" />
        <span className="node-primary">
          <span className="item-name">
            {item?.displayName ?? node.item.id}
          </span>
          {depth > MAX_VISUAL_DEPTH && (
            <span className="depth-badge">·{depth - MAX_VISUAL_DEPTH}·</span>
          )}
        </span>
      </button>

      {!node.isRawMaterial && (
        <div className="tree-node-secondary" style={{ paddingLeft: secondaryPaddingLeft }}>
          <span className="node-facility">
            {node.isExternalSupply
              ? `[imported]`
              : `→ ${facility?.displayName ?? node.facility?.id ?? "?"}`}
          </span>
          <span className="node-count">×{node.facilityCount}</span>
          <span className="node-rate">@ {node.targetRate.toFixed(2)}/min</span>
          {hasMetrics && (
            <div className="node-metrics">
              <span className="metric-chip metric-exact" title="Exact facility count">
                {(node.exactFacilityCount ?? 0).toFixed(2)} fx
              </span>
              {utilPct !== null && (
                <span className="metric-chip metric-util" title="Facility utilization">
                  {utilPct}% util
                </span>
              )}
              {overVal !== null && (
                <span className="metric-chip metric-over" title="Excess production rate">
                  +{overVal} excess
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {node.isRawMaterial && (
        <div className="tree-node-secondary" style={{ paddingLeft: secondaryPaddingLeft }}>
          <span className="node-rate">@ {node.targetRate.toFixed(2)}/min</span>
          {node.isExternalSupply && (
            <span className="node-facility text-accent/60">[imported]</span>
          )}
        </div>
      )}

      {hasChildren && (
        <div className={`tree-children ${expanded ? "expanded" : ""}`}>
          <div className="tree-children-inner">
            <div className="border-l border-border ml-6">
              {node.dependencies!.map((child, i) => (
                <DependencyTree
                  key={i}
                  node={child}
                  depth={depth + 1}
                  compact={compact}
                  initiallyExpanded={expanded}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
