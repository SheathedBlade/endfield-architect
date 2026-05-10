import { useAppStore } from "@/store";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { ImportExportControls } from "../tools/ImportExportControls";
import { StatusRegionControl } from "./StatusRegionControl";
import { StatusSiteControl } from "./StatusSiteControl";

const EMPTY_FAILURES: Array<{ message: string; suggestion?: string }> = [];

interface PlannerHudProps {
  onResetView?: () => void;
}

export const PlannerHud = memo(function PlannerHud({
  onResetView,
}: PlannerHudProps) {
  const goalCount = useAppStore((s) => s.plan.goals.length);
  const errors = useAppStore((s) => s.plan.errors);
  const capWarnings = errors.filter((e) => e.includes("capped"));
  const solveErrors = errors.filter((e) => !e.includes("capped"));
  const layout = useAppStore((s) => s.plan.layout);
  const layoutFailures = layout?.feasibility.failures ?? EMPTY_FAILURES;

  const [problemsOpen, setProblemsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalIssues =
    solveErrors.length + capWarnings.length + layoutFailures.length;

  useEffect(() => {
    if (!problemsOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setProblemsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [problemsOpen]);

  return (
    <div className="planner-hud">
      <div className="planner-hud__left">
        <div className="planner-hud__stat">
          <span className="planner-hud__stat-label">Goals</span>
          <span className="planner-hud__stat-value">{goalCount}</span>
        </div>
        <div className="planner-hud__divider" />
        <StatusRegionControl />
        <div className="planner-hud__divider" />
        <StatusSiteControl />
      </div>

      <div className="planner-hud__right">
        {onResetView && (
          <>
            <button
              type="button"
              className="planner-hud__reset-btn"
              onClick={onResetView}
              title="Reset view"
            >
              Reset view
            </button>
            <div className="planner-hud__divider" />
          </>
        )}
        <ImportExportControls compact />
        <div className="planner-hud__divider" />
        {totalIssues > 0 && (
          <div className="relative" ref={containerRef}>
            <button
              type="button"
              className={`planner-hud__problems-trigger${problemsOpen ? " planner-hud__problems-trigger--open" : ""}`}
              onClick={() => setProblemsOpen((o) => !o)}
              aria-expanded={problemsOpen}
              aria-label={`${solveErrors.length} errors, ${capWarnings.length + layoutFailures.length} warnings`}
            >
              {solveErrors.length > 0 && (
                <span className="planner-hud__problems-count planner-hud__problems-count--error">
                  <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>{solveErrors.length}</span>
                </span>
              )}
              {capWarnings.length + layoutFailures.length > 0 && (
                <span className="planner-hud__problems-count planner-hud__problems-count--warn">
                  <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>{capWarnings.length + layoutFailures.length}</span>
                </span>
              )}
            </button>

            {problemsOpen && (
              <div className="planner-hud__problems-panel">
                {solveErrors.length > 0 && (
                  <div className="planner-hud__problems-section">
                    <div className="planner-hud__problems-section-header planner-hud__problems-section-header--error">
                      <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Errors</span>
                    </div>
                    {solveErrors.map((err, i) => (
                      <div
                        key={i}
                        className="planner-hud__problems-item planner-hud__problems-item--error"
                      >
                        {err}
                      </div>
                    ))}
                  </div>
                )}
                {capWarnings.length + layoutFailures.length > 0 && (
                  <div className="planner-hud__problems-section">
                    <div className="planner-hud__problems-section-header planner-hud__problems-section-header--warn">
                      <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Warnings</span>
                    </div>
                    {capWarnings.map((warn, i) => (
                      <div
                        key={`cap-${i}`}
                        className="planner-hud__problems-item planner-hud__problems-item--warn"
                      >
                        {warn}
                      </div>
                    ))}
                    {layoutFailures.map((f, i) => (
                      <div
                        key={`lay-${i}`}
                        className="planner-hud__problems-item planner-hud__problems-item--warn"
                      >
                        {f.message}
                        {f.suggestion ? (
                          <span className="planner-hud__problems-suggestion">
                            {" "}
                            → {f.suggestion}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
