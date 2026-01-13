// src/pages/ChooseYourTripPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getTrips } from "../services/apiClient";

// Tabs (UI only)
const TAB_DAYUSE = "DAYUSE";
const TAB_STAY = "STAY";

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
  // backend serializer ممكن يرجع availableDate / startDate
  return isDayuseTrip(t) ? String(t?.availableDate || "") : String(t?.startDate || "");
}

function tripNights(t) {
  // backend عنده durationNights
  const n = t?.durationNights ?? t?.nights;
  const num = Number(n);
  return Number.isFinite(num) ? num : null;
}

function addDaysISO(dateISO, days) {
  // dateISO: YYYY-MM-DD
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

export default function ChooseYourTripPage() {
  const [sp] = useSearchParams();

  // لو جاي من برا بـ query params هنحافظ عليهم (اختياري)
  const departQS = sp.get("depart") || "";
  const returnQS = sp.get("return") || "";
  const nightsQS = sp.get("nights") || "";

  const [tab, setTab] = useState(TAB_DAYUSE);

  const [filters, setFilters] = useState({
    destinationCity: "ALL",
    date: "",
    nights: "ALL",
    sort: "DATE_ASC", // DATE_ASC | PRICE_ASC | PRICE_DESC
  });

  const [allTrips, setAllTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ Load from DB via API
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr("");
      try {
        const data = await getTrips(); // /api/trips/
        if (!alive) return;
        setAllTrips(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load trips");
        setAllTrips([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  // ✅ Trips per tab
  const tabTrips = useMemo(() => {
    const list = Array.isArray(allTrips) ? allTrips : [];
    if (tab === TAB_DAYUSE) return list.filter((t) => isDayuseTrip(t));
    // STAY tab: أي حاجة مش DAYUSE نعتبرها STAY (سواء STAY/SEA_ESCAPE/CITY_ESCAPE...)
    return list.filter((t) => !isDayuseTrip(t));
  }, [allTrips, tab]);

  // ✅ Build filter options from DB trips
  const destinationOptions = useMemo(() => {
    const dests = tabTrips.map((t) => String(t?.destinationCity || "").trim());
    return ["ALL", ...uniq(dests)];
  }, [tabTrips]);

  const dateOptions = useMemo(() => {
    const dates = tabTrips.map((t) => tripWhen(t)).filter(Boolean);
    return uniq(dates).sort();
  }, [tabTrips]);

  const nightsOptions = useMemo(() => {
    // Nights filter only makes sense for STAY
    if (tab === TAB_DAYUSE) return ["ALL"];
    const ns = tabTrips.map((t) => tripNights(t)).filter((x) => typeof x === "number");
    const uniqNs = uniq(ns.map(String)).map(Number).filter((x) => Number.isFinite(x));
    uniqNs.sort((a, b) => a - b);
    return ["ALL", ...uniqNs.map(String)];
  }, [tab, tabTrips]);

  const filteredTrips = useMemo(() => {
    let list = [...tabTrips];

    if (filters.destinationCity !== "ALL") {
      list = list.filter((t) => String(t?.destinationCity || "") === filters.destinationCity);
    }

    if (filters.date) {
      list = list.filter((t) => tripWhen(t) === filters.date);
    }

    if (tab === TAB_STAY && filters.nights !== "ALL") {
      const n = Number(filters.nights);
      list = list.filter((t) => tripNights(t) === n);
    }

    // Sort
    if (filters.sort === "DATE_ASC") {
      list.sort((a, b) => (tripWhen(a) || "9999-99-99").localeCompare(tripWhen(b) || "9999-99-99"));
    } else if (filters.sort === "PRICE_ASC") {
      list.sort((a, b) => Number(a?.priceFrom || 0) - Number(b?.priceFrom || 0));
    } else if (filters.sort === "PRICE_DESC") {
      list.sort((a, b) => Number(b?.priceFrom || 0) - Number(a?.priceFrom || 0));
    }

    return list;
  }, [tabTrips, filters, tab]);

  return (
    <div className="page trips-page">
      <section className="page-header">
        <h1 className="page-title">Choose your trip</h1>
        <p className="page-subtitle">Trips from DB — filter, sort, then open details.</p>
      </section>

      {/* Tabs */}
      <div className="tp-tabs">
        <button
          className={tab === TAB_DAYUSE ? "tp-tab tp-tab-active" : "tp-tab"}
          onClick={() => setTab(TAB_DAYUSE)}
          type="button"
        >
          Day-use
        </button>
        <button
          className={tab === TAB_STAY ? "tp-tab tp-tab-active" : "tp-tab"}
          onClick={() => setTab(TAB_STAY)}
          type="button"
        >
          Accommodation
        </button>
      </div>

      {/* Loading / Error */}
      {loading ? <p className="page-info" style={{ marginTop: "1rem" }}>Loading trips…</p> : null}

      {err ? (
        <p className="page-info" style={{ marginTop: "1rem", color: "salmon" }}>
          {err}
        </p>
      ) : null}

      {/* Filters */}
      {!loading && !err && (
        <div className="tp-filters">
          <div className="tp-filter">
            <label className="tp-filter-label">Destination</label>
            <select
              className="input"
              value={filters.destinationCity}
              onChange={(e) => setFilters((p) => ({ ...p, destinationCity: e.target.value }))}
            >
              {destinationOptions.map((c) => (
                <option key={c} value={c}>
                  {c === "ALL" ? "All destinations" : c}
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

          {tab === TAB_STAY && (
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
      )}

      {/* Grid */}
      {!loading && !err && (
        <div className="trip-grid">
          {filteredTrips.map((t) => {
            const dayuse = isDayuseTrip(t);

            const title = String(t?.title || t?.name || "").trim() || "Trip";
            const when = tripWhen(t);
            const dur = String(t?.durationLabel || "").trim();
            const dest = String(t?.destinationCity || "").trim();

            const dayuseTo = dayuse ? codeToCityName(t?.to_code) : "";
            const origin = dayuse ? codeToCityName(t?.from_code) : "";

            const originLabel = origin ? origin : "";
            const destLabel = dayuse ? (dayuseTo || dest || "") : dest || "";

            const desc = String(t?.description || "").trim();

            // ✅ slug اللي هنستخدمه في التفاصيل = public_code (serializer بيرجع slug = public_code)
            const publicSlug = String(t?.slug || t?.publicCode || "").trim();

            // Query params: من الفلاتر أو من data
            const depart = (filters.date || departQS || when || "").trim();
            const nightsVal =
              tab === TAB_STAY && filters.nights !== "ALL" ? Number(filters.nights) : Number(nightsQS) || tripNights(t) || 0;

            const ret = dayuse ? (returnQS || depart) : returnQS || (depart && nightsVal ? addDaysISO(depart, nightsVal) : "");

            const qp = `depart=${encodeURIComponent(depart)}&return=${encodeURIComponent(ret)}&nights=${encodeURIComponent(
              String(nightsVal || "")
            )}`;

            return (
              <article key={publicSlug || t?.id} className="trip-card">
                <div className="trip-card-header">
                  <div className="trip-card-title">{title}</div>
                  <span className="trip-card-type">{dayuse ? "DAYUSE" : "STAY"}</span>
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
      )}

      {!loading && !err && filteredTrips.length === 0 && (
        <p className="page-info" style={{ marginTop: "1rem" }}>
          No trips match your filters yet.
        </p>
      )}
    </div>
  );
}
