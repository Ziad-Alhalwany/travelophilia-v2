// src/pages/CRMLeadsPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { authFetch, clearTokens } from "../services/crmAuth";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api";
const CRM_LIST_ENDPOINT = `${API_BASE}/crm/trip-requests/`;
const CRM_DETAIL_ENDPOINT = (id) => `${API_BASE}/crm/trip-requests/${id}/`;
const CRM_NOTES_ENDPOINT = (id) => `${API_BASE}/crm/trip-requests/${id}/notes/`;

// ---------- Labels + Colors ----------
const STATUS = [
  { value: "NEW", label: "New", tone: "blue" },
  { value: "CONTACTED", label: "Contacted", tone: "purple" },
  { value: "QUALIFIED", label: "Qualified", tone: "cyan" },
  { value: "QUOTED", label: "Quoted", tone: "amber" },
  { value: "BOOKED", label: "Booked", tone: "green" },
  { value: "CLOSED_WON", label: "Closed (Won)", tone: "green" },
  { value: "CLOSED_LOST", label: "Closed (Lost)", tone: "red" },
];

const PRIORITY = [
  { value: "LOW", label: "Low", tone: "green" },
  { value: "MEDIUM", label: "Medium", tone: "amber" },
  { value: "HIGH", label: "High", tone: "red" },
];

// ✅ لو الباك رجّع status/priority كأرقام (legacy/enum) هنحوّلها safely
const STATUS_NUM_MAP = {
  0: "NEW",
  1: "CONTACTED",
  2: "QUALIFIED",
  3: "QUOTED",
  4: "BOOKED",
  5: "CLOSED_WON",
  6: "CLOSED_LOST",
};

const PRIORITY_NUM_MAP = {
  0: "LOW",
  1: "MEDIUM",
  2: "HIGH",
};

function normalizeStatusValue(v) {
  if (typeof v === "number") return STATUS_NUM_MAP[v] || "NEW";
  const s = String(v || "")
    .trim()
    .toUpperCase();
  return s || "NEW";
}

function normalizePriorityValue(v) {
  if (typeof v === "number") return PRIORITY_NUM_MAP[v] || "MEDIUM";
  const s = String(v || "")
    .trim()
    .toUpperCase();
  return s || "MEDIUM";
}

function toneVars(tone) {
  switch (tone) {
    case "green":
      return {
        bg: "rgba(46, 204, 113, 0.14)",
        bd: "rgba(46, 204, 113, 0.35)",
        tx: "rgba(220,255,235,0.95)",
      };
    case "red":
      return {
        bg: "rgba(255, 80, 80, 0.14)",
        bd: "rgba(255, 80, 80, 0.35)",
        tx: "rgba(255,225,225,0.95)",
      };
    case "amber":
      return {
        bg: "rgba(255, 193, 7, 0.14)",
        bd: "rgba(255, 193, 7, 0.35)",
        tx: "rgba(255,245,220,0.95)",
      };
    case "blue":
      return {
        bg: "rgba(0,165,255,0.14)",
        bd: "rgba(0,165,255,0.35)",
        tx: "rgba(220,245,255,0.95)",
      };
    case "purple":
      return {
        bg: "rgba(155, 89, 182, 0.14)",
        bd: "rgba(155, 89, 182, 0.35)",
        tx: "rgba(245,230,255,0.95)",
      };
    case "cyan":
      return {
        bg: "rgba(0,216,192,0.14)",
        bd: "rgba(0,216,192,0.35)",
        tx: "rgba(220,255,250,0.95)",
      };
    default:
      return {
        bg: "rgba(255,255,255,0.06)",
        bd: "rgba(255,255,255,0.12)",
        tx: "rgba(255,255,255,0.9)",
      };
  }
}

function Badge({
  tone = "default",
  children,
  onClick,
  title,
  fullWidth = false,
}) {
  const v = toneVars(tone);
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 32,
        width: fullWidth ? "100%" : "auto",
        justifyContent: "space-between",
        padding: "0 0.6rem",
        borderRadius: 999,
        border: `1px solid ${v.bd}`,
        background: v.bg,
        color: v.tx,
        fontSize: "0.82rem",
        fontWeight: 800,
        whiteSpace: "nowrap",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <span style={{ opacity: 0.85 }}>▾</span>
    </button>
  );
}

// ---------- Custom Dropdown ----------
function SelectMenu({
  value,
  options,
  onChange,
  placeholder = "Select",
  size = "md",
  align = "left",
  autoOpen = false,
  onClose,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const [pos, setPos] = useState(null);

  const current = options.find((o) => o.value === value) || null;

  const close = () => {
    setOpen(false);
    onClose?.();
  };

  function computePos() {
    const el = wrapRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const gap = 8;
    const maxH = 320;
    const needed = maxH + gap;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const openUp = spaceBelow < needed && spaceAbove > needed;

    const width = Math.max(220, rect.width);
    const left = rect.left;
    const right = window.innerWidth - rect.right;

    setPos({
      width,
      openUp,
      top: openUp ? rect.top - gap : rect.bottom + gap,
      left,
      right,
    });
  }

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  useEffect(() => {
    if (!open) return;
    function onEsc(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    computePos();

    function onScroll() {
      computePos();
    }
    function onResize() {
      computePos();
    }

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, options.length]);

  const btnClass = `tp-select-btn ${size === "sm" ? "tp-select-btn-sm" : ""}`;

  const pick = (opt) => {
    close();
    onChange?.(opt.value);
  };

  const menu =
    open && pos
      ? createPortal(
          <div
            className="tp-menu"
            role="listbox"
            style={{
              position: "fixed",
              zIndex: 999999,
              width: pos.width,
              maxHeight: 320,
              overflow: "auto",
              ...(align === "right"
                ? { right: pos.right }
                : { left: pos.left }),
              top: pos.top,
              ...(pos.openUp ? { transform: "translateY(-100%)" } : {}),
            }}
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  className={`tp-menu-item ${active ? "is-active" : ""}`}
                  onClick={() => pick(opt)}
                >
                  <span className="tp-select-left">
                    {opt.tone ? (
                      <span className={`tp-dot tp-dot-${opt.tone}`} />
                    ) : (
                      <span className="tp-dot" />
                    )}
                    <span className="tp-select-text">{opt.label}</span>
                  </span>
                  {active ? <span className="tp-check">✓</span> : null}
                </button>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <div
      ref={wrapRef}
      className="tp-select-wrap"
      style={{ position: "relative" }}
    >
      <button
        type="button"
        className={btnClass}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="tp-select-left">
          {current?.tone ? (
            <span className={`tp-dot tp-dot-${current.tone}`} />
          ) : (
            <span className="tp-dot" />
          )}
          <span className="tp-select-text">
            {current?.label || placeholder}
          </span>
        </span>
        <span className={`tp-caret ${open ? "tp-caret-open" : ""}`}>▾</span>
      </button>

      {menu}
    </div>
  );
}

function normalizeStr(v) {
  return String(v || "")
    .trim()
    .toLowerCase();
}

/**
 * Created format:
 * Mon 11/01/2026 05:17 AM
 */
function formatCrmDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(d);

  const get = (type) => parts.find((p) => p.type === type)?.value || "";
  const weekday = get("weekday");
  const day = get("day");
  const month = get("month");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");
  const dayPeriod = get("dayPeriod");

  return `${weekday} ${day}/${month}/${year} ${hour}:${minute} ${dayPeriod}`;
}

function getCounts(req) {
  const adults =
    Number(
      req?.adultsCount ??
        req?.adults_count ??
        req?.adults_count_in ??
        req?.adults ??
        0
    ) || 0;
  const children =
    Number(
      req?.childrenCount ??
        req?.children_count ??
        req?.children_count_in ??
        req?.children ??
        0
    ) || 0;

  const pax =
    Number(req?.paxTotal ?? req?.pax_total ?? req?.pax_total_in ?? req?.pax) ||
    adults + children ||
    0;

  return { adults, children, pax };
}

function paxNumber(req) {
  const { pax } = getCounts(req);
  return pax ? String(pax) : "—";
}

function paxDetailsString(req) {
  const { adults, children, pax } = getCounts(req);
  if (!pax) return "—";
  const childWord = children === 1 ? "Child" : "Children";
  return `${pax} pax → (${adults} Adults, ${children} ${childWord})`;
}

// دمج L-0000123 كقطعة واحدة بدل L و 0000123
function normalizeCodeSegments(raw) {
  const code = String(raw || "").trim();
  if (!code) return [];
  const segs = code.split("-").filter(Boolean);

  const out = [];
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const n = segs[i + 1];

    if (s === "L" && n && /^\d+$/.test(n)) {
      out.push(`L-${n}`);
      i++;
      continue;
    }
    out.push(s);
  }
  return out;
}

function segKind(seg, idx) {
  const s = String(seg || "");
  if (idx === 0) return "prefix"; // ST / DU / CT
  if (/^\d{6,}$/.test(s)) return "seq"; // 0000007
  if (/^R\d+$/i.test(s)) return "r"; // R0003
  if (/^P\d+$/i.test(s)) return "p"; // P01
  if (/^L-\d+$/i.test(s)) return "lead"; // L-0000123
  if (s === "UNK") return "unk";
  return "text"; // SIWA / DAHAB / etc
}

/**
 * ✅ Trip code inline كما تريد:
 * ST-0000007-SIWA-R0004-P01-L-000067
 * مع تلوين segments فقط و "-" بدون لون
 */
function TripCode({ code, maxWidth = 420 }) {
  const raw = String(code || "").trim();
  if (!raw) return <span className="crm-muted">—</span>;

  const segs = normalizeCodeSegments(raw);

  return (
    <div className="crm-tripcode-inline" title={raw} style={{ maxWidth }}>
      {segs.map((s, i) => (
        <span key={`${s}-${i}`}>
          <span className={`crm-segtext crm-segtext--${segKind(s, i)}`}>
            {s}
          </span>
          {i < segs.length - 1 ? <span className="crm-sep">-</span> : null}
        </span>
      ))}
    </div>
  );
}

export default function CRMLeadsPage() {
  const [rows, setRows] = useState([]);
  const navigate = useNavigate();

  function logout() {
    clearTokens();
    navigate("/crm/login", { replace: true });
  }

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [selected, setSelected] = useState(null);

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [sortKey, setSortKey] = useState("NEWEST");

  // Inline quick-edit
  const [editing, setEditing] = useState({ id: null, field: null });

  // Notes
  const [notes, setNotes] = useState([]);
  const [noteBody, setNoteBody] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);

  const statusFilterOptions = useMemo(
    () => [{ value: "", label: "All", tone: "default" }, ...STATUS],
    []
  );
  const priorityFilterOptions = useMemo(
    () => [{ value: "", label: "All", tone: "default" }, ...PRIORITY],
    []
  );

  const sortOptions = useMemo(
    () => [
      { value: "NEWEST", label: "Newest", tone: "default" },
      { value: "OLDEST", label: "Oldest", tone: "default" },
      {
        value: "PRIORITY_HIGH",
        label: "Priority: High → Low",
        tone: "default",
      },
      { value: "PRIORITY_LOW", label: "Priority: Low → High", tone: "default" },
      { value: "ID_DESC", label: "ID: High → Low", tone: "default" },
      { value: "ID_ASC", label: "ID: Low → High", tone: "default" },
    ],
    []
  );

  async function fetchList() {
    setLoading(true);
    setErr("");
    try {
      const res = await authFetch(CRM_LIST_ENDPOINT, { method: "GET" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed (${res.status})`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.results || [];

      const normalized = list.map((r) => ({
        ...r,
        status: normalizeStatusValue(r.status),
        priority: normalizePriorityValue(r.priority),
      }));

      setRows(normalized);
    } catch (e) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function fetchNotes(id) {
    try {
      const res = await authFetch(CRM_NOTES_ENDPOINT(id));
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.results || [];
      setNotes(list);
    } catch {
      // ignore
    }
  }

  // ✅ detail fetch: عشان Pax details + passengers لو موجودين في الـ detail endpoint
  async function fetchDetail(id) {
    try {
      const res = await authFetch(CRM_DETAIL_ENDPOINT(id), { method: "GET" });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        ...data,
        status: normalizeStatusValue(data.status),
        priority: normalizePriorityValue(data.priority),
      };
    } catch {
      return null;
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  async function patchRow(id, patch) {
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setSelected((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));

    try {
      const res = await authFetch(CRM_DETAIL_ENDPOINT(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Update failed (${res.status})`);
      }

      const fresh = await res.json().catch(() => ({}));
      const merged = {
        ...fresh,
        status: normalizeStatusValue(fresh.status),
        priority: normalizePriorityValue(fresh.priority),
      };

      setRows((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...merged } : x))
      );
      setSelected((prev) => (prev?.id === id ? { ...prev, ...merged } : prev));
    } catch (e) {
      alert(e?.message || "Update failed");
      fetchList();
    }
  }

  // ✅ عند اختيار row: نفتح سريعًا ثم نجيب detail (حل Pax + travelers)
  async function openRow(r) {
    setSelected(r);
    setNotes([]);
    fetchNotes(r.id);

    const detail = await fetchDetail(r.id);
    if (detail) {
      setSelected((prev) =>
        prev?.id === r.id ? { ...prev, ...detail } : prev
      );
      setRows((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, ...detail } : x))
      );
    }
  }

  const viewRows = useMemo(() => {
    const qn = normalizeStr(q);

    let list = rows.slice();

    if (qn) {
      list = list.filter((r) => {
        const hay = [
          r.trip_code,
          r.reservation_code_internal,
          r.leader_full_name,
          r.leader_phone,
          r.leader_whatsapp,
          r.leader_email,
          r.origin_city,
          r.destination_city,
        ]
          .map((x) => normalizeStr(x))
          .join(" | ");
        return hay.includes(qn);
      });
    }

    if (status)
      list = list.filter((r) => normalizeStatusValue(r.status) === status);
    if (priority)
      list = list.filter(
        (r) => normalizePriorityValue(r.priority) === priority
      );

    const prIndex = (p) =>
      p === "HIGH" ? 3 : p === "MEDIUM" ? 2 : p === "LOW" ? 1 : 0;

    list.sort((a, b) => {
      const aCreated = new Date(a.created_at || a.createdAt || 0).getTime();
      const bCreated = new Date(b.created_at || b.createdAt || 0).getTime();
      const aId = Number(a.id || 0);
      const bId = Number(b.id || 0);

      if (sortKey === "NEWEST") return bCreated - aCreated;
      if (sortKey === "OLDEST") return aCreated - bCreated;
      if (sortKey === "PRIORITY_HIGH")
        return prIndex(b.priority) - prIndex(a.priority);
      if (sortKey === "PRIORITY_LOW")
        return prIndex(a.priority) - prIndex(b.priority);
      if (sortKey === "ID_DESC") return bId - aId;
      if (sortKey === "ID_ASC") return aId - bId;

      return bCreated - aCreated;
    });

    return list;
  }, [rows, q, status, priority, sortKey]);

  function resetFilters() {
    setQ("");
    setStatus("");
    setPriority("");
    setSortKey("NEWEST");
  }

  async function addNote() {
    if (!selected?.id) return;
    const body = String(noteBody || "").trim();
    if (!body) return;

    setNoteBusy(true);
    try {
      const res = await authFetch(CRM_NOTES_ENDPOINT(selected.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "NOTE", body }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed (${res.status})`);
      }
      setNoteBody("");
      await fetchNotes(selected.id);
    } catch (e) {
      alert(e?.message || "Failed to add note");
    } finally {
      setNoteBusy(false);
    }
  }

  const statusMeta = (v) =>
    STATUS.find((x) => x.value === normalizeStatusValue(v)) || null;
  const priorityMeta = (v) =>
    PRIORITY.find((x) => x.value === normalizePriorityValue(v)) || null;

  // ✅ travelers fallback
  const selectedTravelers = useMemo(() => {
    if (!selected) return [];
    const t = selected.travelers;
    const p = selected.passengers;
    return Array.isArray(t) ? t : Array.isArray(p) ? p : [];
  }, [selected]);

  const styles = (
    <style>{`
      .crm-wrap{max-width: 1520px;width: 100%;margin: 0 auto;padding: 1.35rem 1.25rem;}
      .crm-top{display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;flex-wrap:wrap;}
      .crm-title{margin:0;font-size:1.7rem;font-weight:950;}
      .crm-sub{margin:0.25rem 0 0;color: var(--text-muted, #9ba6b2);font-size:0.95rem;}
      .crm-cell-control{ width:100%; }
      .tp-select-btn-sm .tp-select-text{ font-size:0.82rem; }
      .tp-select-btn-sm{ line-height: 1; }

      .crm-filters{
        margin-top: 1.05rem;
        display:grid;
        grid-template-columns: 1.6fr 1fr 1fr 1fr auto auto;
        gap:0.65rem;
        align-items:end;
      }
      @media (max-width: 980px){ .crm-filters{grid-template-columns: 1fr 1fr;} }

      .crm-field label{display:block;font-size:0.82rem;color: var(--text-muted, #9ba6b2);margin-bottom:0.25rem;}
      .crm-input{
        width:100%;
        border-radius:12px;
        border:1px solid rgba(255,255,255,0.10);
        background: rgba(255,255,255,0.04);
        color: rgba(255,255,255,0.92);
        padding: 0.62rem 0.75rem;
        outline:none;
      }
      .crm-input:focus{
        border-color: rgba(0,216,192,0.35);
        box-shadow: 0 0 0 1px rgba(0,216,192,0.15) inset;
      }

      .crm-btn{
        border-radius:12px;
        border:1px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.06);
        color: rgba(255,255,255,0.92);
        padding: 0.62rem 0.9rem;
        font-weight:850;
        cursor:pointer;
      }
      .crm-btn.primary{
        border-color: rgba(0,216,192,0.35);
        background: rgba(0,216,192,0.12);
      }
      .crm-btn:disabled{opacity:.55; cursor:not-allowed;}

      .crm-grid{
        margin-top: 1.05rem;
        display:grid;
        grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
        gap: 1rem;
        align-items:start;
      }
      @media (max-width: 1100px){ .crm-grid{grid-template-columns: 1fr;} }

      .crm-card{
        border:1px solid rgba(255,255,255,0.10);
        background: rgba(255,255,255,0.03);
        border-radius:18px;
        padding: 1.05rem 1.05rem;
        min-width: 0;
        overflow: visible;
      }

      .crm-muted{color: var(--text-muted, #9ba6b2); font-size:0.9rem;}
      .crm-date{direction:ltr; unicode-bidi: plaintext; font-variant-numeric: tabular-nums;}

      /* ✅ مهم: نخلي الجدول يعمل Scroll بدل ما يضغط الأعمدة */
      .crm-table-wrap{
        margin-top: 0.85rem;
        overflow-x: auto;
        overflow-y: visible;
      }

      .crm-table{
        width:100%;
        min-width: 1586px; /* مجموع الأعمدة الثابتة */
        border-collapse:separate;
        border-spacing:0;
        table-layout: fixed;
      }
      .crm-table th, .crm-table td{
        padding:0.78rem 0.72rem;
        border-bottom:1px solid rgba(255,255,255,0.08);
        text-align:left;
        vertical-align:middle;
        white-space: nowrap; /* ✅ ممنوع wrap */
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .crm-table th.crm-col-status,
      .crm-table td.crm-col-status,
      .crm-table th.crm-col-priority,
      .crm-table td.crm-col-priority{
        overflow: visible;
        text-overflow: clip;
      }

      .crm-table th{
        color: var(--text-muted, #9ba6b2);
        font-size:0.83rem;
        font-weight:950;
        letter-spacing:.02em;
      }

      .crm-row{cursor:pointer;}
      .crm-row:hover{background: rgba(255,255,255,0.03);}

      .crm-kv{
        display:flex; justify-content:space-between; gap:1rem;
        padding:0.75rem 0.85rem;
        border-radius:16px;
        border:1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.03);
        margin-top:0.6rem;
      }
      .crm-k{color: var(--text-muted, #9ba6b2); font-size:0.83rem;}
      .crm-v{font-weight:800; text-align:right; min-width: 0;}
      .crm-v > *{min-width:0;}

      .crm-notes{margin-top: 0.9rem;}
      .crm-note{
        padding:0.7rem 0.8rem;
        border-radius:16px;
        border:1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.03);
        margin-top:0.6rem;
      }
      .crm-note small{display:block; color: var(--text-muted, #9ba6b2); margin-top:0.35rem;}

      .crm-split{display:flex; gap:0.6rem; align-items:center; flex-wrap:wrap;}

      .tp-select-btn{
        width:100%;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:0.6rem;
        border-radius:12px;
        border:1px solid rgba(255,255,255,0.10);
        background: rgba(255,255,255,0.04);
        color: rgba(255,255,255,0.92);
        padding: 0.62rem 0.75rem;
        outline:none;
        cursor:pointer;
        text-align:left;
      }
      .tp-select-btn:hover{border-color: rgba(0,216,192,0.25);background: rgba(255,255,255,0.055);}
      .tp-select-btn:focus{border-color: rgba(0,216,192,0.35);box-shadow: 0 0 0 1px rgba(0,216,192,0.15) inset;}
      .tp-select-btn-sm{height:32px;padding: 0 0.55rem;border-radius: 999px;}
      .tp-select-left{display:flex; align-items:center; gap:0.55rem; min-width:0;}
      .tp-select-text{font-weight:850; font-size:0.92rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
      .tp-caret{opacity:.8; transition: transform .15s ease;}
      .tp-caret-open{transform: rotate(180deg);}

      .tp-menu{
        min-width: 220px;
        border-radius:14px;
        border:1px solid rgba(255,255,255,0.12);
        background: rgba(18, 22, 28, 0.95);
        backdrop-filter: blur(10px);
        box-shadow: 0 18px 40px rgba(0,0,0,0.35);
        padding: 0.35rem;
      }
      .tp-menu-item{
        width:100%;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:0.6rem;
        border-radius:12px;
        border:1px solid transparent;
        background: transparent;
        color: rgba(255,255,255,0.92);
        padding: 0.55rem 0.65rem;
        cursor:pointer;
      }
      .tp-menu-item:hover{background: rgba(255,255,255,0.06);border-color: rgba(255,255,255,0.10);}
      .tp-menu-item.is-active{background: rgba(0,216,192,0.10);border-color: rgba(0,216,192,0.25);}
      .tp-check{font-weight:900; opacity:.9;}
      .tp-dot{width:10px; height:10px; border-radius:999px;background: rgba(255,255,255,0.35);flex: 0 0 auto;}
      .tp-dot-green{background: rgba(46,204,113,0.95);}
      .tp-dot-red{background: rgba(255,80,80,0.95);}
      .tp-dot-amber{background: rgba(255,193,7,0.95);}
      .tp-dot-blue{background: rgba(0,165,255,0.95);}
      .tp-dot-purple{background: rgba(155,89,182,0.95);}
      .tp-dot-cyan{background: rgba(0,216,192,0.95);}

      /* ✅ Trip code inline (text واحد) */
      .crm-tripcode-inline{
        display:block;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      .crm-segtext{
        display:inline-block;
        padding: 2px 6px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.06);
        font-size: 12px;
        line-height: 1.2;
        vertical-align: baseline;
      }
      .crm-sep{
        display:inline-block;
        margin: 0 3px;
        opacity: 0.70;
      }
      .crm-segtext--prefix{ background: rgba(0, 255, 204, 0.14); border-color: rgba(0, 255, 204, 0.22); }
      .crm-segtext--seq{    background: rgba(0, 140, 255, 0.14); border-color: rgba(0, 140, 255, 0.22); }
      .crm-segtext--text{   background: rgba(180, 180, 180, 0.12); border-color: rgba(180, 180, 180, 0.18); }
      .crm-segtext--r{      background: rgba(255, 196, 0, 0.14); border-color: rgba(255, 196, 0, 0.22); }
      .crm-segtext--p{      background: rgba(180, 0, 255, 0.14); border-color: rgba(180, 0, 255, 0.22); }
      .crm-segtext--lead{   background: rgba(0, 255, 120, 0.14); border-color: rgba(0, 255, 120, 0.22); }
      .crm-segtext--unk{    background: rgba(255, 80, 80, 0.14); border-color: rgba(255, 80, 80, 0.22); }

      /* Passengers table */
      .crm-passengers{ margin-top: 14px; }
      .crm-passengers-title{ font-weight: 950; margin-bottom: 8px; opacity: 0.92; }
      .crm-passengers-tableWrap{ overflow:auto; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); }
      .crm-passengers-table{ width:100%; border-collapse: collapse; font-size: 13px; }
      .crm-passengers-table th, .crm-passengers-table td{
        padding: 10px 12px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        white-space: nowrap;
      }
    `}</style>
  );

  return (
    <div className="crm-wrap">
      {styles}

      <div className="crm-top">
        <div>
          <h1 className="crm-title">CRM – Trip Requests</h1>
          <p className="crm-sub">
            Filter, sort, update status/priority, and add notes.
          </p>
        </div>

        <div className="crm-split">
          <button className="crm-btn" onClick={fetchList} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            className="crm-btn"
            onClick={() => {
              resetFilters();
              setSelected(null);
              setNotes([]);
              setEditing({ id: null, field: null });
            }}
            disabled={loading}
            title="Reset filters & selection"
          >
            Reset
          </button>

          <button className="crm-btn" onClick={logout} title="Logout from CRM">
            Logout
          </button>
        </div>
      </div>

      <div className="crm-filters">
        <div className="crm-field">
          <label>Search</label>
          <input
            className="crm-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Trip code, name, phone, email, destination..."
          />
        </div>

        <div className="crm-field">
          <label>Status</label>
          <SelectMenu
            value={status}
            options={statusFilterOptions}
            onChange={(v) => setStatus(v)}
            placeholder="All"
          />
        </div>

        <div className="crm-field">
          <label>Priority</label>
          <SelectMenu
            value={priority}
            options={priorityFilterOptions}
            onChange={(v) => setPriority(v)}
            placeholder="All"
          />
        </div>

        <div className="crm-field">
          <label>Sort</label>
          <SelectMenu
            value={sortKey}
            options={sortOptions}
            onChange={(v) => setSortKey(v)}
            placeholder="Newest"
          />
        </div>

        <div />
        <div />
      </div>

      {err ? (
        <p style={{ color: "rgba(255,120,120,0.95)", marginTop: "0.8rem" }}>
          {err}
        </p>
      ) : null}

      <div className="crm-grid">
        {/* LIST */}
        <div className="crm-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 950 }}>Requests</div>
            <div className="crm-muted">
              Showing <strong>{viewRows.length}</strong>
            </div>
          </div>

          <div className="crm-table-wrap">
            <table className="crm-table">
              {/* ✅ أعمدة ثابتة عشان Trip/Leader/Destination ياخدوا حقهم */}
              <colgroup>
                <col style={{ width: 56 }} />
                <col style={{ width: 360 }} /> {/* Trip */}
                <col style={{ width: 240 }} /> {/* Leader */}
                <col style={{ width: 200 }} /> {/* Destination */}
                <col style={{ width: 240 }} /> {/* Created */}
                <col style={{ width: 110 }} /> {/* Pax */}
                <col style={{ width: 190 }} /> {/* Status */}
                <col style={{ width: 190 }} /> {/* Priority */}
              </colgroup>

              <thead>
                <tr>
                  <th>#</th>
                  <th>Trip</th>
                  <th>Leader</th>
                  <th>Destination</th>
                  <th>Created</th>
                  <th>Pax</th>
                  <th className="crm-col-status">Status</th>
                  <th className="crm-col-priority">Priority</th>
                </tr>
              </thead>

              <tbody>
                {viewRows.map((r) => {
                  const s = statusMeta(r.status);
                  const p = priorityMeta(r.priority);

                  const code =
                    r.reservation_code_internal ??
                    r.reservationCodeInternal ??
                    r.trip_code ??
                    r.tripCode ??
                    "";

                  const created = formatCrmDateTime(
                    r.created_at || r.createdAt
                  );

                  const isEditingStatus =
                    editing.id === r.id && editing.field === "status";
                  const isEditingPriority =
                    editing.id === r.id && editing.field === "priority";

                  return (
                    <tr
                      key={r.id}
                      className="crm-row"
                      onClick={() => openRow(r)}
                      style={{
                        background:
                          selected?.id === r.id
                            ? "rgba(0,216,192,0.07)"
                            : "transparent",
                      }}
                    >
                      <td
                        style={{
                          color: "rgba(255,255,255,0.78)",
                          fontWeight: 900,
                        }}
                      >
                        {r.id}
                      </td>

                      <td style={{ fontWeight: 950 }}>
                        <TripCode code={code} maxWidth={340} />
                      </td>

                      <td title={r.leader_full_name || ""}>
                        {r.leader_full_name || "-"}
                      </td>

                      <td title={r.destination_city || ""}>
                        {r.destination_city || "-"}
                      </td>

                      <td
                        className="crm-date"
                        title={String(r.created_at || r.createdAt || "")}
                      >
                        {created}
                      </td>

                      <td title="Passengers total">{paxNumber(r)}</td>

                      <td
                        className="crm-col-status"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="crm-cell-control">
                          {isEditingStatus ? (
                            <SelectMenu
                              size="sm"
                              align="right"
                              autoOpen
                              value={normalizeStatusValue(r.status)}
                              options={STATUS}
                              onClose={() =>
                                setEditing({ id: null, field: null })
                              }
                              onChange={async (v) => {
                                setEditing({ id: null, field: null });
                                await patchRow(r.id, { status: v });
                              }}
                              placeholder="Status"
                            />
                          ) : (
                            <Badge
                              fullWidth
                              tone={s?.tone || "default"}
                              title="Click to change status"
                              onClick={() =>
                                setEditing({ id: r.id, field: "status" })
                              }
                            >
                              {s?.label || "—"}
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td
                        className="crm-col-priority"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="crm-cell-control">
                          {isEditingPriority ? (
                            <SelectMenu
                              size="sm"
                              align="right"
                              autoOpen
                              value={normalizePriorityValue(r.priority)}
                              options={PRIORITY}
                              onClose={() =>
                                setEditing({ id: null, field: null })
                              }
                              onChange={async (v) => {
                                setEditing({ id: null, field: null });
                                await patchRow(r.id, { priority: v });
                              }}
                              placeholder="Priority"
                            />
                          ) : (
                            <Badge
                              fullWidth
                              tone={p?.tone || "default"}
                              title="Click to change priority"
                              onClick={() =>
                                setEditing({ id: r.id, field: "priority" })
                              }
                            >
                              {p?.label || "—"}
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!viewRows.length && (
                  <tr>
                    <td
                      colSpan={8}
                      className="crm-muted"
                      style={{ padding: "1rem 0.7rem" }}
                    >
                      No results. Try clearing filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details panel */}
        <div className="crm-card">
          <div style={{ fontWeight: 950 }}>Details</div>

          {!selected ? (
            <p className="crm-muted" style={{ marginTop: "0.85rem" }}>
              Select a request from the table.
            </p>
          ) : (
            <>
              <div className="crm-kv">
                <div className="crm-k">Reservation code</div>
                <div className="crm-v">
                  <TripCode
                    code={
                      selected.reservation_code_internal ??
                      selected.reservationCodeInternal ??
                      selected.trip_code ??
                      selected.tripCode ??
                      `#${selected.id}`
                    }
                    maxWidth={520}
                  />
                </div>
              </div>

              <div className="crm-kv">
                <div className="crm-k">Leader</div>
                <div className="crm-v">{selected.leader_full_name || "-"}</div>
              </div>

              <div className="crm-kv">
                <div className="crm-k">Phone</div>
                <div className="crm-v">{selected.leader_phone || "-"}</div>
              </div>

              <div className="crm-kv">
                <div className="crm-k">Origin</div>
                <div className="crm-v">{selected.origin_city || "-"}</div>
              </div>

              <div className="crm-kv">
                <div className="crm-k">Destination</div>
                <div className="crm-v">{selected.destination_city || "-"}</div>
              </div>

              <div className="crm-kv">
                <div className="crm-k">Created</div>
                <div className="crm-v crm-date">
                  {formatCrmDateTime(selected.created_at || selected.createdAt)}
                </div>
              </div>

              <div className="crm-kv">
                <div className="crm-k">Pax</div>
                <div className="crm-v">{paxDetailsString(selected)}</div>
              </div>

              {/* Passengers sub-table (هيظهر لما الباك يرجّع travelers/passengers) */}
              {selectedTravelers.length > 0 ? (
                <div className="crm-passengers">
                  <div className="crm-passengers-title">Passengers</div>

                  <div className="crm-passengers-tableWrap">
                    <table className="crm-passengers-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Role</th>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>WhatsApp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTravelers.map((t, idx) => {
                          const role =
                            t.role || (t.isLeader ? "Leader" : "Companion");
                          const name = t.fullName ?? t.full_name ?? "—";
                          const phone = t.phone ?? "—";
                          const whatsapp = t.whatsapp ?? "—";
                          return (
                            <tr key={t.id || `${idx}-${role}-${name}`}>
                              <td>{idx + 1}</td>
                              <td>{role}</td>
                              <td>{name}</td>
                              <td>{phone}</td>
                              <td>{whatsapp}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              <div className="crm-kv">
                <div className="crm-k">Status</div>
                <div
                  className="crm-v"
                  style={{ display: "flex", justifyContent: "flex-end" }}
                >
                  <div style={{ width: "min(320px, 100%)" }}>
                    <SelectMenu
                      value={normalizeStatusValue(selected.status)}
                      options={STATUS}
                      onChange={(v) => patchRow(selected.id, { status: v })}
                      placeholder="Status"
                      align="right"
                    />
                  </div>
                </div>
              </div>

              <div className="crm-kv">
                <div className="crm-k">Priority</div>
                <div
                  className="crm-v"
                  style={{ display: "flex", justifyContent: "flex-end" }}
                >
                  <div style={{ width: "min(320px, 100%)" }}>
                    <SelectMenu
                      value={normalizePriorityValue(selected.priority)}
                      options={PRIORITY}
                      onChange={(v) => patchRow(selected.id, { priority: v })}
                      placeholder="Priority"
                      align="right"
                    />
                  </div>
                </div>
              </div>

              {/* NOTES */}
              <div className="crm-notes">
                <div style={{ fontWeight: 950, marginTop: "1rem" }}>Notes</div>

                <div
                  style={{
                    marginTop: "0.65rem",
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    className="crm-input"
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    placeholder="Add note..."
                    style={{ flex: "1 1 220px" }}
                  />
                  <button
                    className="crm-btn primary"
                    onClick={addNote}
                    disabled={noteBusy}
                    style={{ flex: "0 0 auto" }}
                  >
                    {noteBusy ? "Saving..." : "Add"}
                  </button>
                </div>

                {(notes || []).map((n) => (
                  <div
                    key={n.id || `${n.created_at}-${n.body}`}
                    className="crm-note"
                  >
                    <div style={{ fontWeight: 800 }}>{n.body}</div>
                    <small className="crm-date">
                      {formatCrmDateTime(n.created_at || n.createdAt)}
                    </small>
                  </div>
                ))}

                {!notes?.length && (
                  <p className="crm-muted" style={{ marginTop: "0.75rem" }}>
                    No notes yet.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
