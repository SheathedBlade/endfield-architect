import { FACILITY_MAP, ITEM_MAP, RECIPES_BY_OUTPUT } from "@/data/loader";
import type { ItemId, RecipeId } from "@/types";
import { X } from "lucide-react";

interface RecipeOverrideListProps {
  overrideEntries: [ItemId, RecipeId][];
  onRemove: (itemId: ItemId) => void;
}

export function RecipeOverrideList({ overrideEntries, onRemove }: RecipeOverrideListProps) {
  return (
    <>
      {overrideEntries.map(([itemId, recipeId]) => {
        const item = ITEM_MAP.get(itemId);
        const recipes = RECIPES_BY_OUTPUT.get(itemId) ?? [];
        const recipe = recipes.find((r) => r.id === recipeId);
        const facility = recipe ? FACILITY_MAP.get(recipe.facility) : null;
        return (
          <div key={itemId} className="data-row">
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
              onClick={() => onRemove(itemId)}
              className="text-status-error hover:text-status-error/80 shrink-0"
            >
              <X className="w-3 h-3" strokeWidth={2.5} />
            </button>
          </div>
        );
      })}
    </>
  );
}
