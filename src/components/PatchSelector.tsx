import { useAppStore } from "@/store";
import { PATCHES } from "@/types";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PatchSelector = () => {
  const activePatch = useAppStore((s) => s.activePatch);
  const setPatch = useAppStore((s) => s.setPatch);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchPatch = (patch: (typeof PATCHES)[number]) => {
    setPatch(patch);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative z-10000">
      <button
        type="button"
        className="flex items-center gap-1.5 text-xs font-display text-text-muted hover:text-accent transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-[0.65rem] uppercase tracking-widest">Patch</span>
        <span className="font-mono text-accent">{activePatch}</span>
        <ChevronDown
          className={`w-3 h-3 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div className="autocomplete-dropdown w-max min-w-max top-full mt-2 right-0 z-10000">
          {[...PATCHES].reverse().map((patch) => {
            const isActive = activePatch === patch;
            return (
              <button
                key={patch}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm font-mono transition-colors flex items-center justify-between gap-2 ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-text-primary hover:bg-accent/5"
                }`}
                onClick={() => switchPatch(patch)}
              >
                <span>Patch {patch}</span>
                {isActive && (
                  <span className="text-[0.6rem] uppercase tracking-widest text-accent/50 shrink-0">
                    active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatchSelector;
