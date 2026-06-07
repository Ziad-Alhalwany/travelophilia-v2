# Backend Contract Finalization Report

**Task ID:** TP-BE-READ-002
**Agent:** be1
**Date:** 2026-01-23
**Model:** Trip / TripRequest (Booking)
**Scope:** Backend Contract Definition

## 1. Trip Lookup Contract (Final)

The trip lookup logic is defined to be explicit and deterministic.

- **Endpoints:**
  - `GET /api/trips/<identifier>/`
  - Identifier can be a `public_code` or a `slug`.

- **Lookup Logic (Priority Order):**
  1. **By Public Code**: Try to match `public_code` (case-insensitive).
     - Example: `ST-0000007-SIWA`
  2. **By Slug**: If no code match, try to match `slug` (case-insensitive).
     - Example: `siwa-oasis-trip`

- **Fallback Rules (Non-Negotiables):**
  - **NO Date Stripping**: The system must NOT strip date suffixes (e.g., `-2023-10-10`) from the input identifier. If a user requests `siwa-2023`, it should look for a trip with slug `siwa-2023`, not `siwa`.
    - _Action Required_: Remove `re.sub(r"-\d{4}-\d{2}-\d{2}$", "", s)` from `normalize_code_or_slug`.
  - **NO Normalization**: No other "smart" normalization (fuzzy matching) beyond case-insensitivity.
  - **404**: If neither code nor slug matches effectively -> Return 404.

## 2. Code Generation Rules (Final)

The system uses a 3-part composite key for bookings, enforcing global uniqueness and business logic.

### Structure: `[TripPublicCode]-R[Seq]-P[Pax]-L-[LeadID]`

- **R-Sequence (Reservation/Booking)**:
  - **Rule**: `R` is unique per `Trip Public Code`.
  - **Implementation**: Managed via `ReservationSequence` model.
  - **Locking**: `select_for_update()` logic in `TripRequest.save` ensures no duplicate `R` numbers for the same trip.
  - **Format**: `R0001`, `R0002`...

- **P-Sequence (Traveler/Pax)**:
  - **Rule**: `P` represents the traveler index _within_ a reservation.
  - **Current Model Decision**: Since currently 1 `TripRequest` Row = 1 Booking (containing multiple travelers in JSON):
    - The `TripRequest` row itself represents the **Lead Traveler** (or the booking container) and is assigned **P01**.
    - Additional travelers (in `travelers` JSON) do not currently get separate DB rows/P-codes in this table, avoiding complexity.
  - **Format**: `P01`.

- **L-Code (Global Lead ID)**:
  - **Rule**: Global unique identifier for the lead/request.
  - **Implementation**: Based on the primary key (`id`) of the `TripRequest`.
  - **Format**: `L-` + 7 digits (zero-padded).
  - **Example**: `L-0000123`.

**Full Example Code:** `ST-0000007-SIWA-R0003-P01-L-0000123`

## 3. Model / DB Mapping

Structure of key entities and their mapping to current Django models.

### A. Trip (`trips.Trip`)

- **Table**: `trips_trip`
- **Key Fields**:
  - `public_code` (PK-ish): `ST-0000123-SIWA`
  - `slug`: SEO slug
  - `name`: Trip title
  - `type`: `STAY` / `DAYUSE`
  - `dest_code` / `from_code` / `to_code`: Location codes
  - `is_active`: Boolean
  - `priceFrom`, `currency`

### B. Booking (`trip_requests.TripRequest`)

- **Table**: `trip_requests_triprequest`
- **Scope**: Represents one Booking (Reservation).
- **Key Fields**:
  - `trip_public_code`: FK-ish to Trip
  - `reservation_r`: Sequence `R`
  - `status`: `NEW`, `CONTACTED`, `BOOKED`...
  - `priority`: `LOW`, `MEDIUM`, `HIGH`
  - `trip_code`: FULL generated string (for CRM search)

### C. Lead (`TripRequest` Fields)

- **Scope**: The person making the booking (embedded in `TripRequest` row).
- **Key Fields**:
  - `leader_full_name`
  - `leader_phone`, `leader_whatsapp`
  - `leader_email`
  - `leader_nationality`, `leader_resident_country`
  - `is_leader`: (Currently always True for the main row)
  - `lead_code`: Computed property from PK.

### D. Passenger (`TripRequest.travelers` JSON)

- **Scope**: Additional travelers in the same booking.
- **Storage**: `JSONField` named `travelers`.
- **Structure**: List of dicts `[{ "name": "...", "age": 10 }, ...]`.
- **Note**: No dedicated SQL table for passengers yet (keeps valid with "Minimal changes").

### Migrations Needed

- **None**. Current models (`Trip`, `TripRequest`, `ReservationSequence`) already contain all necessary fields (`trip_public_code`, `reservation_r`, `lead_...` fields).
- _Action_: Update `views.py` logic (python only) to stop date stripping.

## 4. JSON Examples

### A. GET Trip Response

**GET** `/api/trips/ST-0000007-SIWA`

```json
{
  "success": true,
  "data": {
    "id": 7,
    "public_code": "ST-0000007-SIWA",
    "slug": "siwa-oasis-trip",
    "name": "Siwa Oasis Adventure",
    "type": "STAY",
    "priceFrom": 5000,
    "currency": "EGP",
    "durationNights": 3,
    "description": "Amazing trip to Siwa...",
    "media": {
      "cover": "url...",
      "gallery": []
    },
    "is_active": true
  }
}
```

### B. POST Trip Request (Booking)

**POST** `/api/trip-requests/`

```json
{
  "trip_slug": "siwa-oasis-trip",
  "origin_city": "Cairo",
  "destination_city": "Siwa",
  "depart_date": "2024-12-01",
  "adults_count": 2,
  "children_count": 0,
  "pax_total": 2,
  "leader_full_name": "Ziad Test",
  "leader_phone": "+201000000000",
  "leader_email": "ziad@example.com",
  "terms_accepted": true,
  "travelers": [
    {
      "name": "Guest 1",
      "age": 30
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "id": 123,
  "trip_code": "ST-0000007-SIWA-R0005-P01-L-0000123",
  "trip_public_code": "ST-0000007-SIWA",
  "reservation_r": 5,
  "status": "NEW",
  "leader_full_name": "Ziad Test",
  "travelers": [{ "name": "Guest 1", "age": 30 }]
}
```

### C. Validation Error (400)

```json
{
  "terms_accepted": ["You must accept terms."]
}
```

## 5. Risks & Tests

### Risks

1.  **Concurrency / Race Conditions**: Two users booking the same trip at the exact same millisecond.
    - _Mitigation_: The `select_for_update()` on `ReservationSequence` is already implemented. We must ensure the transaction is atomic.
2.  **Date-Stripping Removal**: Removing the legacy date stripping might break old URLs like `/trips/siwa-trip-2022-10-10`.
    - _Mitigation_: Acceptable as per "Rule: NO date stripping". Old links with dates should 404 if no such slug exists.

### Test Plan

1.  **Concurrency Test**: Spawn 10 parallel threads attempting to book `ST-0000007-SIWA`.
    - _Expectation_: DB should result in 10 unique `R` numbers (e.g., R0001 to R0010) with no duplicates or errors.
2.  **Lookup Test**:
    - Request `/api/trips/ST-0000007-SIWA` -> 200 OK.
    - Request `/api/trips/siwa-oasis-trip` -> 200 OK.
    - Request `/api/trips/siwa-oasis-trip-2025` -> 404 (Verify date stripping is GONE).
3.  **Code Gen Test**: Create a booking and verify the `trip_code` follows the exact format `...-Rxxxx-P01-L-xxxxxxx`.

## 6. Proposed Comit Message

`NO-COMMIT (read-only): Finalize backend contract and code generation rules (agent:be1)`
