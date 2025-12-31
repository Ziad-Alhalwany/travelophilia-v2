// src/components/SearchSelect.jsx
import { useMemo, useRef, useState } from "react";

export default function SearchSelect({
  value,
  onChange,
  options, // [{ value, label, flag }]
  placeholder = "Type to search...",
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const wrapRef = useRef(null);

  const filtered = useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    const base = options || [];
    if (!q) return base.slice(0, 20);
    return base
      .filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          o.value.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [query, options]);

  function pick(opt) {
    onChange(opt.value);
    setQuery(opt.value);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        className="input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        aria-required={required}
      />

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 50,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(8, 14, 20, 0.98)",
            overflow: "hidden",
            boxShadow: "0 18px 45px rgba(0,0,0,0.55)",
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: "0.75rem 0.9rem", opacity: 0.8 }}>
              No matches
            </div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.65rem 0.85rem",
                  border: "none",
                  background: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ width: 22, textAlign: "center" }}>
                  {o.flag || "🏳️"}
                </span>
                <span>{o.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
