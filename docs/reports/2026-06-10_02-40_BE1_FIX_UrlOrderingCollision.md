# Report: Url Ordering Collision Fix

- **Task ID**: `FIX-BE-URL-ORDERING-COLLISION`
- **Agent**: `BE1 (API & Views Logic Specialist)`
- **Date**: `2026-06-10`
- **Model**: `Gemini 3.5 Flash`
- **Scope**: `backend/django_api/trips/urls.py`
- **Proposed Commit**: `feat(be1): FIX-BE-URL-ORDERING-COLLISION - Move static metadata route above dynamic identifier route to avoid collision`

## Summary
تم حل مشكلة الـ 404 التي كانت تحدث عند محاولة طلب `GET /api/trips/metadata/` من الـ Frontend. المشكلة كانت تكمن في أن مسار التفاصيل الديناميكي `trips/<slug:identifier>/` كان معرفاً قبل المسار الثابت `trips/metadata/` في ملف الـ URLs الخاص بـ `trips` مما يؤدي إلى قيام Django بمطابقة الكلمة الثابتة `metadata` كـ slug ديناميكي ومن ثم إرجاع خطأ 404 لعدم وجود رحلة بهذا المعرف.

تمت إعادة ترتيب مسارات الـ routing عبر نقل المسارين التاليين:
- `path("trips/metadata", TripMetadataView.as_view(), name="trip-metadata-no-slash")`
- `path("trips/metadata/", TripMetadataView.as_view(), name="trip-metadata")`

ليكونا أعلى المسار الديناميكي:
- `path("trips/<slug:identifier>", ...)`
- `path("trips/<slug:identifier>/", ...)`

تم تشغيل الأمر `python backend/django_api/manage.py check` بنجاح وتأكيد سلامة شجرة الـ routing بالكامل دون أي مشاكل.

## Risks
لا توجد مخاطر. هذا الترتيب هو الإجراء القياسي في Django حيث يجب دائماً وضع المسارات الثابتة والمحددة قبل المسارات الديناميكية المتغيرة لمنع حدوث التداخل والتعارض.

## Next Steps
1. فك قفل الملف (UNLOCK).
2. إخطار الـ Frontend للتحقق من زوال المشكلة عند الاتصال بالـ API.

## Example/Scenario
- **السابق**:
  عند طلب `GET /api/trips/metadata/` كانت تتم المطابقة مع `trips/<slug:identifier>/` بقيمة `identifier="metadata"` ويبحث الـ View عن رحلة تحمل هذا الكود فترجع 404.
- **الحالي**:
  عند طلب `GET /api/trips/metadata/` تتم المطابقة فوراً مع المسار الثابت وتوجيه الطلب لـ `TripMetadataView` بنجاح.
