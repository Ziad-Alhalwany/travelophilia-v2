// src/services/apiClient.js
import axios from "axios";
import authStorage from "./authStorage";
import { mapTripRequestPayload } from "../utils/tripRequestMapper";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 25000,
});

/** Attach token if exists (بدون ما نفرض auth على كل حاجة) */
api.interceptors.request.use((config) => {
  try {
    const token = authStorage?.getAccessToken?.();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore token errors
  }
  return config;
});

function unwrap(data) {
  // يدعم شكل: { success, message, data }
  if (data && typeof data === "object" && "success" in data) {
    if (data.success === false) {
      const msg = data.message || "Request failed";
      const err = new Error(msg);
      err.payload = data;
      throw err;
    }
    return data.data ?? data;
  }
  return data;
}

function formatAxiosError(e) {
  const msg =
    e?.response?.data?.message ||
    e?.response?.data?.detail ||
    e?.message ||
    "Request failed";
  return String(msg);
}

function normalizeSlug(slug) {
  const s = String(slug || "").trim();
  return s;
}

/** Trips */
export async function getTrips(params = undefined) {
  try {
    const res = await api.get("/trips/", params ? { params } : undefined);
    return unwrap(res.data);
  } catch (e) {
    throw new Error(formatAxiosError(e));
  }
}

export async function getTripBySlug(slug) {
  const s = normalizeSlug(slug);

  // ✅ ده أهم Fix عملي للمشكلة اللي عندك
  if (!s || s === "undefined" || s === "null") {
    throw new Error("Trip slug is missing (URL has /reserve/undefined)");
  }

  try {
    const res = await api.get(`/trips/${encodeURIComponent(s)}/`);
    return unwrap(res.data);
  } catch (e) {
    throw new Error(formatAxiosError(e));
  }
}

/** Destination Activities */
export async function getDestinationActivities(destinationCode) {
  const code = String(destinationCode || "").trim().toUpperCase();
  if (!code) return [];

  try {
    const res = await api.get(
      `/destinations/${encodeURIComponent(code)}/activities/`
    );
    return unwrap(res.data) || [];
  } catch {
    return [];
  }
}

/** Custom trip (لو لسه بتستخدمه) */
export async function submitCustomTrip(payload) {
  try {
    const body = mapTripRequestPayload(payload);
    const res = await api.post("/custom-trip/", body);
    return unwrap(res.data);
  } catch (e) {
    throw new Error(formatAxiosError(e));
  }
}

/** Trip Requests */
export async function generateTripRequestCode() {
  try {
    const res = await api.get("/trip-requests/generate-code/");
    return unwrap(res.data);
  } catch {
    return { trip_code: `TP-${Date.now()}` };
  }
}

export async function submitTripRequest(payload) {
  try {
    const body = mapTripRequestPayload(payload);
    const res = await api.post("/trip-requests/", body);
    return unwrap(res.data);
  } catch (e) {
    throw new Error(formatAxiosError(e));
  }
}

export default {
  api,
  getTrips,
  getTripBySlug,
  getDestinationActivities,
  submitCustomTrip,
  generateTripRequestCode,
  submitTripRequest,
};
