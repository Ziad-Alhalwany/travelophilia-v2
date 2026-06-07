// src/components/partners/MultiSelectChips.jsx
// TP-OTA-FE-EXTRANET-003 — Reusable searchable multi-select with dismissible badge chips
// Built entirely from shadcn/ui primitives (Popover + Input + Badge)

import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { X, Search, ChevronDown } from "lucide-react";

/**
 * MultiSelectChips — Searchable multi-select with badge chips.
 *
 * Props:
 * @param {Array<{id: number, label: string}>} options — Available items
 * @param {number[]} selected — Currently selected IDs
 * @param {(ids: number[]) => void} onChange — Selection change handler
 * @param {string} [placeholder="Select items..."]
 * @param {boolean} [searchable=true]
 * @param {string} [className]
 */
export default function MultiSelectChips({
  options = [],
  selected = [],
  onChange,
  placeholder = "Select items...",
  searchable = true,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, search]);

  function toggleItem(id) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  function removeItem(id, e) {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== id));
  }

  const selectedLabels = useMemo(() => {
    const map = new Map(options.map((o) => [o.id, o.label]));
    return selected.map((id) => ({ id, label: map.get(id) || `#${id}` }));
  }, [options, selected]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger / chips display */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          "flex min-h-[2.5rem] w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors",
          "hover:border-ring/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          open && "border-ring ring-2 ring-ring/30"
        )}
      >
        {selectedLabels.length > 0 ? (
          selectedLabels.map(({ id, label }) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/25"
            >
              {label}
              <button
                type="button"
                onClick={(e) => removeItem(id, e)}
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-primary/25"
              >
                <X className="size-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown
          className={cn(
            "ml-auto size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full rounded-lg border border-border bg-popover shadow-xl shadow-black/30">
          {/* Search input */}
          {searchable && (
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-7 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = selected.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleItem(opt.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {isSelected && (
                        <svg className="size-3" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2.5 6L5 8.5L9.5 3.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    {opt.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
