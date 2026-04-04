import { REGION_MAP, SITES_BY_REGION } from "@/data/loader";
import { useAppStore } from "@/store";
import { REGION_IDS, SiteId, type RegionId } from "@/types";
import { Check, ChevronDown, ChevronRight, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const RegionSwitcher = () => {
  const { plan, setActiveRegion } = useAppStore();
  const [expanded, setExpanded] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const activeRegion = useAppStore((s) => s.activeRegion);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchRegion = (regionId: RegionId) => {
    setActiveRegion(regionId);
    setShowDropdown(false);
  };

  const toggleSite = (siteId: string) => {
    if (plan.unlockedSites.includes(siteId as SiteId)) {
      useAppStore.getState().lockSite(siteId as SiteId);
    } else {
      useAppStore.getState().unlockSite(siteId as SiteId);
    }
  };

  const currentSites = SITES_BY_REGION.get(activeRegion) ?? [];
  const coreSite = currentSites.find((s) => s.isCore);
  const subSites = currentSites.filter((s) => !s.isCore);
  const activeRegionName = REGION_MAP.get(activeRegion)?.name ?? activeRegion;

  return (
    <div className="panel">
      <div className="panel-header">Region & Site Control</div>
      <div className="panel-body">
        <div className="space-y-3">
          {/* Region selector */}
          <div className="relative" ref={containerRef}>
            <button
              type="button"
              className="flex items-center input-terminal w-full px-0 cursor-pointer"
              onClick={() => setShowDropdown((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={showDropdown}
            >
              <Globe
                className="w-4 h-4 text-text-muted ml-3 shrink-0"
                strokeWidth={2}
              />
              <span className="flex-1 text-text-primary font-sans text-sm px-2 py-2 tracking-wide text-left">
                {activeRegionName}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-text-muted mr-3 shrink-0 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                strokeWidth={2}
              />
            </button>
            {showDropdown && (
              <div className="autocomplete-dropdown">
                {REGION_IDS.map((regionId) => {
                  const region = REGION_MAP.get(regionId);
                  const isActive = activeRegion === regionId;
                  return (
                    <button
                      key={regionId}
                      type="button"
                      className={`w-full text-left px-3 py-1.5 text-sm font-sans transition-colors flex items-center justify-between ${
                        isActive
                          ? "bg-accent/10 text-accent"
                          : "text-text-primary hover:bg-accent/5"
                      }`}
                      onClick={() => switchRegion(regionId)}
                    >
                      <span className="tracking-wide">
                        {region?.name ?? regionId}
                      </span>
                      {isActive && (
                        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Site list for active region */}
          <div>
            <button
              type="button"
              onClick={() => setExpanded((p) => !p)}
              className="flex items-center gap-2 w-full py-1 font-display text-[0.65rem] text-text-muted uppercase tracking-wider hover:text-text-secondary transition-colors"
            >
              {expanded ? (
                <ChevronDown className="w-3 h-3" strokeWidth={2} />
              ) : (
                <ChevronRight className="w-3 h-3" strokeWidth={2} />
              )}
              <span>Sites</span>
            </button>

            <div className={`region-sites ${expanded ? "expanded" : ""}`}>
              <div className="region-sites-inner">
                <div className="ml-4 space-y-0.5 border-l border-border pl-3">
                  {coreSite && (
                    <div className="flex items-center gap-2 py-1.5 font-display text-xs">
                      <Check
                        className="w-3.5 h-3.5 text-accent shrink-0"
                        strokeWidth={2}
                      />
                      <span className="text-text-primary">{coreSite.name}</span>
                      <span className="text-text-dim text-[0.6rem] uppercase tracking-wider">
                        core
                      </span>
                    </div>
                  )}

                  {subSites.map((site) => {
                    const isActive = plan.unlockedSites.includes(
                      site.id as SiteId,
                    );
                    return (
                      <button
                        key={site.id}
                        type="button"
                        onClick={() => toggleSite(site.id)}
                        className="flex items-center gap-2 w-full py-1.5 font-display text-xs transition-colors"
                      >
                        <div
                          className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? "border-accent bg-accent/20"
                              : "border-border"
                          }`}
                        >
                          {isActive && (
                            <Check
                              className="w-2.5 h-2.5 text-accent"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                        <span
                          className={
                            isActive ? "text-text-primary" : "text-text-muted"
                          }
                        >
                          {site.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionSwitcher;
