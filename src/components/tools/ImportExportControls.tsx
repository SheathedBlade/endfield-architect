import { Copy, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store";
import {
  exportPlan,
  importPlan as importPlanFromHash,
} from "@/utils/persistence";

type ImportState = "idle" | "success" | "error";

interface ImportExportControlsProps {
  compact?: boolean;
}

export const ImportExportControls = ({ compact = false }: ImportExportControlsProps) => {
  const { plan, importPlan } = useAppStore();
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [importState, setImportState] = useState<ImportState>("idle");
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowImport(false);
        setShowImportConfirm(false);
        setImportText("");
        setImportState("idle");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowImport(false);
        setShowImportConfirm(false);
        setImportText("");
        setImportState("idle");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleCopy = async () => {
    const hash = exportPlan(plan);
    const url = new URL(window.location.href);
    url.searchParams.set("plan", hash);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = url.toString();
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  const parseHash = (raw: string): string => {
    const trimmed = raw.trim();
    try {
      const url = new URL(trimmed);
      return url.searchParams.get("plan") ?? trimmed;
    } catch {
      return trimmed;
    }
  };

  const handleImport = () => {
    const hash = parseHash(importText);
    const loaded = importPlanFromHash(hash);
    if (!loaded) {
      setImportState("error");
      setTimeout(() => setImportState("idle"), 3000);
      return;
    }
    setShowImportConfirm(true);
  };

  const confirmImport = () => {
    const hash = parseHash(importText);
    const loaded = importPlanFromHash(hash);
    if (!loaded) return;
    importPlan(loaded);
    setImportState("success");
    setImportText("");
    setShowImport(false);
    setShowImportConfirm(false);
    setTimeout(() => setImportState("idle"), 2000);
  };

  const resetImport = () => {
    setShowImport(false);
    setShowImportConfirm(false);
    setImportText("");
    setImportState("idle");
  };

  if (compact) {
    return (
      <div className="relative" ref={containerRef}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="status-plan-btn"
            aria-label="Copy plan share URL"
          >
            {copyState === "copied" ? (
              <span className="type-label type-label--ok">
                Copied
              </span>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                <span className="type-label">
                  Copy
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowImport((o) => !o)}
            className={`status-plan-btn ${showImport ? "status-plan-btn--active" : ""}`}
            aria-expanded={showImport}
            aria-label="Import plan"
          >
            <Upload className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="type-label">
              Import
            </span>
          </button>
        </div>

        <div className={`status-plan-popover ${showImport ? "status-plan-popover--open" : ""}`}>
          <div className="status-plan-popover-inner">
            {!showImportConfirm ? (
              <div className="space-y-2">
                <p className="status-plan-popover-label">Import Plan</p>
                <textarea
                  ref={textareaRef}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste share URL or plan hash..."
                  aria-label="Import plan hash or URL"
                  className="input-terminal w-full px-2 py-1.5 text-sm resize-none h-14"
                  autoFocus
                />
                {importState === "error" && (
                  <p className="font-sans text-sm text-status-error leading-snug">
                    Could not read this plan. Check the URL or hash and try again.
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!importText.trim()}
                    className="btn-tactical primary flex-1 py-1"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={resetImport}
                    className="btn-tactical ghost flex-1 py-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-sans text-xs text-text-secondary leading-relaxed">
                  Import this plan? Your current{" "}
                  <strong className="text-text-primary">
                    {plan.goals.length} goal{plan.goals.length !== 1 ? "s" : ""}
                  </strong>{" "}
                  will be replaced.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={confirmImport}
                    className="btn-tactical primary flex-1 py-1"
                  >
                    Replace plan
                  </button>
                  <button
                    type="button"
                    onClick={resetImport}
                    className="btn-tactical ghost flex-1 py-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="type-label">
        Share Plan
      </span>

      <button
        type="button"
        onClick={handleCopy}
        className="btn-tactical w-full flex border border-accent-border/20 items-center justify-center gap-2 text-xs"
      >
        {copyState === "copied" ? (
          <>
            <Copy className="w-3 h-3" strokeWidth={2} />
            Copied!
          </>
        ) : (
          <>
            <Upload className="w-3 h-3" strokeWidth={2} />
            Copy Share URL
          </>
        )}
      </button>

      {!showImport ? (
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="btn-tactical ghost w-full flex items-center justify-center gap-2 text-xs"
        >
          <Upload className="w-3 h-3" strokeWidth={2} />
          Import a Plan
        </button>
      ) : !showImportConfirm ? (
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste share URL or plan hash..."
            aria-label="Import plan hash or URL"
            className="input-terminal w-full px-2 py-1.5 text-sm resize-none h-16"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleImport}
              disabled={!importText.trim()}
              className="btn-tactical primary flex-1 py-1"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={resetImport}
              className="btn-tactical ghost flex-1 py-1"
            >
              Cancel
            </button>
          </div>
          {importState === "error" && (
            <p className="font-sans text-xs text-status-error leading-snug">
              Could not read this plan. Check the URL or hash and try again.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="font-sans text-xs text-text-secondary leading-relaxed">
            Import this plan? Your current{" "}
            <strong className="text-text-primary">
              {plan.goals.length} goal
              {plan.goals.length !== 1 ? "s" : ""}
            </strong>{" "}
            will be replaced.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmImport}
              className="btn-tactical primary flex-1 py-1"
            >
              Replace plan
            </button>
            <button
              type="button"
              onClick={resetImport}
              className="btn-tactical ghost flex-1 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};