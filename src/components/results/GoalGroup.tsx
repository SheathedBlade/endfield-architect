import type { ProductionNode } from "@/types";
import { memo, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { FACILITY_MAP, ITEM_MAP } from "@/data/loader";
import { DependencyTree } from "./DependencyTree";
import { ItemIconSlot } from "./ItemIconSlot";

interface GoalGroupProps {
  node: ProductionNode;
  compact: boolean;
}

export const GoalGroup = memo(function GoalGroup({
  node,
  compact,
}: GoalGroupProps) {
  const [showChain, setShowChain] = useState(false);

  const item = ITEM_MAP.get(node.item.id);
  const facility = node.facility ? FACILITY_MAP.get(node.facility.id) : null;

  const rawDeps = useMemo(
    () => node.dependencies?.filter((d) => d.isRawMaterial) ?? [],
    [node.dependencies],
  );

  return (
    <div className="goal-group">
      <div className="goal-group-header">
        <div className="goal-group-identity">
          <ItemIconSlot itemId={node.item.id} size="lg" />
          <span className="goal-item-name">{item?.displayName ?? node.item.id}</span>
        </div>
        <div className="goal-group-meta">
          <span className="goal-facility">
            {facility?.displayName ?? node.facility?.id ?? "—"}
          </span>
          <span className="goal-count">×{node.facilityCount}</span>
          <span className="goal-rate">@ {node.targetRate.toFixed(2)}/min</span>
        </div>
      </div>

      {rawDeps.length > 0 && (
        <div className="goal-group-raws">
          <span className="goal-raws-label">Requires:</span>
          {rawDeps.map((raw, i) => (
            <span key={i} className="goal-raw-chip">
              {ITEM_MAP.get(raw.item.id)?.displayName ?? raw.item.id}
              <span className="goal-raw-rate"> @ {raw.targetRate.toFixed(2)}/min</span>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        className="goal-chain-toggle"
        onClick={() => setShowChain((s) => !s)}
        aria-expanded={showChain}
      >
        <ChevronDown
          className="w-3.5 h-3.5 transition-transform duration-200"
          style={{ transform: showChain ? "rotate(0deg)" : "rotate(-90deg)" }}
          strokeWidth={2}
        />
        <span>{showChain ? "Hide" : "Show"} full chain</span>
      </button>

      {node.dependencies && node.dependencies.length > 0 && (
        <div className={`goal-chain ${showChain ? "expanded" : ""}`}>
          <div className="goal-chain-inner">
            {node.dependencies.map((child, i) => (
              <DependencyTree
                key={i}
                node={child}
                depth={1}
                compact={compact}
                initiallyExpanded={showChain}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
