import { ITEM_MAP } from "@/data/loader";
import { useAppStore } from "@/store";
import type { Goal, ItemId } from "@/types";
import { useState, type SyntheticEvent } from "react";
import Button from "./ui/Button";
import Select from "./ui/Select";

const GoalInput = () => {
  const [item, setItem] = useState<ItemId>("yazhen_syringe_a");
  const [rate, setRate] = useState<number>(12);
  const { addGoal, removeGoal, plan } = useAppStore();
  const { goals } = plan;

  const itemOptions = Array.from(ITEM_MAP.values())
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((item) => ({ value: item.id, label: item.id }));

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (rate > 0) {
      addGoal({ itemId: item, targetRate: rate });
      setRate(6);
    }
  };

  return (
    <div className="card mb-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">
        Production Goals
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 mb-4">
        <Select
          className="min-w-48"
          value={item}
          onChange={(e) => setItem(e.target.value as ItemId)}
          options={itemOptions}
        />
        <div className="flex items-center gap-2">
          <input
            className="input w-24"
            type="number"
            min={1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
          <span className="text-gray-400">/min</span>
        </div>
        <Button type="submit" size="sm">
          Add Goal
        </Button>
      </form>

      {goals.length > 0 ? (
        <ul className="space-y-2">
          {goals.map((goal: Goal) => {
            const item = ITEM_MAP.get(goal.itemId);
            return (
              <li
                key={goal.itemId}
                className="flex items-center justify-between p-2 bg-gray-700 rounded"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-300">
                    {item?.id ?? goal.itemId}
                  </span>
                  <span className="text-gray-400">:</span>
                  <span className="text-accent-primary font-semibold">
                    {goal.targetRate.toLocaleString()}/min
                  </span>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeGoal(goal.itemId)}
                  className="px-2 py-1"
                >
                  Remove
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-gray-500 italic">Add a production goal above.</p>
      )}
    </div>
  );
};

export default GoalInput;
