// src/utils/voucherCodes.js

function pad(num, size = 2) {
  const s = String(num ?? "");
  return s.length >= size ? s : "0".repeat(size - s.length) + s;
}

function ddmm(dateStr) {
  // expects YYYY-MM-DD
  if (!dateStr || typeof dateStr !== "string" || dateStr.length < 10) return "0000";
  const [y, m, d] = dateStr.split("-");
  return `${pad(d, 2)}${pad(m, 2)}`;
}

function yyyy(dateStr) {
  if (!dateStr || typeof dateStr !== "string" || dateStr.length < 4) return "0000";
  return dateStr.slice(0, 4);
}

// V1: codes as letters (you can expand anytime)
export const ORIGIN_CODES = {
  Cairo: "CAI",
  Giza: "GIZ",
  Mansoura: "MAN",
  Alexandria: "ALX",
  "New Cairo": "NCA",
};

export const DESTINATION_CODES = {
  Dahab: "DHB",
  "Sharm El Sheikh": "SSH",
  Siwa: "SIW",
  Hurghada: "HRG",
  "Marsa Alam": "MAM",
  "Ain Sokhna": "SOK",
  Alexandria: "ALX",
};

function safeCode(value, map, fallback = "UNK") {
  if (!value) return fallback;
  return map[value] || fallback;
}

// ---- Local serials (TEMP for MVP testing) ----
// In production: these serials come from DB (tripSerial, travelerSerial)
function getNextSerial(key, startAt = 1) {
  const storageKey = "tp_serials_v1";
  const raw = localStorage.getItem(storageKey);
  const data = raw ? JSON.parse(raw) : { trip: startAt, traveler: startAt };

  if (typeof data[key] !== "number") data[key] = startAt;

  const next = data[key];
  data[key] = next + 1;

  localStorage.setItem(storageKey, JSON.stringify(data));
  return next;
}

/**
 * Builds:
 * bookingCode: Trip voucher-like (tripSerial + pax + dates + year + origin + destination)
 * travelerCode: traveler serial only (for each traveler)
 * combinedPersonalVoucher: travelerSerial + bookingCode (shown as ONE code in review)
 */
export function buildVouchers({
  pax,
  departDate,
  returnDate,
  originCity,
  destinationCity,
  tripSerialOverride,     // optional (later from backend)
  travelerSerialOverride, // optional (later from backend)
}) {
  const pax2 = pad(pax, 2);

  const tripSerial = typeof tripSerialOverride === "number"
    ? tripSerialOverride
    : getNextSerial("trip", 1);

  const trip2 = pad(tripSerial, 2);

  const dep = ddmm(departDate);
  const ret = ddmm(returnDate);
  const year = yyyy(departDate);

  const originCode = safeCode(originCity, ORIGIN_CODES, "ORG");
  const destCode = safeCode(destinationCity, DESTINATION_CODES, "DST");

  const bookingCode = `${trip2}${pax2}${dep}${ret}${year}${originCode}${destCode}`;

  // For group booking: generate traveler codes 1..pax
  const travelers = Array.from({ length: pax }, (_, i) => {
    const travelerSerial = typeof travelerSerialOverride === "number"
      ? travelerSerialOverride + i
      : getNextSerial("traveler", 1);

    // keep traveler serial readable + stable
    const travelerCode = pad(travelerSerial, 5); // e.g. 00050
    const combinedPersonalVoucher = `${travelerCode}${bookingCode}`;

    return { travelerCode, combinedPersonalVoucher };
  });

  return { bookingCode, travelers, originCode, destCode, tripSerial };
}

/**
 * For WhatsApp message: make codes readable
 */
export function formatCodesForMessage({ bookingCode, travelers }) {
  const lines = travelers.map((t, idx) => `Traveler ${idx + 1}: ${t.combinedPersonalVoucher}`);
  return `BookingCode: ${bookingCode}\n` + lines.join("\n");
}
