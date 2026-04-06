import { ITEM_MAP, REGION_MAP } from "@/data/loader";
import { useAppStore } from "@/store";
import type { ItemId, MetaStorageTransfer, RegionId } from "@/types";
import { REGION_IDS } from "@/types/constants";
import { ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import AutocompleteDropdown from "./ui/AutocompleteDropdown";
import CollapsiblePanel from "./ui/CollapsiblePanel";

const TRANSFERABLE_RAW_ORES = new Set<ItemId>([
  "originium_ore",
  "amethyst_ore",
  "ferrium_ore",
  "cuprium_ore",
]);

const ALL_REGIONS = REGION_IDS.map((rid) => ({
  value: rid,
  label: REGION_MAP.get(rid)?.name ?? rid,
}));

function buildTransferableItems() {
  return Array.from(ITEM_MAP.values())
    .filter(
      (item) =>
        !item.isLiquid &&
        (!item.isRaw || TRANSFERABLE_RAW_ORES.has(item.id as ItemId)),
    )
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map((item) => ({ value: item.id as ItemId, label: item.displayName }));
}

export default function MetastorageTransfer() {
  const { plan, addMetastorageTransfer, removeMetastorageTransfer } =
    useAppStore();
  const activeRegion = useAppStore((s) => s.activeRegion);
  const { activeTransfers } = plan.regionalTransfer;

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<ItemId | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [newRate, setNewRate] = useState("");
  const [showSourceMenu, setShowSourceMenu] = useState(false);

  const targetLabel =
    REGION_MAP.get(activeRegion as RegionId)?.name ?? activeRegion;
  const sourceRegions = ALL_REGIONS.filter((opt) => opt.value !== activeRegion);
  const [newSource, setNewSource] = useState<RegionId>(sourceRegions[0]?.value);

  const allTransferItems = useMemo(buildTransferableItems, []);

  const filteredTransferItems = useMemo(() => {
    if (!itemSearch) return allTransferItems;
    const q = itemSearch.trimEnd().toLowerCase();
    return allTransferItems.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [allTransferItems, itemSearch]);

  const handleAdd = () => {
    if (!newItem || !newRate || Number(newRate) <= 0) return;
    addMetastorageTransfer({
      itemId: newItem,
      sourceRegion: newSource,
      destinationRegion: activeRegion as RegionId,
      amountPerHour: Number(newRate),
    });
    setShowAddForm(false);
    setNewItem(null);
    setItemSearch("");
    setNewRate("");
  };

  return (
    <CollapsiblePanel title="Metastorage Transfer">
      <div className="space-y-3">
        {/* Active Transfers */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-sm text-text-muted uppercase tracking-wider">
              Active Transfers
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm((s) => !s)}
              className="btn-tactical ghost text-[0.65rem] px-2 py-1"
            >
              {showAddForm ? "Cancel" : "+ Add"}
            </button>
          </div>

          {/* Add transfer form */}
          {showAddForm && (
            <div className="border border-border rounded p-3 space-y-2 mb-3 bg-bg-deep/30">
              {/* Item selector */}
              <div>
                <label className="block font-sans text-sm text-text-muted mb-1">
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
                  <div className="relative">
                    <button
                      type="button"
                      className="input-terminal w-full flex items-center justify-between gap-2 px-3 py-2 text-sm"
                      onClick={() => setShowSourceMenu((v) => !v)}
                    >
                      <span className="flex-1 text-left truncate text-text-primary">
                        {REGION_MAP.get(newSource)?.name ?? newSource}
                      </span>
                      <ChevronDown
                        className="w-3.5 h-3.5 text-text-muted shrink-0"
                        strokeWidth={2}
                      />
                    </button>
                    {showSourceMenu && (
                      <div
                        className="autocomplete-dropdown"
                        style={{ top: "100%", marginTop: "0.25rem" }}
                      >
                        {sourceRegions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className="w-full text-left px-3 py-1.5 text-sm font-sans text-text-primary hover:bg-accent/5 transition-colors"
                            onClick={() => {
                              setNewSource(opt.value as RegionId);
                              setShowSourceMenu(false);
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
                <label className="block font-sans text-sm text-text-muted mb-1">
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
          )}

          {/* Transfer list */}
          {activeTransfers.length === 0 ? (
            <p className="text-sm text-text-muted italic py-2">
              No active transfers
            </p>
          ) : (
            <div className="space-y-1.5">
              {activeTransfers.map((t: MetaStorageTransfer) => (
                <TransferRow
                  key={t.itemId}
                  transfer={t}
                  onRemove={() => removeMetastorageTransfer(t.itemId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </CollapsiblePanel>
  );
}

function TransferRow({
  transfer,
  onRemove,
}: {
  transfer: MetaStorageTransfer;
  onRemove: () => void;
}) {
  const itemName =
    ITEM_MAP.get(transfer.itemId)?.displayName ?? transfer.itemId;
  const fromName =
    REGION_MAP.get(transfer.sourceRegion)?.name ?? transfer.sourceRegion;
  const toName =
    REGION_MAP.get(transfer.destinationRegion)?.name ??
    transfer.destinationRegion;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded bg-bg-deep border border-border">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-text-primary font-display truncate">
          {itemName}
        </div>
        <div className="text-sm text-text-muted font-sans">
          {fromName} → {toName}
        </div>
      </div>
      <div className="text-sm text-accent font-mono shrink-0">
        {transfer.amountPerHour}/hr
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-status-error hover:text-status-error/80 transition-colors shrink-0"
        aria-label={`Remove ${itemName} transfer`}
      >
        <X className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
}
