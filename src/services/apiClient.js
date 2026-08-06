// src/services/apiClient.js
import axios from "axios";
import authStorage from "./authStorage";
import { mapTripRequestPayload } from "../utils/tripRequestMapper";
import { toSnakeDeep, toCamelDeep } from "../utils/caseConverter";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 25000,
});

/** Attach token, client telemetry, and handle snake_case request mapping */
api.interceptors.request.use(
  (_config) => {
    try {
      const token = authStorage?.getAccessToken?.();
      if (token) {
        _config.headers = _config.headers || {};
        _config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore token errors
    }

    // Client Telemetry
    try {
      const telemetry = {
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "SSR",
      };
      _config.headers = _config.headers || {};
      _config.headers["X-Client-Telemetry"] = JSON.stringify(telemetry);
    } catch {
      // ignore telemetry errors
    }

    // Convert payload/params to snake_case before sending
    if (_config.data) {
      _config.data = toSnakeDeep(_config.data);
    }
    if (_config.params) {
      _config.params = toSnakeDeep(_config.params);
    }

    // Direct mutation on _config reference preserves pristine AbortSignal prototype
    return _config;
  },
  (error) => Promise.reject(error)
);

// ═══════════════════════════════════════════════════════════════
// Pluggable Global Error Handler (UI-Decoupled Pattern)
// FE1 wires the active toast library via setGlobalErrorHandler()
// ═══════════════════════════════════════════════════════════════
let _globalErrorHandler = (message, details) => {
  console.error(`[API Error] ${message}`, details);
};

/**
 * Configure the global error handler callback.
 * FE1 wires the active toast/notification library here once (e.g., in App.jsx).
 * @param {(message: string, details?: object) => void} handler
 */
export function setGlobalErrorHandler(handler) {
  if (typeof handler === "function") {
    _globalErrorHandler = handler;
  }
}

/**
 * Parse Django REST Framework validation error dictionaries.
 * Converts { field: [errors] } into a single human-readable string.
 * @param {object} data - The error response data
 * @returns {string|null} Formatted error string or null
 */
function parseDjangoValidationErrors(data) {
  if (!data || typeof data !== "object" || data.detail) return null;
  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  return entries
    .map(([field, errors]) => {
      const msgs = Array.isArray(errors) ? errors.join(", ") : String(errors);
      return `${field}: ${msgs}`;
    })
    .join("\n");
}

/**
 * Dispatch error to the pluggable global handler based on HTTP status.
 * Skipped entirely when config._silentError === true.
 * @param {import('axios').AxiosError} error
 */
function dispatchGlobalError(error) {
  const config = error.config;
  if (config?._silentError) return;

  const status = error.response?.status;
  const data = error.response?.data;

  if (status === 400) {
    const parsed = parseDjangoValidationErrors(data);
    _globalErrorHandler(
      parsed || data?.detail || data?.message || "Validation error",
      { status, data }
    );
  } else if (status === 403) {
    _globalErrorHandler("You do not have permission for this action.", { status });
  } else if (status === 404) {
    _globalErrorHandler("Resource not found.", { status });
  } else if (status >= 500) {
    _globalErrorHandler("Server error. Please try again later.", { status });
  } else if (!error.response && error.message !== "canceled") {
    // Pure network disconnect — no HTTP response received
    _globalErrorHandler("Network error. Check your connection.", {});
  }
}

/** Intercept responses for camelCase conversion, error routing, and JWT refresh */
let refreshInFlight = null;

api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = toCamelDeep(response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.data) {
      error.response.data = toCamelDeep(error.response.data);
    }

    // Route error to pluggable global handler (skip if _silentError)
    dispatchGlobalError(error);

    // Attempt token refresh on 401
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!navigator.onLine) {
        // Connection drop post-auth: maintain session availability and bypass clearing storage
        return Promise.reject(error);
      }

      const refresh = authStorage?.getRefreshToken?.();
      if (!refresh) {
        authStorage?.clear?.();
        return Promise.reject(error);
      }

      if (!refreshInFlight) {
        refreshInFlight = axios
          .post(`${API_BASE}/token/refresh/`, { refresh })
          .then((res) => {
            const data = toCamelDeep(res.data);
            const newAccess = data.access;
            const newRefresh = data.refresh || refresh;

            if (newAccess) {
              authStorage?.setAccessToken?.(newAccess);
              authStorage?.setRefreshToken?.(newRefresh);
              return newAccess;
            }
            throw new Error("No access token in refresh response");
          })
          .catch((refreshErr) => {
            authStorage?.clear?.();
            throw refreshErr;
          })
          .finally(() => {
            refreshInFlight = null;
          });
      }

      try {
        const newAccessToken = await refreshInFlight;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

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

// ═══════════════════════════════════════════════════════════════
// AbortController Request Factory — Race Condition Shield
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a cancellable API call wrapper for race-condition protection.
 * Returns { execute, abort } — components call abort() on unmount.
 *
 * @param {(signal: AbortSignal, ...args: any[]) => Promise} requestFn
 * @returns {{ execute: (...args: any[]) => Promise, abort: () => void }}
 *
 * @example
 * const { execute, abort } = createCancellableRequest(
 *   (signal) => api.get('/trips/', { signal })
 * );
 * useEffect(() => { execute(); return abort; }, []);
 */
export function createCancellableRequest(requestFn) {
  let controller = null;

  const execute = async (...args) => {
    // Abort any in-flight request before launching new one
    if (controller) {
      controller.abort();
    }
    controller = new AbortController();
    try {
      const result = await requestFn(controller.signal, ...args);
      return unwrap(result.data);
    } catch (e) {
      if (e.name === "CanceledError" || e.message === "canceled") {
        return undefined; // Silently swallow cancellation — no leak
      }
      throw new Error(formatAxiosError(e));
    }
  };

  const abort = () => {
    if (controller) {
      controller.abort();
      controller = null;
    }
  };

  return { execute, abort };
}

/** Trips */
export async function getTrips(params = undefined, signal = undefined) {
  try {
    const config = {};
    if (params) config.params = params;
    if (signal) config.signal = signal;
    const res = await api.get("/trips/", config);
    return unwrap(res.data);
  } catch (e) {
    if (e.name === "CanceledError" || e.message === "canceled") return undefined;
    throw new Error(formatAxiosError(e));
  }
}

export async function getTripMetadata(signal = undefined) {
  try {
    const config = signal ? { signal } : {};
    const res = await api.get("/trips/metadata/", config);
    return unwrap(res.data);
  } catch (e) {
    if (e.name === "CanceledError" || e.message === "canceled") return undefined;
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

// ═══════════════════════════════════════════════════════════════
// B2B Extranet & OTA Meta-Search Network Bindings (Sprint 2)
// Contract: Pre-wired — pending api.md formal update
// ═══════════════════════════════════════════════════════════════

/** Property Calendar — Fetch availability grid for a specific month */
export async function fetchPropertyAvailability(propertyId, month, year, signal) {
  try {
    const res = await api.get(
      `/properties/${encodeURIComponent(propertyId)}/availability/`,
      { params: { month, year }, signal }
    );
    return unwrap(res.data);
  } catch (e) {
    if (e.name === "CanceledError") return undefined;
    throw new Error(formatAxiosError(e));
  }
}

/** Property Calendar — Bulk update inventory slots */
export async function bulkUpdateInventory(propertyId, payload, signal) {
  try {
    const res = await api.post(
      `/properties/${encodeURIComponent(propertyId)}/availability/bulk-update/`,
      payload,
      { signal }
    );
    return unwrap(res.data);
  } catch (e) {
    if (e.name === "CanceledError") return undefined;
    throw new Error(formatAxiosError(e));
  }
}

/** OTA Meta-Search — Aggregated property search results */
export async function fetchSearchAggregator(params = {}, signal) {
  try {
    const res = await api.get("/properties/search/", { params, signal });
    // Post-interceptor camelCase fields: totalStayPrice, avgPricePerNight, displayTag
    return unwrap(res.data);
  } catch (e) {
    if (e.name === "CanceledError") return undefined;
    throw new Error(formatAxiosError(e));
  }
}

/** Waitlist Queue — Submit user interest */
export async function submitWaitlistQueue(payload, signal) {
  try {
    const res = await api.post("/waitlist/", payload, { signal });
    return unwrap(res.data);
  } catch (e) {
    if (e.name === "CanceledError") return undefined;
    throw new Error(formatAxiosError(e));
  }
}

export default {
  api,
  setGlobalErrorHandler,
  createCancellableRequest,
  // Existing service functions
  getTrips,
  getTripBySlug,
  getTripMetadata,
  getDestinationActivities,
  submitCustomTrip,
  generateTripRequestCode,
  submitTripRequest,
  // B2B Extranet & OTA (Sprint 2)
  fetchPropertyAvailability,
  bulkUpdateInventory,
  fetchSearchAggregator,
  submitWaitlistQueue,
};
