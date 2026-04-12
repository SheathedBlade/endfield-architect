import { ITEM_MAP } from "@/data/loader";
import { useAppStore } from "@/store";
import { RAW_MATERIAL_REGIONS, type ItemId } from "@/types";
import { Plus, Search, X } from "lucide-react";
import { useState } from "react";

const RAW_ITEMS = Array.from(ITEM_MAP.values()).filter(
  (item) => item.isRaw && item.patch <= "1.1",
);

export const RawInputOverrides = () => {
  const { plan, activeRegion, setRawInputOverride, removeRawInputOverride } =
    useAppStore();
  const overrides = plan.rawInputOverrides;
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<ItemId | null>(null);
  const [rate, setRate] = useState(0);

  const overriddenIds = new Set(Object.keys(overrides) as ItemId[]);
  const regionRates = RAW_MATERIAL_REGIONS[activeRegion];
  const availableRawItems = RAW_ITEMS.filter(
    (item) =>
      !overriddenIds.has(item.id as ItemId) &&
      item.id in regionRates &&
      Number.isFinite(regionRates[item.id as ItemId] as number),
  );

  const filtered = availableRawItems.filter((item) =>
    item.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = () => {
    if (!selectedItem || rate <= 0) return;
    setRawInputOverride(selectedItem, rate);
    setShowAdd(false);
    setSelectedItem(null);
    setRate(0);
    setSearch("");
  };

  const overrideEntries = Object.entries(overrides) as [ItemId, number][];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm text-text-secondary uppercase tracking-wider">
          Raw Input Override
        </span>
        {!showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="btn-tactical ghost text-[0.6rem] px-2 py-0.5 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            Add
          </button>
        )}
      </div>
      <p className="font-sans text-xs text-text-muted">
        Adjust raw material supply rates beyond the region default. Use this to model manual sourcing.
      </p>

      {overrideEntries.length === 0 && !showAdd && (
        <p className="font-display text-xs text-center text-text-muted py-1">
          No raw input overrides
        </p>
      )}

      {overrideEntries.map(([itemId, ratePerMin]) => {
        const item = ITEM_MAP.get(itemId);
        return (
          <div key={itemId} className="data-row">
            <span className="flex-1 font-display text-sm text-text-primary truncate">
              {item?.displayName ?? itemId}
            </span>
            <span className="font-mono text-sm text-accent shrink-0">
              {ratePerMin}/min
            </span>
            <button
              type="button"
              onClick={() => removeRawInputOverride(itemId)}
              className="text-status-error hover:text-status-error/80 shrink-0"
            >
              <X className="w-3 h-3" strokeWidth={2.5} />
            </button>
          </div>
        );
      })}

      {showAdd && (
        <div className="space-y-2 p-2 border border-accent-border/30 bg-bg-deep">
          <div className="flex items-center input-terminal w-full px-0">
            <Search
              className="w-4 h-4 text-text-muted ml-3 shrink-0"
              strokeWidth={2}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedItem(null);
              }}
              placeholder="Search raw materials..."
              className="flex-1 bg-transparent border-none outline-none text-text-primary font-sans text-sm px-2 py-2"
            />
          </div>

          {!selectedItem ? (
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {filtered.slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItem(item.id as ItemId)}
                  className="w-full text-left px-3 py-1.5 text-sm text-text-primary font-sans hover:bg-accent/5 transition-colors"
                >
                  {item.displayName}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-text-muted italic px-3 py-1.5">
                  No raw materials available
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex-1 text-sm text-text-primary font-display truncate ml-2">
                {ITEM_MAP.get(selectedItem)?.displayName}
              </span>
              <input
                type="number"
                min={1}
                value={rate || ""}
                onChange={(e) => setRate(Number(e.target.value) || 0)}
                placeholder="Rate"
                className="input-terminal w-20 px-2 py-1 text-sm text-right"
              />
              <span className="text-sm text-text-muted">/min</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedItem || rate <= 0}
              className="btn-tactical primary flex-1 text-[0.6rem] py-1"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setSelectedItem(null);
                setRate(0);
                setSearch("");
              }}
              className="btn-tactical ghost flex-1 text-[0.6rem] py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
