import { useAppStore } from "@/store";
import type { ItemId, RecipeId } from "@/types";
import { Plus } from "lucide-react";
import { useState } from "react";
import { RecipeOverrideList } from "./RecipeOverrideList";
import { useRecipeOverrideOptions } from "./useRecipeOverrideOptions";
import { RecipeOverrideWizard } from "./RecipeOverrideWizard";

export const RecipeOverrides = () => {
  const { setRecipeOverride, removeRecipeOverride } = useAppStore();
  const { overrides, availableOutputs, candidateRecipesForOutput } = useRecipeOverrideOptions();

  const [showAdd, setShowAdd] = useState(false);

  const overrideEntries = Object.entries(overrides) as [ItemId, RecipeId][];

  const handleAdd = (outputId: ItemId, recipeId: RecipeId) => {
    setRecipeOverride(outputId, recipeId);
    setShowAdd(false);
  };

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
      <p className="font-sans text-xs text-text-muted">
        Force the solver to use a specific recipe when an item has multiple production paths.
      </p>

      {overrideEntries.length === 0 && !showAdd && (
        <p className="font-display text-xs text-center text-text-muted py-1">
          No recipe overrides
        </p>
      )}

      <RecipeOverrideList
        overrideEntries={overrideEntries}
        onRemove={removeRecipeOverride}
      />

      {showAdd && (
        <RecipeOverrideWizard
          availableOutputs={availableOutputs}
          candidateRecipesForOutput={candidateRecipesForOutput}
          onApply={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}
    </div>
  );
};
