import type { ProductionPlan } from "@/types";
import LZString from "lz-string";

const URL_PARAM = "plan";

export const exportPlan = (plan: ProductionPlan): string => {
  const exportData = {
    ...plan,
    nodes: [],
    detectedCycles: [],
  };
  const json = JSON.stringify(exportData);
  return LZString.compressToEncodedURIComponent(json);
};

export const importPlan = (hash: string): ProductionPlan | null => {
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash);
    if (!json) return null;
    const data = JSON.parse(json) as Partial<ProductionPlan>;
    if (!data.goals || !Array.isArray(data.goals)) return null;
    return data as ProductionPlan;
  } catch {
    return null;
  }
};

export const pushPlanToURL = (plan: ProductionPlan): void => {
  const hash = exportPlan(plan);
  const url = new URL(window.location.href);
  url.searchParams.set(URL_PARAM, hash);
  window.history.replaceState({}, "", url.toString());
};

export const loadPlanFromURL = (): ProductionPlan | null => {
  const url = new URL(window.location.href);
  const hash = url.searchParams.get(URL_PARAM);
  if (!hash) return null;
  return importPlan(hash);
};
