# FE1-FIX-MAP-003 — تقرير إصلاح Vite + خريطة المشروع

**Task ID:** TP-FE1-FIX-AND-MAP-003
**Agent:** fe1
**Date:** 2026-03-15
**Branch:** `agent/fe1`

## ملخص الإصلاحات

### 1. Double BrowserRouter (السبب الحقيقي للكراش)
- `main.jsx` كان يلف `<App>` داخل `<BrowserRouter>`
- `App.jsx` كان أيضاً يلف كل شيء داخل `<BrowserRouter>` → **Router مكرر = crash**
- **الحل:** أزلنا `<BrowserRouter>` من `App.jsx` وأبقينا `<Routes>` فقط. `main.jsx` يوفر Router.

### 2. Unused Imports (تنظيف)
- أُزيل: `apiClient` (default import), `MapPin`, `Star`, `TripRequestForm`
- السبب: لم تُستخدم في JSX بعد دمج المنطق مع CheckoutCard

### 3. تأكيد: الملفات ليست وهمية
- `AppLayout.jsx` ← **موجود** في `src/components/layout/`
- `TripRequestForm.jsx` ← **موجود** في `src/components/forms/`
- المسارات كانت صحيحة — المشكلة الفعلية هي Double Router

## خريطة المشروع
- تم إنشاء: `_shared/docs/FRONTEND_MAP.md`
- تحتوي على 59 ملف مُوثق بالمسار والوظيفة
- قاعدة صارمة في البداية: "تحقق من المسارات قبل أي Import"

## Risks
- بعض الصفحات القديمة (About, Visa, Transportation, etc.) ليس لها routes في App.jsx
- Legacy components (flat `/src/components/`) لا تزال موجودة بجانب Shadcn components

## Proposed Commit
```
TP-FE1-FIX-AND-MAP-003: fix - remove double BrowserRouter + clean unused imports (agent:fe1)
```
