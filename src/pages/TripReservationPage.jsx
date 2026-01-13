// src/pages/TripReservationPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  getTripBySlug,
  getTrips,
  submitTripRequest,
  generateTripRequestCode,
} from "../services/apiClient";

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
        identityLast4: isEgyptian
          ? String(form.nationalId || "").slice(-4)
          : String(form.passportNumber || "").slice(-4),

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
      const createdCode =
        res?.trip_code ||
        res?.tripCode ||
        res?.data?.trip_code ||
        res?.data?.tripCode;

      setStatusMsg({
        type: "ok",
        text: createdCode
          ? `Reservation created ✅ Trip code: ${createdCode}`
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

  const styles = (
    <style>{`
      .res-wrap{max-width:1100px;margin:0 auto;padding:1.25rem 1rem 2rem;}
      .res-title{font-size:1.55rem;font-weight:950;margin:0;}
      .res-sub{margin:.25rem 0 0;color:rgba(255,255,255,.65);}
      .res-card{margin-top:1rem;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.03);border-radius:18px;padding:1rem;}
      .res-grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-top:.75rem;}
      @media(max-width:900px){.res-grid{grid-template-columns:1fr;}}
      .res-field label{display:block;font-size:.82rem;color:rgba(255,255,255,.68);margin-bottom:.25rem;}
      .res-input,.res-select,.res-textarea{width:100%;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:rgba(255,255,255,.92);padding:.62rem .75rem;outline:none;}
      .res-row{display:flex;gap:.6rem;align-items:end;}
      .res-row>*{flex:1;}
      .res-actions{display:flex;gap:.6rem;margin-top:.9rem;flex-wrap:wrap;}
      .res-btn{border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:rgba(255,255,255,.92);padding:.65rem .95rem;font-weight:900;cursor:pointer;}
      .res-btn.primary{border-color:rgba(0,216,192,.35);background:rgba(0,216,192,.12);}
      .res-btn:disabled{opacity:.55;cursor:not-allowed;}
      .res-msg{margin-top:.8rem;padding:.75rem .85rem;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.03);}
      .res-msg.ok{border-color:rgba(0,216,192,.30);background:rgba(0,216,192,.08);}
      .res-msg.err{border-color:rgba(255,80,80,.30);background:rgba(255,80,80,.08);}
      .res-check{display:flex;gap:.55rem;align-items:flex-start;padding:.65rem .7rem;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.03);}
      .res-check input{margin-top:.2rem;}
      .res-muted{color:rgba(255,255,255,.65);font-size:.9rem;}
      .res-radio{display:flex;gap:.6rem;flex-wrap:wrap;}
      .res-pill{display:inline-flex;gap:.45rem;align-items:center;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);padding:.55rem .7rem;border-radius:999px;cursor:pointer;}
      .res-pill input{margin:0;}
    `}</style>
  );

  const tripTitle = trip?.name || trip?.title || "Reserve this trip";

  return (
    <div className="res-wrap">
      {styles}

      <h1 className="res-title">{tripTitle}</h1>
      <p className="res-sub">
        {tripLoading
          ? "Loading trip details..."
          : trip?.location || "This will create a CRM lead automatically."}
      </p>

      {tripErr ? <div className="res-msg err">{tripErr}</div> : null}

      <div className="res-card">
        <div style={{ fontWeight: 950 }}>Reservation form</div>
        <p className="res-muted" style={{ marginTop: ".35rem" }}>
          لازم نملأ الحقول المطلوبة عشان الـ backend بيراجع شروط (Terms +
          Documents + Identity).
        </p>

        <form onSubmit={onSubmit}>
          <div className="res-grid">
            <div className="res-field">
              <label>Full name *</label>
              <input
                className="res-input"
                value={form.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
              />
            </div>

            <div className="res-field">
              <label>Email *</label>
              <input
                className="res-input"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>

            <div className="res-field">
              <label>Phone *</label>
              <div className="res-row">
                <div>
                  <input
                    className="res-input"
                    value={form.dialCode}
                    onChange={(e) => setField("dialCode", e.target.value)}
                    placeholder="+20"
                  />
                </div>
                <div>
                  <input
                    className="res-input"
                    value={form.phoneLocal}
                    onChange={(e) => setField("phoneLocal", e.target.value)}
                    placeholder="Local number"
                  />
                </div>
              </div>
            </div>

            <div className="res-field">
              <label>WhatsApp</label>
              <div className="res-check">
                <input
                  type="checkbox"
                  checked={form.phoneHasWhatsapp}
                  onChange={(e) =>
                    setField("phoneHasWhatsapp", e.target.checked)
                  }
                />
                <div>
                  <div style={{ fontWeight: 850 }}>
                    WhatsApp on the same phone number
                  </div>
                  <div className="res-muted">
                    لو لأ → هتظهر خانات رقم واتساب منفصل
                  </div>
                </div>
              </div>

              {!form.phoneHasWhatsapp ? (
                <div className="res-row" style={{ marginTop: ".6rem" }}>
                  <div>
                    <input
                      className="res-input"
                      value={form.whatsappDialCode}
                      onChange={(e) =>
                        setField("whatsappDialCode", e.target.value)
                      }
                      placeholder="+20"
                    />
                  </div>
                  <div>
                    <input
                      className="res-input"
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

            <div className="res-field">
              <label>Gender *</label>
              <select
                className="res-select"
                value={form.leaderGender}
                onChange={(e) => setField("leaderGender", e.target.value)}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div className="res-field">
              <label>Age *</label>
              <input
                className="res-input"
                type="number"
                min="1"
                value={form.leaderAge}
                onChange={(e) => setField("leaderAge", e.target.value)}
              />
            </div>

            <div className="res-field">
              <label>Nationality *</label>
              <input
                className="res-input"
                value={form.nationality}
                onChange={(e) => setField("nationality", e.target.value)}
              />
            </div>

            <div className="res-field">
              <label>Resident country *</label>
              <input
                className="res-input"
                value={form.residentCountry}
                onChange={(e) => setField("residentCountry", e.target.value)}
              />
            </div>

            {isEgyptian ? (
              <div className="res-field">
                <label>National ID * (Egyptians)</label>
                <input
                  className="res-input"
                  value={form.nationalId}
                  onChange={(e) => setField("nationalId", e.target.value)}
                  placeholder="Digits only"
                />
              </div>
            ) : (
              <>
                <div className="res-field">
                  <label>Passport number *</label>
                  <input
                    className="res-input"
                    value={form.passportNumber}
                    onChange={(e) => setField("passportNumber", e.target.value)}
                  />
                </div>

                <div className="res-field">
                  <label>Entry status for Egypt *</label>
                  <select
                    className="res-select"
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

            <div className="res-field">
              <label>Origin city *</label>
              <input
                className="res-input"
                value={form.originCity}
                onChange={(e) => setField("originCity", e.target.value)}
                disabled={originLocked}
                readOnly={originLocked}
              />
            </div>

            <div className="res-field">
              <label>Destination *</label>
              <input
                className="res-input"
                value={form.destinationCity}
                onChange={(e) => setField("destinationCity", e.target.value)}
                disabled={destinationLocked}
                readOnly={destinationLocked}
              />
            </div>

            <div className="res-field">
              <label>Depart date *</label>
              <input
                className="res-input"
                type="date"
                value={form.departDate}
                onChange={(e) => setField("departDate", e.target.value)}
              />
            </div>

            <div className="res-field">
              <label>Return date *</label>
              <input
                className="res-input"
                type="date"
                value={form.returnDate}
                onChange={(e) => setField("returnDate", e.target.value)}
              />
            </div>

            <div className="res-field">
              <label>Adults *</label>
              <input
                className="res-input"
                type="number"
                min="1"
                value={form.adults}
                onChange={(e) => setField("adults", e.target.value)}
              />
            </div>

            <div className="res-field">
              <label>Children *</label>
              <input
                className="res-input"
                type="number"
                min="0"
                value={form.children}
                onChange={(e) => setField("children", e.target.value)}
              />
            </div>

            <div className="res-field" style={{ gridColumn: "1 / -1" }}>
              <label>Are you traveling as a couple? *</label>
              <div className="res-radio">
                <label className="res-pill">
                  <input
                    type="radio"
                    name="couplesAnswer"
                    value="NO"
                    checked={form.couplesAnswer === "NO"}
                    onChange={() => setField("couplesAnswer", "NO")}
                  />
                  NO
                </label>

                <label className="res-pill">
                  <input
                    type="radio"
                    name="couplesAnswer"
                    value="YES"
                    checked={form.couplesAnswer === "YES"}
                    onChange={() => setField("couplesAnswer", "YES")}
                  />
                  YES
                </label>
              </div>
            </div>

            <div className="res-field" style={{ gridColumn: "1 / -1" }}>
              <label>Note</label>
              <textarea
                className="res-textarea"
                rows={4}
                value={form.note}
                onChange={(e) => setField("note", e.target.value)}
                placeholder="Any extra details..."
              />
            </div>

            <div className="res-field" style={{ gridColumn: "1 / -1" }}>
              <div className="res-check">
                <input
                  type="checkbox"
                  checked={form.termsAccepted}
                  onChange={(e) => setField("termsAccepted", e.target.checked)}
                />
                <div>
                  <div style={{ fontWeight: 900 }}>I accept the terms *</div>
                  <div className="res-muted">
                    (Required by backend validation)
                  </div>
                </div>
              </div>
            </div>

            {docsNeeded ? (
              <div className="res-field" style={{ gridColumn: "1 / -1" }}>
                <div className="res-check">
                  <input
                    type="checkbox"
                    checked={form.docsAcknowledged}
                    onChange={(e) =>
                      setField("docsAcknowledged", e.target.checked)
                    }
                  />
                  <div>
                    <div style={{ fontWeight: 900 }}>
                      I acknowledge required documents *
                    </div>
                    <div className="res-muted">
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

          <div className="res-actions">
            <button
              className="res-btn primary"
              type="submit"
              disabled={busy || tripLoading}
            >
              {busy ? "Submitting..." : "Submit reservation"}
            </button>
          </div>

          {statusMsg.text ? (
            <div
              className={`res-msg ${statusMsg.type === "ok" ? "ok" : "err"}`}
            >
              {statusMsg.text}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
