# Documentation Synchronization Plan (TP-CORE-SEC-001 Sync)

Provide a synchronization of our central documentation maps with the actual implementation of backend models, active URL endpoints, security requirements, and frontend React router paths.

## User Review Required

> [!IMPORTANT]
> This synchronization updates both the main copy in `_shared/docs/` and the local project copy in `Travelophilia v2/docs/` to prevent developer/agent hallucinations.
> No application source code changes are performed.

> [!WARNING]
> We will add a non-negotiable security clause in `ARCHITECTURE.md` explicitly forbidding fallback values for `SECRET_KEY` or `DB_PASSWORD`. Note that currently, `settings.py` contains developmental merge-conflict fallbacks which must be cleaned up in a separate backend task.

## Proposed Changes

### Documentation Components

---

### [Component: Backend Map]

#### [MODIFY] [BACKEND_MAP.md](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_shared/docs/BACKEND_MAP.md)
#### [MODIFY] [BACKEND_MAP.md](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/Travelophilia%20v2/docs/BACKEND_MAP.md)

- Update models section to list all **8 models**:
  - `trips/models.py`:
    1. `Destination` (fields, slug/code auto-generation)
    2. `Activity` (fields, tags/options JSON, unique constraints)
    3. `Trip` (computed fields: `global_seq`, `public_code`, `internal_key`, `internal_seq`; helper methods: `_is_dayuse()`, `_compute_internal_key()`, `_build_public_code()`)
    4. `LegacyCustomTrip` (log payload)
  - `trip_requests/models.py`:
    5. `ReservationSequence` (last reservation sequence R-value tracker per public code)
    6. `Customer` (secured fields: `identity_type`, `identity_last4`, `identity_hash` constraint for data masking)
    7. `TripRequest` (computed properties: `reservation_code`, `traveler_code`, `lead_code`, `_build_internal_code()`, CRM status choices, and traveler details JSON validation)
    8. `TripRequestNote` (CRM note logging, kind choices)

---

### [Component: API Contract]

#### [MODIFY] [api.md](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_shared/docs/api.md)
#### [MODIFY] [api.md](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/Travelophilia%20v2/docs/api.md)

- Document the actual **14 active endpoints** (supporting slash/no-slash paths):
  1. `POST /api/auth/token` - Login & JWT token retrieval
  2. `POST /api/auth/token/refresh` - Refresh JWT token
  3. `GET /api/trips` - Get active trips list
  4. `GET /api/trips/<slug:identifier>` - Get trip details by slug or public code
  5. `GET /api/destinations` - Get active destinations list
  6. `GET /api/destinations/<slug:slug_or_code>` - Get destination details by slug or code
  7. `GET /api/destinations/<slug:slug_or_code>/activities` - Get destination activities
  8. `POST /api/custom-trip` - Save custom trip request payload
  9. `POST /api/trip-requests` - Submit public trip request form (with camelCase mapping logic)
  10. `GET /api/trip-requests/generate-code` - Legacy trip request code generator
  11. `GET /api/crm/trip-requests` - List CRM trip requests (protected, supports filters, search `q`, sorting)
  12. `GET /api/crm/trip-requests/<int:pk>` - CRM trip request detail view (protected)
  13. `PATCH /api/crm/trip-requests/<int:pk>` - CRM update status/priority/assignment (protected)
  14. `GET` / `POST /api/crm/trip-requests/<int:pk>/notes` - Retrieve/Create CRM notes (protected)
- Define the `camelCase` to `snake_case` mapping logic explicitly in `TripRequestCreateSerializer`:
  - `originCity` -> `origin_city`
  - `destinationCity` -> `destination_city`
  - `fullName` -> `leader_full_name` (saved to Customer)
  - `phone` -> `leader_phone` (saved to Customer)
  - `termsAccepted` -> `terms_accepted`
  - `docsAcknowledged` -> `docs_acknowledged`
  - `tripSlug_in` -> `trip_slug`
  - `tripTitle_in` -> `trip_title`

---

### [Component: Architecture Design]

#### [MODIFY] [ARCHITECTURE.md](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_shared/docs/ARCHITECTURE.md)
#### [MODIFY] [ARCHITECTURE.md](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/Travelophilia%20v2/docs/ARCHITECTURE.md)

- Add a strict security clause under Backend Rules:
  - **بند أمني غير قابل للتفاوض (Non-Negotiable Security Clause):** It is strictly forbidden to embed or fallback to any default developer keys or passwords in the codebase (e.g. `SECRET_KEY = os.getenv('SECRET_KEY', 'default_fallback')` or `DB_PASSWORD = os.getenv('DB_PASSWORD', '123')`). If variables are missing from environment files (`.env`), the server execution must throw an error and fail immediately.

---

### [Component: Frontend Map]

#### [MODIFY] [FRONTEND_MAP.md](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_shared/docs/FRONTEND_MAP.md)
#### [MODIFY] [FRONTEND_MAP.md](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/Travelophilia%20v2/docs/FRONTEND_MAP.md)

- Update React router path configurations to reflect actual paths from `App.jsx`:
  - `CRMLeadsPage.jsx` mapped to `/crm/leads`
  - `CRMLoginPage.jsx` mapped to `/crm/login`
  - Add redirect from `/crm` to `/crm/leads`
  - Ensure all other routed page components match `App.jsx` exactly.

## Verification Plan

### Manual Verification
- Review updated markdown files in both `_shared/docs` and `Travelophilia v2/docs` to ensure they are visually correct, formatted correctly, and free from typos.
- Verify that no application code was touched.
