import { useAppStore } from "@/store";
import type { MetaStorageTransfer } from "@/types";
import { useState } from "react";
import CollapsiblePanel from "../ui/CollapsiblePanel";
import { TransferForm } from "./TransferForm";
import { TransferRow } from "./TransferRow";

export default function MetastorageTransfer() {
  const { plan, addMetastorageTransfer, removeMetastorageTransfer } =
    useAppStore();
  const activeRegion = useAppStore((s) => s.activeRegion);
  const { activeTransfers } = plan.regionalTransfer;

  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = (transfer: MetaStorageTransfer) => {
    addMetastorageTransfer(transfer);
    setShowAddForm(false);
  };

  return (
    <CollapsiblePanel title="Metastorage Transfer">
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-sm text-text-secondary uppercase tracking-wider">
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

          {showAddForm && (
            <TransferForm
              activeRegion={activeRegion}
              onAdd={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {activeTransfers.length === 0 && !showAddForm ? (
            <p className="font-display text-xs text-text-muted text-center py-2">
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
