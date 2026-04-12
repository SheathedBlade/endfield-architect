import { AlertCircle, AlertTriangle, Diamond } from "lucide-react";
import { useEffect } from "react";
import GoalInput from "../components/GoalInput";
import MetastorageTransfer from "../components/transfers/MetastorageTransfer";
import PlannerTools from "../components/PlannerTools";
import { StatusSiteControl } from "../components/planner/StatusSiteControl";
import { StatusRegionControl } from "../components/planner/StatusRegionControl";
import ResultsTree from "../components/ResultsTree";
import { useAppStore } from "../store";
import { loadPlanFromURL } from "../utils/persistence";

const PlannerPage = () => {
  const { plan, importPlan } = useAppStore();

  useEffect(() => {
    const loaded = loadPlanFromURL();
    if (loaded) importPlan(loaded);
  }, [importPlan]);

  const goalCount = plan.goals.length;

  return (
    <div className="page-transition">
      {/* ═══ STATUS BAR ═══ */}
      <div className="status-bar-wrapper mb-4">
        <div className="status-bar flex items-center gap-4 py-2 px-3 bg-bg-surface border border-border">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[0.65rem] uppercase tracking-widest text-text-muted">Goals</span>
            <span className="font-mono text-sm text-accent font-bold">{goalCount}</span>
          </div>
          <div className="w-px h-4 bg-border-mid" />
          <StatusRegionControl />
          <div className="w-px h-4 bg-border-mid" />
          <StatusSiteControl />
        </div>
      </div>

      {/* ═══ ERRORS ═══ */}
      {(() => {
        const capWarnings = plan.errors.filter((e) => e.includes("capped"));
        const solveErrors = plan.errors.filter((e) => !e.includes("capped"));

        return (
          <div className="mb-4 space-y-2" aria-live="polite">
            {/* Cap warnings — amber */}
            {capWarnings.map((err, i) => (
              <div
                key={`cap-${i}`}
                className="flex items-start gap-2.5 px-3 py-2.5 rounded bg-status-warning/10 border border-status-warning/20"
              >
                <AlertTriangle
                  className="w-4 h-4 text-status-warning shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <span className="font-display text-sm text-status-warning leading-snug">
                  {err}
                </span>
              </div>
            ))}
            {/* Solve errors — red */}
            {solveErrors.map((err, i) => (
              <div
                key={`err-${i}`}
                className="flex items-start gap-2.5 px-3 py-2.5 rounded bg-status-error/10 border border-status-error/20"
              >
                <AlertCircle
                  className="w-4 h-4 text-status-error shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <span className="font-display text-sm text-status-error leading-snug">
                  {err}
                </span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr] gap-4">
        {/* Left column: controls */}
        <div className="space-y-4">
          <GoalInput />
          <PlannerTools />
          <MetastorageTransfer />
        </div>

        {/* Right column: results */}
        <div>
          {plan.nodes.length > 0 ? (
            <ResultsTree nodes={plan.nodes} />
          ) : (
            <div className="panel min-h-100 flex items-center justify-center">
              <div className="text-center max-w-xs px-4">
                <div className="originium-pulse-wrap w-12 h-12 mx-auto mb-4">
                  <Diamond
                    className="w-full h-full text-text-muted"
                    strokeWidth={1}
                  />
                </div>
                <p className="font-display text-sm text-text-muted tracking-wider mb-1">
                  YOUR PRODUCTION PLAN
                </p>
                <p className="font-sans text-xs text-text-dim leading-relaxed">
                  Add goals in the left panel. Your production breakdown — facilities, counts, and input requirements — will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlannerPage;
