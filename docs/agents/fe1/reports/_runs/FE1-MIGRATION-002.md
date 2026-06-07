# FE1-MIGRATION-002 — تقرير الترحيل الكامل

**Task ID:** TP-FE1-FULL-MIGRATION-002
**Agent:** fe1
**Date:** 2026-03-15
**Branch:** `agent/fe1`
**Scope:** `src/pages/**`, `src/components/**`, `src/App.jsx`

## ملخص
- تم دمج كافة المنطق البرمجي من `TripDetailsPage.jsx` (790 سطر) في `TripDetails.jsx` الجديد مع واجهة Shadcn UI.
- تم تحديث `App.jsx` ليشمل 7 مسارات تغطي كل الصفحات (الجديدة والقديمة المتبقية).
- تم حذف الملفات القديمة المستبدلة بالكامل: `HomePage.jsx`, `TripDetailsPage.jsx`.

## المنطق المنقول (من TripDetailsPage → TripDetails)
- **FX Rates:** تحويل العملات مع caching في localStorage (22 ساعة TTL)
- **Checkout Math:** حساب السعر الأساسي + Activities + خصم الكوبون
- **Coupons:** تطبيق/إزالة كوبونات (TP10, WELCOME5, SIWA15)
- **Activities:** تحميل من API + اختيار/إلغاء اختيار
- **Media Gallery:** عرض صور + تضمين YouTube
- **Reviews:** عرض التقييمات والنجوم
- **Mobile Bottom-Sheet:** تصميم متجاوب للموبايل
- **Reservation Link:** بناء رابط الحجز مع query params

## الملفات المُعدلة

| ملف | نوع التغيير |
|-----|------------|
| `src/pages/TripDetails.jsx` | **دمج** — من 153 سطر → ~450 سطر (مع كل المنطق) |
| `src/App.jsx` | **تحديث** — 7 مسارات بدلاً من 2 |
| `src/pages/HomePage.jsx` | **حذف** |
| `src/pages/TripDetailsPage.jsx` | **حذف** |

## المسارات الجديدة في Router

| Path | Component |
|------|-----------|
| `/` | `Home` |
| `/destinations/:slug` | `TripDetails` |
| `/trips/:slug` | `TripDetails` (alias) |
| `/choose-your-trip` | `ChooseYourTripPage` |
| `/customize-your-trip` | `CustomizeYourTripPage` |
| `/reserve/:slug` | `TripReservationPage` |
| `/after-submit` | `AfterSubmitPage` |

## Risks
- الصفحات القديمة المتبقية (`ChooseYourTripPage`, `CustomizeYourTripPage`, `TripReservationPage`) لا تزال تستخدم CSS classes قديمة وتحتاج ترقية Shadcn في تذكرة منفصلة.
- كوبونات الـ MVP ثابتة في الكود (hardcoded) وتحتاج ربط بالـ Backend لاحقاً.
- الـ Activities endpoint يستخدم `fetch` مباشر بدلاً من `apiClient`.

## Proposed Commit
```
TP-FE1-FULL-MIGRATION-002: feat - merge legacy logic into Shadcn pages + update Router + cleanup (agent:fe1)
```

## مثال تطبيقي (Before/After)

**Before:** صفحة التفاصيل القديمة تستخدم 790 سطر مع CSS classes مثل `td-wrap`, `td-checkout`, `td-btn-primary`
**After:** نفس المنطق في صفحة Shadcn تستخدم `Card`, `CardContent`, `Button`, `Input` مع Tailwind CSS variables
