import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type TabId = "goals" | "tools" | "transfers" | "summary";

interface PlannerTabsModalProps {
  open: boolean;
  tab: TabId | null;
  onClose: () => void;
  children: React.ReactNode;
}

const PANEL_TITLES: Record<TabId, string> = {
  goals: "Goals",
  tools: "Tools",
  transfers: "Transfers",
  summary: "Summary",
};

export const PlannerTabsModal = function PlannerTabsModal({
  open,
  tab,
  onClose,
  children,
}: PlannerTabsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstFocusRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !tab) return null;

  return (
    <div
      className="planner-tabs-overlay"
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={PANEL_TITLES[tab]}
    >
      <div className="planner-tabs-modal">
        <div className="planner-tabs-modal__header">
          <span className="planner-tabs-modal__title">
            {PANEL_TITLES[tab]}
          </span>
          <button
            ref={firstFocusRef}
            type="button"
            className="planner-tabs-modal__close"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
        <div className="planner-tabs-modal__body">
          {children}
        </div>
      </div>
    </div>
  );
}