// src/pages/TripReservationPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  getTripBySlug,
  getTrips,
  submitTripRequest,
  generateTripRequestCode,
} from "../services/apiClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// =========================
// Helpers
// =========================
function onlyDigits(v) {
  return String(v || "").replace(/\D+/g, "");
}

function normalizeDialCode(v) {
  const s = String(v || "").trim();
  if (!s) return "+20";
  return s.startsWith("+") ? s : `+${onlyDigits(s)}`;
}

function isEgyptianNationality(nat) {
  const s = String(nat || "")
    .trim()
    .toLowerCase();
  if (!s) return true;
  return s === "egypt" || s === "egyptian" || s === "eg" || s.includes("مصر");
}

function formatApiError(err) {
  const data = err?.response?.data;
  if (!data) return err?.message || "Request failed";

  if (typeof data === "string") return data;
  if (data.detail) return String(data.detail);

  const parts = [];
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) parts.push(`${k}: ${v.join(", ")}`);
    else if (typeof v === "object" && v)
      parts.push(`${k}: ${JSON.stringify(v)}`);
    else parts.push(`${k}: ${String(v)}`);
  }
  return parts.join(" | ") || "Request failed";
}

// اختياري: تحويل الأكواد لأسماء (للـ dayuse)
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

function codeToName(code) {
  const c = String(code || "")
    .trim()
    .toUpperCase();
  return CODE_TO_CITY[c] || c || "";
}

export default function TripReservationPage() {
  // ✅ identifier = ممكن يكون publicCode (المفضل للحجز) أو slug (SEO) — والـ backend lookup بيدعم الاتنين
  const { identifier } = useParams();
  const [sp] = useSearchParams();
  const depart = sp.get("depart");
  const ret = sp.get("return");
  const nights = sp.get("nights"); // currently not used, بس سايبه لو هتحتاجه

  const tripIdentifier = useMemo(
    () => String(identifier || "").trim(),
    [identifier]
  );

  const [resolvedIdentifier, setResolvedIdentifier] = useState("");
  const [trip, setTrip] = useState(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [tripErr, setTripErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // ===== Form state =====
  const [form, setForm] = useState({
    fullName: "",
    dialCode: "+20",
    phoneLocal: "",
    phoneHasWhatsapp: true,
    whatsappDialCode: "+20",
    whatsappLocal: "",

    email: "",
    leaderGender: "MALE",
    leaderAge: "",

    nationality: "Egypt",
    residentCountry: "Egypt",

    nationalId: "",
    passportNumber: "",
    entryStatusForEgypt: "TOURIST",

    originCity: "",
    destinationCity: "",

    departDate: "",
    returnDate: "",

    adults: 1,
    children: 0,

    couplesAnswer: "NO",
    termsAccepted: false,
    docsAcknowledged: false,

    note: "",
  });

  const isEgyptian = useMemo(
    () => isEgyptianNationality(form.nationality),
    [form.nationality]
  );

  const docsNeeded = useMemo(() => {
    const ch = Number(form.children || 0);
    const couples = form.couplesAnswer === "YES";
    return ch > 0 || couples;
  }, [form.children, form.couplesAnswer]);

  const isDayuseTrip = String(trip?.type || "").toUpperCase() === "DAYUSE";
  const destinationLocked = Boolean(trip); // ✅ destination تقفل بمجرد تحميل الرحلة
  const originLocked = Boolean(trip) && isDayuseTrip; // ✅ origin تقفل فقط في dayuse

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  // ✅ تعبئة التواريخ من query params
  useEffect(() => {
    if (!depart && !ret) return;
    setForm((p) => ({
      ...p,
      departDate: p.departDate || depart || "",
      returnDate: p.returnDate || ret || depart || "",
    }));
  }, [depart, ret]);

  // ✅ Load trip by identifier (public_code OR slug)
  useEffect(() => {
    let alive = true;

    async function load() {
      setTripLoading(true);
      setTripErr("");
      setTrip(null);
      setResolvedIdentifier("");

      // reset حقول الرحلة عند تغيير identifier
      setForm((p) => ({
        ...p,
        destinationCity: "",
        originCity: isDayuseTrip ? "" : p.originCity,
      }));

      try {
        let t = null;
        let used = "";
        let lastErr = null;

        // 1) direct by identifier
        try {
          t = await getTripBySlug(tripIdentifier);
          used = tripIdentifier;
        } catch (e) {
          lastErr = e;
        }

        // 2) fallback list search (احتياط)
        if (!t) {
          const all = await getTrips();
          const found =
            Array.isArray(all) &&
            all.find(
              (x) =>
                x?.publicCode === tripIdentifier ||
                x?.public_code === tripIdentifier ||
                x?.slug === tripIdentifier
            );

          if (found) {
            t = found;
            used =
              found?.publicCode ||
              found?.public_code ||
              found?.slug ||
              tripIdentifier;
          } else {
            throw lastErr || new Error("Trip not found");
          }
        }

        if (!alive) return;

        setTrip(t);

        const preferredIdentifier =
          String(t?.publicCode || "").trim() ||
          String(t?.public_code || "").trim() ||
          used ||
          tripIdentifier;

        setResolvedIdentifier(preferredIdentifier);

        // ✅ تعبئة origin/destination بناءً على الرحلة نفسها
        const loc = String(t?.location || "").trim();
        const locCity = loc ? loc.split(",")[0].trim() : "";
        const dayuse = String(t?.type || "").toUpperCase() === "DAYUSE";

        setForm((p) => ({
          ...p,
          // Dayuse: من/إلى ثابتين من الرحلة
          destinationCity: dayuse
            ? codeToName(t?.to_code) || locCity || p.destinationCity
            : locCity || p.destinationCity || "",
          originCity: dayuse
            ? codeToName(t?.from_code) || p.originCity || ""
            : p.originCity,
        }));
      } catch (e) {
        if (!alive) return;
        setTripErr(formatApiError(e));
      } finally {
        if (alive) setTripLoading(false);
      }
    }

    if (tripIdentifier) load();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripIdentifier]);

  async function onSubmit(e) {
    e.preventDefault();
    setStatusMsg({ type: "", text: "" });

    // ===== Front validation =====
    if (!String(form.fullName).trim())
      return setStatusMsg({ type: "err", text: "Full name is required." });
    if (!String(form.email).trim())
      return setStatusMsg({ type: "err", text: "Email is required." });
    if (!String(form.phoneLocal).trim())
      return setStatusMsg({ type: "err", text: "Phone is required." });
    if (!String(form.leaderAge).trim())
      return setStatusMsg({ type: "err", text: "Age is required." });
    if (!String(form.originCity).trim())
      return setStatusMsg({ type: "err", text: "Origin city is required." });
    if (!String(form.destinationCity).trim())
      return setStatusMsg({ type: "err", text: "Destination is required." });
    if (!String(form.departDate).trim())
      return setStatusMsg({ type: "err", text: "Depart date is required." });
    if (!String(form.returnDate).trim())
      return setStatusMsg({ type: "err", text: "Return date is required." });

    if (!form.termsAccepted)
      return setStatusMsg({ type: "err", text: "You must accept the terms." });
    if (docsNeeded && !form.docsAcknowledged)
      return setStatusMsg({
        type: "err",
        text: "Docs acknowledgment is required (children or couples).",
      });

    if (isEgyptian) {
      if (onlyDigits(form.nationalId).length < 4) {
        return setStatusMsg({
          type: "err",
          text: "National ID is required for Egyptians.",
        });
      }
    } else {
      if (String(form.passportNumber).trim().length < 4) {
        return setStatusMsg({
          type: "err",
          text: "Passport number is required for non-Egyptians.",
        });
      }
      if (
        !["TOURIST", "RESIDENCE"].includes(
          String(form.entryStatusForEgypt || "").trim()
        )
      ) {
        return setStatusMsg({
          type: "err",
          text: "Entry status is required for non-Egyptians.",
        });
      }
    }

    setBusy(true);
    try {
      // ✅ generate code for the request (CRM lead code)
      const codeResp = await generateTripRequestCode();
      const generatedCode =
        codeResp?.tripCode ||
        codeResp?.code ||
        codeResp?.data?.tripCode ||
        codeResp?.data?.code ||
        "";

      // ✅ Operational trip identifier (prefer publicCode)
      const operationalTripId =
        String(trip?.publicCode || "").trim() ||
        String(trip?.public_code || "").trim() ||
        String(resolvedIdentifier || "").trim() ||
        String(tripIdentifier || "").trim();

      const normalizedDial = normalizeDialCode(form.dialCode);
      const phoneLocalDigits = onlyDigits(form.phoneLocal);

      // بدل phoneHasWhatsapp (UI-only) — هنحوّلها لقيم WhatsApp فعلية
      const sameWhatsapp = Boolean(form.phoneHasWhatsapp);
      const normalizedWhatsappDial = sameWhatsapp
        ? normalizedDial
        : normalizeDialCode(form.whatsappDialCode);
      const whatsappLocalDigits = sameWhatsapp
        ? phoneLocalDigits
        : onlyDigits(form.whatsappLocal);

      const safeAdults = Number(form.adults || 1);
      const safeChildren = Number(form.children || 0);

      const payload = {
        tripCode_in: String(generatedCode || "").trim(),

        // ✅ trip identity (public_code or slug) — backend بيعمل lookup بالاتنين
        tripSlug_in: operationalTripId,
        tripTitle_in: String(trip?.name || trip?.title || "").trim(),

        originCity: String(form.originCity || "").trim(),
        destinationCity: String(form.destinationCity || "").trim(),

        departDate: form.departDate,
        returnDate: form.returnDate,

        fullName: String(form.fullName || "").trim(),

        dialCode: normalizedDial,
        phoneLocal: phoneLocalDigits,

        whatsappDialCode: normalizedWhatsappDial,
        whatsappLocal: whatsappLocalDigits,

        email: String(form.email || "").trim(),
        gender: form.leaderGender,
        age: form.leaderAge,
        nationality: form.nationality,
        residentCountry: form.residentCountry,
        identityType: isEgyptian ? "NATIONAL_ID" : "PASSPORT",
        identityNumber: isEgyptian
          ? String(form.nationalId || "")
          : String(form.passportNumber || ""),

        entryTypeForEgypt: form.entryTypeForEgypt,

        // ✅ مهم: الأسماء اللي الـ mapper/serializer يتوقعوها
        adultsCount: safeAdults,
        childrenCount: safeChildren,
        paxTotal: safeAdults + safeChildren,

        couplesAnswer: form.couplesAnswer,
        termsAccepted: Boolean(form.termsAccepted),
        docsAcknowledged: Boolean(form.docsAcknowledged),

        note: String(form.note || "").trim(),
      };

      const res = await submitTripRequest(payload);
      const createdId =
        res?.id ||
        res?.data?.id ||
        res?.trip_code ||
        res?.tripCode ||
        res?.data?.trip_code ||
        res?.data?.tripCode;

      const submitPayload = {
        tripCode: createdId || generatedCode || operationalTripId,
        fullName: String(form.fullName || "").trim(),
        leaderPhone: `${normalizedDial}${phoneLocalDigits}`,
        email: String(form.email || "").trim(),
        originCity: String(form.originCity || "").trim(),
        destinationCity: String(form.destinationCity || "").trim(),
        departDate: form.departDate,
        returnDate: form.returnDate,
        adults: safeAdults,
        children: safeChildren,
        totalPax: safeAdults + safeChildren,
        companionsMode: safeChildren > 0 || form.couplesAnswer === "YES" ? "LATER" : "SOLO",
      };

      try {
        sessionStorage.setItem("tp_last_submit_v1", JSON.stringify(submitPayload));
      } catch {}

      setStatusMsg({
        type: "ok",
        text: createdId
          ? `Reservation created ✅ Booking ID: ${createdId}`
          : "Reservation created ✅",
      });

      setForm((p) => ({
        ...p,
        note: "",
        termsAccepted: false,
        docsAcknowledged: false,
      }));
    } catch (e2) {
      setStatusMsg({ type: "err", text: formatApiError(e2) });
    } finally {
      setBusy(false);
    }
  }

  const tripTitle = trip?.name || trip?.title || "Reserve this trip";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{tripTitle}</h1>
      <p className="mt-1 text-sm text-white/65">
        {tripLoading
          ? "Loading trip details..."
          : trip?.location || "This will create a CRM lead automatically."}
      </p>

      {tripErr ? (
        <div className="mt-4 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm font-medium">
          {tripErr}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md shadow-2xl">
        <h2 className="text-lg font-extrabold text-white">Reservation form</h2>
        <p className="mt-1 text-xs text-white/60">
          لازم نملأ الحقول المطلوبة عشان الـ backend بيراجع شروط (Terms + Documents + Identity).
        </p>

        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/70">Full name *</label>
              <Input
                className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl"
                value={form.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/70">Email *</label>
              <Input
                className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/70">Phone *</label>
              <div className="flex gap-2 items-center">
                <div className="w-24 shrink-0">
                  <Input
                    className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl"
                    value={form.dialCode}
                    onChange={(e) => setField("dialCode", e.target.value)}
                    placeholder="+20"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl"
                    value={form.phoneLocal}
                    onChange={(e) => setField("phoneLocal", e.target.value)}
                    placeholder="Local number"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/70">WhatsApp</label>
              <div className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-white/20 bg-white/5 accent-cyan-500 cursor-pointer"
                  checked={form.phoneHasWhatsapp}
                  onChange={(e) =>
                    setField("phoneHasWhatsapp", e.target.checked)
                  }
                />
                <div>
                  <div className="text-xs font-bold text-white">
                    WhatsApp on the same phone number
                  </div>
                  <div className="text-xs text-white/60">
                    لو لأ ← هتظهر خانات رقم واتساب منفصل
                  </div>
                </div>
              </div>

              {!form.phoneHasWhatsapp ? (
                <div className="flex gap-2 items-center mt-2">
                  <div className="w-24 shrink-0">
                    <Input
                      className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl"
                      value={form.whatsappDialCode}
                      onChange={(e) =>
                        setField("whatsappDialCode", e.target.value)
                      }
                      placeholder="+20"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl"
                      value={form.whatsappLocal}
                      onChange={(e) =>
                        setField("whatsappLocal", e.target.value)
                      }
                      placeholder="WhatsApp local"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/70">Gender *</label>
              <select
                className="w-full h-8 rounded-lg border border-white/12 bg-white/5 px-2.5 py-1 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 dark:bg-[#101b23]"
                value={form.leaderGender}
                onChange={(e) => setField("leaderGender", e.target.value)}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/70">Age *</label>
              <Input
                className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl"
                type="number"
                min="1"
                value={form.leaderAge}
                onChange={(e) => setField("leaderAge", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/70">Nationality *</label>
              <Input
                className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl"
                value={form.nationality}
                onChange={(e) => setField("nationality", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/70">Resident country *</label>
              <Input
                className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl"
                value={form.residentCountry}
                onChange={(e) => setField("residentCountry", e.target.value)}
              />
            </div>

            {isEgyptian ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-white/70">National ID * (Egyptians)</label>
                <Input
                  className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl"
                  value={form.nationalId}
                  onChange={(e) => setField("nationalId", e.target.value)}
                  placeholder="Digits only"
                />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70">Passport number *</label>
                  <Input
                    className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl"
                    value={form.passportNumber}
                    onChange={(e) => setField("passportNumber", e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/70">Entry status for Egypt *</label>
                  <select
                    className="w-full h-8 rounded-lg border border-white/12 bg-white/5 px-2.5 py-1 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 dark:bg-[#101b23]"
                    value={form.entryStatusForEgypt}
                    onChange={(e) =>
                      setField("entryStatusForEgypt", e.target.value)
                    }
                  >
                    <option value="TOURIST">Tourist</option>
                    <option value="RESIDENCE">Residence</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/70">Origin city *</label>
              <Input
                className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                value={form.originCity}
                onChange={(e) => setField("originCity", e.target.value)}
                disabled={originLocked}
                readOnly={originLocked}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/70">Destination *</label>
              <Input
                className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                value={form.destinationCity}
                onChange={(e) => setField("destinationCity", e.target.value)}
                disabled={destinationLocked}
                readOnly={destinationLocked}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/70">Depart date *</label>
              <Input
                className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl"
                type="date"
                value={form.departDate}
                onChange={(e) => setField("departDate", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/70">Return date *</label>
              <Input
                className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl"
                type="date"
                value={form.returnDate}
                onChange={(e) => setField("returnDate", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/70">Adults *</label>
              <Input
                className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl"
                type="number"
                min="1"
                value={form.adults}
                onChange={(e) => setField("adults", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-white/70">Children *</label>
              <Input
                className="bg-white/5 border-white/12 text-white placeholder:text-white/40 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40 rounded-xl"
                type="number"
                min="0"
                value={form.children}
                onChange={(e) => setField("children", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-white/70">Are you traveling as a couple? *</label>
              <div className="flex gap-3 items-center mt-1">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/12 bg-white/5 text-sm text-white font-medium cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="radio"
                    className="accent-cyan-500 cursor-pointer"
                    name="couplesAnswer"
                    value="NO"
                    checked={form.couplesAnswer === "NO"}
                    onChange={() => setField("couplesAnswer", "NO")}
                  />
                  NO
                </label>

                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/12 bg-white/5 text-sm text-white font-medium cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="radio"
                    className="accent-cyan-500 cursor-pointer"
                    name="couplesAnswer"
                    value="YES"
                    checked={form.couplesAnswer === "YES"}
                    onChange={() => setField("couplesAnswer", "YES")}
                  />
                  YES
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-white/70">Note</label>
              <textarea
                className="w-full rounded-xl border border-white/12 bg-white/5 p-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                rows={4}
                value={form.note}
                onChange={(e) => setField("note", e.target.value)}
                placeholder="Any extra details..."
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <div className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-white/20 bg-white/5 accent-cyan-500 cursor-pointer"
                  checked={form.termsAccepted}
                  onChange={(e) => setField("termsAccepted", e.target.checked)}
                />
                <div>
                  <div className="text-xs font-bold text-white">I accept the terms *</div>
                  <div className="text-xs text-white/60">
                    (Required by backend validation)
                  </div>
                </div>
              </div>
            </div>

            {docsNeeded ? (
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <div className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-white/20 bg-white/5 accent-cyan-500 cursor-pointer"
                    checked={form.docsAcknowledged}
                    onChange={(e) =>
                      setField("docsAcknowledged", e.target.checked)
                    }
                  />
                  <div>
                    <div className="text-xs font-bold text-white">
                      I acknowledge required documents *
                    </div>
                    <div className="text-xs text-white/60">
                      Required because{" "}
                      {Number(form.children || 0) > 0
                        ? "children > 0"
                        : "couples = YES"}
                      .
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex gap-3 mt-6 flex-wrap">
            <Button
              className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 font-bold rounded-xl px-6 py-2.5 shadow-lg shadow-cyan-500/10 cursor-pointer"
              type="submit"
              disabled={busy || tripLoading}
            >
              {busy ? "Submitting..." : "Submit reservation"}
            </Button>
          </div>

          {statusMsg.text ? (
            <div
              className={`mt-4 p-3.5 rounded-xl border text-sm font-medium ${
                statusMsg.type === "ok"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-300"
              }`}
            >
              {statusMsg.text}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
