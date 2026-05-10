import { Outlet } from "react-router-dom";
import PatchSelector from "../../components/PatchSelector";
import MainNav from "../navigation/MainNav";

const AppShell = () => {
  return (
    <div className="app-content app-shell-content--workspace">
      {/* ═══ HEADER ═══ */}
      <header className="app-header">
        <div className="app-header__inner">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="status-dot active" />
              <h1 className="font-display text-xl uppercase font-bold text-accent">
                Endfield Architect
              </h1>
            </div>
            <p className="font-display text-sm text-text-muted tracking-wider ml-5">
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
      <div className="app-shell-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AppShell;
