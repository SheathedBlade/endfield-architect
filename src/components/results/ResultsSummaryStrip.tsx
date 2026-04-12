import type { ProductionNode } from "@/types";
import { memo, useMemo } from "react";

interface ResultsSummaryStripProps {
  nodes: ProductionNode[];
}

export const ResultsSummaryStrip = memo(function ResultsSummaryStrip({
  nodes,
}: ResultsSummaryStripProps) {
  const stats = useMemo(() => {
    const topTargets = nodes.filter((n) => n.isTarget);
    const allRaw = collectRawMaterials(nodes);
    const allExternal = collectExternalSupplies(nodes);
    const allFacilities = collectFacilities(nodes);

    return {
      targetCount: topTargets.length,
      facilityCount: allFacilities.size,
      rawCount: allRaw.length,
      externalCount: allExternal.length,
    };
  }, [nodes]);

  return (
    <div className="summary-strip">
      <div className="summary-stat">
        <span className="summary-stat-value">{stats.targetCount}</span>
        <span className="summary-stat-label">Target{stats.targetCount !== 1 ? "s" : ""}</span>
      </div>
      <div className="summary-divider" />
      <div className="summary-stat">
        <span className="summary-stat-value">{stats.facilityCount}</span>
        <span className="summary-stat-label">Facility{stats.facilityCount !== 1 ? " Types" : ""}</span>
      </div>
      <div className="summary-divider" />
      <div className="summary-stat">
        <span className="summary-stat-value">{stats.rawCount}</span>
        <span className="summary-stat-label">Raw Input{stats.rawCount !== 1 ? "s" : ""}</span>
      </div>
      {stats.externalCount > 0 && (
        <>
          <div className="summary-divider" />
          <div className="summary-stat">
            <span className="summary-stat-value">{stats.externalCount}</span>
            <span className="summary-stat-label">Imported</span>
          </div>
        </>
      )}
    </div>
  );
});

function collectRawMaterials(nodes: ProductionNode[]): ProductionNode[] {
  const raw: ProductionNode[] = [];
  function walk(node: ProductionNode) {
    if (node.isRawMaterial) raw.push(node);
    node.dependencies?.forEach(walk);
  }
  nodes.forEach(walk);
  return raw;
}

function collectExternalSupplies(nodes: ProductionNode[]): ProductionNode[] {
  const ext: ProductionNode[] = [];
  function walk(node: ProductionNode) {
    if (node.isExternalSupply) ext.push(node);
    node.dependencies?.forEach(walk);
  }
  nodes.forEach(walk);
  return ext;
}

function collectFacilities(nodes: ProductionNode[]): Set<string> {
  const facs = new Set<string>();
  function walk(node: ProductionNode) {
    if (node.facility) facs.add(node.facility.id);
    node.dependencies?.forEach(walk);
  }
  nodes.forEach(walk);
  return facs;
}
