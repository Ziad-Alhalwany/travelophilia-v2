// src/utils/formUtils.js
export function onlyDigits(v = "") {
  return String(v).replace(/\D+/g, "");
}

export function maskIdForReview(id = "") {
  const s = String(id).replace(/\s+/g, "");
  if (s.length <= 6) return s;
  return `${s.slice(0, 2)}${"•".repeat(Math.max(4, s.length - 6))}${s.slice(-4)}`;
}

export function formatDMY(isoDate = "") {
  // iso: YYYY-MM-DD
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "—";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Basic email validation (منطقي ومرن)
export function isValidEmail(email = "") {
  const e = String(email).trim();
  // RFC-lite: اسم@دومين.تي_إل_دي
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,24}$/.test(e);
}

// E.164-lite: طول معقول
export function isValidPhoneE164Local(numberDigits = "") {
  const n = onlyDigits(numberDigits);
  return n.length >= 7 && n.length <= 15;
}
// src/utils/formUtils.js (داخل نفس الملف)

export const DIAL_CODE_OPTIONS = [
  { value: "+20", label: "Egypt (+20)", flag: "🇪🇬" },
  { value: "+966", label: "Saudi Arabia (+966)", flag: "🇸🇦" },
  { value: "+962", label: "Jordan (+962)", flag: "🇯🇴" },
  { value: "+971", label: "UAE (+971)", flag: "🇦🇪" },
  { value: "+965", label: "Kuwait (+965)", flag: "🇰🇼" },
  { value: "+974", label: "Qatar (+974)", flag: "🇶🇦" },
  { value: "+973", label: "Bahrain (+973)", flag: "🇧🇭" },
  { value: "+968", label: "Oman (+968)", flag: "🇴🇲" },
  { value: "+90", label: "Turkey (+90)", flag: "🇹🇷" },
  { value: "+49", label: "Germany (+49)", flag: "🇩🇪" },
  { value: "+44", label: "United Kingdom (+44)", flag: "🇬🇧" },
  { value: "+1", label: "USA/Canada (+1)", flag: "🇺🇸" },
].sort((a, b) => a.label.localeCompare(b.label));

export const COUNTRY_OPTIONS = [
  { value: "Egypt", label: "Egypt", flag: "🇪🇬" },
  { value: "Saudi Arabia", label: "Saudi Arabia", flag: "🇸🇦" },
  { value: "Jordan", label: "Jordan", flag: "🇯🇴" },
  { value: "United Arab Emirates", label: "United Arab Emirates", flag: "🇦🇪" },
  { value: "Kuwait", label: "Kuwait", flag: "🇰🇼" },
  { value: "Qatar", label: "Qatar", flag: "🇶🇦" },
  { value: "Bahrain", label: "Bahrain", flag: "🇧🇭" },
  { value: "Oman", label: "Oman", flag: "🇴🇲" },
  { value: "Turkey", label: "Turkey", flag: "🇹🇷" },
  { value: "Germany", label: "Germany", flag: "🇩🇪" },
  { value: "United Kingdom", label: "United Kingdom", flag: "🇬🇧" },
  { value: "United States", label: "United States", flag: "🇺🇸" },
].sort((a, b) => a.label.localeCompare(b.label));

export const NATIONALITY_OPTIONS = [
  { value: "Egyptian", label: "Egyptian", flag: "🇪🇬" },
  { value: "Saudi", label: "Saudi", flag: "🇸🇦" },
  { value: "Jordanian", label: "Jordanian", flag: "🇯🇴" },
  { value: "Emirati", label: "Emirati", flag: "🇦🇪" },
  { value: "Kuwaiti", label: "Kuwaiti", flag: "🇰🇼" },
  { value: "Qatari", label: "Qatari", flag: "🇶🇦" },
  { value: "Bahraini", label: "Bahraini", flag: "🇧🇭" },
  { value: "Omani", label: "Omani", flag: "🇴🇲" },
  { value: "Turkish", label: "Turkish", flag: "🇹🇷" },
  { value: "German", label: "German", flag: "🇩🇪" },
  { value: "British", label: "British", flag: "🇬🇧" },
  { value: "American", label: "American", flag: "🇺🇸" },
].sort((a, b) => a.label.localeCompare(b.label));
