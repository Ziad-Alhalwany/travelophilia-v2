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
> Auto-generated from _shared â€” 2026-02-03 00:51:45

### _imports
- Report: NOT FOUND ($ReportName)

### analytics
- Branch: 
- Last synced commit: 
- git status: 

**Handoff**
_(Handoff section missing)_

### be1
- Branch: 
- Last synced commit: 
- git status: 

**Handoff**
_(Handoff section missing)_

### be2
- Branch: 
- Last synced commit: 
- git status: 

**Handoff**
_(Handoff section missing)_

### doc
- Branch: 
- Last synced commit: 
- git status: 

**Handoff**
_(Handoff section missing)_

### fe1
- Branch: 
- Last synced commit: 
- git status: 

**Handoff**
_(Handoff section missing)_

### fe2
- Branch: 
- Last synced commit: 
- git status: 

**Handoff**
_(Handoff section missing)_

### finance
- Branch: 
- Last synced commit: 
- git status: 

**Handoff**
_(Handoff section missing)_

### marketing
- Branch: 
- Last synced commit: 
- git status: 

**Handoff**
_(Handoff section missing)_

### opscrm
- Branch: 
- Last synced commit: 
- git status: 

**Handoff**
_(Handoff section missing)_

### planner
- Branch: 
- Last synced commit: 
- git status: 

**Handoff**
_(Handoff section missing)_

### qa
- Branch: 
- Last synced commit: 
- git status: 

**Handoff**
_(Handoff section missing)_

### release
- Branch: 
- Last synced commit: 
- git status: 

**Handoff**
_(Handoff section missing)_

### security
- Branch: 
- Last synced commit: 
- git status: 

**Handoff**
_(Handoff section missing)_

### uxcopy
- Branch: 
- Last synced commit: 
- git status: 

**Handoff**
_(Handoff section missing)_

<!-- END STATE SYNC SNAPSHOT -->

