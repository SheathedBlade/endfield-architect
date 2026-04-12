import { ITEM_MAP, REGION_MAP } from "@/data/loader";
import type { MetaStorageTransfer } from "@/types";
import { X } from "lucide-react";

interface TransferRowProps {
  transfer: MetaStorageTransfer;
  onRemove: () => void;
}

export function TransferRow({ transfer, onRemove }: TransferRowProps) {
  const itemName =
    ITEM_MAP.get(transfer.itemId)?.displayName ?? transfer.itemId;
  const fromName =
    REGION_MAP.get(transfer.sourceRegion)?.name ?? transfer.sourceRegion;
  const toName =
    REGION_MAP.get(transfer.destinationRegion)?.name ??
    transfer.destinationRegion;

  return (
    <div className="data-row">
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
