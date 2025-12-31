// src/services/apiClient.js
import axios from "axios";

/**
 * Axios instance موحّد لكل طلبات الباك إند
 * NOTE:
 * - baseURL = "/api" عشان Vite proxy يودّيها للـ Django backend
 * - بنستخدم الـ endpoints بالـ trailing slash لتفادي redirects
 */
const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

/**
 * Helpers: بعض الـ endpoints عندك بترجع:
 *  { success: true, data: ... }
 * وفيه صفحات قديمة ممكن تكون متعودة على data مباشرة
 * فبنرجّع data بشكل مرن.
 */
function unwrap(respData) {
  if (respData && typeof respData === "object" && "data" in respData) return respData.data;
  return respData;
}

// ===== Trips =====

// GET /api/trips/  -> list
export async function getTrips() {
  const res = await api.get("/trips/");
  return unwrap(res.data);
}

// GET /api/trips/:slug/ -> detail
export async function getTripBySlug(slug) {
  const res = await api.get(`/trips/${encodeURIComponent(slug)}/`);
  const body = res.data;

  // لو backend بيرجع wrapper {success, data, message}
  if (body && typeof body === "object" && "success" in body) {
    if (body.success === false) {
      const msg = body.message || "Trip not found";
      const err = new Error(msg);
      err.response = { data: body }; // عشان formatApiError يطلع message مضبوط
      throw err;
    }
    return body.data ?? body;
  }

  // لو بيرجع Trip مباشرة
  return body;
}

// ===== Legacy custom-trip (لو لسه عندك صفحة قديمة بتستعمله) =====
export async function submitCustomTrip(payload) {
  const res = await api.post("/custom-trip/", payload);
  return res.data;
}

// ===== New: Trip Requests (اللي بتغذي CRM) =====

// POST /api/trip-requests/
export async function submitTripRequest(payload) {
  const res = await api.post("/trip-requests/", payload);
  return res.data; // المفروض يرجّع tripCode وغيره
}

// GET /api/trip-requests/generate-code/
export async function generateTripRequestCode() {
  const res = await api.get("/trip-requests/generate-code/");
  return res.data;
}
