// src/pages/admin/markupApi.js
// TP-OTA-FE-EXTRANET-003 — Self-contained API helpers for Admin Markup Rules Manager
// Imports the shared axios instance but does NOT modify apiClient.js (FE2 scope)

import { api } from "@/services/apiClient";

/**
 * Lists all markup rules.
 * GET /api/pricing/markup-rules/
 */
export async function fetchMarkupRules() {
  const res = await api.get("/pricing/markup-rules/");
  const data = res.data;
  if (data?.status === "error") throw new Error(data.message || "Failed to fetch rules");
  return data?.data || data;
}

/**
 * Creates a new markup rule.
 * POST /api/pricing/markup-rules/
 */
export async function createMarkupRule(payload) {
  const res = await api.post("/pricing/markup-rules/", payload);
  const data = res.data;
  if (data?.status === "error") throw new Error(data.message || "Failed to create rule");
  return data?.data || data;
}

/**
 * Updates an existing markup rule.
 * PUT /api/pricing/markup-rules/{id}/
 */
export async function updateMarkupRule(id, payload) {
  const res = await api.put(`/pricing/markup-rules/${id}/`, payload);
  const data = res.data;
  if (data?.status === "error") throw new Error(data.message || "Failed to update rule");
  return data?.data || data;
}

/**
 * Deletes a markup rule.
 * DELETE /api/pricing/markup-rules/{id}/
 */
export async function deleteMarkupRule(id) {
  const res = await api.delete(`/pricing/markup-rules/${id}/`);
  const data = res.data;
  if (data?.status === "error") throw new Error(data.message || "Failed to delete rule");
  return data?.data || data;
}

/**
 * Fetches metadata for form population (room types, properties list).
 * GET /api/properties/metadata/
 */
export async function fetchMetadata() {
  const res = await api.get("/properties/metadata/");
  const data = res.data;
  if (data?.status === "error") throw new Error(data.message || "Failed to fetch metadata");
  return data?.data || data;
}
