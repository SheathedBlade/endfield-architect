import { ITEM_MAP } from "@/data/loader";
import { getProducibleItems } from "@/solver";
import { useAppStore } from "@/store";
import type { Goal, ItemId } from "@/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface GoalEditorState {
  isAdding: boolean;
  editingItemId: ItemId | null;
  draftItem: ItemId | null;
  draftRate: number;
  showPicker: boolean;
  pickerSearch: string;
  pickerHighlighted: number;
  producibleItems: Set<ItemId>;
  goalItemIds: Set<ItemId>;
  selectableItems: { value: ItemId; label: string }[];
  filteredPickerItems: { value: ItemId; label: string }[];
  exiting: Set<ItemId>;
  entering: Set<ItemId>;
  isEditing: boolean;
  openAdd: () => void;
  openEdit: (goal: Goal) => void;
  selectFromPicker: (opt: { value: ItemId; label: string }) => void;
  cancelEdit: () => void;
  confirmEdit: () => void;
  handlePickerKeyDown: (e: React.KeyboardEvent) => void;
  handleRemove: (itemId: ItemId) => void;
  handleClearAll: () => void;
  setDraftItem: (item: ItemId | null) => void;
  setDraftRate: (rate: number) => void;
  setPickerSearch: (q: string) => void;
  setShowPicker: (show: boolean) => void;
  setPickerHighlighted: (i: number) => void;
}

export function useGoalEditorState(): GoalEditorState {
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

  const openAdd = useCallback(() => {
    setEditingItemId(null);
    setDraftItem(null);
    setDraftRate(0);
    setPickerSearch("");
    setPickerHighlighted(0);
    setIsAdding(true);
    setShowPicker(false);
  }, []);

  const openEdit = useCallback((goal: Goal) => {
    setEditingItemId(goal.itemId);
    setDraftItem(goal.itemId);
    setDraftRate(goal.targetRate);
    setPickerSearch(ITEM_MAP.get(goal.itemId)?.displayName ?? "");
    setPickerHighlighted(0);
    setIsAdding(true);
    setShowPicker(false);
  }, []);

  const selectFromPicker = useCallback((opt: { value: ItemId; label: string }) => {
    setDraftItem(opt.value);
    setPickerSearch(opt.label);
    setShowPicker(false);
  }, []);

  const cancelEdit = useCallback(() => {
    setIsAdding(false);
    setEditingItemId(null);
    setDraftItem(null);
    setDraftRate(0);
    setPickerSearch("");
    setShowPicker(false);
  }, []);

  const confirmEdit = useCallback(() => {
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
  }, [draftItem, draftRate, editingItemId, updateGoal, addGoal]);

  const handlePickerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
    },
    [filteredPickerItems, pickerHighlighted, showPicker, selectFromPicker, draftItem, isAdding, cancelEdit],
  );

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

  return {
    isAdding,
    editingItemId,
    draftItem,
    draftRate,
    showPicker,
    pickerSearch,
    pickerHighlighted,
    producibleItems,
    goalItemIds,
    selectableItems,
    filteredPickerItems,
    exiting,
    entering,
    isEditing: editingItemId !== null,
    openAdd,
    openEdit,
    selectFromPicker,
    cancelEdit,
    confirmEdit,
    handlePickerKeyDown,
    handleRemove,
    handleClearAll,
    setDraftItem,
    setDraftRate,
    setPickerSearch,
    setShowPicker,
    setPickerHighlighted,
  };
}