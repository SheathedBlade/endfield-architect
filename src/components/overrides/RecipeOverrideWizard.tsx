import { FACILITY_MAP, ITEM_MAP } from "@/data/loader";
import type { ItemId, RecipeId } from "@/types";
import type { Recipe } from "@/types";
import { Search } from "lucide-react";
import { useState } from "react";

interface RecipeOverrideWizardProps {
  availableOutputs: { id: string; displayName: string; isRaw: boolean }[];
  candidateRecipesForOutput: (outputId: ItemId) => Recipe[];
  onApply: (outputId: ItemId, recipeId: RecipeId) => void;
  onCancel: () => void;
}

export function RecipeOverrideWizard({
  availableOutputs,
  candidateRecipesForOutput,
  onApply,
  onCancel,
}: RecipeOverrideWizardProps) {
  const [selectedOutput, setSelectedOutput] = useState<ItemId | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeId | null>(null);
  const [search, setSearch] = useState("");

  const filteredOutputs = availableOutputs.filter((item) =>
    item.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  const candidateRecipes = selectedOutput
    ? candidateRecipesForOutput(selectedOutput)
    : [];

  const handleApply = () => {
    if (!selectedOutput || !selectedRecipe) return;
    onApply(selectedOutput, selectedRecipe);
  };

  const handleCancel = () => {
    setSelectedOutput(null);
    setSelectedRecipe(null);
    setSearch("");
    onCancel();
  };

  return (
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
              const found = candidateRecipes.find((r) => r.id === selectedRecipe);
              if (!found) return null;
              return (
                FACILITY_MAP.get(found.facility)?.displayName ?? found.facility
              );
            })()}
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleApply}
          disabled={!selectedOutput || !selectedRecipe}
          className="btn-tactical primary flex-1 text-[0.6rem] py-1"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="btn-tactical ghost flex-1 text-[0.6rem] py-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
