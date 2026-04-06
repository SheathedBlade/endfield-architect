import { FACILITY_MAP, ITEM_MAP, RECIPES_BY_OUTPUT } from "@/data/loader";
import { getProducibleItems } from "@/solver";
import { isRecipeAvailable } from "@/solver/utils";
import { useAppStore } from "@/store";
import { type ItemId, type RecipeId } from "@/types";
import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

export const RecipeOverrides = () => {
  const { plan, activeRegion, setRecipeOverride, removeRecipeOverride } =
    useAppStore();
  const overrides = plan.recipeOverrides;
  const producibleItems = useMemo(
    () => getProducibleItems([activeRegion], plan.version),
    [activeRegion, plan.version],
  );

  const [showAdd, setShowAdd] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState<ItemId | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeId | null>(null);
  const [search, setSearch] = useState("");

  const availableOutputs = useMemo(() => {
    const overriddenIds = new Set(Object.keys(overrides) as ItemId[]);
    return Array.from(ITEM_MAP.values())
      .filter((item) => {
        if (item.isRaw) return false;
        if (!producibleItems.has(item.id as ItemId)) return false;
        if (overriddenIds.has(item.id as ItemId)) return false;

        // Only include items with 2+ valid recipes in the current context
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

  const filteredOutputs = availableOutputs.filter((item) =>
    item.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  const candidateRecipes = useMemo(() => {
    if (!selectedOutput) return [];
    const recipes = RECIPES_BY_OUTPUT.get(selectedOutput) ?? [];
    return recipes.filter((r) => {
      const facility = FACILITY_MAP.get(r.facility);
      if (!facility) return false;
      if (!isRecipeAvailable(r, facility, activeRegion, plan.version))
        return false;
      if (r.inputs.some((i) => !producibleItems.has(i.itemId))) return false;
      return true;
    });
  }, [selectedOutput, plan.version, activeRegion, producibleItems]);

  const handleAdd = () => {
    if (!selectedOutput || !selectedRecipe) return;
    setRecipeOverride(selectedOutput, selectedRecipe);
    setShowAdd(false);
    setSelectedOutput(null);
    setSelectedRecipe(null);
    setSearch("");
  };

  const overrideEntries = Object.entries(overrides) as [ItemId, RecipeId][];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm text-text-secondary uppercase tracking-wider">
          Recipe Override
        </span>
        {!showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="btn-tactical ghost text-[0.6rem] px-2 py-0.5 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            Add
          </button>
        )}
      </div>

      {overrideEntries.length === 0 && !showAdd && (
        <p className="font-display text-xs text-center text-text-muted py-1">
          No recipe overrides
        </p>
      )}

      {overrideEntries.map(([itemId, recipeId]) => {
        const item = ITEM_MAP.get(itemId);
        const recipes = RECIPES_BY_OUTPUT.get(itemId) ?? [];
        const recipe = recipes.find((r) => r.id === recipeId);
        const facility = recipe ? FACILITY_MAP.get(recipe.facility) : null;
        return (
          <div
            key={itemId}
            className="flex items-center gap-2 px-3 py-2 bg-bg-deep border border-border"
          >
            <div className="flex-1 min-w-0">
              <span className="font-display text-sm text-text-primary truncate block">
                {item?.displayName ?? itemId}
              </span>
              {recipe && facility && (
                <span className="font-sans text-sm text-text-muted truncate block">
                  {facility.displayName}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeRecipeOverride(itemId)}
              className="text-status-error hover:text-status-error/80 shrink-0"
            >
              <X className="w-3 h-3" strokeWidth={2.5} />
            </button>
          </div>
        );
      })}

      {showAdd && (
        <div className="space-y-2 p-2 border border-accent-border/30 bg-bg-deep">
          {!selectedOutput ? (
            <>
              <div className="flex items-center input-terminal w-full px-0">
                <Search
                  className="w-4 h-4 text-text-muted ml-3 shrink-0"
                  strokeWidth={2}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search items..."
                  className="flex-1 bg-transparent border-none outline-none text-text-primary font-sans text-sm px-2 py-2"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {filteredOutputs.slice(0, 10).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedOutput(item.id as ItemId)}
                    className="w-full text-left px-3 py-1.5 text-sm text-text-primary font-sans hover:bg-accent/5 transition-colors"
                  >
                    {item.displayName}
                  </button>
                ))}
                {filteredOutputs.length === 0 && (
                  <p className="text-sm text-text-muted italic px-3 py-1.5">
                    No producible items available
                  </p>
                )}
              </div>
            </>
          ) : !selectedRecipe ? (
            <>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm text-accent font-display truncate">
                  {ITEM_MAP.get(selectedOutput)?.displayName}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedOutput(null)}
                  className="text-text-muted hover:text-text-primary text-sm"
                >
                  Change
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {candidateRecipes.map((recipe) => {
                  const facility = FACILITY_MAP.get(recipe.facility);
                  return (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => setSelectedRecipe(recipe.id)}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent/5 transition-colors"
                    >
                      <span className="text-text-primary font-display text-sm truncate block">
                        {facility?.displayName ?? recipe.facility}
                      </span>
                      <span className="text-text-muted text-sm">
                        {recipe.inputs
                          .map((i) => {
                            const inputItem = ITEM_MAP.get(i.itemId);
                            return `${i.amount}× ${inputItem?.displayName ?? i.itemId}`;
                          })
                          .join(" + ") || "No inputs"}{" "}
                        → {recipe.outputs[0]?.amount ?? 0}×
                        {ITEM_MAP.get(selectedOutput)?.displayName}
                      </span>
                    </button>
                  );
                })}
                {candidateRecipes.length === 0 && (
                  <p className="text-sm text-text-muted italic px-3 py-1.5">
                    No recipes available for this item
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex-1 text-sm text-text-primary font-display truncate">
                {ITEM_MAP.get(selectedOutput)?.displayName}
              </span>
              <span className="text-sm text-text-muted">
                →{" "}
                {(() => {
                  const found = candidateRecipes.find(
                    (r) => r.id === selectedRecipe,
                  );
                  if (!found) return null;
                  return (
                    FACILITY_MAP.get(found.facility)?.displayName ??
                    found.facility
                  );
                })()}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedOutput || !selectedRecipe}
              className="btn-tactical primary flex-1 text-[0.6rem] py-1"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setSelectedOutput(null);
                setSelectedRecipe(null);
                setSearch("");
              }}
              className="btn-tactical ghost flex-1 text-[0.6rem] py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
