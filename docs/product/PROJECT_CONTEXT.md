<div dir="rtl">
# PROJECT_CONTENT — ما الذي نبنيه؟

# Travelophilia — Project Context (Source of Truth)

## 0) North Star

- We are not selling trips only. We build an end-to-end experience (discover → reserve → follow-up → CRM).
- Every step should be clear, trackable, and production-ready.

---

## 1) Team & Working Rules (Non-Negotiables)

- Do not change UI/UX or feature behavior unless explicitly requested by Ziad.
- Bugfix only = no wide refactor.
- If editing a file: share full file copy/paste when changes are more than 3 edits; otherwise specify exact location.
- Always provide: **Goal → Change → How to test → Risks**
- Keep code modular, naming consistent, validations strong, logging useful, migrations safe.

---

## 2) Naming Conventions (Hybrid Standard)

### Backend (Django/DB/Serializers)

- Use **snake_case** everywhere.

### Frontend (React/JS State/Components)

- Use **camelCase** everywhere.

### Bridge Between Them

- Requests from FE → BE: convert **camelCase → snake_case**
- Responses from BE → FE: convert **snake_case → camelCase**
- Only keep “mappers” for semantic transformations (not just key casing).

---

## 3) Identifiers & Codes (Trips / Reservations / CRM)

### Trip SEO Slug (Marketing Friendly)

- `slug` = friendly readable unique string (SEO + shareable)
- Example: `siwa-weekend`, `dahab-escape`

### Trip Public Code (Operational Stable)

- `public_code` = stable operational identifier (never changes)
- Example: `ST-0000007-SIWA`, `DU-0000004-MNS-AIN`

### Lookup Rule (Backend)

- `/api/trips/<identifier>/` must accept either:
  - `slug` OR
  - `public_code`
- This gives: SEO + stability + backward compatibility.

---

## 4) Reservation / TripRequest Codes (Business Logic)

- Trip Public Code: stable per trip
  - `ST-0000007-SIWA`
- Reservation sequence (per trip): `R0001`, `R0002`, ...
  - Third booking on same trip → `R0003`
- Passenger sequence (per reservation): `P01..Pxx`
- Lead Code (internal company-wide): `L-0001234`

### Display rules

- Customer sees short: `ST-0000007-SIWA-R0003` (and possibly `-P01`)
- CRM sees internal: `ST-0000007-SIWA-R0003-P01-L-0001234`

---

## 5) API Shape (Current Contracts)

### Trips

- `GET /api/trips/` → list of trips
- `GET /api/trips/<identifier>/` → trip details (identifier = slug OR public_code)
- `GET /api/destinations/<CODE>/activities/` → activities for destination

### Trip Requests (Customer side)

- `GET /api/trip-requests/generate-code/` → returns code for a new request
- `POST /api/trip-requests/` → creates a new request (expects snake_case)

### CRM

- `GET /api/crm/trip-requests/` requires auth
- Token refresh flow is normal (401 then refresh then 200).

---

## 6) Data Rules

- Backend is source of truth (DB), no static lists after DB exists.
- Avoid mixed camel + snake for the same fields in one response.
- Keep slug unique, public_code stable.

---

## 7) Security & Stability Baselines

- Do not expose internal codes to customers unless needed.
- Validate request payloads in serializers, return clear 400 errors.
- Log server errors with traceback (dev), structured logs (prod).
- CORS/CSRF set correctly; DRF permissions explicitly defined.
- Never commit secrets. Use environment variables.

---

## 8) Dev Commands

### Frontend

- `npm run dev`

### Backend

- Activate venv then `python manage.py runserver`

---

## 9) Definition of Done (DoD)

A task is done when:

- No console errors
- No backend 500s
- Expected 400s show clear field-level messages
- The flow works end-to-end:
  - Trip list → Trip details → Reservation submit → Appears in CRM
- Minimal diff, no scope creep, no unintended UI/UX changes

## 1) Travelophilia = Experience + Operations System

مش بنبيع “رحلة” فقط.  
بنبيع: **وضوح + طمأنينة + تشغيل مضبوط + متابعة حقيقية**.

---

## 2) الرسالة الثابتة (لازم تظهر في كل صفحة)

**"إنت مش لوحدك… إحنا بنبني تجربة ونتابعها، وكل خطوة واضحة."**

---

## 3) Brand Pillars

- Trust & Clarity
- Experience & Story
- Operational Excellence
- Smart Customization

---

## 4) Customer Journey Golden Path

Trips/Templates → Trip Details → Add-ons → Request → CRM Follow-up → Payment → Confirmation → Itinerary

</div>
