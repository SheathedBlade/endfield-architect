import { AlertCircle, Diamond } from "lucide-react";
import { useEffect } from "react";
import GoalInput from "./components/GoalInput";
import PatchSelector from "./components/PatchSelector";
import RegionSwitcher from "./components/RegionSwitcher";
import ResultsTree from "./components/ResultsTree";
import { useAppStore } from "./store";
import "./styles/globals.css";
import { loadPlanFromURL } from "./utils/persistence";

function App() {
  const { plan } = useAppStore();

  useEffect(() => {
    const loaded = loadPlanFromURL();
    if (loaded) useAppStore.setState({ plan: loaded });
  }, []);

  const nodeCount = plan.nodes.length;
  const goalCount = plan.goals.length;

  return (
    <div className="app-content min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* ═══ HEADER ═══ */}
        <header className="mb-6 z-50 relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="status-dot active" />
                <h1 className="font-display text-2xl uppercase font-bold text-accent">
                  Endfield Architect
                </h1>
              </div>
              <p className="font-display text-xs text-text-muted tracking-wider ml-5">
                AIC PRODUCTION PLANNING SYSTEM
              </p>
            </div>
            <div className="flex items-center gap-6">
              <PatchSelector />
              <div className="flex items-center gap-4 font-display text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <span className="text-secondary">GOALS:</span>
                  <span className="text-accent">{goalCount}</span>
                </div>
                <div className="w-px h-4 bg-border-mid" />
                <div className="flex items-center gap-2">
                  <span className="text-secondary">NODES:</span>
                  <span className="text-accent">{nodeCount}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="divider mt-4" />
        </header>

        {/* ═══ ERRORS ═══ */}
        {plan.errors.length > 0 && (
          <div className="mb-4 space-y-2">
            {plan.errors.map((err, i) => (
              <div
                key={i}
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
        )}

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
          {/* Left column: controls */}
          <div className="space-y-4">
            <GoalInput />
            <RegionSwitcher />
          </div>

          {/* Right column: results */}
          <div>
            {nodeCount > 0 ? (
              <ResultsTree nodes={plan.nodes} />
            ) : (
              <div className="panel min-h-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="originium-pulse-wrap w-16 h-16 mx-auto mb-4">
                    <Diamond
                      className="w-full h-full text-text-muted"
                      strokeWidth={1}
                    />
                  </div>
                  <p className="font-display text-sm text-text-muted tracking-wider">
                    NO PRODUCTION DATA
                  </p>
                  <p className="font-display text-xs text-text-muted mt-2 tracking-wider">
                    ADD GOALS TO SEE RESULTS
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
