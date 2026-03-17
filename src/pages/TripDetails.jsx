import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Calendar, Users, CheckCircle, ArrowLeft } from "lucide-react";
import { getTripBySlug } from "@/services/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

/* ──────────────── helpers ──────────────── */

function asUpper(v) {
  return String(v || "").trim().toUpperCase();
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

/* ──────────────── FX / Currency ──────────────── */

const FX_BASE = "EGP";
const FX_CACHE_KEY = "tp_fx_rates_egp_v1";
const FX_TTL_MS = 22 * 60 * 60 * 1000;
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
    localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ ts: Date.now(), rates }));
  } catch { /* ignore */ }
}

function toEmbedUrl(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  const yt = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
  if (yt?.[1]) return `https://www.youtube.com/embed/${yt[1]}`;
  return u;
}

function starsDisplay(n) {
  const x = Math.max(0, Math.min(5, Number(n) || 0));
  const full = Math.round(x);
  return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
}

/* ──────────────── coupons (MVP) ──────────────── */
const COUPONS = { TP10: 10, WELCOME5: 5, SIWA15: 15 };

/* ──────────────── component ──────────────── */

export default function TripDetails() {
  const { slug } = useParams();
  const [sp] = useSearchParams();
  const depart = sp.get("depart") || "";
  const ret = sp.get("return") || "";
  const nights = sp.get("nights") || "";

  /* core state */
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* activities */
  const [activities, setActivities] = useState([]);
  const [actsLoading, setActsLoading] = useState(false);
  const [selectedActs, setSelectedActs] = useState([]);

  /* coupons */
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponErr, setCouponErr] = useState("");

  /* FX */
  const [currency, setCurrency] = useState("EGP");
  const [fxRates, setFxRates] = useState(() => getCachedRates() || {});

  /* mobile bottom sheet */
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 900 : true
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  /* ═══ Effects ═══ */

  // Resize listener
  useEffect(() => {
    function onResize() {
      const m = window.innerWidth < 900;
      setIsMobile(m);
      if (!m) setSheetOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock body when sheet open
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [sheetOpen]);

  // Load trip
  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      setTrip(null);
      try {
        const t = await getTripBySlug(slug);
        if (!alive) return;
        setTrip(t);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Trip not found");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [slug]);

  // Load FX rates (once/day)
  useEffect(() => {
    const cached = getCachedRates();
    if (cached) { setFxRates(cached); return; }
    fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(FX_BASE)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.result === "success" && data?.rates) {
          setFxRates(data.rates);
          setCachedRates(data.rates);
        }
      })
      .catch(() => { /* fallback to EGP */ });
  }, []);

  /* ═══ Derived / Computed ═══ */

  const destCode = useMemo(() => {
    if (!trip) return "";
    return isDayuseTrip(trip) ? asUpper(trip?.to_code) : asUpper(trip?.dest_code);
  }, [trip]);

  // Load activities for destination
  useEffect(() => {
    let alive = true;
    async function loadActs() {
      setActivities([]);
      setSelectedActs([]);
      if (!destCode) return;
      setActsLoading(true);
      try {
        const res = await fetch(`/api/destinations/${encodeURIComponent(destCode)}/activities/`);
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
    return () => { alive = false; };
  }, [destCode]);

  // Media + Social Proof
  const images = useMemo(() => Array.isArray(trip?.media?.images) ? trip.media.images : [], [trip]);
  const videos = useMemo(() => Array.isArray(trip?.media?.videos) ? trip.media.videos : [], [trip]);
  const ratingAvg = safeNum(trip?.social_proof?.rating_avg);
  const ratingCount = safeNum(trip?.social_proof?.rating_count);
  const reviews = useMemo(
    () => Array.isArray(trip?.social_proof?.reviews) ? trip.social_proof.reviews : [],
    [trip]
  );

  // Checkout math
  const basePriceEGP = safeNum(trip?.priceFrom || trip?.pricePerPerson);
  const actsTotalEGP = useMemo(
    () => selectedActs.reduce((sum, a) => sum + safeNum(a?.price), 0),
    [selectedActs]
  );
  const subTotalEGP = basePriceEGP + actsTotalEGP;
  const discountPercent = safeNum(appliedCoupon?.percent);
  const discountEGP = subTotalEGP > 0 ? (subTotalEGP * discountPercent) / 100 : 0;
  const totalEGP = Math.max(0, subTotalEGP - discountEGP);

  /* ═══ Actions ═══ */

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
    if (!r) return formatEGP(amt);
    const converted = amt * r;
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(converted);
    } catch {
      return `${converted.toFixed(2)} ${currency}`;
    }
  }

  function toggleActivity(act) {
    const id = act?.id;
    if (!id) return;
    setSelectedActs((prev) => {
      const exists = prev.some((x) => x?.id === id);
      if (exists) return prev.filter((x) => x?.id !== id);
      return [...prev, act];
    });
  }

  function applyCoupon() {
    setCouponErr("");
    const code = asUpper(couponInput);
    if (!code) { setAppliedCoupon(null); return; }
    const pct = COUPONS[code];
    if (!pct) { setAppliedCoupon(null); setCouponErr("الكوبون غير صالح."); return; }
    setAppliedCoupon({ code, percent: pct });
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponErr("");
  }

  /* ═══ Reservation identifier ═══ */
  const reserveIdentifier =
    String(trip?.publicCode || "").trim() ||
    String(trip?.public_code || "").trim() ||
    String(trip?.slug || "").trim();

  /* ═══ Render: Loading ═══ */
  if (loading) {
    return (
      <div className="pt-6 sm:pt-10 max-w-[1040px] mx-auto animate-pulse">
        <div className="h-4 w-24 bg-secondary rounded mb-8"></div>
        <div className="h-10 w-3/4 max-w-lg bg-secondary rounded-lg mb-4"></div>
        <div className="h-6 w-1/2 bg-secondary rounded mb-10"></div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
          <div className="h-[400px] bg-secondary rounded-3xl"></div>
          <div className="h-[500px] bg-secondary rounded-3xl"></div>
        </div>
      </div>
    );
  }

  /* ═══ Render: Error ═══ */
  if (error || !trip) {
    return (
      <div className="pt-20 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">!</span>
        </div>
        <h2 className="text-2xl font-bold mb-4">Trip Not Found</h2>
        <p className="text-muted-foreground mb-8">{error || "The destination you are looking for does not exist."}</p>
        <Button asChild className="rounded-full bg-white/10 hover:bg-white/20 text-white">
          <Link to="/">Browse All Destinations</Link>
        </Button>
      </div>
    );
  }

  const dayuse = isDayuseTrip(trip);

  /* ═══ CheckoutCard sub-component ═══ */
  function CheckoutCard({ compact = false }) {
    return (
      <Card className={`bg-card text-card-foreground border border-border rounded-2xl ${compact ? "" : "lg:sticky lg:top-24"}`}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold">Checkout</h3>
              <p className="text-xs text-muted-foreground">السعر النهائي بعد التأكيد</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(asUpper(e.target.value))}
                className="bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-ring outline-none"
              >
                {DEFAULT_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lines */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base trip</span>
              <span className="font-medium">{money(basePriceEGP)}</span>
            </div>

            {selectedActs.length > 0 ? (
              <div className="space-y-1.5 pl-2 border-l-2 border-primary/30">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Activities</span>
                {selectedActs.map((a) => (
                  <div key={a.id} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{a?.title || "Activity"}</span>
                    <span>{money(safeNum(a?.price))}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">اختر Activities عشان يظهروا هنا مع السعر.</p>
            )}

            <div className="border-t border-border pt-3" />

            {/* Coupon */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Coupon</label>
              <div className="flex gap-2">
                <Input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="مثال: TP10"
                  className="bg-background text-foreground border-border rounded-lg h-9 text-xs"
                />
                {appliedCoupon ? (
                  <Button variant="ghost" size="sm" onClick={removeCoupon} className="text-xs shrink-0">Remove</Button>
                ) : (
                  <Button size="sm" onClick={applyCoupon} className="bg-primary text-primary-foreground text-xs shrink-0">Apply</Button>
                )}
              </div>
              {couponErr && <p className="text-xs text-destructive">{couponErr}</p>}
              {appliedCoupon && (
                <p className="text-xs text-primary">تم تطبيق <strong>{appliedCoupon.code}</strong> — خصم {appliedCoupon.percent}%</p>
              )}
            </div>

            {appliedCoupon && (
              <div className="flex justify-between text-primary">
                <span>Discount <span className="text-muted-foreground">({appliedCoupon.percent}%)</span></span>
                <span>- {money(discountEGP)}</span>
              </div>
            )}

            <div className="border-t border-border pt-3 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{money(totalEGP)}</span>
            </div>
          </div>

          {/* CTA */}
          <Button asChild className="w-full mt-6 rounded-xl bg-gradient-to-r from-primary to-[#00d8c0] text-primary-foreground font-bold h-12 shadow-[0_10px_25px_hsl(var(--primary)/0.3)] hover:-translate-y-[1px] transition-all">
            <Link
              to={`/reserve/${encodeURIComponent(reserveIdentifier)}?depart=${encodeURIComponent(depart)}&return=${encodeURIComponent(ret)}&nights=${encodeURIComponent(nights)}`}
            >
              Continue to reservation
            </Link>
          </Button>

          <p className="text-center text-[10px] text-muted-foreground mt-3">
            Rates by{" "}
            <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer" className="underline hover:text-primary">
              ExchangeRate-API
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  /* ═══ Render: Main ═══ */
  return (
    <div className="pt-2 sm:pt-8 pb-10">
      <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-white mb-8 transition-colors">
        <ArrowLeft size={16} className="mr-1.5" />
        Back to Destinations
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 xl:gap-16 items-start">

        {/* ═══ Left Col: Details ═══ */}
        <div>
          {/* Header */}
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-secondary border border-border rounded-full text-[11px] font-bold uppercase tracking-wider text-accent-strong mb-4">
              {trip.destination || trip.destinationCity || (dayuse ? "DAYUSE" : "STAY")}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-[1.15]">{trip.title || trip.name}</h1>

            {/* Rating */}
            {ratingAvg > 0 ? (
              <div className="flex items-center gap-2 mb-3 text-sm">
                <span className="text-yellow-400">{starsDisplay(ratingAvg)}</span>
                <span className="font-medium">{ratingAvg.toFixed(1)}</span>
                {ratingCount > 0 && <span className="text-muted-foreground">({ratingCount} reviews)</span>}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mb-3">No ratings yet</p>
            )}

            <p className="text-lg text-muted-foreground leading-relaxed">
              {trip.description || trip.shortDescription || "Experience an unforgettable journey customized for the modern explorer."}
            </p>
          </div>

          {/* Stats bar */}
          <div className="bg-secondary text-secondary-foreground p-6 rounded-2xl flex flex-wrap justify-between items-center mt-8 mb-10 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Duration</span>
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar size={15} className="text-primary" />
                <span>{trip.durationDays || trip.durationLabel || "—"}</span>
              </div>
            </div>

            {(trip.maxCapacity || trip.max_capacity) && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Group Size</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <Users size={15} className="text-primary" />
                  <span>Max {trip.maxCapacity || trip.max_capacity}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
              <div className="flex items-center gap-1.5 font-medium text-foreground/90">
                <span className={`w-2 h-2 rounded-full ${trip.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                <span className="capitalize">{trip.status || 'Active'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Base Price</span>
              <div className="flex items-center gap-1.5 font-medium text-primary text-lg">
                {money(basePriceEGP)}
              </div>
            </div>
          </div>

          {/* Media Gallery */}
          {(images.length > 0 || videos.length > 0) && (
            <div className="mb-10">
              <h3 className="text-xl font-bold mb-4">Photos & Videos</h3>
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {images.map((src, idx) => (
                    <img key={`${src}-${idx}`} src={src} alt={`trip-${idx}`} loading="lazy"
                      className="rounded-xl w-full h-[180px] object-cover border border-border" />
                  ))}
                </div>
              )}
              {videos.map((v, idx) => {
                const emb = toEmbedUrl(v);
                return (
                  <div key={`${v}-${idx}`} className="rounded-xl overflow-hidden border border-border mb-3 aspect-video">
                    <iframe src={emb} title={`video-${idx}`} loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen className="w-full h-full" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Description + Highlights */}
          <div className="mb-10">
            <h3 className="text-xl font-bold mb-4">The Experience</h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {trip.description || `Dive deep into the heart of ${trip.destination || "this destination"} with a curated itinerary that balances iconic sights with hidden gems.`}
            </p>

            {Array.isArray(trip.highlights) && trip.highlights.length > 0 && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {trip.highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-muted-foreground text-sm">
                    <CheckCircle size={16} className="text-primary shrink-0" />
                    {String(h)}
                  </li>
                ))}
              </ul>
            )}

            <h4 className="text-lg font-bold mb-3 mt-8">What's Included</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {["Luxury Accommodations", "Private Expert Guides", "VIP Airport Transfers",
                "Curated Dining Experiences", "All Domestic Transportation", "24/7 Concierge Support"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-muted-foreground text-sm">
                  <CheckCircle size={16} className="text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Activities */}
          <div className="mb-10">
            <h3 className="text-xl font-bold mb-4">Add-ons / Activities</h3>
            {!destCode ? (
              <p className="text-sm text-muted-foreground italic">No destination code for activities.</p>
            ) : actsLoading ? (
              <p className="text-sm text-muted-foreground">Loading activities…</p>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">لا يوجد Activities لهذه الوجهة حاليًا.</p>
            ) : (
              <div className="grid gap-3">
                {activities.map((a) => {
                  const checked = selectedActs.some((x) => x?.id === a?.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleActivity(a)}
                      className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                        checked
                          ? "border-primary bg-primary/5 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                          : "border-border bg-secondary/30 hover:border-white/20"
                      }`}
                    >
                      <div>
                        <div className="font-medium text-sm">{a.title}</div>
                        {a.description && <div className="text-xs text-muted-foreground mt-0.5">{a.description}</div>}
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="text-sm font-medium">{money(safeNum(a.price))}</div>
                        <div className={`text-xs mt-0.5 ${checked ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                          {checked ? "Added ✓" : "Add"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trust blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <Card className="border-border bg-secondary/30">
              <CardContent className="p-5">
                <h4 className="font-bold text-sm mb-1">وفر وقتك وخلي رحلتك "Ready"</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  اختيارك للـ Activities من هنا بيخلينا نجهز لك برنامج مبدئي أسرع بعد تأكيد الحجز.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-secondary/30">
              <CardContent className="p-5">
                <h4 className="font-bold text-sm mb-1">ثقة وأمان</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  متابعة على واتساب + تأكيد واضح قبل أي دفع + دعم سريع خلال الرحلة.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Reviews */}
          <div className="mb-10">
            <h3 className="text-xl font-bold mb-4">Reviews & feedback</h3>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">لا يوجد تقييمات حتى الآن.</p>
            ) : (
              <div className="grid gap-4">
                {reviews.map((r, i) => (
                  <Card key={i} className="border-border bg-secondary/30">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{r?.name || "Guest"}</span>
                        <span className="text-yellow-400 text-sm">{starsDisplay(safeNum(r?.rating || ratingAvg || 0))}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{r?.text || ""}</p>
                      {r?.date && <p className="text-[10px] text-muted-foreground mt-2">{String(r.date)}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Right Col: Checkout (Desktop) ═══ */}
        {!isMobile && (
          <div className="lg:sticky lg:top-24">
            <CheckoutCard />
          </div>
        )}
      </div>

      {/* ═══ Mobile Bottom Bar + Sheet ═══ */}
      {isMobile && (
        <>
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</div>
              <div className="text-lg font-bold text-primary">{money(totalEGP)}</div>
            </div>
            <Button
              onClick={() => setSheetOpen(true)}
              className="rounded-xl bg-gradient-to-r from-primary to-[#00d8c0] text-primary-foreground font-bold px-6"
            >
              Checkout
            </Button>
          </div>

          {sheetOpen && (
            <div className="fixed inset-0 z-40 flex items-end">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSheetOpen(false)} />
              <div className="relative w-full max-h-[85vh] overflow-y-auto bg-background rounded-t-3xl border-t border-border p-6 animate-in slide-in-from-bottom">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Checkout</h3>
                  <button
                    onClick={() => setSheetOpen(false)}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-white"
                    aria-label="close"
                  >✕</button>
                </div>
                <CheckoutCard compact />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
