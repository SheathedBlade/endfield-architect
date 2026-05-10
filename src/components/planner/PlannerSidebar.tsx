import { memo, type ReactNode } from "react";

interface PlannerSidebarProps {
  side: "left" | "right";
  collapsed: boolean;
  onToggle: () => void;
  title?: string;
  children: ReactNode;
}

export const PlannerSidebar = memo(function PlannerSidebar({
  side,
  collapsed,
  onToggle,
  title,
  children,
}: PlannerSidebarProps) {
  const isLeft = side === "left";

  return (
    <div
      className={`planner-sidebar planner-sidebar--${side} ${collapsed ? "planner-sidebar--collapsed" : ""}`}
      style={{
        [isLeft ? "left" : "right"]: 0,
      }}
    >
      {/* Sidebar header / collapse handle */}
      <div className="planner-sidebar__header">
        {!collapsed && title && (
          <span className="planner-sidebar__title">{title}</span>
        )}
        <button
          type="button"
          className="planner-sidebar__toggle"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: collapsed
                ? isLeft
                  ? "rotate(0deg)"
                  : "rotate(180deg)"
                : isLeft
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
              transition: "transform 200ms ease",
            }}
          >
            <path
              d="M2 1L5 5L2 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Sidebar content */}
      {!collapsed && (
        <div className="planner-sidebar__content">
          {children}
        </div>
      )}
    </div>
  );
});