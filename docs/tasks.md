<div dir="rtl">

# Master Task Board — Travelophilia 🗺️

> **ملاحظة صارمة**: هذا الملف هو المصدر الوحيد (Source of Truth) لحالة المهام.
>
> - أي تغيير يجب أن يكون مرتبطًا بـ Commit/PR أو Handoff واضح.
> - يجب ذكر الـ branch + commit hash عند نقل المهمة إلى (Done).
> - يجب كتابة اسم الـ Agent المسؤول بجوار كل مهمة قيد العمل.

---

## 🔴 Blocked (متوقف بسبب مشكلة)

- [ ] _لا يوجد مهام متوقفة حالياً_

## 🟡 In Progress (قيد العمل حالياً)

- [ ] TP-MERGE-001: Merge owner/integration into main (Assigned to: `@Release` / `Ziad`)
- [ ] TP-FE-START-001: FE consume backend contract (lookup + trip request) (Assigned to: `@FE2`)
- [ ] TP-OPSCRM-SYNC-001: CRM pipeline + required fields aligned with codes (Assigned to: `@OpsCRM`)
- [ ] TP-STATE-SYNC-001: All agents submit state sync report in \_shared (Assigned to: `@All_Agents`)

## 🔵 Backlog (مهام قادمة - مرتبة بالأولوية)

- [ ] TP-001: Postgres integration (prod-ready) (Planned for: `@BE2`)
- [ ] TP-002: Persist Custom Trip Requests (Planned for: `@BE1`)
- [ ] TP-003: CRM pipeline statuses + UI (Planned for: `@OpsCRM`, `@FE1`)
- [ ] TP-004: Basic analytics events plan (Planned for: `@Analytics`)
- [ ] TP-005: Voucher generation v1 (Planned for: `@OpsCRM`, `@BE1`)
- [ ] TP-006: Pricing guardrails v1 (Planned for: `@Finance`, `@BE1`)

## 🟢 Done (مكتمل وتم الدمج)

- [x] TP-FIX-FE1-LAYOUT-DUPLICATE-MAGICLINK-001: Purge duplicate button.tsx, enforce AppLayout in App.jsx, refactor TripReservationPage to Tailwind v4, release Magic Companion Link in AfterSubmitPage (Assigned to: `@FE1`)
- [x] TP-FIX-FE2-APICLIENT-CONFLICT-RESOLUTION-001: Resolve Git merge conflict markers in src/services/apiClient.js and verify ES modules syntax (Assigned to: `@FE2`)
- [x] TP-DOC-SPRINT3-GLOBAL-SYNC-001: Synchronize central documentation for Sprint 3 FE & Integration accomplishments (Assigned to: `@Doc`)
- [x] TP-BE-IMPL-001: Remove slug date-stripping + add strict lookup & concurrency tests (owner/integration: e100a77)
- [x] TP-AUDIT-DOC-FULL-SYSTEM-001: Audit project documentation alignment against implementation reality and reconcile PRD & project maps (Assigned to: `@Doc`)

</div>
