import { FACILITY_MAP, ITEM_MAP } from "@/data/loader";
import type { ProductionNode } from "@/types";
import { useState } from "react";
import { Toggle } from "./ui/Accordion";

interface NodeRowProps {
  node: ProductionNode;
  depth?: number;
}

const ResultsTree = ({ nodes }: { nodes: ProductionNode[] }) => {
  if (nodes.length === 0) return null;

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">
        Production Plan
      </h2>
      <div className="space-y-1">
        {nodes.map((node, i) => (
          <NodeRow key={i} node={node} />
        ))}
      </div>
    </div>
  );
};

const NodeRow = ({ node, depth = 0 }: NodeRowProps) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.dependencies && node.dependencies.length > 0;
  const item = ITEM_MAP.get(node.item.id);
  const facility = node.facility ? FACILITY_MAP.get(node.facility.id) : null;

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div className="flex items-center gap-3, py-2 group">
        {hasChildren ? (
          <Toggle expanded={expanded} onClick={() => setExpanded(!expanded)} />
        ) : (
          <span className="w-6" />
        )}
        <span className="font-mono text-accent-primary text-sm">
          {item?.id ?? node.item.id}
        </span>
        <span className="text-gray-600">→</span>
        <span className="font-mono text-blue-400 text-sm">
          {facility?.id ?? node.facility?.id ?? "raw"}
        </span>
        <span className="text-gray-600">×</span>
        <span className="font-mono text-green-400 font-semibold">
          {node.facilityCount.toLocaleString()}
        </span>
        <span className="text-gray-600">@</span>
        <span className="font-mono text-yellow-400">
          {node.targetRate.toLocaleString()}/min
        </span>
      </div>
      {hasChildren && expanded && (
        <div className="ml-4 border-l border-gray-700 pl-2">
          {node.dependencies!.map((child, i) => (
            <NodeRow key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsTree;
