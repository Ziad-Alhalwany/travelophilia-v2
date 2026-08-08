# 🏛️ Full Architectural Audit: Frontend Integration & State Layer (FE2)

**Task ID:** TP-AUDIT-FE2-FULL-SYSTEM-001  
**Agent:** FE2 (Integration & State Developer)  
**Date:** 2026-08-07 10:00  
**Scope:** `src/services/**`, `src/hooks/**`, `src/middleware/**`  

---

## 1. Audit: `src/services/apiClient.js`

### 1.1 Overview & Central Architecture
`src/services/apiClient.js` serves as the primary centralized network communication layer for the Travelophilia Frontend application. Built on top of an `axios` instance configured with a 25-second timeout and `/api` baseURL (read from `import.meta.env.VITE_API_BASE_URL` with a `/api` fallback), it governs request transformation, response normalization, global error routing, and token authentication.

---

### 1.2 Exported API Functions & Utilities

| Function / Export | Parameters | Signature & Contract | Description |
| :--- | :--- | :--- | :--- |
| `api` | N/A | `AxiosInstance` | Pre-configured Axios instance (`baseURL: /api`, `timeout: 25000`). |
| `setGlobalErrorHandler` | `(handler)` | `(handler: Function) => void` | Pluggable error handler registration for UI notification libraries (e.g. toasts). |
| `createCancellableRequest` | `(requestFn)` | `(requestFn: Function) => { execute: Function, abort: Function }` | Factory creating `AbortController`-protected API call wrappers to shield against race conditions. |
| `getTrips` | `(params?, signal?)` | `(params?: object, signal?: AbortSignal) => Promise<any>` | Fetches list of trips from `GET /trips/`. Supports polymorphic signal parameter signature. |
| `getTripMetadata` | `(signal?)` | `(signal?: AbortSignal) => Promise<any>` | Fetches aggregate trips metadata from `GET /trips/metadata/`. |
| `getTripBySlug` | `(slug)` | `(slug: string) => Promise<any>` | Fetches trip details by slug from `GET /trips/:slug/`. Guards against missing or `'undefined'` slugs. |
| `getDestinationActivities` | `(destinationCode)` | `(destinationCode: string) => Promise<Array>` | Fetches activities for a destination from `GET /destinations/:code/activities/`. Normalizes code to UPPERCASE. |
| `submitCustomTrip` | `(payload)` | `(payload: object) => Promise<any>` | Submits a legacy custom trip request via `POST /custom-trip/` using `mapTripRequestPayload`. |
| `generateTripRequestCode` | `()` | `() => Promise<object>` | Generates a unique trip request code from `GET /trip-requests/generate-code/`. |
| `submitTripRequest` | `(payload)` | `(payload: object) => Promise<any>` | Submits a customer trip booking request via `POST /trip-requests/` mapped via `mapTripRequestPayload`. |
| `fetchPropertyAvailability` | `(propertyId, month, year, signal?)` | `(propertyId: number, month: number, year: number, signal?: AbortSignal) => Promise<any>` | Fetches monthly availability calendar grid from `GET /properties/:id/availability/`. |
| `bulkUpdateInventory` | `(propertyId, payload, signal?)` | `(propertyId: number, payload: object, signal?: AbortSignal) => Promise<any>` | Performs bulk updates on rates/inventory via `POST /properties/:id/availability/bulk-update/`. |
| `fetchSearchAggregator` | `(params?, signal?)` | `(params?: object, signal?: AbortSignal) => Promise<any>` | OTA meta-search aggregator via `GET /properties/search/`. |
| `submitWaitlistQueue` | `(payload, signal?)` | `(payload: object, signal?: AbortSignal) => Promise<any>` | Submits a date waitlist request via `POST /waitlist/`. |
| `default` | N/A | `Object` | Default export aggregating `api`, handlers, factories, and all API service functions. |

---

### 1.3 Axios Interceptors Architecture

#### A. Request Interceptor (`api.interceptors.request`)
1. **JWT Header Attachment**: Checks `authStorage.getAccessToken()`. If present, injects `headers.Authorization = Bearer <token>`.
2. **Automatic Request Payload Casing**: Calls `toSnakeDeep()` on `_config.data` and `_config.params` before dispatch, converting frontend `camelCase` keys to DRF `snake_case`.
3. **Pristine AbortSignal Prototype Protection**: Performs direct mutations on the existing `_config` object reference rather than returning a new object destructure (`{ ..._config }`), preserving native `AbortSignal` instance prototypes.

#### B. Response Interceptor (`api.interceptors.response`)
1. **Automatic Response Casing**: Recursively converts `response.data` and `error.response.data` from `snake_case` to `camelCase` using `toCamelDeep()`.
2. **Global Error Dispatcher (`dispatchGlobalError`)**:
   - Skips error dispatching when `_silentError: true` is configured on the request.
   - Formats DRF dictionary validation errors (`parseDjangoValidationErrors`) for HTTP 400 responses.
   - Handles HTTP status 403 (Permission), 404 (Not Found), 500 (Server Error), and pure network errors (disconnects).
3. **JWT Automatic Refresh on 401**:
   - Intercepts HTTP 401 Unauthorized responses.
   - Verifies `!originalRequest._retry` and presence of a refresh token in `authStorage`.
   - **Concurrency Deduplication**: Uses a shared `refreshInFlight` promise to deduplicate simultaneous 401 refresh calls targeting `/api/token/refresh/`.
   - On success: Stores new tokens in `authStorage`, updates `originalRequest.headers.Authorization`, and retries the failed request.
   - On failure: Clears `authStorage` and rejects the promise.

---

### 1.4 Casing Converters (`camelCase` <-> `snake_case`)
Implemented in `src/utils/caseConverter.js`:
- `toSnakeDeep(value, opts)`: Recursively converts JS object keys to `snake_case` using regular expressions handling acronyms (e.g., `URL` -> `url`).
- `toCamelDeep(value, opts)`: Recursively converts API response keys to `camelCase`.
- **Special Object Guards**: Skips non-plain objects such as `FormData`, `URLSearchParams`, `Date`, and `Blob`.

---

## 2. Audit: Auth Token Management

The system maintains complete separation between **B2B Partners / Extranet Vendors** and **CRM Staff Members**.

```
+-------------------------------------------------------------------------------+
|                           AUTH TOKEN MANAGEMENT                               |
+------------------------------------+------------------------------------------+
|      B2B Partner / Vendor          |            CRM Staff / Admin             |
+------------------------------------+------------------------------------------+
| Storage: localStorage              | Storage: Multi-tier Fallback System      |
| Keys:                              | (localStorage -> sessionStorage -> Map)  |
|  - travelophilia_access_token      | Keys:                                    |
|  - travelophilia_refresh_token     |  - tp_crm_access                         |
| Service: authStorage.js            |  - tp_crm_refresh                        |
| Transport: Axios (apiClient.js)    | Service: crmAuth.js                      |
| Refresh: Interceptor-managed       | Transport: authFetch (native fetch wrapper) |
| Guard: PartnerGuard                | Refresh: authFetch automatic retry       |
|                                    | Guard: CRMGuard                          |
+------------------------------------+------------------------------------------+
```

### 2.1 B2B Partner Token Manager (`src/services/authStorage.js`)
- **Persistence Target**: Direct `localStorage` operations.
- **Keys**:
  - `travelophilia_access_token`
  - `travelophilia_refresh_token`
- **Interface Methods**: `getAccessToken()`, `setAccessToken(token)`, `removeAccessToken()`, `getRefreshToken()`, `setRefreshToken(token)`, `removeRefreshToken()`, `clear()`.
- **Integration**: Injected into Axios HTTP requests via `apiClient.js` request interceptor.

### 2.2 Staff & CRM Token Manager (`src/services/crmAuth.js`)
- **Multi-Tier Fallback Storage**: Features `getSafeStorage()` that tests `localStorage`, falls back to `sessionStorage`, and defaults to an in-memory `Map()` store if browser storage access is restricted.
- **Keys**:
  - `tp_crm_access`
  - `tp_crm_refresh`
- **Validation**: Enforces strict JWT structure verification via `isValidJwt(token)` regex (`/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/`) before returning tokens.
- **Transport (`authFetch`)**: Custom native `fetch` wrapper adding `Authorization: Bearer <tp_crm_access>`. On 401 responses, performs inline JWT refresh against `/api/auth/token/refresh/` with deduplicated `refreshInFlight` promise.
- **Logout Event**: On authentication failure or explicit `logout()`, clears storage and dispatches a global `tp:crm:logout` window event.

---

## 3. Audit: Route Guards (`src/middleware/authGuard.jsx`)

Route isolation is strictly enforced at the middleware layer using React Router `<Navigate />` and `<Outlet />`.

```
                         Incoming Route Request
                                   │
                  ┌────────────────┴────────────────┐
                  ▼                                 ▼
           Path: /crm/*                     Path: /partners/*
                  │                                 │
            [ CRMGuard ]                     [ PartnerGuard ]
                  │                                 │
       Calls crmAuth.hasAccessToken()      Reads authStorage.getAccessToken()
        & checks JWT validity                & checks regex pattern
                  │                                 │
          ┌───────┴───────┐                 ┌───────┴───────┐
          ▼               ▼                 ▼               ▼
       [ Valid ]     [ Invalid ]         [ Valid ]     [ Invalid ]
          │               │                 │               │
       <Outlet/>     Redirect to         <Outlet/>     Redirect to
                     /crm/login                        /partners/login
```

### 3.1 `CRMGuard`
- **Protected Paths**: `/crm/*` (Staff & CRM Lead Management).
- **Verification**: Evaluates `hasAccessToken()` from `crmAuth.js`.
- **Failure Action**: Performs isolated redirect to `/crm/login` (`<Navigate to="/crm/login" replace />`).

### 3.2 `PartnerGuard`
- **Protected Paths**: `/partners/*` (Extranet & Inventory Dashboards).
- **Verification**: Reads `authStorage.getAccessToken()` and verifies JWT format structure via regex (`/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/`).
- **Failure Action**: Performs isolated redirect to `/partners/login` (`<Navigate to="/partners/login" replace />`).

---

## 4. Audit: OTA Custom Hooks (`src/hooks/useOtaServices.js`)

### 4.1 Shared State Scaffold & Race Condition Architecture (`useOtaRequest`)
All OTA custom hooks utilize `useOtaRequest`, an internal DRY hook scaffold providing:
1. **Standard State Tuple**: `{ loading: boolean, error: string|null, data: any }`.
2. **Lifecycle Ref Guards**:
   - `cancellableRef`: Holds the `createCancellableRequest` wrapper across re-renders.
   - `mountedRef`: Prevents memory leaks and invalid state updates (`setState`) on unmounted components.
3. **Race Condition Prevention**:
   - Leverages `createCancellableRequest()`.
   - Calling `execute()` automatically triggers `controller.abort()` on any previous in-flight request before spawning the new request.
   - Cancellation exceptions (`CanceledError`) return `undefined` and are swallowed silently without updating state or throwing errors.

---

### 4.2 Detailed Breakdown of Custom Hooks

#### 1. `usePropertyAvailability()`
- **Wrapped Service**: `fetchPropertyAvailability(propertyId, month, year, signal)`
- **Endpoint**: `GET /api/properties/{id}/availability/`
- **Purpose**: Fetches monthly calendar availability and pricing grid for Extranet inventory management.
- **Returns**: `{ loading, error, data, execute, abort, reset }`

#### 2. `useBulkInventoryUpdate()`
- **Wrapped Service**: `bulkUpdateInventory(propertyId, payload, signal)`
- **Endpoint**: `POST /api/properties/{id}/availability/bulk-update/`
- **Purpose**: Submits bulk availability and price updates for room types and rate plans.
- **Returns**: `{ loading, error, data, execute, abort, reset }`

#### 3. `useOtaSearch()`
- **Wrapped Service**: `fetchSearchAggregator(params, signal)`
- **Endpoint**: `GET /api/properties/search/`
- **Purpose**: Meta-search aggregator hook. Protected against fast user keystroke/filter race conditions via automatic request cancellation.
- **Returns**: `{ loading, error, data, execute, abort, reset }`

#### 4. `useWaitlistSubmit()`
- **Wrapped Service**: `submitWaitlistQueue(payload, signal)`
- **Endpoint**: `POST /api/waitlist/`
- **Purpose**: Submits user waitlist requests for sold-out or inactive dates.
- **Returns**: `{ loading, error, data, execute, abort, reset }`

---

## 5. Architectural Recommendations & Conclusions

1. **Service Consistency**: The integration layer (`apiClient.js`) exhibits robust design with pristine signal prototype retention, pluggable error dispatching, and automatic casing conversion.
2. **Auth Isolation**: B2B Partner and CRM Staff authentication pipelines are fully isolated with clear storage boundaries (`localStorage` vs. multi-tier `safeStorage`).
3. **Race Shielding**: Custom hooks in `useOtaServices.js` effectively isolate state changes and prevent unmount memory leaks and race conditions through `AbortController` cancellation lifecycle management.
