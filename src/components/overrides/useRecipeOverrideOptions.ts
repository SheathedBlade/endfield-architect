import { FACILITY_MAP, ITEM_MAP, RECIPES_BY_OUTPUT } from "@/data/loader";
import { getProducibleItems } from "@/solver";
import { isRecipeAvailable } from "@/solver/utils";
import { useAppStore } from "@/store";
import type { Item, ItemId, Recipe, RecipeId } from "@/types";
import { useMemo } from "react";

interface UseRecipeOverrideOptionsResult {
  overrides: Partial<Record<ItemId, RecipeId>>;
  producibleItems: Set<ItemId>;
  availableOutputs: Item[];
  candidateRecipesForOutput: (outputId: ItemId) => Recipe[];
}

export function useRecipeOverrideOptions(): UseRecipeOverrideOptionsResult {
  const { plan, activeRegion } = useAppStore();
  const overrides = plan.recipeOverrides;

  const producibleItems = useMemo(
    () => getProducibleItems([activeRegion], plan.version),
    [activeRegion, plan.version],
  );

  const availableOutputs = useMemo(() => {
    const overriddenIds = new Set(Object.keys(overrides) as ItemId[]);
    return Array.from(ITEM_MAP.values())
      .filter((item) => {
        if (item.isRaw) return false;
        if (!producibleItems.has(item.id as ItemId)) return false;
        if (overriddenIds.has(item.id as ItemId)) return false;

        const recipes = RECIPES_BY_OUTPUT.get(item.id as ItemId) ?? [];
        const validCount = recipes.filter((r) => {
          const facility = FACILITY_MAP.get(r.facility);
          if (!facility) return false;
          if (!isRecipeAvailable(r, facility, activeRegion, plan.version))
            return false;
          if (r.inputs.some((i) => !producibleItems.has(i.itemId)))
            return false;
          return true;
        }).length;
        return validCount >= 2;
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [producibleItems, overrides, activeRegion, plan.version]);

  const candidateRecipesForOutput = (outputId: ItemId): Recipe[] => {
    const recipes = RECIPES_BY_OUTPUT.get(outputId) ?? [];
    return recipes.filter((r) => {
      const facility = FACILITY_MAP.get(r.facility);
      if (!facility) return false;
      if (!isRecipeAvailable(r, facility, activeRegion, plan.version))
        return false;
      if (r.inputs.some((i) => !producibleItems.has(i.itemId))) return false;
      return true;
    });
  };

  return { overrides, producibleItems, availableOutputs, candidateRecipesForOutput };
}
