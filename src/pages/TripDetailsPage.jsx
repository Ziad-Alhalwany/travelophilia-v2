// src/pages/TripDetailsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getTripBySlug } from "../services/apiClient";

function asUpper(v) {
  return String(v || "")
    .trim()
    .toUpperCase();
}
function isDayuseTrip(t) {
  return asUpper(t?.type) === "DAYUSE";
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatEGP(n) {
  return `${Math.round(safeNum(n)).toLocaleString()} EGP`;
}

// ===== FX (Currency Converter) =====
// هنستخدم Open Access endpoint بدون API Key (مرة يوميًا) + caching في localStorage
// لازم Attribution صغير في الصفحة (هتلاقيه تحت في UI)
const FX_BASE = "EGP";
const FX_CACHE_KEY = "tp_fx_rates_egp_v1";
const FX_TTL_MS = 22 * 60 * 60 * 1000; // 22h

const DEFAULT_CURRENCIES = ["EGP", "USD", "EUR", "GBP", "SAR", "AED", "TRY"];

function getCachedRates() {
  try {
    const raw = localStorage.getItem(FX_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || !parsed?.rates) return null;
    if (Date.now() - parsed.ts > FX_TTL_MS) return null;
    return parsed.rates;
  } catch {
    return null;
  }
}

function setCachedRates(rates) {
  try {
    localStorage.setItem(
      FX_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), rates })
    );
  } catch {
    // ignore
  }
}

function toEmbedUrl(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  // YouTube support
  const yt = u.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
  );
  if (yt?.[1]) return `https://www.youtube.com/embed/${yt[1]}`;
  return u; // fallback (can be direct embed url)
}

export default function TripDetailsPage() {
  const { slug } = useParams();
  const [sp] = useSearchParams();

  const depart = sp.get("depart") || "";
  const ret = sp.get("return") || "";
  const nights = sp.get("nights") || "";

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Activities selection (MVP)
  const [activities, setActivities] = useState([]);
  const [actsLoading, setActsLoading] = useState(false);

  const [selectedActs, setSelectedActs] = useState([]); // array of activity objects

  // Coupon (MVP)
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, percent }
  const [couponErr, setCouponErr] = useState("");

  // FX
  const [currency, setCurrency] = useState("EGP");
  const [fxRates, setFxRates] = useState(() => getCachedRates() || {});

  // Mobile bottom sheet
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 900 : true
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    function onResize() {
      const m = window.innerWidth < 900;
      setIsMobile(m);
      if (!m) setSheetOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  // ===== Load Trip =====
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr("");
      setTrip(null);

      try {
        const t = await getTripBySlug(slug);
        if (!alive) return;
        setTrip(t);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Trip not found");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [slug]);

  // ===== FX rates (once/day) =====
  useEffect(() => {
    const cached = getCachedRates();
    if (cached) {
      setFxRates(cached);
      return;
    }

    // Open access: https://open.er-api.com/v6/latest/EGP
    fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(FX_BASE)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.result === "success" && data?.rates) {
          setFxRates(data.rates);
          setCachedRates(data.rates);
        }
      })
      .catch(() => {
        // لو فشل مش مشكلة — هنفضل على EGP
      });
  }, []);

  function rateFor(cur) {
    const c = asUpper(cur);
    if (c === FX_BASE) return 1;
    const r = fxRates?.[c];
    return Number.isFinite(Number(r)) ? Number(r) : null;
  }

  function money(amountEGP) {
    const amt = safeNum(amountEGP);

    if (currency === "EGP") return formatEGP(amt);

    const r = rateFor(currency);
    if (!r) return formatEGP(amt); // fallback
    const converted = amt * r;

    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
      }).format(converted);
    } catch {
      return `${converted.toFixed(2)} ${currency}`;
    }
  }

  // ===== Destination code (for Activities/Hotels/Transfers later) =====
  const destCode = useMemo(() => {
    if (!trip) return "";
    if (isDayuseTrip(trip)) return asUpper(trip?.to_code);
    return asUpper(trip?.dest_code); // STAY لازم تبقى متسجلة في DB
  }, [trip]);

  // ===== Load Activities for this destination (MVP placeholder: لو endpoint موجود عندك) =====
  useEffect(() => {
    let alive = true;

    async function loadActs() {
      setActivities([]);
      setSelectedActs([]);
      if (!destCode) return;

      // ✅ لو عندك endpoint: /api/destinations/<CODE>/activities/
      // هنجيبها بـ fetch مباشر (عشان ما نعتمدش على apiClient لو مش جاهز)
      setActsLoading(true);
      try {
        const res = await fetch(
          `/api/destinations/${encodeURIComponent(destCode)}/activities/`
        );
        const data = await res.json();
        if (!alive) return;
        setActivities(Array.isArray(data) ? data : []);
      } catch {
        if (!alive) return;
        setActivities([]);
      } finally {
        if (alive) setActsLoading(false);
      }
    }

    loadActs();
    return () => {
      alive = false;
    };
  }, [destCode]);

  // ===== Media + Social Proof =====
  const images = useMemo(
    () => (Array.isArray(trip?.media?.images) ? trip.media.images : []),
    [trip]
  );
  const videos = useMemo(
    () => (Array.isArray(trip?.media?.videos) ? trip.media.videos : []),
    [trip]
  );

  const ratingAvg = safeNum(trip?.social_proof?.rating_avg);
  const ratingCount = safeNum(trip?.social_proof?.rating_count);
  const reviews = useMemo(
    () =>
      Array.isArray(trip?.social_proof?.reviews)
        ? trip.social_proof.reviews
        : [],
    [trip]
  );

  // ===== Checkout math =====
  const basePriceEGP = safeNum(trip?.priceFrom); // السعر الأساسي في التفاصيل = priceFrom (زي ما طلبت)
  const actsTotalEGP = useMemo(
    () => selectedActs.reduce((sum, a) => sum + safeNum(a?.price), 0),
    [selectedActs]
  );
  const subTotalEGP = basePriceEGP + actsTotalEGP;

  const discountPercent = safeNum(appliedCoupon?.percent);
  const discountEGP =
    subTotalEGP > 0 ? (subTotalEGP * discountPercent) / 100 : 0;
  const totalEGP = Math.max(0, subTotalEGP - discountEGP);

  function toggleActivity(act) {
    const id = act?.id;
    if (!id) return;

    setSelectedActs((prev) => {
      const exists = prev.some((x) => x?.id === id);
      if (exists) return prev.filter((x) => x?.id !== id);
      return [...prev, act];
    });
  }

  // Coupons (MVP)
  const COUPONS = {
    TP10: 10,
    WELCOME5: 5,
    SIWA15: 15,
  };

  function applyCoupon() {
    setCouponErr("");
    const code = asUpper(couponInput);
    if (!code) {
      setAppliedCoupon(null);
      return;
    }
    const pct = COUPONS[code];
    if (!pct) {
      setAppliedCoupon(null);
      setCouponErr("الكوبون غير صالح.");
      return;
    }
    setAppliedCoupon({ code, percent: pct });
    setCouponErr("");
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponErr("");
  }

  function stars(n) {
    const x = Math.max(0, Math.min(5, Number(n) || 0));
    const full = Math.round(x);
    return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
  }

  if (loading) {
    return (
      <div className="td-wrap">
        <div className="td-skeleton">Loading trip details…</div>
      </div>
    );
  }

  if (err || !trip) {
    return (
      <div className="td-wrap">
        <div className="td-error">
          <div className="td-error-title">لم نتمكن من تحميل تفاصيل الرحلة</div>
          <div className="td-error-msg">{String(err || "Trip not found")}</div>
          <Link className="td-back" to="/choose-your-trip">
            الرجوع لصفحة الرحلات
          </Link>
        </div>
      </div>
    );
  }

  const dayuse = isDayuseTrip(trip);

  // ✅ Reservation identifier (Operational first)
  const reserveIdentifier =
    String(trip?.publicCode || "").trim() ||
    String(trip?.public_code || "").trim() ||
    String(trip?.slug || "").trim();

  // ===== Checkout UI block (desktop) =====
  function CheckoutCard({ compact = false }) {
    return (
      <aside className={`td-checkout ${compact ? "td-checkout-compact" : ""}`}>
        <div className="td-checkout-head">
          <div>
            <div className="td-checkout-title">Checkout</div>
            <div className="td-checkout-sub">السعر النهائي بعد التأكيد</div>
          </div>

          <div className="td-currency">
            <label>Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(asUpper(e.target.value))}
            >
              {DEFAULT_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="td-lines">
          <div className="td-line">
            <div className="td-line-left">Base trip</div>
            <div className="td-line-right">{money(basePriceEGP)}</div>
          </div>

          {selectedActs.length > 0 ? (
            <div className="td-line-group">
              <div className="td-line-group-title">Activities</div>
              {selectedActs.map((a) => (
                <div className="td-line td-line-sub" key={a.id}>
                  <div className="td-line-left">{a?.title || "Activity"}</div>
                  <div className="td-line-right">
                    {money(safeNum(a?.price))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="td-hint">
              اختر Activities عشان يظهروا هنا مع السعر.
            </div>
          )}

          <div className="td-divider" />

          {/* Coupon */}
          <div className="td-coupon">
            <label>Coupon</label>
            <div className="td-coupon-row">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="مثال: TP10"
                className="td-coupon-input"
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  className="td-btn td-btn-ghost"
                  onClick={removeCoupon}
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  className="td-btn td-btn-primary"
                  onClick={applyCoupon}
                >
                  Apply
                </button>
              )}
            </div>
            {couponErr ? (
              <div className="td-coupon-err">{couponErr}</div>
            ) : null}
            {appliedCoupon ? (
              <div className="td-coupon-ok">
                تم تطبيق <b>{appliedCoupon.code}</b> — خصم{" "}
                {appliedCoupon.percent}%
              </div>
            ) : null}
          </div>

          {appliedCoupon ? (
            <div className="td-line td-discount">
              <div className="td-line-left">
                Discount{" "}
                <span className="td-muted">({appliedCoupon.percent}%)</span>
              </div>
              <div className="td-line-right">- {money(discountEGP)}</div>
            </div>
          ) : null}

          <div className="td-total">
            <div className="td-total-left">Total</div>
            <div className="td-total-right">{money(totalEGP)}</div>
          </div>

          <div className="td-actions">
            <Link
              className="td-btn td-btn-primary td-btn-block"
              to={`/reserve/${encodeURIComponent(
                reserveIdentifier
              )}?depart=${encodeURIComponent(
                depart
              )}&return=${encodeURIComponent(ret)}&nights=${encodeURIComponent(
                nights
              )}`}
              onClick={() => {
                if (import.meta.env.DEV) {
                  console.log("Trip object before reserve navigate:", trip);
                  console.log("reserveIdentifier:", reserveIdentifier);
                  console.log("trip keys:", Object.keys(trip || {}));
                }
              }}
            >
              Continue to reservation
            </Link>
          </div>

          {/* Attribution (required by open access endpoint) */}
          <div className="td-fx-attr">
            Rates by{" "}
            <a
              href="https://www.exchangerate-api.com"
              target="_blank"
              rel="noreferrer"
            >
              ExchangeRate-API
            </a>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <div className="td-wrap">
      <div className="td-grid">
        {/* Main */}
        <section className="td-main">
          <div className="td-hero">
            <div>
              <div className="td-title">{trip.title || trip.name}</div>
              <div className="td-meta">
                <span>{trip.location || trip.destinationCity || ""}</span>
                <span className="td-dot">•</span>
                <span>{dayuse ? "DAYUSE" : "STAY"}</span>
                {trip.durationLabel ? (
                  <>
                    <span className="td-dot">•</span>
                    <span>{trip.durationLabel}</span>
                  </>
                ) : null}
              </div>

              {ratingAvg > 0 ? (
                <div className="td-rating">
                  <span className="td-stars">{stars(ratingAvg)}</span>
                  <span className="td-rating-num">{ratingAvg.toFixed(1)}</span>
                  {ratingCount > 0 ? (
                    <span className="td-muted">({ratingCount} reviews)</span>
                  ) : null}
                </div>
              ) : (
                <div className="td-rating td-muted">
                  لا يوجد تقييمات بعد (لسه هنضيف Social Proof)
                </div>
              )}

              <div className="td-price">
                <span className="td-price-label">Base price:</span>
                <span className="td-price-val">{formatEGP(basePriceEGP)}</span>
              </div>

              <div className="td-cta-row">
                <Link
                  className="td-btn td-btn-primary"
                  to={`/reserve/${encodeURIComponent(
                    reserveIdentifier
                  )}?depart=${encodeURIComponent(
                    depart
                  )}&return=${encodeURIComponent(
                    ret
                  )}&nights=${encodeURIComponent(nights)}`}
                  onClick={() => {
                    if (import.meta.env.DEV) {
                      console.log("Trip object before reserve navigate:", trip);
                      console.log("reserveIdentifier:", reserveIdentifier);
                      console.log("trip keys:", Object.keys(trip || {}));
                    }
                  }}
                >
                  احجز الآن
                </Link>
                <Link className="td-btn td-btn-ghost" to="/choose-your-trip">
                  رجوع للرحلات
                </Link>
              </div>
            </div>

            {/* Desktop checkout (sticky) */}
            {!isMobile ? <CheckoutCard /> : null}
          </div>

          {/* Media */}
          <div className="td-section">
            <div className="td-section-title">Photos & Videos</div>

            {images.length > 0 ? (
              <div className="td-gallery">
                {images.map((src, idx) => (
                  <img
                    key={`${src}-${idx}`}
                    src={src}
                    alt={`trip-${idx}`}
                    loading="lazy"
                  />
                ))}
              </div>
            ) : (
              <div className="td-empty">
                ضيف صور للرحلة من Django Admin في حقل media → images[]
              </div>
            )}

            {videos.length > 0 ? (
              <div className="td-videos">
                {videos.map((v, idx) => {
                  const emb = toEmbedUrl(v);
                  return (
                    <div className="td-video" key={`${v}-${idx}`}>
                      <iframe
                        src={emb}
                        title={`video-${idx}`}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Description */}
          <div className="td-section">
            <div className="td-section-title">Trip details</div>
            <p className="td-desc">{trip.description || "—"}</p>

            {Array.isArray(trip.highlights) && trip.highlights.length > 0 ? (
              <ul className="td-bullets">
                {trip.highlights.map((h, i) => (
                  <li key={i}>{String(h)}</li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Activities */}
          <div className="td-section">
            <div className="td-section-title">Add-ons / Activities</div>

            {!destCode ? (
              <div className="td-empty">
                مفيش Destination code للرحلة دي. (لرحلات الإقامة: لازم
                Trip.dest_code يتسجل مثلًا SIWA / DHB عشان نجيب Activities
                الخاصة بالوجهة)
              </div>
            ) : actsLoading ? (
              <div className="td-empty">Loading activities…</div>
            ) : activities.length === 0 ? (
              <div className="td-empty">
                لا يوجد Activities لهذه الوجهة حاليًا.
              </div>
            ) : (
              <div className="td-acts">
                {activities.map((a) => {
                  const checked = selectedActs.some((x) => x?.id === a?.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      className={`td-act ${checked ? "is-on" : ""}`}
                      onClick={() => toggleActivity(a)}
                    >
                      <div className="td-act-left">
                        <div className="td-act-title">{a.title}</div>
                        {a.description ? (
                          <div className="td-act-desc">{a.description}</div>
                        ) : null}
                      </div>
                      <div className="td-act-right">
                        <div className="td-act-price">
                          {money(safeNum(a.price))}
                        </div>
                        <div className="td-act-toggle">
                          {checked ? "Added" : "Add"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Up-sell + Trust blocks */}
            <div className="td-upsell">
              <div className="td-upsell-card">
                <div className="td-upsell-title">
                  وفر وقتك وخلي رحلتك “Ready”
                </div>
                <div className="td-upsell-text">
                  اختيارك للـ Activities من هنا بيخلينا نجهز لك برنامج مبدئي
                  أسرع بعد تأكيد الحجز.
                </div>
              </div>
              <div className="td-upsell-card">
                <div className="td-upsell-title">ثقة وأمان</div>
                <div className="td-upsell-text">
                  متابعة على واتساب + تأكيد واضح قبل أي دفع + دعم سريع خلال
                  الرحلة.
                </div>
              </div>
            </div>
          </div>

          {/* Hotels / Transfers placeholders */}
          <div className="td-section">
            <div className="td-section-title">Hotels</div>
            <div className="td-placeholder-grid">
              <div className="td-placeholder-card">
                <div className="td-ph-title">Coming soon</div>
                <div className="td-ph-text">
                  هنعرض هنا فنادق الوجهة + خيارات الغرف + الأسعار.
                </div>
              </div>
              <div className="td-placeholder-card">
                <div className="td-ph-title">Deals & bundles</div>
                <div className="td-ph-text">
                  باكدجات “Trip + Hotel + Activities” بخصم تلقائي.
                </div>
              </div>
            </div>
          </div>

          <div className="td-section">
            <div className="td-section-title">Transfers</div>
            <div className="td-placeholder-grid">
              <div className="td-placeholder-card">
                <div className="td-ph-title">Coming soon</div>
                <div className="td-ph-text">
                  هنعرض هنا وسائل النقل المناسبة للوجهة + تسعير واضح.
                </div>
              </div>
              <div className="td-placeholder-card">
                <div className="td-ph-title">Pickup rules</div>
                <div className="td-ph-text">
                  لـ Dayuse: Pickup city ثابتة حسب الرحلة (زي ما اتفقنا).
                </div>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="td-section">
            <div className="td-section-title">Reviews & feedback</div>

            {reviews.length === 0 ? (
              <div className="td-empty">
                ضيف Reviews من Django Admin في social_proof → reviews[]
              </div>
            ) : (
              <div className="td-reviews">
                {reviews.map((r, i) => (
                  <div className="td-review" key={i}>
                    <div className="td-review-top">
                      <div className="td-review-name">{r?.name || "Guest"}</div>
                      <div className="td-review-stars">
                        {stars(safeNum(r?.rating || ratingAvg || 0))}
                      </div>
                    </div>
                    <div className="td-review-text">{r?.text || ""}</div>
                    {r?.date ? (
                      <div className="td-review-date">{String(r.date)}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Mobile bottom sheet trigger */}
        {isMobile ? (
          <>
            <div className="td-mobile-bar">
              <div className="td-mobile-total">
                <div className="td-mobile-total-label">Total</div>
                <div className="td-mobile-total-val">{money(totalEGP)}</div>
              </div>
              <button
                className="td-btn td-btn-primary"
                type="button"
                onClick={() => setSheetOpen(true)}
              >
                Checkout
              </button>
            </div>

            {sheetOpen ? (
              <div className="td-sheet">
                <div
                  className="td-sheet-backdrop"
                  onClick={() => setSheetOpen(false)}
                />
                <div className="td-sheet-panel">
                  <div className="td-sheet-head">
                    <div className="td-sheet-title">Checkout</div>
                    <button
                      className="td-sheet-close"
                      onClick={() => setSheetOpen(false)}
                      aria-label="close"
                    >
                      ✕
                    </button>
                  </div>
                  <CheckoutCard compact />
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
