// src/pages/CustomizeYourTripPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/apiClient";

const SUBMIT_ENDPOINT = "/trip-requests/";
const GENERATE_CODE_ENDPOINT = "/trip-requests/generate-code/";
const ALLOW_PAST_DATES_FOR_TEAM = false;
const DRAFT_KEY = "tp_customize_draft_v7";
const WHATSAPP_NUMBER = "201030624545";

/** =========================
 * Options (MVP lists)
 * ========================= */
const COUNTRY_OPTIONS = [
  { name: "Egypt", iso2: "EG" },
  { name: "Saudi Arabia", iso2: "SA" },
  { name: "United Arab Emirates", iso2: "AE" },
  { name: "Kuwait", iso2: "KW" },
  { name: "Qatar", iso2: "QA" },
  { name: "Bahrain", iso2: "BH" },
  { name: "Oman", iso2: "OM" },
  { name: "Jordan", iso2: "JO" },
  { name: "Lebanon", iso2: "LB" },
  { name: "Iraq", iso2: "IQ" },
  { name: "Palestine", iso2: "PS" },
  { name: "Yemen", iso2: "YE" },
  { name: "Morocco", iso2: "MA" },
  { name: "Algeria", iso2: "DZ" },
  { name: "Tunisia", iso2: "TN" },
  { name: "Libya", iso2: "LY" },
  { name: "Sudan", iso2: "SD" },

  { name: "Turkey", iso2: "TR" },
  { name: "Greece", iso2: "GR" },
  { name: "Italy", iso2: "IT" },
  { name: "France", iso2: "FR" },
  { name: "Germany", iso2: "DE" },
  { name: "United Kingdom", iso2: "GB" },
  { name: "Spain", iso2: "ES" },
  { name: "Portugal", iso2: "PT" },
  { name: "Netherlands", iso2: "NL" },
  { name: "Belgium", iso2: "BE" },
  { name: "Switzerland", iso2: "CH" },
  { name: "Austria", iso2: "AT" },
  { name: "Sweden", iso2: "SE" },
  { name: "Norway", iso2: "NO" },
  { name: "Denmark", iso2: "DK" },
  { name: "Ireland", iso2: "IE" },

  { name: "United States", iso2: "US" },
  { name: "Canada", iso2: "CA" },
  { name: "Mexico", iso2: "MX" },
  { name: "Brazil", iso2: "BR" },
  { name: "Argentina", iso2: "AR" },

  { name: "Russia", iso2: "RU" },
  { name: "Ukraine", iso2: "UA" },

  { name: "China", iso2: "CN" },
  { name: "Japan", iso2: "JP" },
  { name: "South Korea", iso2: "KR" },
  { name: "India", iso2: "IN" },
  { name: "Pakistan", iso2: "PK" },
  { name: "Bangladesh", iso2: "BD" },
  { name: "Sri Lanka", iso2: "LK" },
  { name: "Indonesia", iso2: "ID" },
  { name: "Malaysia", iso2: "MY" },
  { name: "Singapore", iso2: "SG" },
  { name: "Thailand", iso2: "TH" },
  { name: "Vietnam", iso2: "VN" },
  { name: "Philippines", iso2: "PH" },

  { name: "South Africa", iso2: "ZA" },
  { name: "Nigeria", iso2: "NG" },
  { name: "Kenya", iso2: "KE" },
  { name: "Ethiopia", iso2: "ET" },
  { name: "Tanzania", iso2: "TZ" },
  { name: "Uganda", iso2: "UG" },
  { name: "Ghana", iso2: "GH" },
];

const DIAL_CODE_OPTIONS = [
  { name: "Egypt", iso2: "EG", code: "+20" },
  { name: "Saudi Arabia", iso2: "SA", code: "+966" },
  { name: "United Arab Emirates", iso2: "AE", code: "+971" },
  { name: "Kuwait", iso2: "KW", code: "+965" },
  { name: "Qatar", iso2: "QA", code: "+974" },
  { name: "Bahrain", iso2: "BH", code: "+973" },
  { name: "Oman", iso2: "OM", code: "+968" },
  { name: "Jordan", iso2: "JO", code: "+962" },
  { name: "Lebanon", iso2: "LB", code: "+961" },
  { name: "Iraq", iso2: "IQ", code: "+964" },
  { name: "Palestine", iso2: "PS", code: "+970" },
  { name: "Yemen", iso2: "YE", code: "+967" },
  { name: "Morocco", iso2: "MA", code: "+212" },
  { name: "Algeria", iso2: "DZ", code: "+213" },
  { name: "Tunisia", iso2: "TN", code: "+216" },
  { name: "Libya", iso2: "LY", code: "+218" },
  { name: "Sudan", iso2: "SD", code: "+249" },

  { name: "Turkey", iso2: "TR", code: "+90" },
  { name: "United Kingdom", iso2: "GB", code: "+44" },
  { name: "Germany", iso2: "DE", code: "+49" },
  { name: "France", iso2: "FR", code: "+33" },
  { name: "Italy", iso2: "IT", code: "+39" },
  { name: "Spain", iso2: "ES", code: "+34" },
  { name: "Netherlands", iso2: "NL", code: "+31" },

  { name: "United States", iso2: "US", code: "+1" },
  { name: "Canada", iso2: "CA", code: "+1" },

  { name: "India", iso2: "IN", code: "+91" },
  { name: "Pakistan", iso2: "PK", code: "+92" },
  { name: "Bangladesh", iso2: "BD", code: "+880" },

  { name: "China", iso2: "CN", code: "+86" },
  { name: "Japan", iso2: "JP", code: "+81" },
  { name: "South Korea", iso2: "KR", code: "+82" },

  { name: "South Africa", iso2: "ZA", code: "+27" },
  { name: "Nigeria", iso2: "NG", code: "+234" },
  { name: "Kenya", iso2: "KE", code: "+254" },
];

const NATIONALITY_OPTIONS = COUNTRY_OPTIONS;

/** =========================
 * Helpers
 * ========================= */
function onlyDigits(v = "") {
  return String(v).replace(/\D+/g, "");
}
function sanitizePassport(v = "") {
  return String(v)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}
function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function formatDMY(isoDate) {
  if (!isoDate || typeof isoDate !== "string" || !isoDate.includes("-"))
    return "";
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}
function firstName(fullName = "") {
  return fullName.trim().split(/\s+/)[0] || "";
}
function isValidEmail(email = "") {
  const v = String(email).trim();
  return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v);
}
function isValidPhoneLocalDigits(digits = "") {
  const len = String(digits).length;
  return len >= 7 && len <= 14;
}
function requiredText(v) {
  return String(v || "").trim().length > 0;
}
function isEgyptian(nat = "") {
  const s = String(nat).trim().toLowerCase();
  return (
    s === "egypt" ||
    s === "egyptian" ||
    s === "eg" ||
    s.includes("مصري") ||
    s.includes("مصر")
  );
}
function last4Display(v = "") {
  const s = String(v || "").trim();
  const tail = s.slice(-4);
  if (!tail) return "••••";
  return `•••• ${tail}`;
}
function residenceLabel(v) {
  if (v === "RESIDENCE") return "Residence permit";
  if (v === "TOURIST") return "Tourist visa";
  return "";
}
function flagEmoji(iso2 = "") {
  const s = String(iso2 || "").toUpperCase();
  if (s.length !== 2) return "🏳️";
  const A = 0x1f1e6;
  const code0 = s.charCodeAt(0) - 65 + A;
  const code1 = s.charCodeAt(1) - 65 + A;
  return String.fromCodePoint(code0, code1);
}
function generateTripCode() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const t = Date.now().toString(36).toUpperCase().slice(-6);
  return `TP-${y}${m}${day}-${t}-${rand}`;
}
function travelerCode(tripCode, index1) {
  return `${tripCode}-P${index1}`;
}

// =========================
// ✅ TripRequest payload (snake_case)
// =========================
function buildTripRequestSnakePayload(
  form,
  { adults, children, totalPax, isSolo, needsDocs }
) {
  const leaderIsEg = isEgyptian(form.nationality);

  const leaderPhone = `${String(form.dialCode || "").trim()}${onlyDigits(
    form.phoneLocal
  )}`;
  const leaderWhatsapp = form.phoneHasWhatsapp
    ? leaderPhone
    : `${String(form.whatsappDialCode || "").trim()}${onlyDigits(
        form.whatsappLocal
      )}`;

  const leaderIdentityRaw = leaderIsEg
    ? onlyDigits(form.nationalId)
    : sanitizePassport(form.passportNumber);
  const leaderIdentityLast4 = (leaderIdentityRaw || "").slice(-4);

  const companionsMode = isSolo
    ? "SOLO"
    : String(form.companionsMode || "").trim();

  const travelers = (form.travelers || []).map((t, idx) => {
    const tIsEg = isEgyptian(t.nationality);

    const tPhone = `${String(t.dialCode || "").trim()}${onlyDigits(
      t.phoneLocal
    )}`;
    const tWhatsapp = t.phoneHasWhatsapp
      ? tPhone
      : `${String(t.whatsappDialCode || "").trim()}${onlyDigits(
          t.whatsappLocal
        )}`;

    const tIdentityRaw = tIsEg
      ? onlyDigits(t.nationalId)
      : sanitizePassport(t.passportNumber);
    const tIdentityLast4 = (tIdentityRaw || "").slice(-4);

    return {
      index: idx + 1,
      is_leader: idx === 0,

      full_name: String(t.fullName || "").trim(),
      gender: String(t.gender || "").trim(),
      age: Number(t.age) || null,

      phone: tPhone,
      whatsapp: tWhatsapp,
      email: String(t.email || "").trim(),

      nationality: String(t.nationality || "").trim(),
      resident_country: String(t.residentCountry || "").trim(),

      identity_type: tIsEg ? "NATIONAL_ID" : "PASSPORT",
      identity_last4: tIdentityLast4,

      entry_type_for_egypt: tIsEg
        ? ""
        : String(t.entryStatusForEgypt || "").trim(),

      origin_city: requiredText(t.originCityOverride)
        ? String(t.originCityOverride).trim()
        : String(form.originCity || "").trim(),
    };
  });

  const childrenDetails = (form.childrenDetails || []).map((c, idx) => ({
    child_index: idx + 1,
    full_name: String(c.fullName || "").trim(),
    age_group: String(c.ageGroup || "").trim(),
    birth_cert_id: onlyDigits(c.birthCertId),
  }));

  return {
    // Customize: غالباً مفيش trip_slug / trip_title
    trip_slug: "",
    trip_title: "",

    origin_city: String(form.originCity || "").trim(),
    destination_city: String(form.destinationCity || "").trim(),

    depart_date: form.departDate || null,
    return_date: form.returnDate || null,

    adults_count: Number(adults) || 1,
    children_count: Number(children) || 0,
    pax_total: Number(totalPax) || 1,

    companions_mode: companionsMode,

    note: String(form.note || "").trim(),
    couples_answer: String(form.couplesAnswer || "").trim(),

    // ✅ دول كانوا سبب الرسالة بتاعة required
    terms_accepted: !!form.termsAccepted,
    docs_acknowledged: needsDocs
      ? !!form.docsAcknowledged
      : !!form.docsAcknowledged,

    leader_full_name: String(form.fullName || "").trim(),
    leader_phone: leaderPhone,
    leader_whatsapp: leaderWhatsapp,
    leader_email: String(form.email || "").trim(),

    leader_gender: String(form.leaderGender || "").trim(),
    leader_age: Number(form.leaderAge) || null,

    leader_nationality: String(form.nationality || "").trim(),
    leader_resident_country: String(form.residentCountry || "").trim(),

    leader_identity_type: leaderIsEg ? "NATIONAL_ID" : "PASSPORT",
    leader_identity_last4: leaderIdentityLast4,

    entry_type_for_egypt: leaderIsEg
      ? ""
      : String(form.entryStatusForEgypt || "").trim(),

    travelers,
    children_details: childrenDetails,
  };
}

/** =========================
 * Default state
 * ========================= */
function defaultForm() {
  return {
    tripCode: "",

    fullName: "",
    dialCode: "+20",
    phoneLocal: "",
    phoneHasWhatsapp: true,
    whatsappDialCode: "+20",
    whatsappLocal: "",
    email: "",
    leaderGender: "",
    leaderAge: "",

    nationality: "",
    residentCountry: "",
    nationalId: "",
    passportNumber: "",
    entryStatusForEgypt: "",

    originCity: "Cairo",
    destinationCity: "Dahab",
    departDate: "",
    returnDate: "",

    adults: 1,
    children: 0,

    companionsMode: "",

    travelers: [
      {
        fullName: "",
        gender: "",
        age: "",
        dialCode: "+20",
        phoneLocal: "",
        phoneHasWhatsapp: true,
        whatsappDialCode: "+20",
        whatsappLocal: "",
        email: "",
        nationality: "",
        residentCountry: "",
        nationalId: "",
        passportNumber: "",
        entryStatusForEgypt: "",
        originCityOverride: "",
      },
    ],

    childrenDetails: [],

    note: "",

    couplesAnswer: "",
    termsAccepted: false,
    docsAcknowledged: false,
  };
}

/** =========================
 * Masked input (no eye button)
 * ========================= */
function MaskedTextInput({
  value,
  onValueChange,
  placeholder,
  disabled,
  inputMode = "text",
  maxLength,
  className = "",
}) {
  return (
    <input
      className={`input ${className}`}
      type="password"
      inputMode={inputMode}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      autoComplete="off"
    />
  );
}

function DataListInput({
  value,
  onChange,
  onBlur,
  listId,
  placeholder,
  className = "",
}) {
  return (
    <input
      className={`input ${className}`}
      list={listId}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      autoComplete="off"
    />
  );
}

/** =========================
 * Main Page
 * ========================= */
export default function CustomizeYourTripPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(() => defaultForm());
  const [touched, setTouched] = useState({});
  const [attempted, setAttempted] = useState({});
  const [stepIndex, setStepIndex] = useState(0);

  const [sysSave, setSysSave] = useState({ status: "idle", error: "" }); // idle|saving|success|error

  // Restore draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) {
        setForm((prev) => ({
          ...prev,
          tripCode: prev.tripCode || generateTripCode(),
        }));
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;

      const merged = { ...defaultForm(), ...parsed };
      merged.tripCode = merged.tripCode || generateTripCode();

      merged.travelers = Array.isArray(parsed.travelers)
        ? parsed.travelers
        : defaultForm().travelers;
      merged.childrenDetails = Array.isArray(parsed.childrenDetails)
        ? parsed.childrenDetails
        : [];

      setForm(merged);
    } catch {
      setForm((prev) => ({
        ...prev,
        tripCode: prev.tripCode || generateTripCode(),
      }));
    }
  }, []);

  // Trip Code (from system)
  useEffect(() => {
    let cancelled = false;

    async function getCode() {
      try {
        if (form.tripCode) return;

        const res = await axios.get(GENERATE_CODE_ENDPOINT);
        // apiClient بيحوّل response لـ camelCase
        const code = res?.data?.tripCode || res?.data?.trip_code;

        if (!cancelled && code) {
          setForm((p) => ({ ...p, tripCode: code }));
        }
      } catch {
        // fallback لو السيرفر واقع
        if (!cancelled) {
          setForm((p) => ({
            ...p,
            tripCode: p.tripCode || generateTripCode(),
          }));
        }
      }
    }

    getCode();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.tripCode]);

  // Persist draft
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }
  function markTouched(key) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }
  function markStepAttempt(stepKey) {
    setAttempted((prev) => ({ ...prev, [stepKey]: true }));
  }

  const adults = useMemo(
    () => Math.max(1, Number(form.adults) || 1),
    [form.adults]
  );
  const children = useMemo(
    () => Math.max(0, Number(form.children) || 0),
    [form.children]
  );
  const totalPax = adults + children;
  const isSolo = totalPax === 1;

  const destinationCountry = "Egypt";

  const leaderIsEgyptian = isEgyptian(form.nationality);
  const shouldAskNationalIdLeader = leaderIsEgyptian;
  const shouldAskPassportLeader = !leaderIsEgyptian;
  const shouldAskEntryStatusLeader = !leaderIsEgyptian;

  const minDepart = ALLOW_PAST_DATES_FOR_TEAM ? undefined : todayISO();
  const minReturn = ALLOW_PAST_DATES_FOR_TEAM
    ? undefined
    : form.departDate || todayISO();

  const datesValid = useMemo(() => {
    if (!form.departDate || !form.returnDate) return false;
    return form.returnDate >= form.departDate;
  }, [form.departDate, form.returnDate]);

  // Resize children details
  useEffect(() => {
    setForm((prev) => {
      const current = Array.isArray(prev.childrenDetails)
        ? prev.childrenDetails
        : [];
      const resized = Array.from({ length: children }, (_, i) => {
        return current[i] || { fullName: "", ageGroup: "", birthCertId: "" };
      });
      return { ...prev, childrenDetails: resized };
    });
  }, [children]);

  // Resize travelers + mirror leader into travelers[0]
  useEffect(() => {
    setForm((prev) => {
      const current = Array.isArray(prev.travelers) ? prev.travelers : [];
      const resized = Array.from({ length: adults }, (_, i) => {
        return (
          current[i] || {
            fullName: "",
            gender: "",
            age: "",
            dialCode: "+20",
            phoneLocal: "",
            phoneHasWhatsapp: true,
            whatsappDialCode: "+20",
            whatsappLocal: "",
            email: "",
            nationality: "",
            residentCountry: "",
            nationalId: "",
            passportNumber: "",
            entryStatusForEgypt: "",
            originCityOverride: "",
          }
        );
      });

      resized[0] = {
        ...resized[0],
        fullName: prev.fullName,
        gender: prev.leaderGender,
        age: prev.leaderAge,
        dialCode: prev.dialCode,
        phoneLocal: prev.phoneLocal,
        phoneHasWhatsapp: prev.phoneHasWhatsapp,
        whatsappDialCode: prev.whatsappDialCode,
        whatsappLocal: prev.whatsappLocal,
        email: prev.email,
        nationality: prev.nationality,
        residentCountry: prev.residentCountry,
        nationalId: prev.nationalId,
        passportNumber: prev.passportNumber,
        entryStatusForEgypt: prev.entryStatusForEgypt,
        originCityOverride: "",
      };

      return { ...prev, travelers: resized };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    adults,
    form.fullName,
    form.leaderGender,
    form.leaderAge,
    form.dialCode,
    form.phoneLocal,
    form.phoneHasWhatsapp,
    form.whatsappDialCode,
    form.whatsappLocal,
    form.email,
    form.nationality,
    form.residentCountry,
    form.nationalId,
    form.passportNumber,
    form.entryStatusForEgypt,
  ]);

  function updateTraveler(index, patch) {
    setForm((prev) => {
      const next = [...(prev.travelers || [])];
      next[index] = { ...next[index], ...patch };
      return { ...prev, travelers: next };
    });
  }
  function updateChild(index, patch) {
    setForm((prev) => {
      const next = [...(prev.childrenDetails || [])];
      next[index] = { ...next[index], ...patch };
      return { ...prev, childrenDetails: next };
    });
  }

  const needsDocs = useMemo(() => {
    const hasKids = children > 0;
    const hasCouples = form.couplesAnswer === "YES";
    return hasKids || hasCouples;
  }, [children, form.couplesAnswer]);

  // Steps
  const steps = useMemo(() => {
    // AFTER_SUBMIT دايمًا بعد REVIEW
    if (isSolo) return ["LEADER", "NOTE", "REVIEW", "AFTER_SUBMIT"];
    if (form.companionsMode === "NOW")
      return [
        "LEADER",
        "COMP_MODE",
        "COMP_DETAILS",
        "NOTE",
        "REVIEW",
        "AFTER_SUBMIT",
      ];
    return ["LEADER", "COMP_MODE", "NOTE", "REVIEW", "AFTER_SUBMIT"];
  }, [isSolo, form.companionsMode]);

  const stepKey = steps[stepIndex] || steps[0];
  const stepsCount = steps.length;
  const progressPct = Math.round(((stepIndex + 1) / stepsCount) * 100);

  function goNext() {
    setStepIndex((i) => Math.min(stepsCount - 1, i + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Validation
  const leaderPhoneDigits = onlyDigits(form.phoneLocal);
  const leaderFullPhone = `${form.dialCode}${leaderPhoneDigits}`;

  const leaderWhatsappDigits = onlyDigits(form.whatsappLocal);
  const leaderFullWhatsapp = `${form.whatsappDialCode}${leaderWhatsappDigits}`;

  const leaderWhatsappOk =
    form.phoneHasWhatsapp === true ||
    (requiredText(form.whatsappDialCode) &&
      isValidPhoneLocalDigits(leaderWhatsappDigits));

  function leaderStepValid() {
    const baseOk =
      requiredText(form.fullName) &&
      requiredText(form.dialCode) &&
      requiredText(form.phoneLocal) &&
      requiredText(form.email) &&
      requiredText(form.leaderGender) &&
      requiredText(form.leaderAge) &&
      requiredText(form.nationality) &&
      requiredText(form.residentCountry) &&
      requiredText(form.originCity) &&
      requiredText(form.destinationCity) &&
      requiredText(form.departDate) &&
      requiredText(form.returnDate) &&
      datesValid &&
      Number(form.adults) >= 1 &&
      Number(form.children) >= 0;

    if (!baseOk) return false;

    const ageNum = Number(form.leaderAge);
    if (!Number.isFinite(ageNum) || ageNum < 18) return false;

    if (!isValidEmail(form.email)) return false;
    if (!isValidPhoneLocalDigits(leaderPhoneDigits)) return false;
    if (!leaderWhatsappOk) return false;

    if (shouldAskNationalIdLeader) {
      const id = onlyDigits(form.nationalId);
      if (id.length !== 14) return false;
    } else {
      const p = sanitizePassport(form.passportNumber);
      if (p.length < 5) return false;
      if (
        form.entryStatusForEgypt !== "RESIDENCE" &&
        form.entryStatusForEgypt !== "TOURIST"
      )
        return false;
    }
    return true;
  }

  function compModeValid() {
    return form.companionsMode === "NOW" || form.companionsMode === "LATER";
  }

  function travelersNowValid() {
    const arr = Array.isArray(form.travelers) ? form.travelers : [];
    if (arr.length !== adults) return false;

    for (let i = 0; i < arr.length; i++) {
      const t = arr[i];

      if (
        !requiredText(t.fullName) ||
        !requiredText(t.gender) ||
        !requiredText(t.age)
      )
        return false;

      const ageNum = Number(t.age);
      if (!Number.isFinite(ageNum) || ageNum < 18) return false;

      const td = onlyDigits(t.phoneLocal);
      if (!requiredText(t.dialCode) || !isValidPhoneLocalDigits(td))
        return false;

      const tWDigits = onlyDigits(t.whatsappLocal);
      const tWhatsappOk =
        t.phoneHasWhatsapp === true ||
        (requiredText(t.whatsappDialCode) && isValidPhoneLocalDigits(tWDigits));
      if (!tWhatsappOk) return false;

      if (!requiredText(t.email) || !isValidEmail(t.email)) return false;

      if (!requiredText(t.nationality) || !requiredText(t.residentCountry))
        return false;
      const tEgypt = isEgyptian(t.nationality);

      if (tEgypt) {
        const id = onlyDigits(t.nationalId);
        if (id.length !== 14) return false;
      } else {
        const p = sanitizePassport(t.passportNumber);
        if (p.length < 5) return false;
        if (
          t.entryStatusForEgypt !== "RESIDENCE" &&
          t.entryStatusForEgypt !== "TOURIST"
        )
          return false;
      }
    }

    if (children > 0) {
      for (const c of form.childrenDetails || []) {
        if (
          !requiredText(c.fullName) ||
          !requiredText(c.ageGroup) ||
          !requiredText(c.birthCertId)
        )
          return false;
        const id = onlyDigits(c.birthCertId);
        if (id.length < 5) return false;
      }
    }

    return true;
  }

  function reviewValid() {
    const couplesOk =
      form.couplesAnswer === "YES" || form.couplesAnswer === "NO";
    const termsOk = !!form.termsAccepted;
    const docsOk = needsDocs ? !!form.docsAcknowledged : true;
    return couplesOk && termsOk && docsOk;
  }

  function buildSystemPayload(action = "submit") {
    const travelers = (form.travelers || []).map((t, idx) => {
      const isEg = isEgyptian(t.nationality);
      const identity = isEg
        ? onlyDigits(t.nationalId)
        : sanitizePassport(t.passportNumber);

      const phone = `${t.dialCode}${onlyDigits(t.phoneLocal)}`;
      const wa = t.phoneHasWhatsapp
        ? phone
        : `${t.whatsappDialCode}${onlyDigits(t.whatsappLocal)}`;

      return {
        travelerCode: travelerCode(form.tripCode, idx + 1),
        fullName: t.fullName,
        gender: t.gender,
        age: t.age,
        phone,
        whatsapp: wa,
        email: t.email,
        nationality: t.nationality,
        residentCountry: t.residentCountry,
        identityType: isEg ? "NATIONAL_ID" : "PASSPORT",
        identityNumber: identity,
        egyptEntryStatus: isEg ? "" : t.entryStatusForEgypt,
        originCity: requiredText(t.originCityOverride)
          ? t.originCityOverride
          : form.originCity,
      };
    });

    const kids = (form.childrenDetails || []).map((c, idx) => ({
      childIndex: idx + 1,
      fullName: c.fullName,
      ageGroup: c.ageGroup,
      birthCertId: onlyDigits(c.birthCertId),
    }));

    return {
      action,
      tripCode_in: form.tripCode,
      createdAt: new Date().toISOString(),
      trip: {
        originCity: form.originCity,
        destinationCity: form.destinationCity,
        departDate: form.departDate,
        returnDate: form.returnDate,
        pax: { total: totalPax, adults, children },
      },
      companionsMode: isSolo ? "SOLO" : form.companionsMode,
      travelers,
      children: kids,
      note: (form.note || "").trim(),
      confirmations: {
        couplesAnswer: form.couplesAnswer,
        termsAccepted: !!form.termsAccepted,
        docsAcknowledged: !!form.docsAcknowledged,
        needsDocs: !!needsDocs,
      },
    };
  }

  async function persistToSystem() {
    setSysSave({ status: "saving", error: "" });

    try {
      const payload = buildTripRequestSnakePayload(form, {
        adults,
        children,
        totalPax,
        isSolo: totalPax === 1,
        needsDocs,
      });

      const res = await api.post(SUBMIT_ENDPOINT, payload);

      // ✅ لو السيرفر رجّع trip_code الحقيقي نخزّنه بدل اللي متولد محليًا
      const serverTripCode =
        res?.data?.trip_code ||
        res?.data?.tripCode ||
        res?.data?.trip_code_internal ||
        "";

      if (serverTripCode) {
        setForm((p) => ({ ...p, tripCode: serverTripCode }));
      }

      setSysSave({ status: "success", error: "" });
      return true;
    } catch (err) {
      const msg = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message || "Failed to submit";
      setSysSave({ status: "error", error: msg });
      return false;
    }
  }

  function buildWhatsAppLink() {
    const lines = [];

    lines.push(`Travelophilia – New Request`);
    lines.push(`Trip code: ${form.tripCode}`);
    lines.push(`Hello ${firstName(form.fullName) || "Traveler"} 👋`);
    lines.push("");

    lines.push(`Travelers:`);
    const list = form.travelers || [];
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      const isEg = isEgyptian(t.nationality);
      const idRaw = isEg
        ? onlyDigits(t.nationalId)
        : sanitizePassport(t.passportNumber);

      const phone = `${t.dialCode}${onlyDigits(t.phoneLocal)}`;
      const wa = t.phoneHasWhatsapp
        ? phone
        : `${t.whatsappDialCode}${onlyDigits(t.whatsappLocal)}`;

      const origin = requiredText(t.originCityOverride)
        ? t.originCityOverride
        : form.originCity;

      lines.push(
        `- ${travelerCode(form.tripCode, i + 1)} | ${t.fullName} | ${wa} | ${
          t.nationality
        } | ${last4Display(idRaw)} | From: ${origin}`
      );
    }

    lines.push("");
    lines.push(`Trip:`);
    lines.push(`From: ${form.originCity}`);
    lines.push(`To: ${form.destinationCity}`);
    lines.push(
      `Dates: ${formatDMY(form.departDate)} → ${formatDMY(form.returnDate)}`
    );
    lines.push(`Pax: ${totalPax} (Adults ${adults}, Children ${children})`);
    if (!leaderIsEgyptian)
      lines.push(
        `Egypt entry status: ${residenceLabel(form.entryStatusForEgypt)}`
      );

    lines.push("");
    lines.push(`Couples: ${form.couplesAnswer === "YES" ? "Yes" : "No"}`);
    lines.push(`Confirmation requires 50% deposit.`);

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      lines.join("\n")
    )}`;
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }

  // UI error classes
  function showError(fieldKey) {
    const tried = attempted[stepKey];
    return !!touched[fieldKey] || !!tried;
  }
  function inputClass(fieldKey, isOk) {
    if (!showError(fieldKey)) return "";
    return isOk ? "" : "tp-error";
  }

  const uiStyles = (
    <style>{`
      .tp-progress-wrap{margin:0 0 1.2rem; padding:0.75rem 0;}
      .tp-progress-top{display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:0.45rem;}
      .tp-progress-label{font-size:0.85rem; color: var(--text-muted, #9ba6b2);}
      .tp-progress-bar{height:12px; border-radius:999px; overflow:hidden; background: rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.08);}
      .tp-progress-fill{
        height:100%;
        width:${progressPct}%;
        border-radius:999px;
        background: linear-gradient(90deg, rgba(0,216,192,0.15), rgba(0,216,192,0.75), rgba(0,165,255,0.75), rgba(0,216,192,0.15));
        background-size: 300% 100%;
        animation: tpWave 2.4s ease-in-out infinite;
        box-shadow: 0 0 0 1px rgba(0,216,192,0.25) inset;
      }
      @keyframes tpWave{ 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

      .tp-error{border-color: rgba(255, 80, 80, 0.9) !important; box-shadow: 0 0 0 1px rgba(255, 80, 80, 0.25) inset;}
      .tp-help{color: var(--text-muted, #9ba6b2); font-size:0.85rem; margin-top:0.35rem;}

      .tp-card{
        border:1px solid rgba(255,255,255,0.10);
        background: rgba(255,255,255,0.03);
        border-radius:16px;
        padding: 1rem;
        margin-top: 1rem;
      }
      .tp-card.leader{
        border-color: rgba(0,216,192,0.25);
        background: rgba(0,216,192,0.06);
      }
      .tp-card-title{
        font-size:1.05rem;
        font-weight:800;
        margin: 0 0 0.75rem;
      }

      .tp-review-grid{display:grid; gap:0.8rem;}
      .tp-kv{display:flex; justify-content:space-between; gap:1rem; padding:0.75rem 0.9rem; border-radius:14px; border:1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);}
      .tp-k{color: var(--text-muted, #9ba6b2); font-size:0.85rem;}
      .tp-v{font-weight:600; text-align:right;}
      .tp-radio{display:flex; flex-direction:column; gap:0.6rem; margin-top:0.6rem;}
      .tp-radio label{display:flex; gap:0.6rem; align-items:flex-start; cursor:pointer;}
      .tp-check{display:flex; gap:0.55rem; align-items:flex-start; margin-top:0.75rem;}
      .tp-check p{margin:0; font-size:0.88rem;}

      .tp-phone-row{display:grid; grid-template-columns: 120px 1fr; gap:0.75rem;}
      @media (max-width: 720px){ .tp-phone-row{grid-template-columns: 120px 1fr;} }

      .btn-primary:disabled{opacity:.45; cursor:not-allowed; filter: grayscale(0.2);}

      .tp-actions-row{display:flex; gap:0.75rem; flex-wrap:wrap;}
    `}</style>
  );

  const blur = (key) => () => markTouched(key);

  return (
    <div className="page">
      {uiStyles}

      {/* DATALISTS */}
      <datalist id="tpCountryList">
        {COUNTRY_OPTIONS.slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((c) => (
            <option
              key={c.iso2}
              value={c.name}
              label={`${flagEmoji(c.iso2)} ${c.name}`}
            />
          ))}
      </datalist>

      <datalist id="tpNationalityList">
        {NATIONALITY_OPTIONS.slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((c) => (
            <option
              key={c.iso2}
              value={c.name}
              label={`${flagEmoji(c.iso2)} ${c.name}`}
            />
          ))}
      </datalist>

      <datalist id="tpDialCodesList">
        {DIAL_CODE_OPTIONS.slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((c) => (
            <option
              key={`${c.iso2}-${c.code}`}
              value={c.code}
              label={`${flagEmoji(c.iso2)} ${c.name} (${c.code})`}
            />
          ))}
      </datalist>

      <header className="page-header page-header-center">
        <p className="page-kicker">Customize your trip</p>
        <h1>Let’s build your perfect trip</h1>

        <div className="tp-progress-wrap">
          <div className="tp-progress-top">
            <div className="tp-progress-label">
              Step {stepIndex + 1} / {stepsCount}
            </div>
            <div className="tp-progress-label">{progressPct}%</div>
          </div>
          <div className="tp-progress-bar">
            <div className="tp-progress-fill" />
          </div>
        </div>
      </header>

      {/* ===================== LEADER ===================== */}
      {stepKey === "LEADER" && (
        <section className="form">
          <div className="form-grid">
            <div className="field-group">
              <h2 className="section-title">Leader details</h2>

              <label>
                Full name <span className="page-error">*</span>
                <input
                  className={`input ${inputClass(
                    "fullName",
                    requiredText(form.fullName)
                  )}`}
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  onBlur={blur("fullName")}
                  placeholder="Your full name"
                />
              </label>

              <label>
                Phone <span className="page-error">*</span>
                <div className="tp-phone-row">
                  <DataListInput
                    value={form.dialCode}
                    onChange={(e) => update("dialCode", e.target.value)}
                    onBlur={blur("dialCode")}
                    listId="tpDialCodesList"
                    placeholder="+20"
                    className={inputClass(
                      "dialCode",
                      requiredText(form.dialCode)
                    )}
                  />
                  <input
                    className={`input ${inputClass(
                      "phoneLocal",
                      isValidPhoneLocalDigits(onlyDigits(form.phoneLocal))
                    )}`}
                    value={form.phoneLocal}
                    onChange={(e) =>
                      update("phoneLocal", onlyDigits(e.target.value))
                    }
                    onBlur={blur("phoneLocal")}
                    placeholder="Number"
                  />
                </div>
              </label>

              <div className="tp-check">
                <input
                  type="checkbox"
                  checked={!!form.phoneHasWhatsapp}
                  onChange={(e) => update("phoneHasWhatsapp", e.target.checked)}
                />
                <p className="page-info">This phone number has WhatsApp</p>
              </div>

              {!form.phoneHasWhatsapp && (
                <label style={{ marginTop: "0.6rem" }}>
                  WhatsApp number <span className="page-error">*</span>
                  <div className="tp-phone-row">
                    <DataListInput
                      value={form.whatsappDialCode}
                      onChange={(e) =>
                        update("whatsappDialCode", e.target.value)
                      }
                      onBlur={blur("whatsappDialCode")}
                      listId="tpDialCodesList"
                      placeholder="+20"
                      className={inputClass(
                        "whatsappDialCode",
                        requiredText(form.whatsappDialCode)
                      )}
                    />
                    <input
                      className={`input ${inputClass(
                        "whatsappLocal",
                        isValidPhoneLocalDigits(onlyDigits(form.whatsappLocal))
                      )}`}
                      value={form.whatsappLocal}
                      onChange={(e) =>
                        update("whatsappLocal", onlyDigits(e.target.value))
                      }
                      onBlur={blur("whatsappLocal")}
                      placeholder="WhatsApp number"
                    />
                  </div>
                </label>
              )}

              <label>
                Email <span className="page-error">*</span>
                <input
                  className={`input ${inputClass(
                    "email",
                    isValidEmail(form.email)
                  )}`}
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  onBlur={blur("email")}
                  placeholder="name@email.com"
                />
              </label>

              <div className="field-row">
                <label>
                  Gender <span className="page-error">*</span>
                  <select
                    className={`input ${inputClass(
                      "leaderGender",
                      requiredText(form.leaderGender)
                    )}`}
                    value={form.leaderGender}
                    onChange={(e) => update("leaderGender", e.target.value)}
                    onBlur={blur("leaderGender")}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>

                <label>
                  Age <span className="page-error">*</span>
                  <input
                    className={`input ${inputClass(
                      "leaderAge",
                      Number(form.leaderAge) >= 18
                    )}`}
                    value={form.leaderAge}
                    onChange={(e) =>
                      update("leaderAge", onlyDigits(e.target.value))
                    }
                    onBlur={blur("leaderAge")}
                    placeholder="e.g. 23"
                  />
                </label>
              </div>
            </div>

            <div className="field-group">
              <h2 className="section-title">Identity & residence</h2>

              <label>
                Nationality <span className="page-error">*</span>
                <DataListInput
                  value={form.nationality}
                  onChange={(e) => update("nationality", e.target.value)}
                  onBlur={blur("nationality")}
                  listId="tpNationalityList"
                  placeholder="Type to search..."
                  className={inputClass(
                    "nationality",
                    requiredText(form.nationality)
                  )}
                />
              </label>

              <label>
                Resident country <span className="page-error">*</span>
                <DataListInput
                  value={form.residentCountry}
                  onChange={(e) => update("residentCountry", e.target.value)}
                  onBlur={blur("residentCountry")}
                  listId="tpCountryList"
                  placeholder="Type to search..."
                  className={inputClass(
                    "residentCountry",
                    requiredText(form.residentCountry)
                  )}
                />
              </label>

              {shouldAskNationalIdLeader && (
                <label>
                  National ID <span className="page-error">*</span>
                  <MaskedTextInput
                    value={form.nationalId}
                    onValueChange={(v) => update("nationalId", onlyDigits(v))}
                    placeholder="National ID"
                    inputMode="numeric"
                    maxLength={14}
                    className={inputClass(
                      "nationalId",
                      onlyDigits(form.nationalId).length === 14
                    )}
                  />
                </label>
              )}

              {shouldAskPassportLeader && (
                <>
                  <label>
                    Passport number <span className="page-error">*</span>
                    <MaskedTextInput
                      value={form.passportNumber}
                      onValueChange={(v) =>
                        update("passportNumber", sanitizePassport(v))
                      }
                      placeholder="Passport number"
                      maxLength={20}
                      className={inputClass(
                        "passportNumber",
                        sanitizePassport(form.passportNumber).length >= 5
                      )}
                    />
                  </label>

                  {shouldAskEntryStatusLeader && (
                    <label>
                      Egypt entry status <span className="page-error">*</span>
                      <select
                        className={`input ${inputClass(
                          "entryStatusForEgypt",
                          form.entryStatusForEgypt === "RESIDENCE" ||
                            form.entryStatusForEgypt === "TOURIST"
                        )}`}
                        value={form.entryStatusForEgypt}
                        onChange={(e) =>
                          update("entryStatusForEgypt", e.target.value)
                        }
                        onBlur={blur("entryStatusForEgypt")}
                      >
                        <option value="">Select</option>
                        <option value="RESIDENCE">Residence permit</option>
                        <option value="TOURIST">Tourist visa</option>
                      </select>
                    </label>
                  )}
                </>
              )}
            </div>

            <div className="field-group full-width">
              <h2 className="section-title">Trip basics</h2>

              <div className="field-row">
                <label>
                  Departure city <span className="page-error">*</span>
                  <input
                    className={`input ${inputClass(
                      "originCity",
                      requiredText(form.originCity)
                    )}`}
                    value={form.originCity}
                    onChange={(e) => update("originCity", e.target.value)}
                    onBlur={blur("originCity")}
                    placeholder="e.g. Cairo"
                  />
                </label>

                <label>
                  Destination city <span className="page-error">*</span>
                  <input
                    className={`input ${inputClass(
                      "destinationCity",
                      requiredText(form.destinationCity)
                    )}`}
                    value={form.destinationCity}
                    onChange={(e) => update("destinationCity", e.target.value)}
                    onBlur={blur("destinationCity")}
                    placeholder="e.g. Dahab"
                  />
                </label>
              </div>

              <div className="field-row">
                <label>
                  Departure date <span className="page-error">*</span>
                  <input
                    type="date"
                    className={`input ${inputClass(
                      "departDate",
                      requiredText(form.departDate) && !!datesValid
                    )}`}
                    value={form.departDate}
                    min={minDepart}
                    onChange={(e) => update("departDate", e.target.value)}
                    onBlur={blur("departDate")}
                  />
                </label>

                <label>
                  Return date <span className="page-error">*</span>
                  <input
                    type="date"
                    className={`input ${inputClass(
                      "returnDate",
                      requiredText(form.returnDate) && !!datesValid
                    )}`}
                    value={form.returnDate}
                    min={minReturn}
                    onChange={(e) => update("returnDate", e.target.value)}
                    onBlur={blur("returnDate")}
                  />
                </label>
              </div>

              <div className="field-row">
                <label>
                  Adults <span className="page-error">*</span>
                  <input
                    type="number"
                    min={1}
                    className={`input ${inputClass(
                      "adults",
                      Number(form.adults) >= 1
                    )}`}
                    value={form.adults}
                    onChange={(e) => update("adults", Number(e.target.value))}
                    onBlur={blur("adults")}
                  />
                </label>

                <label>
                  Children <span className="page-error">*</span>
                  <input
                    type="number"
                    min={0}
                    className={`input ${inputClass(
                      "children",
                      Number(form.children) >= 0
                    )}`}
                    value={form.children}
                    onChange={(e) => update("children", Number(e.target.value))}
                    onBlur={blur("children")}
                  />
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button
                className="btn-primary"
                disabled={!leaderStepValid()}
                onClick={goNext}
                type="button"
              >
                Continue
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ===================== COMP_MODE ===================== */}
      {stepKey === "COMP_MODE" && (
        <section className="form">
          <div className="form-grid">
            <div className="field-group full-width">
              <h2 className="section-title">Companions info</h2>

              <div className="tp-radio">
                <label>
                  <input
                    type="radio"
                    name="companionsMode"
                    value="NOW"
                    checked={form.companionsMode === "NOW"}
                    onChange={() => update("companionsMode", "NOW")}
                  />
                  <div>
                    <strong>Fill companions now</strong>
                  </div>
                </label>

                <label>
                  <input
                    type="radio"
                    name="companionsMode"
                    value="LATER"
                    checked={form.companionsMode === "LATER"}
                    onChange={() => update("companionsMode", "LATER")}
                  />
                  <div>
                    <strong>They will fill later</strong>
                  </div>
                </label>
              </div>

              {attempted["COMP_MODE"] && !compModeValid() && (
                <p className="page-error">Required.</p>
              )}
            </div>

            <div className="form-actions">
              <div className="tp-actions-row">
                <button className="btn-ghost" onClick={goBack} type="button">
                  Back
                </button>
                <button
                  className="btn-primary"
                  disabled={!compModeValid()}
                  onClick={() => {
                    if (!compModeValid()) {
                      markStepAttempt("COMP_MODE");
                      return;
                    }
                    goNext();
                  }}
                  type="button"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================== COMP_DETAILS ===================== */}
      {stepKey === "COMP_DETAILS" && form.companionsMode === "NOW" && (
        <section className="form">
          <div className="form-grid">
            <div className="field-group full-width">
              <h2 className="section-title">Travelers details</h2>

              <div className="tp-card leader">
                <div className="tp-card-title">Leader</div>

                <div className="field-row">
                  <label>
                    Trip code
                    <input className="input" value={form.tripCode} disabled />
                  </label>
                  <label>
                    Traveler code
                    <input
                      className="input"
                      value={travelerCode(form.tripCode, 1)}
                      disabled
                    />
                  </label>
                </div>

                <div className="field-row">
                  <label>
                    Name
                    <input className="input" value={form.fullName} disabled />
                  </label>
                  <label>
                    Phone
                    <input
                      className="input"
                      value={`${form.dialCode}${onlyDigits(form.phoneLocal)}`}
                      disabled
                    />
                  </label>
                </div>

                <div className="field-row">
                  <label>
                    ID / Passport
                    <input
                      className="input"
                      value={last4Display(
                        leaderIsEgyptian
                          ? onlyDigits(form.nationalId)
                          : sanitizePassport(form.passportNumber)
                      )}
                      disabled
                    />
                  </label>
                  <label>
                    Destination
                    <input
                      className="input"
                      value={form.destinationCity}
                      disabled
                    />
                  </label>
                </div>
              </div>

              {adults > 1 &&
                (form.travelers || []).slice(1).map((t, idx) => {
                  const realIndex = idx + 1;
                  const tIsEgyptian = isEgyptian(t.nationality);

                  const tPhoneDigits = onlyDigits(t.phoneLocal);
                  const tWhatsappDigits = onlyDigits(t.whatsappLocal);

                  const tPhoneOk = isValidPhoneLocalDigits(tPhoneDigits);
                  const tWhatsappOk =
                    t.phoneHasWhatsapp === true ||
                    (requiredText(t.whatsappDialCode) &&
                      isValidPhoneLocalDigits(tWhatsappDigits));

                  const tIdOk = tIsEgyptian
                    ? onlyDigits(t.nationalId).length === 14
                    : sanitizePassport(t.passportNumber).length >= 5;

                  const tEntryOk = tIsEgyptian
                    ? true
                    : t.entryStatusForEgypt === "RESIDENCE" ||
                      t.entryStatusForEgypt === "TOURIST";

                  return (
                    <div key={realIndex} className="tp-card">
                      <div className="tp-card-title">
                        Traveler {realIndex + 1}
                      </div>

                      <div className="field-row">
                        <label>
                          Traveler code
                          <input
                            className="input"
                            value={travelerCode(form.tripCode, realIndex + 1)}
                            disabled
                          />
                        </label>
                        <label>
                          Departure city
                          <input
                            className="input"
                            value={t.originCityOverride || ""}
                            onChange={(e) =>
                              updateTraveler(realIndex, {
                                originCityOverride: e.target.value,
                              })
                            }
                            placeholder=""
                          />
                        </label>
                      </div>

                      <div className="field-row">
                        <label>
                          Full name <span className="page-error">*</span>
                          <input
                            className={`input ${
                              attempted["COMP_DETAILS"] &&
                              !requiredText(t.fullName)
                                ? "tp-error"
                                : ""
                            }`}
                            value={t.fullName || ""}
                            onChange={(e) =>
                              updateTraveler(realIndex, {
                                fullName: e.target.value,
                              })
                            }
                            placeholder="Full name"
                          />
                        </label>

                        <label>
                          Gender <span className="page-error">*</span>
                          <select
                            className={`input ${
                              attempted["COMP_DETAILS"] &&
                              !requiredText(t.gender)
                                ? "tp-error"
                                : ""
                            }`}
                            value={t.gender || ""}
                            onChange={(e) =>
                              updateTraveler(realIndex, {
                                gender: e.target.value,
                              })
                            }
                          >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </label>
                      </div>

                      <div className="field-row">
                        <label>
                          Age <span className="page-error">*</span>
                          <input
                            className={`input ${
                              attempted["COMP_DETAILS"] &&
                              !(Number(t.age) >= 18)
                                ? "tp-error"
                                : ""
                            }`}
                            value={t.age || ""}
                            onChange={(e) =>
                              updateTraveler(realIndex, {
                                age: onlyDigits(e.target.value),
                              })
                            }
                            placeholder=""
                          />
                        </label>

                        <label>
                          Email <span className="page-error">*</span>
                          <input
                            className={`input ${
                              attempted["COMP_DETAILS"] &&
                              !isValidEmail(t.email)
                                ? "tp-error"
                                : ""
                            }`}
                            value={t.email || ""}
                            onChange={(e) =>
                              updateTraveler(realIndex, {
                                email: e.target.value,
                              })
                            }
                            placeholder="name@email.com"
                          />
                        </label>
                      </div>

                      <label>
                        Phone <span className="page-error">*</span>
                        <div className="tp-phone-row">
                          <DataListInput
                            value={t.dialCode || ""}
                            onChange={(e) =>
                              updateTraveler(realIndex, {
                                dialCode: e.target.value,
                              })
                            }
                            onBlur={() => {}}
                            listId="tpDialCodesList"
                            placeholder="+20"
                            className={
                              attempted["COMP_DETAILS"] &&
                              !requiredText(t.dialCode)
                                ? "tp-error"
                                : ""
                            }
                          />
                          <input
                            className={`input ${
                              attempted["COMP_DETAILS"] && !tPhoneOk
                                ? "tp-error"
                                : ""
                            }`}
                            value={t.phoneLocal || ""}
                            onChange={(e) =>
                              updateTraveler(realIndex, {
                                phoneLocal: onlyDigits(e.target.value),
                              })
                            }
                            placeholder="Number"
                          />
                        </div>
                      </label>

                      <div className="tp-check">
                        <input
                          type="checkbox"
                          checked={t.phoneHasWhatsapp !== false}
                          onChange={(e) =>
                            updateTraveler(realIndex, {
                              phoneHasWhatsapp: e.target.checked,
                            })
                          }
                        />
                        <p className="page-info">
                          This phone number has WhatsApp
                        </p>
                      </div>

                      {t.phoneHasWhatsapp === false && (
                        <label style={{ marginTop: "0.6rem" }}>
                          WhatsApp number <span className="page-error">*</span>
                          <div className="tp-phone-row">
                            <DataListInput
                              value={t.whatsappDialCode || ""}
                              onChange={(e) =>
                                updateTraveler(realIndex, {
                                  whatsappDialCode: e.target.value,
                                })
                              }
                              onBlur={() => {}}
                              listId="tpDialCodesList"
                              placeholder="+20"
                              className={
                                attempted["COMP_DETAILS"] &&
                                !requiredText(t.whatsappDialCode)
                                  ? "tp-error"
                                  : ""
                              }
                            />
                            <input
                              className={`input ${
                                attempted["COMP_DETAILS"] && !tWhatsappOk
                                  ? "tp-error"
                                  : ""
                              }`}
                              value={t.whatsappLocal || ""}
                              onChange={(e) =>
                                updateTraveler(realIndex, {
                                  whatsappLocal: onlyDigits(e.target.value),
                                })
                              }
                              placeholder="WhatsApp number"
                            />
                          </div>
                        </label>
                      )}

                      <div className="field-row">
                        <label>
                          Nationality <span className="page-error">*</span>
                          <DataListInput
                            value={t.nationality || ""}
                            onChange={(e) =>
                              updateTraveler(realIndex, {
                                nationality: e.target.value,
                              })
                            }
                            onBlur={() => {}}
                            listId="tpNationalityList"
                            placeholder="Type to search..."
                            className={
                              attempted["COMP_DETAILS"] &&
                              !requiredText(t.nationality)
                                ? "tp-error"
                                : ""
                            }
                          />
                        </label>

                        <label>
                          Resident country <span className="page-error">*</span>
                          <DataListInput
                            value={t.residentCountry || ""}
                            onChange={(e) =>
                              updateTraveler(realIndex, {
                                residentCountry: e.target.value,
                              })
                            }
                            onBlur={() => {}}
                            listId="tpCountryList"
                            placeholder="Type to search..."
                            className={
                              attempted["COMP_DETAILS"] &&
                              !requiredText(t.residentCountry)
                                ? "tp-error"
                                : ""
                            }
                          />
                        </label>
                      </div>

                      {tIsEgyptian ? (
                        <label>
                          National ID <span className="page-error">*</span>
                          <MaskedTextInput
                            value={t.nationalId || ""}
                            onValueChange={(v) =>
                              updateTraveler(realIndex, {
                                nationalId: onlyDigits(v),
                              })
                            }
                            placeholder="National ID"
                            inputMode="numeric"
                            maxLength={14}
                            className={
                              attempted["COMP_DETAILS"] && !tIdOk
                                ? "tp-error"
                                : ""
                            }
                          />
                        </label>
                      ) : (
                        <>
                          <label>
                            Passport number{" "}
                            <span className="page-error">*</span>
                            <MaskedTextInput
                              value={t.passportNumber || ""}
                              onValueChange={(v) =>
                                updateTraveler(realIndex, {
                                  passportNumber: sanitizePassport(v),
                                })
                              }
                              placeholder="Passport number"
                              maxLength={20}
                              className={
                                attempted["COMP_DETAILS"] && !tIdOk
                                  ? "tp-error"
                                  : ""
                              }
                            />
                          </label>

                          <label>
                            Egypt entry status{" "}
                            <span className="page-error">*</span>
                            <select
                              className={`input ${
                                attempted["COMP_DETAILS"] && !tEntryOk
                                  ? "tp-error"
                                  : ""
                              }`}
                              value={t.entryStatusForEgypt || ""}
                              onChange={(e) =>
                                updateTraveler(realIndex, {
                                  entryStatusForEgypt: e.target.value,
                                })
                              }
                            >
                              <option value="">Select</option>
                              <option value="RESIDENCE">
                                Residence permit
                              </option>
                              <option value="TOURIST">Tourist visa</option>
                            </select>
                          </label>
                        </>
                      )}
                    </div>
                  );
                })}

              {children > 0 && (
                <div className="tp-card">
                  <div className="tp-card-title">Children</div>

                  {(form.childrenDetails || []).map((c, idx) => {
                    const cIdOk = onlyDigits(c.birthCertId).length >= 5;

                    return (
                      <div
                        key={idx}
                        className="tp-card"
                        style={{ marginTop: idx ? "0.9rem" : 0 }}
                      >
                        <div className="tp-card-title">Child {idx + 1}</div>

                        <div className="field-row">
                          <label>
                            Child name <span className="page-error">*</span>
                            <input
                              className={`input ${
                                attempted["COMP_DETAILS"] &&
                                !requiredText(c.fullName)
                                  ? "tp-error"
                                  : ""
                              }`}
                              value={c.fullName}
                              onChange={(e) =>
                                updateChild(idx, { fullName: e.target.value })
                              }
                              placeholder=""
                            />
                          </label>

                          <label>
                            Age group <span className="page-error">*</span>
                            <select
                              className={`input ${
                                attempted["COMP_DETAILS"] &&
                                !requiredText(c.ageGroup)
                                  ? "tp-error"
                                  : ""
                              }`}
                              value={c.ageGroup}
                              onChange={(e) =>
                                updateChild(idx, { ageGroup: e.target.value })
                              }
                            >
                              <option value="">Select</option>
                              <option value="lte6">≤ 6</option>
                              <option value="gt6_lte12">7 – 12</option>
                              <option value="gt12_lt18">13 – 17</option>
                            </select>
                          </label>
                        </div>

                        <label>
                          Birth certificate ID{" "}
                          <span className="page-error">*</span>
                          <MaskedTextInput
                            value={c.birthCertId}
                            onValueChange={(v) =>
                              updateChild(idx, { birthCertId: onlyDigits(v) })
                            }
                            placeholder="Birth certificate ID"
                            inputMode="numeric"
                            maxLength={20}
                            className={
                              attempted["COMP_DETAILS"] && !cIdOk
                                ? "tp-error"
                                : ""
                            }
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="form-actions">
              <div className="tp-actions-row">
                <button className="btn-ghost" onClick={goBack} type="button">
                  Back
                </button>
                <button
                  className="btn-primary"
                  disabled={!travelersNowValid()}
                  onClick={() => {
                    if (!travelersNowValid()) {
                      markStepAttempt("COMP_DETAILS");
                      return;
                    }
                    goNext();
                  }}
                  type="button"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================== NOTE ===================== */}
      {stepKey === "NOTE" && (
        <section className="form">
          <div className="form-grid">
            <div className="field-group full-width">
              <h2 className="section-title">Any notes?</h2>
              <label>
                Note
                <textarea
                  className="textarea"
                  value={form.note}
                  onChange={(e) => update("note", e.target.value)}
                  placeholder=""
                />
              </label>
            </div>

            <div className="form-actions">
              <div className="tp-actions-row">
                <button className="btn-ghost" onClick={goBack} type="button">
                  Back
                </button>
                <button className="btn-primary" onClick={goNext} type="button">
                  Review
                </button>
              </div>

              <p className="page-info">Draft saved automatically.</p>
            </div>
          </div>
        </section>
      )}

      {/* ===================== REVIEW ===================== */}
      {stepKey === "REVIEW" && (
        <ReviewBlock
          form={form}
          setForm={setForm}
          goBack={goBack}
          needsDocs={needsDocs}
          reviewValid={reviewValid}
          markStepAttempt={() => markStepAttempt("REVIEW")}
          sysSave={sysSave}
          onSubmit={async () => {
            if (!reviewValid()) {
              markStepAttempt("REVIEW");
              return;
            }
            const ok = await persistToSystem();
            if (!ok) return;

            clearDraft();
            goNext();
          }}
        />
      )}

      {/* ===================== AFTER_SUBMIT ===================== */}
      {stepKey === "AFTER_SUBMIT" && (
        <AfterSubmitBlock
          tripCode={form.tripCode}
          onWhatsApp={() =>
            window.open(buildWhatsAppLink(), "_blank", "noreferrer")
          }
          onHome={() => navigate("/", { replace: true })}
        />
      )}
    </div>
  );
}

/** =========================
 * Review Block (Submit only)
 * ========================= */
function ReviewBlock({
  form,
  setForm,
  goBack,
  needsDocs,
  reviewValid,
  markStepAttempt,
  sysSave,
  onSubmit,
}) {
  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const adults = Math.max(1, Number(form.adults) || 1);
  const children = Math.max(0, Number(form.children) || 0);

  const leaderIsEgyptian = isEgyptian(form.nationality);
  const idLeaderRaw = leaderIsEgyptian
    ? onlyDigits(form.nationalId)
    : sanitizePassport(form.passportNumber);

  return (
    <section className="form">
      <div className="form-grid">
        <div className="field-group full-width">
          <h2 className="section-title">Review</h2>

          <div className="tp-card">
            <div className="tp-card-title">Trip details</div>

            <div className="tp-review-grid">
              <div className="tp-kv">
                <div className="tp-k">Trip code</div>
                <div className="tp-v">{form.tripCode}</div>
              </div>

              <div className="tp-kv">
                <div className="tp-k">Leader</div>
                <div className="tp-v">{form.fullName}</div>
              </div>

              <div className="tp-kv">
                <div className="tp-k">Contact</div>
                <div className="tp-v">
                  {form.dialCode}
                  {onlyDigits(form.phoneLocal)} · {form.email}
                </div>
              </div>

              <div className="tp-kv">
                <div className="tp-k">ID / Passport</div>
                <div className="tp-v">{last4Display(idLeaderRaw)}</div>
              </div>

              <div className="tp-kv">
                <div className="tp-k">From</div>
                <div className="tp-v">{form.originCity}</div>
              </div>

              <div className="tp-kv">
                <div className="tp-k">To</div>
                <div className="tp-v">{form.destinationCity}</div>
              </div>

              <div className="tp-kv">
                <div className="tp-k">Dates</div>
                <div className="tp-v">
                  {formatDMY(form.departDate)} → {formatDMY(form.returnDate)}
                </div>
              </div>

              <div className="tp-kv">
                <div className="tp-k">Pax</div>
                <div className="tp-v">
                  {adults + children} (Adults {adults}, Children {children})
                </div>
              </div>

              {!leaderIsEgyptian && (
                <div className="tp-kv">
                  <div className="tp-k">Egypt entry status</div>
                  <div className="tp-v">
                    {residenceLabel(form.entryStatusForEgypt)}
                  </div>
                </div>
              )}

              {form.note?.trim() ? (
                <div className="tp-kv">
                  <div className="tp-k">Note</div>
                  <div className="tp-v">{form.note.trim()}</div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="tp-card">
            <div className="tp-card-title">Confirmations</div>

            <p className="page-info" style={{ marginTop: "0.4rem" }}>
              Are there couples in this trip?{" "}
              <span className="page-error">*</span>
            </p>

            <div className="tp-radio">
              <label>
                <input
                  type="radio"
                  name="couplesAnswer"
                  value="YES"
                  checked={form.couplesAnswer === "YES"}
                  onChange={() => update("couplesAnswer", "YES")}
                />
                <div>
                  <strong>Yes</strong>
                </div>
              </label>

              <label>
                <input
                  type="radio"
                  name="couplesAnswer"
                  value="NO"
                  checked={form.couplesAnswer === "NO"}
                  onChange={() => update("couplesAnswer", "NO")}
                />
                <div>
                  <strong>No</strong>
                </div>
              </label>
            </div>

            {needsDocs && (
              <div className="tp-check">
                <input
                  type="checkbox"
                  checked={!!form.docsAcknowledged}
                  onChange={(e) => update("docsAcknowledged", e.target.checked)}
                />
                <p className="page-info">
                  I will send the required documents on WhatsApp after
                  submitting. <span className="page-error">*</span>
                </p>
              </div>
            )}

            <div className="tp-check">
              <input
                type="checkbox"
                checked={!!form.termsAccepted}
                onChange={(e) => update("termsAccepted", e.target.checked)}
              />
              <p className="page-info">
                I agree to the Terms & Privacy Policy.{" "}
                <span className="page-error">*</span>
              </p>
            </div>

            {!reviewValid() && (
              <p className="page-error" style={{ marginTop: "0.6rem" }}>
                Please complete the required confirmations.
              </p>
            )}
          </div>
        </div>

        <div className="form-actions">
          <div className="tp-actions-row">
            <button className="btn-ghost" onClick={goBack} type="button">
              Back
            </button>

            <button
              className="btn-primary"
              type="button"
              disabled={!reviewValid() || sysSave?.status === "saving"}
              onClick={() => {
                if (!reviewValid()) {
                  markStepAttempt?.();
                  return;
                }
                onSubmit?.();
              }}
            >
              {sysSave?.status === "saving" ? "Submitting..." : "Submit"}
            </button>
          </div>

          {sysSave?.status === "error" && (
            <p className="page-error" style={{ marginTop: "0.7rem" }}>
              {sysSave?.error || "Failed to submit."}
            </p>
          )}

          <p className="page-info">Draft saved automatically.</p>
        </div>
      </div>
    </section>
  );
}

/** =========================
 * After Submit Block
 * ========================= */
function AfterSubmitBlock({ tripCode, onWhatsApp, onHome }) {
  return (
    <section className="form">
      <div className="form-grid">
        <div className="field-group full-width">
          <h2 className="section-title">Request received</h2>

          <div className="tp-card">
            <div className="tp-review-grid">
              <div className="tp-kv">
                <div className="tp-k">Trip code</div>
                <div className="tp-v">{tripCode}</div>
              </div>
            </div>
          </div>

          <div className="tp-card">
            <div className="tp-card-title">Next</div>

            <div className="tp-actions-row">
              <button
                className="btn-primary"
                type="button"
                onClick={onWhatsApp}
              >
                Send on WhatsApp (priority)
              </button>

              <button className="btn-ghost" type="button" onClick={onHome}>
                Skip WhatsApp (reply may take longer)
              </button>

              <p className="tp-help" style={{ marginTop: "0.7rem" }}>
                WhatsApp requests are handled faster — skipping may delay the
                reply.
              </p>
            </div>

            <p className="tp-help" style={{ marginTop: "0.7rem" }}>
              Sending via WhatsApp helps us reply faster.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
