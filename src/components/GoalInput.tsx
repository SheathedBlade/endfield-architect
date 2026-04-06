import { ITEM_MAP } from "@/data/loader";
import { getProducibleItems } from "@/solver";
import { useAppStore } from "@/store";
import type { Goal, ItemId } from "@/types";
import { Check, Eraser, Pencil, Plus, Search, Target, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const GoalInput = () => {
  const [exiting, setExiting] = useState<Set<ItemId>>(new Set());
  const [entering, setEntering] = useState<Set<ItemId>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [editingItemId, setEditingItemId] = useState<ItemId | null>(null);
  const [draftItem, setDraftItem] = useState<ItemId | null>(null);
  const [draftRate, setDraftRate] = useState<number>(0);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerHighlighted, setPickerHighlighted] = useState(0);
  const { addGoal, removeGoal, updateGoal, clearGoals, plan } = useAppStore();
  const activeRegion = useAppStore((s) => s.activeRegion);
  const { goals } = plan;
  const prevCountRef = useRef(goals.length);
  const pickerRef = useRef<HTMLDivElement>(null);

  const producibleItems = useMemo(() => {
    return getProducibleItems([activeRegion], plan.version);
  }, [activeRegion, plan.version]);

  const goalItemIds = useMemo(
    () => new Set(goals.map((g) => g.itemId)),
    [goals],
  );

  const selectableItems = useMemo(() => {
    return Array.from(ITEM_MAP.values())
      .filter(
        (item) =>
          !item.isRaw &&
          producibleItems.has(item.id as ItemId) &&
          (editingItemId !== null
            ? item.id === editingItemId
            : !goalItemIds.has(item.id as ItemId)),
      )
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map((item) => ({ value: item.id as ItemId, label: item.displayName }));
  }, [producibleItems, goalItemIds, editingItemId]);

  const filteredPickerItems = useMemo(() => {
    if (!pickerSearch) return selectableItems;
    const q = pickerSearch.trimEnd().toLowerCase();
    return selectableItems.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [selectableItems, pickerSearch]);

  useEffect(() => {
    setPickerHighlighted(0);
  }, [pickerSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openAdd = () => {
    setEditingItemId(null);
    setDraftItem(null);
    setDraftRate(0);
    setPickerSearch("");
    setPickerHighlighted(0);
    setIsAdding(true);
    setShowPicker(false);
  };

  const openEdit = (goal: Goal) => {
    setEditingItemId(goal.itemId);
    setDraftItem(goal.itemId);
    setDraftRate(goal.targetRate);
    setPickerSearch(ITEM_MAP.get(goal.itemId)?.displayName ?? "");
    setPickerHighlighted(0);
    setIsAdding(true);
    setShowPicker(false);
  };

  const selectFromPicker = (opt: { value: ItemId; label: string }) => {
    setDraftItem(opt.value);
    setPickerSearch(opt.label);
    setShowPicker(false);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingItemId(null);
    setDraftItem(null);
    setDraftRate(0);
    setPickerSearch("");
    setShowPicker(false);
  };

  const confirmEdit = () => {
    if (draftItem === null || draftRate <= 0) return;
    if (editingItemId !== null) {
      updateGoal({ itemId: editingItemId, targetRate: draftRate });
    } else {
      addGoal({ itemId: draftItem, targetRate: draftRate });
      setEntering((prev) => new Set(prev).add(draftItem));
    }
    setIsAdding(false);
    setEditingItemId(null);
    setDraftItem(null);
    setDraftRate(0);
    setPickerSearch("");
  };

  const handlePickerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setShowPicker(true);
      setPickerHighlighted((i) =>
        Math.min(i + 1, filteredPickerItems.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setPickerHighlighted((i) => Math.max(i - 1, 0));
    } else if (
      e.key === "Enter" &&
      showPicker &&
      filteredPickerItems[pickerHighlighted]
    ) {
      e.preventDefault();
      selectFromPicker(filteredPickerItems[pickerHighlighted]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (draftItem === null && !isAdding) {
        cancelEdit();
      } else {
        setShowPicker(false);
      }
    }
  };

  useEffect(() => {
    if (goals.length > prevCountRef.current) {
      const newGoals = goals.slice(prevCountRef.current);
      const newIds = new Set(newGoals.map((g) => g.itemId));
      setEntering((prev) => {
        const merged = new Set(prev);
        newIds.forEach((id) => merged.add(id));
        return merged;
      });
      setTimeout(() => {
        setEntering((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.delete(id));
          return next;
        });
      }, 200);
    }
    prevCountRef.current = goals.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals.length]);

  const handleRemove = useCallback(
    (itemId: ItemId) => {
      setExiting((prev) => new Set(prev).add(itemId));
      setTimeout(() => {
        removeGoal(itemId);
        setExiting((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }, 200);
    },
    [removeGoal],
  );

  const handleClearAll = useCallback(() => {
    if (goals.length === 0) return;
    const allIds = new Set(goals.map((g) => g.itemId));
    setExiting(allIds);
    setTimeout(() => {
      clearGoals();
      setExiting(new Set());
    }, 200);
  }, [goals, clearGoals]);

  const isEditing = editingItemId !== null;

  return (
    <div className="panel z-dropdown">
      <div className="panel-header">
        <span>Production Goals</span>
        {goals.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="ml-auto btn-tactical danger flex items-center gap-1 text-[0.65rem] self-center"
            style={{ padding: "0.2rem 0.5rem" }}
          >
            <Eraser className="w-3 h-3" strokeWidth={2} />
            <span>Clear</span>
          </button>
        )}
      </div>
      <div className="panel-body p-5">
        {/* Add Goal button — always visible */}
        {!isAdding && (
          <button
            type="button"
            onClick={openAdd}
            className="btn-tactical w-full flex items-center justify-center gap-2 border border-accent-border/20"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>Add Goal</span>
          </button>
        )}

        {/* Goal list — collapsed when form is open */}
        <div className={`goal-list-container${isAdding ? "" : " expanded"}`}>
          <div className="goal-list-container-inner">
            {goals.length > 0 && (
              <>
                <div className="divider mt-4 mb-3" />
                <div className="goal-list space-y-1">
                  {goals.map((goal: Goal) => {
                    const item = ITEM_MAP.get(goal.itemId);
                    const isEntering = entering.has(goal.itemId);
                    const isExiting = exiting.has(goal.itemId);
                    const animClass = isExiting
                      ? "goal-item-exiting"
                      : isEntering
                        ? "goal-item-entering"
                        : "";
                    return (
                      <div
                        key={goal.itemId}
                        className={`flex items-center justify-between px-3 py-2 bg- border-l-2 border-accent-border ${animClass}`}
                      >
                        <div className="flex items-center gap-3">
                          <Target
                            className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5"
                            strokeWidth={2}
                          />
                          <div className="flex flex-col">
                            <span className="font-display text-sm">
                              {item?.displayName ?? goal.itemId}
                            </span>
                            <span className="font-display text-xs text-accent font-bold">
                              {goal.targetRate.toLocaleString()}/min
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(goal)}
                            className="btn-tactical ghost px-2 py-1 text-[0.7rem]"
                          >
                            <Pencil className="w-3 h-3" strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => handleRemove(goal.itemId)}
                            className="btn-tactical danger px-2 py-1 text-[0.7rem]"
                          >
                            <X className="w-3 h-3" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {goals.length === 0 && (
              <p className="font-display text-xs text-text-muted tracking-wider text-center py-2">
                No production goals defined
              </p>
            )}
          </div>
        </div>

        {/* Add/Edit form — expanded when isAdding */}
        <div className={`goal-form-container${isAdding ? " expanded" : ""}`}>
          <div className="goal-form-container-inner">
            {isAdding && (
              <div className="space-y-3 goal-form-slide">
                {/* Picker search — shown when no item selected */}
                {draftItem === null && (
                  <div ref={pickerRef} className="goal-picker-anchor">
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
                        onKeyDown={handlePickerKeyDown}
                        placeholder="Search items..."
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

                {/* Selected item display — shown once item is picked */}
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

                {/* Rate stepper */}
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs text-text-muted uppercase tracking-wider">
                    Rate
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="stepper">
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => setDraftRate((r) => Math.max(0, r - 1))}
                        disabled={draftRate <= 0}
                      >
                        -
                      </button>
                      <input
                        className="stepper-input"
                        type="text"
                        inputMode="numeric"
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
                      />
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => setDraftRate((r) => r + 1)}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-text-muted">/min</span>
                  </div>
                </div>

                {/* Confirm/Cancel */}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalInput;
