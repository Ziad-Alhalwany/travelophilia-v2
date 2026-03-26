<div dir="rtl">

# Agents Index — Travelophilia (Source of Truth)

> الهدف: أي Agent يفهم “آخر وضع” في أقل من دقيقة.  
> التفصيل/الشاتات/التقارير التفصيلية **محليًا فقط** في: `_shared/agents/<agent>/...` (غير متتبعة داخل Git).

---

## Latest Decisions (Non-Negotiables)

- **Slug**: بدون تواريخ. ممنوع `date stripping` أو `normalize` ذكي يشيل suffix.
- **Trip Lookup**: يدعم `slug` أو `public_code` (case-insensitive فقط).  
  _الواجهة تستخدم slug للـ SEO، والـ backend يعمل fallback على public_code._
- **Codes**:
  - للعميل: `<TripPublicCode>-Rxxxx-P01`
  - داخلي/CRM: `<TripPublicCode>-Rxxxx-P01-L-xxxxxxx`
  - **P01 فقط حاليًا** (Lead داخل الحجز).

---

## Latest Milestones

- **Main Updated**: `d722886` — merged (governance docs + be2 trips lookup fix).
- **be1**: TP-BE-READ-002 → Backend Contract approved (lookup + codes).
- **be2**: TP-BE-IMPL-001 → Removed date stripping + strict lookup + concurrency tests (included in main).

---

## Current Work Mode

- **Docs Source of Truth**: كل القرارات التشغيلية موجودة داخل `docs/` على main.
- **Local Logs/Reports**: أي تقارير تشغيل/شاتات تتخزن في `_shared` فقط (مش داخل repo).

---

## Next Up (Order)

1. **All Agents**: TP-STATE-SYNC-001 report in `_shared`.
2. **FE1/FE2**: Consume backend lookup contract + implement TripRequest flow (no UI/UX change without request).
3. **OpsCRM**: Align pipeline + required fields + message templates with code format.
4. **Release**: Ensure docs governance remains consistent (identifiers/locks/tasks).

</div>

<!-- BEGIN STATE SYNC SNAPSHOT -->
> Auto-generated from _shared - 2026-02-06 Friday 16:03:26

### analytics
- Branch: _
- Last synced commit: _
- git status: _

**Handoff**
_(Handoff section missing)_

### be1
- Branch: agent/be1
- Last synced commit: 9dd9c38
- git status: clean

**Handoff**
- What I completed
  - Created agent report directory structure.
  - Documented sync failure due to SSH permission.
  - Moved report to `_shared/agents/be1/reports/_runs/` as requested.
- What changed
  - Added `docs/agents/be1/reports/` and `docs/agents/be1/chats/`.
  - Added `TP-STATE-SYNC-001.md` report.
- Next step for you
  - Resolve SSH key permissions for `agent/be1`.
  - Resume `git fetch` and `git merge` from `origin/main`.
- Risks/Blockers
  - BLOCKER: Cannot fetch from remote (Permission denied).
  - RISK: Local branch may be stale relative to main.
- References (paths + commit hashes)
  - Report: `_shared/agents/be1/reports/_runs/TP-STATE-SYNC-001.md`

### be2
- Branch: _
- Last synced commit: _
- git status: _

**Handoff**
_(Handoff section missing)_

### doc
- Branch: _
- Last synced commit: _
- git status: _

**Handoff**
_(Handoff section missing)_

### fe1
- Branch: agent/fe1
- Last synced commit: 630a8741be44ab9a1a336b80e90b098b45a67061
- git status: clean

**Handoff**
- What I completed: FE Wiring for Trip Details and Customization pages.
- What changed: `CustomizeYourTripPage.jsx` and `TripDetailsPage.jsx` now use `apiClient` services.
- Next step for you: Integrate these changes into `owner/integration` and proceed with further refactoring or new feature development.
- Risks/Blockers: None blocking immediate integration, but technical debt exists in the form of large components and CSS.
- References:
  - `src/pages/CustomizeYourTripPage.jsx`
  - `src/pages/TripDetailsPage.jsx`
  - `src/services/apiClient.js`

### fe2
- Branch: _
- Last synced commit: _
- git status: _

**Handoff**
_(Handoff section missing)_

### finance
- Branch: _
- Last synced commit: _
- git status: _

**Handoff**
_(Handoff section missing)_

### marketing
- Branch: _
- Last synced commit: _
- git status: _

**Handoff**
_(Handoff section missing)_

### opscrm
- Branch: _
- Last synced commit: _
- git status: _

**Handoff**
_(Handoff section missing)_

### planner
- Branch: _
- Last synced commit: _
- git status: _

**Handoff**
_(Handoff section missing)_

### qa
- Branch: _
- Last synced commit: _
- git status: _

**Handoff**
_(Handoff section missing)_

### release
- Branch: _
- Last synced commit: _
- git status: _

**Handoff**
_(Handoff section missing)_

### security
- Branch: _
- Last synced commit: _
- git status: _

**Handoff**
_(Handoff section missing)_

### uxcopy
- Branch: _
- Last synced commit: _
- git status: _

**Handoff**
_(Handoff section missing)_

<!-- END STATE SYNC SNAPSHOT -->


