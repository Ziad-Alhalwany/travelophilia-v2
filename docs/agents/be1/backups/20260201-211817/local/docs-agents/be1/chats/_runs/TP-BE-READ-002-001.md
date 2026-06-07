# Chat Summary: TP-BE-READ-002

**Agent:** be1
**Task ID:** TP-BE-READ-002
**Related Report:** `TP-BE-READ-002-001.md`

## 1. What was discussed

- Finalizing the Backend Contract for Trip Lookup (Public Code vs Slug).
- Defining rules for CRM Code Generation (R, P, L sequences).
- Mapping current DB models (`Trip`, `TripRequest`) to concepts (Booking, Lead, Passenger).
- Identifying discrepancies between current code (date stripping regex) and new rules (NO date stripping).

## 2. Decisions made

- **Trip Lookup**: Explicit priority: `public_code` -> `slug`.
- **Date Stripping**: Must be removed from `normalize_code_or_slug`.
- **Booking Model**: `TripRequest` represents the Booking (R) + Lead Traveler (P01). Additional passengers stored in `travelers` JSON for now (Minimal Changes policy).
- **Validation**: Strict validation on `terms_accepted`.

## 3. Open questions

- None. The contract is now clearly defined for implementation.

## 4. Next Steps

- Execute the described changes (remove regex) in a subsequent task.
- Implement the described tests.
