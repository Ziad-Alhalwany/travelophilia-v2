// src/hooks/useOtaServices.js
// ═══════════════════════════════════════════════════════════════
// OTA Engine — React Custom Hooks Pipeline (Sprint 2)
// Task ID: TP-OTA-HOOKS-GENERATION-006B
// Agent: FE2 (Integration & State)
// ═══════════════════════════════════════════════════════════════
//
// Architecture:
//   Each hook wraps a pre-wired network function from apiClient.js
//   into a standard { loading, error, data } state tuple, with
//   cancellable AbortController lifecycle management to prevent
//   race conditions and memory leaks on component unmount.
//
// Contract: api.md endpoints 15–18
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from "react";
import {
  fetchPropertyAvailability,
  bulkUpdateInventory,
  fetchSearchAggregator,
  submitWaitlistQueue,
  createCancellableRequest,
} from "../services/apiClient";

// ───────────────────────────────────────────────────────────────
// Internal: Shared state factory — DRY base for all OTA hooks
// ───────────────────────────────────────────────────────────────

/**
 * Creates a reusable hook state scaffold with AbortController lifecycle.
 *
 * @param {(signal: AbortSignal, ...args: any[]) => Promise} requestFn
 *   The raw network function from apiClient.js (must accept signal).
 * @returns {{
 *   loading: boolean,
 *   error: string|null,
 *   data: any,
 *   execute: (...args: any[]) => Promise<any>,
 *   abort: () => void,
 *   reset: () => void
 * }}
 */
function useOtaRequest(requestFn) {
  const [state, setState] = useState({
    loading: false,
    error: null,
    data: null,
  });

  // Stable ref for the cancellable wrapper — survives re-renders
  const cancellableRef = useRef(null);
  // Guard against setState after unmount
  const mountedRef = useRef(true);

  // Build/rebuild the cancellable wrapper once per requestFn identity
  useEffect(() => {
    cancellableRef.current = createCancellableRequest(requestFn);
    return () => {
      // Abort any in-flight request when the requestFn changes
      cancellableRef.current?.abort();
    };
  }, [requestFn]);

  // Cleanup on unmount — abort pending + prevent leaked setState
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancellableRef.current?.abort();
    };
  }, []);

  const execute = useCallback(async (...args) => {
    if (!mountedRef.current) return undefined;

    setState({ loading: true, error: null, data: null });

    try {
      const result = await cancellableRef.current?.execute(...args);

      // Cancellation returns undefined — don't update state
      if (result === undefined && !mountedRef.current) return undefined;

      if (mountedRef.current) {
        setState({ loading: false, error: null, data: result ?? null });
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setState({
          loading: false,
          error: err?.message || "Request failed",
          data: null,
        });
      }
      throw err;
    }
  }, []);

  const abort = useCallback(() => {
    cancellableRef.current?.abort();
    if (mountedRef.current) {
      setState((prev) => (prev.loading ? { ...prev, loading: false } : prev));
    }
  }, []);

  const reset = useCallback(() => {
    if (mountedRef.current) {
      setState({ loading: false, error: null, data: null });
    }
  }, []);

  return { ...state, execute, abort, reset };
}

// ═══════════════════════════════════════════════════════════════
// Hook 1: usePropertyAvailability
// Endpoint 15 — GET /api/properties/{id}/availability/
// ═══════════════════════════════════════════════════════════════

/**
 * Fetches the availability calendar grid for a specific property.
 *
 * @returns {{
 *   loading: boolean,
 *   error: string|null,
 *   data: Array|null,
 *   execute: (propertyId: number, month: number, year: number) => Promise,
 *   abort: () => void,
 *   reset: () => void
 * }}
 *
 * @example
 * const { data, loading, error, execute, abort } = usePropertyAvailability();
 * useEffect(() => { execute(42, 6, 2026); return abort; }, []);
 */
export function usePropertyAvailability() {
  return useOtaRequest(fetchPropertyAvailability);
}

// ═══════════════════════════════════════════════════════════════
// Hook 2: useBulkInventoryUpdate
// Endpoint 16 — POST /api/properties/{id}/availability/bulk-update/
// ═══════════════════════════════════════════════════════════════

/**
 * Wraps the bulk inventory/pricing update for the Extranet grid.
 *
 * @returns {{
 *   loading: boolean,
 *   error: string|null,
 *   data: object|null,
 *   execute: (propertyId: number, payload: object) => Promise,
 *   abort: () => void,
 *   reset: () => void
 * }}
 *
 * @example
 * const { execute, loading } = useBulkInventoryUpdate();
 * await execute(42, { roomTypeId: 3, ratePlan: "BB", price: 2500, ... });
 */
export function useBulkInventoryUpdate() {
  return useOtaRequest(bulkUpdateInventory);
}

// ═══════════════════════════════════════════════════════════════
// Hook 3: useOtaSearch
// Endpoint 17 — GET /api/properties/search/
// ═══════════════════════════════════════════════════════════════

/**
 * Wraps the aggregator meta-search with race-condition cancel guards.
 * Rapid successive calls automatically abort the previous in-flight
 * request via createCancellableRequest, preventing stale data rendering.
 *
 * @returns {{
 *   loading: boolean,
 *   error: string|null,
 *   data: Array|object|null,
 *   execute: (params?: object) => Promise,
 *   abort: () => void,
 *   reset: () => void
 * }}
 *
 * @example
 * const { data, execute, abort } = useOtaSearch();
 * useEffect(() => {
 *   execute({ accommodationId: 2, checkIn: "2026-06-01", checkOut: "2026-06-04" });
 *   return abort;
 * }, [searchParams]);
 */
export function useOtaSearch() {
  return useOtaRequest(fetchSearchAggregator);
}

// ═══════════════════════════════════════════════════════════════
// Hook 4: useWaitlistSubmit
// Endpoint 18 — POST /api/waitlist/
// ═══════════════════════════════════════════════════════════════

/**
 * Wraps the waitlist queue submission handler.
 *
 * @returns {{
 *   loading: boolean,
 *   error: string|null,
 *   data: object|null,
 *   execute: (payload: {
 *     accommodationId: number,
 *     roomTypeId: number,
 *     requestedDate: string,
 *     userEmail: string
 *   }) => Promise,
 *   abort: () => void,
 *   reset: () => void
 * }}
 *
 * @example
 * const { execute, loading, data } = useWaitlistSubmit();
 * await execute({
 *   accommodationId: 2, roomTypeId: 1,
 *   requestedDate: "2026-06-15", userEmail: "user@example.com"
 * });
 */
export function useWaitlistSubmit() {
  return useOtaRequest(submitWaitlistQueue);
}
