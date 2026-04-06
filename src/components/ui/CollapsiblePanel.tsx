import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

interface CollapsiblePanelProps {
  title: string;
  defaultCollapsed?: boolean;
  children: ReactNode;
}

export default function CollapsiblePanel({
  title,
  defaultCollapsed = false,
  children,
}: CollapsiblePanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`panel ${collapsed ? "collapsed" : ""}`}>
      <button
        type="button"
        className="panel-header w-full text-left cursor-pointer"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span>{title}</span>
        <ChevronDown
          className={`text-text-secondary w-4 h-4 ml-auto transition-transform duration-200 ${
            collapsed ? "rotate-90" : ""
          }`}
          strokeWidth={2}
        />
      </button>
      <div className="panel-body">
        <div className="panel-body-inner">
          <div className="panel-content">{children}</div>
        </div>
      </div>
    </div>
  );
}