import { REGION_MAP } from "@/data/loader";
import { useAppStore } from "@/store";
import { REGION_IDS, type RegionId } from "@/types";
import { Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="8"
      height="5"
      viewBox="0 0 8 5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`region-chevron ${open ? "region-chevron--open" : ""}`}
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

export function StatusRegionControl() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRegion = useAppStore((s) => s.activeRegion);
  const setActiveRegion = useAppStore((s) => s.setActiveRegion);

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const regionName = REGION_MAP.get(activeRegion)?.name ?? activeRegion;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className={`status-region-trigger ${open ? "status-region-trigger--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Region: ${regionName}`}
      >
        <Globe className="w-4 h-4 mr-0.5" strokeWidth={2} />
        <span className="font-mono text-sm text-accent font-bold">{regionName}</span>
        <ChevronIcon open={open} />
      </button>

      <div className={`region-panel ${open ? "region-panel--open" : ""}`}>
        <div className="region-panel-inner">
          <div className="region-panel-header">Region</div>
          {REGION_IDS.map((regionId) => {
            const region = REGION_MAP.get(regionId);
            const isActive = activeRegion === regionId;
            return (
              <button
                key={regionId}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`region-row ${isActive ? "region-row--active" : ""}`}
                onClick={() => {
                  setActiveRegion(regionId as RegionId);
                  setOpen(false);
                }}
              >
                <span>{region?.name ?? regionId}</span>
                {isActive && (
                  <span className="region-check">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
