import { Outlet } from "react-router-dom";
import PatchSelector from "../../components/PatchSelector";
import MainNav from "../navigation/MainNav";

const AppShell = () => {
  return (
    <div className="app-content min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* ═══ HEADER ═══ */}
        <header className="mb-4 z-50 relative">
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
            <div className="flex items-center gap-4">
              <MainNav />
              <div className="w-px h-5 bg-border-mid" />
              <PatchSelector />
            </div>
          </div>
        </header>

        {/* ═══ PAGE CONTENT ═══ */}
        <Outlet />
      </div>
    </div>
  );
};

export default AppShell;
