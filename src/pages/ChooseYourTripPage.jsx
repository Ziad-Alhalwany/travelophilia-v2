// src/pages/ChooseYourTripPage.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getTrips, getTripMetadata } from "../services/apiClient";

// Owner marketing layouts configuration
const UI_LAYOUT_CONFIG = [
  {
    id: "escapes",
    label: "روقان واستجمام",
    backendTypes: ["STAY", "SEA_ESCAPE"],
    visibleInHeader: true,
    visibleInHomeSection: true,
  },
  {
    id: "dayuse",
    label: "خروجات اليوم الواحد",
    backendTypes: ["DAYUSE"],
    visibleInHeader: false,
    visibleInHomeSection: true,
  },
  {
    id: "adventure",
    label: "مغامرة واستكشاف",
    backendTypes: ["ADVENTURE", "CITY_ESCAPE"],
    visibleInHeader: true,
    visibleInHomeSection: true,
  },
];

// helpers
function uniq(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function asUpper(v) {
  return String(v || "").trim().toUpperCase();
}

function isDayuseTrip(t) {
  return asUpper(t?.type) === "DAYUSE";
}

function tripWhen(t) {
  return isDayuseTrip(t) ? String(t?.availableDate || "") : String(t?.startDate || "");
}

function tripNights(t) {
  const n = t?.durationNights ?? t?.nights;
  const num = Number(n);
  return Number.isFinite(num) ? num : null;
}

function addDaysISO(dateISO, days) {
  if (!dateISO) return "";
  const d = new Date(`${dateISO}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + Number(days || 0));
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const CODE_TO_CITY = {
  CAI: "Cairo",
  GIZ: "Giza",
  ALX: "Alexandria",
  MNS: "Mansoura",
  KFS: "Kafr El-Sheikh",
  AIN: "Ain Sokhna",
  DHB: "Dahab",
  SIWA: "Siwa",
  HRG: "Hurghada",
  SHM: "Sharm El-Sheikh",
  FYM: "Fayoum",
  LXR: "Luxor",
  ASW: "Aswan",
};

function codeToCityName(code) {
  const c = String(code || "").trim().toUpperCase();
  return CODE_TO_CITY[c] || c || "";
}

function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden="true">
      {/* Tabs Skeleton */}
      <div className="flex gap-4 mb-4">
        {UI_LAYOUT_CONFIG.map((cfg) => (
          <div key={cfg.id} className="h-10 w-36 bg-white/5 rounded-full" />
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-16 bg-white/5 rounded" />
            <div className="h-10 bg-white/5 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-white/5 bg-[#090f14] rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="h-6 w-32 bg-white/5 rounded" />
              <div className="h-5 w-16 bg-white/5 rounded" />
            </div>
            <div className="h-4 w-48 bg-white/5 rounded" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full bg-white/5 rounded" />
              <div className="h-4 w-5/6 bg-white/5 rounded" />
            </div>
            <div className="h-6 w-24 bg-white/5 rounded pt-4" />
            <div className="flex gap-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-5 w-12 bg-white/5 rounded" />
              ))}
            </div>
            <div className="h-11 w-full bg-white/5 rounded-xl pt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorPlaceholder({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-[#0a1219] border border-destructive/20 backdrop-blur-sm space-y-4 my-8">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-3xl text-destructive font-bold">
        !
      </div>
      <h3 className="text-xl font-bold text-foreground">Failed to Load Trips</h3>
      <p className="text-muted-foreground text-sm max-w-md">
        {message || "We encountered an issue while loading trips and filter metadata. Please try again."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="px-6 py-2.5 rounded-full bg-gradient-to-br from-primary to-brand-accent-strong text-primary-foreground font-semibold hover:-translate-y-[1px] transition-all cursor-pointer shadow-lg"
      >
        Retry Connection
      </button>
    </div>
  );
}

export default function ChooseYourTripPage() {
  const [sp] = useSearchParams();

  // URL query params fallback
  const departQS = sp.get("depart") || "";
  const returnQS = sp.get("return") || "";
  const nightsQS = sp.get("nights") || "";

  const [tab, setTab] = useState("escapes");

  const [filters, setFilters] = useState({
    destinationCity: "ALL",
    date: "",
    nights: "ALL",
    sort: "DATE_ASC", // DATE_ASC | PRICE_ASC | PRICE_DESC
  });

  const [allTrips, setAllTrips] = useState([]);
  const [metadata, setMetadata] = useState({ destinations: [], tripTypes: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const abortControllerRef = useRef(null);

  // Consolidated parallel loader using a single AbortController signal
  const loadData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setErr("");
    try {
      const [tripsData, metaData] = await Promise.all([
        getTrips(undefined, controller.signal),
        getTripMetadata(controller.signal),
      ]);

      if (controller.signal.aborted) return;

      if (tripsData) {
        setAllTrips(Array.isArray(tripsData) ? tripsData : []);
      }
      if (metaData) {
        setMetadata({
          destinations: metaData.destinations || [],
          tripTypes: metaData.tripTypes || metaData.trip_types || [],
        });
      }
    } catch (e) {
      if (controller.signal.aborted || e.name === "CanceledError" || e.message === "canceled") {
        return;
      }
      setErr(e?.message || "Failed to load trips and filter metadata");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  // Client-side filtering per active layout configuration
  const tabTrips = useMemo(() => {
    const list = Array.isArray(allTrips) ? allTrips : [];
    const config = UI_LAYOUT_CONFIG.find((c) => c.id === tab);
    if (!config) return [];
    return list.filter((t) => config.backendTypes.includes(asUpper(t?.type)));
  }, [allTrips, tab]);

  // Wire destinations from metadata API response exclusively
  const destinationOptions = useMemo(() => {
    return [
      { code: "ALL", name: "All destinations" },
      ...(metadata.destinations || [])
    ];
  }, [metadata.destinations]);

  // Build date options dynamically from visible tab trips
  const dateOptions = useMemo(() => {
    const dates = tabTrips.map((t) => tripWhen(t)).filter(Boolean);
    return uniq(dates).sort();
  }, [tabTrips]);

  // Build nights options dynamically from visible tab trips (irrelevant for day-use)
  const nightsOptions = useMemo(() => {
    if (tab === "dayuse") return ["ALL"];
    const ns = tabTrips.map((t) => tripNights(t)).filter((x) => typeof x === "number");
    const uniqNs = uniq(ns.map(String)).map(Number).filter((x) => Number.isFinite(x));
    uniqNs.sort((a, b) => a - b);
    return ["ALL", ...uniqNs.map(String)];
  }, [tab, tabTrips]);

  const filteredTrips = useMemo(() => {
    let list = [...tabTrips];

    // Destination matching support (code or name match)
    if (filters.destinationCity !== "ALL") {
      list = list.filter((t) => {
        const tripDest = String(t?.destinationCity || "").trim().toUpperCase();
        const targetDest = metadata.destinations.find(
          (d) => d.code === filters.destinationCity
        );
        if (!targetDest) return false;
        return (
          tripDest === targetDest.name.toUpperCase() ||
          tripDest === targetDest.code.toUpperCase()
        );
      });
    }

    if (filters.date) {
      list = list.filter((t) => tripWhen(t) === filters.date);
    }

    if (tab !== "dayuse" && filters.nights !== "ALL") {
      const n = Number(filters.nights);
      list = list.filter((t) => tripNights(t) === n);
    }

    // Sort mappings
    if (filters.sort === "DATE_ASC") {
      list.sort((a, b) => (tripWhen(a) || "9999-99-99").localeCompare(tripWhen(b) || "9999-99-99"));
    } else if (filters.sort === "PRICE_ASC") {
      list.sort((a, b) => Number(a?.priceFrom || 0) - Number(b?.priceFrom || 0));
    } else if (filters.sort === "PRICE_DESC") {
      list.sort((a, b) => Number(b?.priceFrom || 0) - Number(a?.priceFrom || 0));
    }

    return list;
  }, [tabTrips, filters, tab, metadata.destinations]);

  return (
    <div className="page trips-page">
      <section className="page-header">
        <h1 className="page-title">Choose your trip</h1>
        <p className="page-subtitle">Trips from DB — filter, sort, then open details.</p>
      </section>

      {/* Loading & Error States */}
      {loading && <SkeletonLoader />}
      {!loading && err && <ErrorPlaceholder message={err} onRetry={loadData} />}

      {/* Main Dynamic Workspace Panel */}
      {!loading && !err && (
        <>
          {/* Config-Driven Tabs Panel */}
          <div className="tp-tabs">
            {UI_LAYOUT_CONFIG.map((cfg) => (
              <button
                key={cfg.id}
                className={tab === cfg.id ? "tp-tab tp-tab-active" : "tp-tab"}
                onClick={() => {
                  setTab(cfg.id);
                  // Reset filters when switching tab to prevent cross-contamination
                  setFilters((prev) => ({
                    ...prev,
                    destinationCity: "ALL",
                    date: "",
                    nights: "ALL",
                  }));
                }}
                type="button"
              >
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Dynamic Filters Form */}
          <div className="tp-filters">
            <div className="tp-filter">
              <label className="tp-filter-label">Destination</label>
              <select
                className="input"
                value={filters.destinationCity}
                onChange={(e) => setFilters((p) => ({ ...p, destinationCity: e.target.value }))}
              >
                {destinationOptions.map((dest) => (
                  <option key={dest.code} value={dest.code}>
                    {dest.code === "ALL" ? "All destinations" : dest.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="tp-filter">
              <label className="tp-filter-label">Date</label>
              <select
                className="input"
                value={filters.date}
                onChange={(e) => setFilters((p) => ({ ...p, date: e.target.value }))}
              >
                <option value="">Any date</option>
                {dateOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {tab !== "dayuse" && (
              <div className="tp-filter">
                <label className="tp-filter-label">Nights</label>
                <select
                  className="input"
                  value={filters.nights}
                  onChange={(e) => setFilters((p) => ({ ...p, nights: e.target.value }))}
                >
                  {nightsOptions.map((n) => (
                    <option key={String(n)} value={String(n)}>
                      {n === "ALL" ? "Any" : `${n} nights`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="tp-filter">
              <label className="tp-filter-label">Sort</label>
              <select
                className="input"
                value={filters.sort}
                onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}
              >
                <option value="DATE_ASC">Date (soonest)</option>
                <option value="PRICE_ASC">Price (low → high)</option>
                <option value="PRICE_DESC">Price (high → low)</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="trip-grid">
            {filteredTrips.map((t) => {
              const dayuse = isDayuseTrip(t);

              const title = String(t?.title || t?.name || "").trim() || "Trip";
              const when = tripWhen(t);
              const dur = String(t?.durationLabel || "").trim();
              const dest = String(t?.destinationCity || "").trim();

              const dayuseTo = dayuse ? codeToCityName(t?.to_code || t?.toCode) : "";
              const origin = dayuse ? codeToCityName(t?.from_code || t?.fromCode) : "";

              const originLabel = origin ? origin : "";
              const destLabel = dayuse ? (dayuseTo || dest || "") : dest || "";

              const desc = String(t?.description || "").trim();
              const publicSlug = String(t?.slug || t?.publicCode || "").trim();

              // Calculate query params
              const depart = (filters.date || departQS || when || "").trim();
              const nightsVal =
                tab !== "dayuse" && filters.nights !== "ALL"
                  ? Number(filters.nights)
                  : Number(nightsQS) || tripNights(t) || 0;

              const ret = dayuse
                ? (returnQS || depart)
                : returnQS || (depart && nightsVal ? addDaysISO(depart, nightsVal) : "");

              const qp = `depart=${encodeURIComponent(depart)}&return=${encodeURIComponent(ret)}&nights=${encodeURIComponent(
                String(nightsVal || "")
              )}`;

              return (
                <article key={publicSlug || t?.id} className="trip-card">
                  <div className="trip-card-header">
                    <div className="trip-card-title">{title}</div>
                    <span className="trip-card-type">{asUpper(t?.type)}</span>
                  </div>

                  <div className="trip-card-location">
                    {dayuse
                      ? `${originLabel || "—"} → ${destLabel || "—"}${when ? ` • ${when}` : ""}`
                      : `${destLabel || "—"}${dur ? ` • ${dur}` : ""}${when ? ` • ${when}` : ""}`}
                  </div>

                  <div className="trip-card-description">{desc || "—"}</div>

                  <div className="trip-card-meta">
                    <span className="trip-card-price">
                      {t?.priceFrom ? `From ${t.priceFrom} ${t.currency || "EGP"}` : `Price: ${t.currency || "EGP"}`}
                    </span>
                  </div>

                  <div className="trip-card-tags">
                    {(t?.tags || []).slice(0, 4).map((tag) => (
                      <span className="trip-tag" key={String(tag)}>
                        {String(tag)}
                      </span>
                    ))}
                  </div>

                  <div className="trip-card-btn">
                    {publicSlug ? (
                      <Link className="btn-primary" to={`/trips/${encodeURIComponent(publicSlug)}?${qp}`}>
                        View details
                      </Link>
                    ) : (
                      <button className="btn-primary" type="button" disabled>
                        Coming soon
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {filteredTrips.length === 0 && (
            <p className="page-info" style={{ marginTop: "1rem" }}>
              No trips match your filters yet.
            </p>
          )}
        </>
      )}
    </div>
  );
}
