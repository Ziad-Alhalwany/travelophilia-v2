// src/utils/markupHelpers.js
// TP-OTA-FE-EXTRANET-003 — Pure utility functions for the Extranet modules

/**
 * Expands a date range into an array of individual "YYYY-MM-DD" strings.
 * Used to map bulk form submissions into daily allocation slots for the backend.
 * @param {string} startDate - ISO date string "YYYY-MM-DD"
 * @param {string} endDate   - ISO date string "YYYY-MM-DD"
 * @returns {string[]}
 */
export function expandDateRange(startDate, endDate) {
  const dates = [];
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return dates;
  if (start > end) return dates;

  const current = new Date(start);
  while (current <= end) {
    dates.push(formatDateISO(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Formats a Date object to "YYYY-MM-DD".
 * @param {Date} date
 * @returns {string}
 */
export function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Builds the bulk update payload for the backend.
 * Converts the form state into the expected POST body for
 * POST /api/properties/{id}/availability/bulk-update/
 *
 * @param {Object} formData
 * @param {number} formData.roomTypeId
 * @param {string} formData.ratePlan    - "RO" | "BB" | "HB" | "FB" | "AI"
 * @param {string} formData.startDate   - "YYYY-MM-DD"
 * @param {string} formData.endDate     - "YYYY-MM-DD"
 * @param {number} formData.price       - price per night in EGP
 * @param {number} formData.allocation  - number of physical rooms
 * @returns {Object} Backend-compatible payload
 */
export function buildBulkUpdatePayload(formData) {
  return {
    room_type_id: formData.roomTypeId,
    rate_plan: formData.ratePlan,
    start_date: formData.startDate,
    end_date: formData.endDate,
    price: Number(formData.price),
    allocation: Number(formData.allocation),
  };
}

/**
 * Formats a numeric amount into a human-readable currency string.
 * @param {number} amount
 * @param {string} [currency="EGP"]
 * @returns {string} e.g. "1,500 EGP"
 */
export function formatCurrency(amount, currency = "EGP") {
  if (amount == null || isNaN(amount)) return `— ${currency}`;
  return `${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

/**
 * Validates that a date range is logically correct.
 * @param {string} checkIn  - "YYYY-MM-DD"
 * @param {string} checkOut - "YYYY-MM-DD"
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDateRange(checkIn, checkOut) {
  if (!checkIn) return { valid: false, error: "Start date is required" };
  if (!checkOut) return { valid: false, error: "End date is required" };

  const start = new Date(checkIn + "T00:00:00");
  const end = new Date(checkOut + "T00:00:00");

  if (isNaN(start.getTime())) return { valid: false, error: "Invalid start date" };
  if (isNaN(end.getTime())) return { valid: false, error: "Invalid end date" };
  if (end <= start) return { valid: false, error: "End date must be after start date" };

  return { valid: true };
}

/**
 * Validates that a value is a positive number (≥ 0).
 * @param {*} value
 * @param {string} [fieldName="Value"]
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePositiveNumber(value, fieldName = "Value") {
  const num = Number(value);
  if (value === "" || value == null) return { valid: false, error: `${fieldName} is required` };
  if (isNaN(num)) return { valid: false, error: `${fieldName} must be a number` };
  if (num < 0) return { valid: false, error: `${fieldName} cannot be negative` };
  return { valid: true };
}

/**
 * Calculates the preview price after applying a markup rule.
 * @param {number} basePrice  - Original price
 * @param {"INCREASE"|"DECREASE"} action
 * @param {"PERCENTAGE"|"FIXED"} mode
 * @param {number} value      - The markup value (% or fixed EGP)
 * @returns {number} The adjusted price
 */
export function calculateMarkupPreview(basePrice, action, mode, value) {
  const base = Number(basePrice) || 0;
  const val = Number(value) || 0;

  let delta = 0;
  if (mode === "PERCENTAGE") {
    delta = (base * val) / 100;
  } else {
    delta = val;
  }

  if (action === "DECREASE") {
    return Math.max(0, base - delta);
  }
  return base + delta;
}

/**
 * Returns the availability status color class for calendar cells.
 * @param {string} status  - "AVAILABLE" | "UNAVAILABLE_SOLD_OUT" | "UNAVAILABLE_NOT_SET"
 * @param {number} [roomsLeft]
 * @returns {string} Tailwind color class descriptor
 */
export function getAvailabilityColor(status, roomsLeft) {
  if (status === "UNAVAILABLE_NOT_SET") return "gray";
  if (status === "UNAVAILABLE_SOLD_OUT") return "red";
  if (status === "AVAILABLE" && roomsLeft != null && roomsLeft <= 2) return "amber";
  if (status === "AVAILABLE") return "green";
  return "gray";
}
