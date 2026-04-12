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

  return (
    <>
      {goals.length > 0 && (
        <>
          <div className="divider mt-4 mb-3" />
          <div className="goal-list space-y-1">
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
        </>
      )}
      {goals.length === 0 && (
        <p className="font-display text-xs text-text-muted tracking-wider text-center py-2">
          No production goals defined
        </p>
      )}
    </>
  );
}