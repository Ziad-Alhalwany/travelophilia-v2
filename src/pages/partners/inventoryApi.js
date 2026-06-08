// src/pages/partners/inventoryApi.js
// TP-OTA-FE-EXTRANET-003 — Self-contained API helpers for Vendor Inventory Dashboard
// Imports the shared axios instance but does NOT modify apiClient.js (FE2 scope)

import { api } from "@/services/apiClient";

/**
 * Fetches calendar availability for a property.
 * GET /api/properties/{propertyId}/availability/?month=X&year=Y
 */
export async function fetchAvailability(propertyId, month, year) {
  const res = await api.get(`/properties/${propertyId}/availability/`, {
    params: { month, year },
  });
  const data = res.data;
  if (data?.status === "error") throw new Error(data.message || "Failed to fetch availability");
  return data?.data || data;
}

/**
 * Fetches metadata (room types + rate plans) for form population.
 * GET /api/properties/metadata/
 */
export async function fetchPropertyMetadata() {
  const res = await api.get("/properties/metadata/");
  const data = res.data;
  if (data?.status === "error") throw new Error(data.message || "Failed to fetch metadata");
  return data?.data || data;
}

/**
 * Bulk-updates availability and pricing for a date range.
 * POST /api/properties/{propertyId}/availability/bulk-update/
 */
export async function bulkUpdateAvailability(propertyId, payload) {
  const res = await api.post(`/properties/${propertyId}/availability/bulk-update/`, payload);
  const data = res.data;
  if (data?.status === "error") throw new Error(data.message || "Bulk update failed");
  return data?.data || data;
}

/**
 * Searches properties (used by PropertyCalendar).
 * GET /api/properties/search/
 */
export async function searchProperties(params) {
  const res = await api.get("/properties/search/", { params });
  const data = res.data;
  if (data?.status === "error") throw new Error(data.message || "Search failed");
  return data?.data || data;
}

/**
 * Submits a waitlist lead for unavailable dates.
 * POST /api/waitlist/
 */
export async function submitWaitlist(payload) {
  const res = await api.post("/waitlist/", payload);
  const data = res.data;
  if (data?.status === "error") throw new Error(data.message || "Waitlist submission failed");
  return data?.data || data;
}
