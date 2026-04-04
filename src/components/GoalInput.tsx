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
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const { addGoal, removeGoal, updateGoal, clearGoals, plan } = useAppStore();
  const activeRegion = useAppStore((s) => s.activeRegion);
  const { goals } = plan;
  const prevCountRef = useRef(goals.length);
  const containerRef = useRef<HTMLDivElement>(null);

  const producibleItems = useMemo(() => {
    return getProducibleItems([activeRegion], plan.version);
  }, [activeRegion, plan.version]);

  const itemOptions = useMemo(() => {
    return Array.from(ITEM_MAP.values())
      .filter((item) => !item.isRaw && producibleItems.has(item.id as ItemId))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map((item) => ({ value: item.id, label: item.displayName }));
  }, [producibleItems]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return itemOptions;
    const q = searchQuery.toLowerCase();
    return itemOptions.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [itemOptions, searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  const openAdd = () => {
    setEditingItemId(null);
    setDraftItem(null);
    setDraftRate(0);
    setSearchQuery("");
    setHighlightedIndex(0);
    setIsAdding(true);
    setShowDropdown(false);
  };

  const openEdit = (goal: Goal) => {
    setEditingItemId(goal.itemId);
    setDraftItem(goal.itemId);
    setDraftRate(goal.targetRate);
    const item = ITEM_MAP.get(goal.itemId);
    setSearchQuery(item?.displayName ?? "");
    setHighlightedIndex(0);
    setIsAdding(true);
    setShowDropdown(false);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingItemId(null);
    setShowDropdown(false);
    setSearchQuery("");
  };

  const selectItem = (opt: { value: ItemId; label: string }) => {
    setDraftItem(opt.value);
    setSearchQuery(opt.label);
    setShowDropdown(false);
  };

  const confirmEdit = () => {
    if (draftItem === null || draftRate <= 0) return;
    if (editingItemId !== null) {
      updateGoal({ itemId: draftItem, targetRate: draftRate });
    } else {
      addGoal({ itemId: draftItem, targetRate: draftRate });
      setEntering((prev) => new Set(prev).add(draftItem));
    }
    setIsAdding(false);
    setEditingItemId(null);
    setShowDropdown(false);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredOptions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        selectItem(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
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
    <div className={`panel ${showDropdown ? "z-dropdown" : ""}`}>
      <div className="panel-header">
        <span>Production Goals</span>
        {goals.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="ml-auto btn-tactical danger flex items-center gap-1"
            style={{ padding: "0.2rem 0.5rem", fontSize: "0.65rem" }}
          >
            <Eraser className="w-3 h-3" strokeWidth={2} />
            <span>Clear</span>
          </button>
        )}
      </div>
      <div className="panel-body">
        {!isAdding ? (
          <button
            type="button"
            onClick={openAdd}
            className="btn-tactical w-full flex items-center justify-center gap-2 border border-accent-border/20"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>Add Goal</span>
          </button>
        ) : (
          <div className="space-y-3 goal-form-slide">
            {/* Autocomplete input */}
            <div className="relative" ref={containerRef}>
              <div className="flex items-center input-terminal w-full px-0">
                <Search
                  className="w-4 h-4 text-text-muted ml-3 shrink-0"
                  strokeWidth={2}
                />
                <input
                  className="flex-1 bg-transparent border-none outline-none text-text-primary font-sans text-sm px-2 py-2"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search items..."
                />
              </div>
              {showDropdown && filteredOptions.length > 0 && (
                <div className="autocomplete-dropdown">
                  {filteredOptions.map((opt, i) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`w-full text-left px-3 py-1.5 text-sm font-sans transition-colors ${
                        i === highlightedIndex
                          ? "bg-accent/10 text-accent"
                          : "text-text-primary hover:bg-accent/5"
                      }`}
                      onMouseEnter={() => setHighlightedIndex(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectItem(opt)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              {showDropdown && filteredOptions.length === 0 && (
                <div className="autocomplete-dropdown text-text-muted">
                  No items match "{searchQuery}"
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-display text-xs text-text-muted uppercase tracking-wider">
                Rate
              </span>
              <div className="flex items-center gap-2">
                <div className="stepper">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => setDraftRate((r) => Math.max(1, r - 1))}
                    disabled={draftRate <= 1}
                  >
                    -
                  </button>
                  <input
                    className="stepper-input"
                    type="number"
                    min={1}
                    value={draftRate}
                    onChange={(e) =>
                      setDraftRate(Math.max(1, Number(e.target.value)))
                    }
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmEdit}
                className="btn-tactical primary flex-1 flex items-center justify-center gap-1.5"
                disabled={draftItem === null}
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

        {goals.length > 0 && (
          <div
            className={`goal-list-container ${goals.length > 0 ? "expanded" : ""}`}
          >
            <div className="goal-list-container-inner">
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
                          className="btn-tactical ghost"
                          style={{
                            padding: "0.3rem 0.5rem",
                            fontSize: "0.7rem",
                          }}
                        >
                          <Pencil className="w-3 h-3" strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => handleRemove(goal.itemId)}
                          className="btn-tactical danger"
                          style={{
                            padding: "0.3rem 0.5rem",
                            fontSize: "0.7rem",
                          }}
                        >
                          <X className="w-3 h-3" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {goals.length === 0 && !isAdding && (
          <p className="font-display text-xs text-text-muted tracking-wider text-center py-2">
            No production goals defined
          </p>
        )}
      </div>
    </div>
  );
};

export default GoalInput;
