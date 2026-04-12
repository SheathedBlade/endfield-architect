import { ITEM_MAP } from "@/data/loader";
import type { ItemId } from "@/types";
import { Check, Search, Target, X } from "lucide-react";
import { useRef } from "react";

interface GoalEditorProps {
  draftItem: ItemId | null;
  draftRate: number;
  isEditing: boolean;
  showPicker: boolean;
  pickerSearch: string;
  pickerHighlighted: number;
  filteredPickerItems: { value: ItemId; label: string }[];
  selectFromPicker: (opt: { value: ItemId; label: string }) => void;
  confirmEdit: () => void;
  cancelEdit: () => void;
  handlePickerKeyDown: (e: React.KeyboardEvent) => void;
  setDraftItem: (item: ItemId | null) => void;
  setDraftRate: (rate: number) => void;
  setPickerSearch: (q: string) => void;
  setShowPicker: (show: boolean) => void;
  setPickerHighlighted: (i: number) => void;
}

export function GoalEditor({
  draftItem,
  draftRate,
  isEditing,
  showPicker,
  pickerSearch,
  pickerHighlighted,
  filteredPickerItems,
  selectFromPicker,
  confirmEdit,
  cancelEdit,
  handlePickerKeyDown,
  setDraftItem,
  setDraftRate,
  setPickerSearch,
  setShowPicker,
  setPickerHighlighted,
}: GoalEditorProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3 goal-form-slide">
      {draftItem === null && (
        <div ref={pickerRef} className="goal-picker-anchor">
          <p className="font-sans text-xs text-text-muted mb-1.5">
            Select the item you want to produce
          </p>
          <div className="flex items-center input-terminal w-full px-0">
            <Search
              className="w-4 h-4 text-text-muted ml-3 shrink-0"
              strokeWidth={2}
            />
            <input
              className="flex-1 bg-transparent border-none outline-none text-text-primary font-sans text-sm px-2 py-2"
              type="text"
              value={pickerSearch}
              onChange={(e) => {
                setPickerSearch(e.target.value);
                setShowPicker(true);
              }}
              onFocus={() => setShowPicker(true)}
              onBlur={() => setShowPicker(false)}
              onKeyDown={handlePickerKeyDown}
              placeholder="Search items..."
              aria-label="Search items"
            />
          </div>
          {showPicker && filteredPickerItems.length > 0 && (
            <div className="goal-item-picker">
              {filteredPickerItems.map((opt, i) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`goal-item-picker-row ${
                    i === pickerHighlighted ? "highlighted" : ""
                  }`}
                  onMouseEnter={() => setPickerHighlighted(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectFromPicker(opt)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          {showPicker && filteredPickerItems.length === 0 && (
            <div className="goal-item-picker-empty">
              No items match &ldquo;{pickerSearch}&rdquo;
            </div>
          )}
        </div>
      )}

      {draftItem !== null && (
        <div className="flex items-center gap-2 px-3 py-2 bg-bg-deep/50 border border-border rounded">
          <Target
            className="w-4 h-4 text-accent shrink-0"
            strokeWidth={2}
          />
          <span className="font-display text-sm text-text-primary flex-1">
            {ITEM_MAP.get(draftItem)?.displayName ?? draftItem}
          </span>
          <button
            type="button"
            onClick={() => {
              setDraftItem(null);
              setPickerSearch("");
              setShowPicker(true);
            }}
            className="text-text-muted hover:text-text-primary transition-colors"
            title="Change item"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="font-display text-xs text-text-muted uppercase tracking-wider">
          Rate
        </span>
        <div className="flex items-center gap-2">
          <div className="stepper">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setDraftRate(Math.max(0, draftRate - 1))}
              disabled={draftRate <= 0}
              aria-label="Decrease rate"
            >
              -
            </button>
            <input
              className="stepper-input"
              type="number"
              value={draftRate}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  setDraftRate(0);
                } else {
                  const n = Number(v);
                  if (!isNaN(n) && n >= 0) setDraftRate(n);
                }
              }}
              onBlur={(e) => {
                const n = Number(e.target.value);
                if (isNaN(n) || n < 1) setDraftRate(0);
              }}
              aria-label="Production rate"
            />
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setDraftRate(draftRate + 1)}
              aria-label="Increase rate"
            >
              +
            </button>
          </div>
          <span className="text-xs text-text-muted">/min</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={confirmEdit}
          className="btn-tactical primary flex-1 flex items-center justify-center gap-1.5"
          disabled={draftItem === null || draftRate <= 0}
        >
          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>{isEditing ? "Update" : "Confirm"}</span>
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          className="btn-tactical ghost flex-1 flex items-center justify-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
}