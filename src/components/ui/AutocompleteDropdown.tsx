import { Search, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface AutocompleteOption<T> {
  value: T;
  label: string;
}

interface AutocompleteDropdownProps<T> {
  options: AutocompleteOption<T>[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (opt: AutocompleteOption<T>) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  icon?: LucideIcon;
  searchRef?: React.RefObject<HTMLInputElement | null>;
  disabled?: boolean;
}

export default function AutocompleteDropdown<T>({
  options,
  searchQuery,
  onSearchChange,
  onSelect,
  onKeyDown,
  placeholder = "Search...",
  icon: Icon = Search,
  searchRef,
  disabled = false,
}: AutocompleteDropdownProps<T>) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown && e.key !== "Enter") return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && options[highlightedIndex]) {
      e.preventDefault();
      onSelect(options[highlightedIndex]);
      setShowDropdown(false);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    } else if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center input-terminal w-full px-0">
        <Icon className="w-4 h-4 text-text-muted ml-3 shrink-0" strokeWidth={2} />
        <input
          ref={searchRef}
          className="flex-1 bg-transparent border-none outline-none text-text-primary font-sans text-sm px-2 py-2"
          type="text"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => !disabled && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        />
      </div>
      {showDropdown && options.length > 0 && (
        <div className="autocomplete-dropdown">
          {options.map((opt, i) => (
            <button
              key={String(opt.value)}
              type="button"
              className={`w-full text-left px-3 py-1.5 text-sm font-sans transition-colors ${
                i === highlightedIndex
                  ? "bg-accent/10 text-accent"
                  : "text-text-primary hover:bg-accent/5"
              }`}
              onMouseEnter={() => setHighlightedIndex(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(opt);
                setShowDropdown(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {showDropdown && options.length === 0 && (
        <div className="autocomplete-dropdown dropdown-empty">
          No items match "{searchQuery}"
        </div>
      )}
    </div>
  );
}