import { FACILITY_MAP, ITEM_MAP } from "@/data/loader";
import type { ProductionNode } from "@/types";
import { ChevronDown, ChevronRight, Dot } from "lucide-react";
import { useState } from "react";

interface NodeRowProps {
  node: ProductionNode;
  depth?: number;
}

const ResultsTree = ({ nodes }: { nodes: ProductionNode[] }) => {
  if (nodes.length === 0) return null;

  return (
    <div className="panel">
      <div className="panel-header">Production Plan — Data Readout</div>
      <div className="panel-body">
        <div className="space-y-0.5">
          {nodes.map((node, i) => (
            <NodeRow key={i} node={node} />
          ))}
        </div>
      </div>
    </div>
  );
};

const NodeRow = ({ node, depth = 0 }: NodeRowProps) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.dependencies && node.dependencies.length > 0;
  const item = ITEM_MAP.get(node.item.id);
  const facility = node.facility ? FACILITY_MAP.get(node.facility.id) : null;

  const nodeClass = [
    "tree-node",
    node.isRawMaterial ? "raw" : "",
    node.isTarget ? "target" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <div className={nodeClass} style={{ paddingLeft: depth * 16 + 8 }}>
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

        <span className="item-name flex-1 truncate">
          {item?.displayName ?? node.item.id}
        </span>

        {!node.isRawMaterial && (
          <>
            <span className="text-dim">→</span>
            <span className="facility-name">
              {facility?.displayName ?? node.facility?.id ?? "raw"}
            </span>
            <span className="text-dim">×</span>
            <span className="count">{node.facilityCount.toLocaleString()}</span>
          </>
        )}

        <span className="text-dim">@</span>
        <span className="rate">{node.targetRate.toLocaleString()}/min</span>
      </div>

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
