import { ITEM_MAP } from "@/data/loader";
import type { Goal, ItemId } from "@/types";
import { Pencil, Target, X } from "lucide-react";

interface GoalRowProps {
  goal: Goal;
  isEntering: boolean;
  isExiting: boolean;
  onEdit: (goal: Goal) => void;
  onRemove: (itemId: ItemId) => void;
}

export function GoalRow({ goal, isEntering, isExiting, onEdit, onRemove }: GoalRowProps) {
  const item = ITEM_MAP.get(goal.itemId);
  const animClass = isExiting
    ? "goal-item-exiting"
    : isEntering
      ? "goal-item-entering"
      : "";

  return (
    <div
      className={`flex items-center justify-between data-row-accent ${animClass}`}
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
          type="button"
          onClick={() => onEdit(goal)}
          className="btn-tactical ghost px-2 py-1 text-[0.7rem]"
        >
          <Pencil className="w-3 h-3" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => onRemove(goal.itemId)}
          className="btn-tactical danger px-2 py-1 text-[0.7rem]"
        >
          <X className="w-3 h-3" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}