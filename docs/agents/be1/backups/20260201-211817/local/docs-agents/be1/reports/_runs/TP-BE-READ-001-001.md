# TP-BE-READ-001: Backend Verification Report

- **Agent**: be1
- **Date**: 2026-01-19
- **Scope**: Backend Logic & Data Models (Read-only)

---

## 1. Trip Lookup (Confirmed)

**Status**: ✅ Supported

- **Logic**: `TripsDetailView` checks `public_code` first, then fallback to `slug`.
- **Code Reference**: `backend/django_api/trips/views.py`
  ```python
  # 1) public_code (Priority)
  trip = Trip.objects.filter(public_code__iexact=s).first()
  # 2) slug (Fallback)
  if not trip:
      trip = Trip.objects.filter(slug__iexact=s).first()
  ```

## 2. Booking / Reservation Logic

**Status**: ✅ Implemented with Sequencing

- **Reservation Sequence (R-xxxx)**:
  - **Mechanism**: `ReservationSequence` model tracks `last_r` per `trip_public_code`.
  - **Generation**: Inside `TripRequestCreateSerializer.create`, using `transaction.atomic` + `select_for_update` to prevent race conditions.
  - **Result**: Unique incremental R number per Trip.

- **Passenger Sequence (P-xx)**:
  - **Mechanism**: Calculated via `Max("traveler_p")` query on existing requests.
  - **Current Behavior**: `TripRequestCreateSerializer` defaults `traveler_p=1` for new requests (assuming 1 Request Row = 1 Booking Group). Future passengers in same booking would increment this.

- **Lead Code (L-xxxxxx)**:
  - **Mechanism**: Computed Property based on Primary Key (`pk`).
  - **Location**: `TripRequest.lead_code` property.
  - **Format**: `L-{pk:07d}` (e.g., `L-0001234`).

## 3. Data Model Mapping

| Requirement               | Existing Field (BE)                | Status     |
| :------------------------ | :--------------------------------- | :--------- |
| `Trip.public_code`        | `Trip.public_code`                 | ✅ Matched |
| `Trip.slug`               | `Trip.slug`                        | ✅ Matched |
| `Booking.reservation_seq` | `TripRequest.reservation_r`        | ✅ Matched |
| `Passenger.passenger_seq` | `TripRequest.traveler_p`           | ✅ Matched |
| `Lead.lead_code`          | `TripRequest.lead_code` (Computed) | ✅ Matched |

**Note**: Currently `TripRequest` acts as the Booking Record. `travelers` JSON field holds guest details. This fits the "Single Row per Booking" model unless split later.

## 4. Risks & Tests

### Risks

1.  **Date Suffix Stripping**: `re.sub(r"-\d{4}-\d{2}-\d{2}$", "", s)` in `normalize_code_or_slug` might accidentally strip legitimate slug parts if they look like dates.
2.  **Ambiguity**: `TripRequest` mixing "Booking" and "Passenger" roles might complicate things if we move to "One Row Per Passenger" model later (PK-based Lead Code would change for split rows).

### Test Plan (Immediate Smoke Test)

1.  **Lookup by Code**: `GET /api/trips/ST-0000007-SIWA` -> Expect 200.
2.  **Lookup by Slug**: `GET /api/trips/siwa-oasis-trip` -> Expect 200.
3.  **Booking Creation**:
    - `POST /api/trip-requests/` with `{ "destinationCity": "..." }`
    - Verify response contains `trip_code` with `Rxxxx-P01-Lxxxx`.

## 5. What is missing?

- `docs/identifiers.md` does not exist (Checking `docs/api.md` instead).

---

**Proposed Commit Message**:
NO-COMMIT (read-only): backend verification report (agent:be1)
