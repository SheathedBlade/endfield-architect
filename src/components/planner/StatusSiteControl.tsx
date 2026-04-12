import { SITES_BY_REGION } from "@/data/loader";
import { Check } from "lucide-react";
import { useAppStore } from "@/store";
import { SiteId } from "@/types";
import { useEffect, useRef, useState } from "react";

export function StatusSiteControl() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRegion = useAppStore((s) => s.activeRegion);
  const { plan, lockSite, unlockSite } = useAppStore();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentSites = SITES_BY_REGION.get(activeRegion) ?? [];
  const coreSite = currentSites.find((s) => s.isCore);
  const subSites = currentSites.filter((s) => !s.isCore);
  const activeCount = plan.unlockedSites.length;

  const toggleSite = (siteId: string) => {
    if (plan.unlockedSites.includes(siteId as SiteId)) {
      lockSite(siteId as SiteId);
    } else {
      unlockSite(siteId as SiteId);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className={`status-site-trigger ${open ? "status-site-trigger--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Sites: ${activeCount} unlocked`}
      >
        <span className="font-mono text-sm text-accent font-bold">{activeCount}</span>
        <span className="font-display text-[0.65rem] uppercase tracking-widest text-text-muted">
          Sites
        </span>
        <ChevronIcon open={open} />
      </button>

      <div className={`sites-panel ${open ? "sites-panel--open" : ""}`}>
        <div className="sites-panel-inner">
          <div className="sites-panel-header">Sites</div>

          {coreSite && (
            <div className="sites-row sites-row--core">
              <div className="sites-checkbox sites-checkbox--on">
                <Check className="w-2.5 h-2.5 text-accent" strokeWidth={3} />
              </div>
              <span className="sites-name">{coreSite.name}</span>
              <span className="sites-badge">core</span>
            </div>
          )}

          {subSites.map((site) => {
            const isActive = plan.unlockedSites.includes(site.id as SiteId);
            return (
              <button
                key={site.id}
                type="button"
                className={`sites-row ${isActive ? "sites-row--active" : "sites-row--inactive"}`}
                onClick={() => toggleSite(site.id)}
                aria-pressed={isActive}
              >
                <div className={`sites-checkbox ${isActive ? "sites-checkbox--on" : ""}`}>
                  {isActive && (
                    <Check className="w-2.5 h-2.5 text-accent" strokeWidth={3} />
                  )}
                </div>
                <span className="sites-name">{site.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="8"
      height="5"
      viewBox="0 0 8 5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`sites-chevron ${open ? "sites-chevron--open" : ""}`}
    >
      <path
        d="M1 1L4 4L7 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
