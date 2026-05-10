import { useAppStore } from "@/store";
import type { ItemId } from "@/types";
import type { Goal } from "@/types";
import { GoalRow } from "./GoalRow";

interface GoalListProps {
  exiting: Set<ItemId>;
  entering: Set<ItemId>;
  onRemove: (itemId: ItemId) => void;
  onEdit: (goal: Goal) => void;
}

export function GoalList({ exiting, entering, onRemove, onEdit }: GoalListProps) {
  const { goals } = useAppStore((s) => s.plan);

  if (goals.length === 0) {
    return (
      <p className="goal-list-empty">
        No production goals defined
      </p>
    );
  }

  return (
    <div className="goal-list">
      {goals.map((goal: Goal) => (
        <GoalRow
          key={goal.itemId}
          goal={goal}
          isEntering={entering.has(goal.itemId)}
          isExiting={exiting.has(goal.itemId)}
          onEdit={onEdit}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}