import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

interface CollapsiblePanelProps {
  title: string;
  defaultCollapsed?: boolean;
  children: ReactNode;
  variant?: "panel" | "sidebar";
}

export default function CollapsiblePanel({
  title,
  defaultCollapsed = false,
  children,
  variant = "panel",
}: CollapsiblePanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div className={`collapsible-panel collapsible-panel--${variant} ${collapsed ? "collapsed" : ""}`}>
      <button
        type="button"
        className="collapsible-panel__header"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-controls={`panel-content-${title.replace(/\s+/g, "-").toLowerCase()}`}
      >
        <span>{title}</span>
        <ChevronDown
          className={`collapsible-panel__chevron ${collapsed ? "collapsed" : ""}`}
          strokeWidth={2}
        />
      </button>
      <div className="collapsible-panel__body">
        <div className="collapsible-panel__body-inner">
          <div
            id={`panel-content-${title.replace(/\s+/g, "-").toLowerCase()}`}
            className="collapsible-panel__content"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}