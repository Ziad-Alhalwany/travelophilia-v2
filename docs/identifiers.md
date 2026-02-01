# Identifiers Glossary & Checklist

> **Goal**: Prevent confusion between Marketing (Slug), Operations (Public Code), and Internal (Lead/Reservation) codes.

## 1) Glossary & Definitions

| Term                 | Symbol      | Context    | Definition                                        | Example               |
| :------------------- | :---------- | :--------- | :------------------------------------------------ | :-------------------- |
| **Trip Public Code** | `ST` / `DU` | Operations | **Immutable** ID per Trip. Never changes.         | `ST-0000007-SIWA`     |
| **Reservation Seq**  | `R`         | Booking    | Sequence of booking _within_ that Trip.           | `R0003` (3rd booking) |
| **Passenger Seq**    | `P`         | Pax        | Sequence of person _within_ that Booking.         | `P01`, `P02`          |
| **Lead Code**        | `L`         | Internal   | **Global** ID for the Lead person (Company-wide). | `L-0001234`           |
| **Slug**             | -           | Marketing  | **Mutable** URL-friendly string for SEO.          | `siwa-weekend`        |

---

## 2) Identifier Format String (The Standard)

### A) Customer View (Short & Clean)

Target: Boarding Pass, Emails, User Dashboard.
Format: `[Trip Public Code]-[R-Seq]-[P-Seq]`

> **Example**: `ST-0000007-SIWA-R0003-P01`

### B) CRM / Operations View (Full Traceability)

Target: Backoffice, Admin Panel, Logs.
Format: `[Trip Public Code]-[R-Seq]-[P-Seq]-[Lead Code]`

> **Example**: `ST-0000007-SIWA-R0003-P01-L-0001234`

---

## 3) Engineering Decisions (Backend Rules)

### Slug vs. Public Code Lookup

1.  **Trip Public Code (`ST-...`)**: The hard anchor. Used for relations, payments, and invoices.
2.  **Slug (`siwa-...`)**: The soft entry. Used for Landing Pages and SEO URLs.
3.  **Requirement**:
    - `GET /api/trips/{id}/` MUST support **both**.
    - Logic: Try matching `slug` first? OR Check regex format?
    - **Decision**: If it looks like a Public Code (Starts with `ST-` or `DU-`), treat as Code. Else treat as Slug.

---

## 4) Agent Checklist (Before Coding)

- [ ] **FE**: Display the **Short Code** to users, never the internal Lead Code string.
- [ ] **BE**: Ensure `POST /api/bookings/` accepts the `Public Code`.
- [ ] **BE**: Ensure URL resolution handles existing `public_code` even if `slug` changes.
- [ ] **CRM**: Ensure Lead Code `L-xxxx` is indexed for "Repeat Customer" lookup.
