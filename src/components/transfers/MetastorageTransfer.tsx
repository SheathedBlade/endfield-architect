import { useAppStore } from "@/store";
import type { MetaStorageTransfer } from "@/types";
import { useState } from "react";
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
    <div className="meta-transfer">
      <div className="meta-transfer__header">
        <span className="meta-transfer__label">Metastorage Transfer</span>
        <button
          type="button"
          onClick={() => setShowAddForm((s) => !s)}
          className="meta-transfer__add-btn"
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
        <p className="meta-transfer__empty">No active transfers</p>
      ) : (
        <div className="meta-transfer__list">
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
  );
}