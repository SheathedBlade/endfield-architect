import type { ProductionNode, SiteId, SiteProductionNode } from "@/types";

/**
 * Recursively walks tree and converts all nodes into SiteProduction nodes
 * @param nodes
 * @param defaultSiteId
 * @returns the same exact tree lmao
 */
export const convertToSiteProduction = (
  nodes: ProductionNode[],
  defaultSiteId: SiteId,
): SiteProductionNode[] => {
  function convertNode(node: ProductionNode): SiteProductionNode {
    const siteNode: SiteProductionNode = {
      ...node,
      siteId: defaultSiteId,
      assignedFacilityIndex: 0,
    };

    if (node.dependencies && node.dependencies.length > 0)
      siteNode.dependencies = node.dependencies.map(convertNode);

    return siteNode;
  }
  return nodes.map(convertNode);
};
