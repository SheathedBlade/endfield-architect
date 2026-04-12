import type { ItemId, MetaStorageTransfer, RegionId } from "@/types";
import { Search } from "lucide-react";
import { useState } from "react";
import AutocompleteDropdown from "../ui/AutocompleteDropdown";
import { buildSourceRegions, buildTransferableItems } from "./transferRules";

interface TransferFormProps {
  activeRegion: RegionId;
  onAdd: (transfer: MetaStorageTransfer) => void;
  onCancel: () => void;
}

export function TransferForm({ activeRegion, onAdd, onCancel }: TransferFormProps) {
  const [newItem, setNewItem] = useState<ItemId | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [newRate, setNewRate] = useState("");
  const [showSourceMenu, setShowSourceMenu] = useState(false);

  const targetLabel = activeRegion;
  const sourceRegions = buildSourceRegions(activeRegion);
  const [newSource, setNewSource] = useState<RegionId>(sourceRegions[0]?.value);

  const allTransferItems = buildTransferableItems();

  const filteredTransferItems = allTransferItems.filter((opt) =>
    opt.label.toLowerCase().includes(itemSearch.toLowerCase()),
  );

  const handleAdd = () => {
    if (!newItem || !newRate || Number(newRate) <= 0) return;
    onAdd({
      itemId: newItem,
      sourceRegion: newSource,
      destinationRegion: activeRegion,
      amountPerHour: Number(newRate),
    });
    onCancel();
  };

  return (
    <div className="border border-border rounded p-3 space-y-2 mb-3 bg-bg-deep/30">
      {/* Item selector */}
      <div>
        <label className="block font-sans text-sm uppercase text-text-muted mb-1">
          Item
        </label>
        <AutocompleteDropdown
          options={filteredTransferItems}
          searchQuery={itemSearch}
          onSearchChange={setItemSearch}
          onSelect={(opt) => {
            setNewItem(opt.value as ItemId);
            setItemSearch(opt.label);
          }}
          placeholder="Search items..."
          icon={Search}
        />
      </div>

      {/* Region selectors — two-column row */}
      <div className="grid grid-cols-2 gap-3 items-end">
        {/* From */}
        <div>
          <label className="block font-sans text-sm text-text-muted mb-1.5 uppercase tracking-wider">
            From
          </label>
          <SourceRegionSelector
            value={newSource}
            options={sourceRegions}
            onChange={setNewSource}
            showMenu={showSourceMenu}
            onToggle={() => setShowSourceMenu((v) => !v)}
            onClose={() => setShowSourceMenu(false)}
          />
        </div>

        {/* Arrow + To */}
        <div className="flex flex-col items-center justify-end pb-2">
          <div className="flex items-center gap-1.5 text-text-muted mb-0.5">
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <path
                d="M0 5h12M8 1l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[0.65rem] uppercase tracking-wider font-display">
              To
            </span>
          </div>
          <span className="font-sans text-sm font-semibold text-accent capitalize">
            {targetLabel}
          </span>
        </div>
      </div>

      {/* Rate input */}
      <div>
        <label className="block font-sans text-sm uppercase text-text-muted mb-1">
          Rate (per hour)
        </label>
        <input
          type="number"
          value={newRate}
          onChange={(e) => setNewRate(e.target.value)}
          placeholder="0"
          min={0}
          className="input-terminal w-full text-sm px-2 py-1.5"
        />
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="btn-tactical primary w-full text-[0.65rem] py-1.5"
      >
        Add Transfer
      </button>
    </div>
  );
}

interface SourceRegionSelectorProps {
  value: RegionId;
  options: { value: RegionId; label: string }[];
  showMenu: boolean;
  onChange: (r: RegionId) => void;
  onToggle: () => void;
  onClose: () => void;
}

function SourceRegionSelector({
  value,
  options,
  showMenu,
  onChange,
  onToggle,
  onClose,
}: SourceRegionSelectorProps) {
  return (
    <div className="relative">
      <button
        type="button"
        className="input-terminal w-full flex items-center justify-between gap-2 px-3 py-2 text-sm"
        onClick={onToggle}
      >
        <span className="flex-1 text-left truncate text-text-primary">
          {options.find((o) => o.value === value)?.label ?? value}
        </span>
        <svg
          className="w-3.5 h-3.5 text-text-muted shrink-0"
          strokeWidth={2}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {showMenu && (
        <div
          className="autocomplete-dropdown"
          style={{ top: "100%", marginTop: "0.25rem" }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm font-sans text-text-primary hover:bg-accent/5 transition-colors"
              onClick={() => {
                onChange(opt.value as RegionId);
                onClose();
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
