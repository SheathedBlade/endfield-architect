import { useAppStore } from "@/store";
import {
  exportPlan,
  importPlan as importPlanFromHash,
} from "@/utils/persistence";
import { Copy, Download, Upload } from "lucide-react";
import { useRef, useState } from "react";

type ImportState = "idle" | "success" | "error";

export const ImportExportControls = () => {
  const { plan, importPlan } = useAppStore();
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [importState, setImportState] = useState<ImportState>("idle");
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = async () => {
    const hash = exportPlan(plan);
    const url = new URL(window.location.href);
    url.searchParams.set("plan", hash);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      // fallback: select text
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

  const handleImport = () => {
    const trimmed = importText.trim();
    if (!trimmed) return;

    // Extract hash from URL or use raw hash
    let hash = trimmed;
    try {
      const url = new URL(trimmed);
      hash = url.searchParams.get("plan") ?? trimmed;
    } catch {
      // not a URL, use as-is
    }

    const loaded = importPlanFromHash(hash);
    if (!loaded) {
      setImportState("error");
      setTimeout(() => setImportState("idle"), 3000);
      return;
    }

    importPlan(loaded);
    setImportState("success");
    setImportText("");
    setShowImport(false);
    setTimeout(() => setImportState("idle"), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="font-display text-xs text-text-secondary uppercase tracking-wider">
        Import / Export
      </span>

      <button
        type="button"
        onClick={handleCopy}
        className="btn-tactical w-full flex border border-accent-border/20 items-center justify-center gap-2 text-[0.65rem]"
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
          className="btn-tactical ghost w-full flex items-center justify-center gap-2 text-[0.65rem]"
        >
          <Download className="w-3 h-3" strokeWidth={2} />
          Import Plan
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste share URL or plan hash..."
            className="input-terminal w-full px-2 py-1.5 text-sm resize-none h-16"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleImport}
              disabled={!importText.trim()}
              className="btn-tactical primary flex-1 text-[0.6rem] py-1"
            >
              Import
            </button>
            <button
              type="button"
              onClick={() => {
                setShowImport(false);
                setImportText("");
                setImportState("idle");
              }}
              className="btn-tactical ghost flex-1 text-[0.6rem] py-1"
            >
              Cancel
            </button>
          </div>
          {importState === "error" && (
            <p className="font-display text-[0.65rem] text-status-error">
              Invalid plan — could not parse
            </p>
          )}
          {importState === "success" && (
            <p className="font-display text-[0.65rem] text-green-400">
              Plan imported successfully
            </p>
          )}
        </div>
      )}
    </div>
  );
};
