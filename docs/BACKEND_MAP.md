> **ملاحظة صارمة (STRICT RULE):**
> يجب مراجعة هذا الملف قبل كتابة أي Import أو مسار API لتجنب الاستدعاءات الخاطئة (Hallucinations).
> آخر تحديث: 2026-08-09 — Audit Commit: `TP-DOC-SPRINT3.5-FULL-SYSTEM-SYNC-001`

# Backend Architecture Map (Travelophilia)

## 📌 1. الإعدادات والبيئة والسكربتات (Settings, Config & Root Scripts)
- **الموقع:** `backend/django_api/`
- **الملفات الرئيسية:**
  - `djconfig/settings.py`: إعدادات المشروع (Database, JWT, Middleware, Installed Apps, Throttling).
  - `djconfig/urls.py`: موجه الـ URLs الرئيسي للمشروع، ويقوم بتصدير الروابط للتطبيقات الفرعية والـ JWT Auth.
  - `djconfig/wsgi.py` / `djconfig/asgi.py`: نقطة دخول السيرفر.
  - `_backfill_trip_requests_codes.py`: سكربت تحديث ومعالجة الأكواد القديمة لطلبات الحجز المسبقة.
  - `requirements.txt`: حزم ومكتبات Python/Django المعتمدة للمشروع.
  - `manage.py`: أداة تنفيذ أوامر Django.

---

## 📌 2. التطبيقات والـ 8 نماذج الفعلية (Django Apps & 8 Models)

### 2.1 التطبيق الأول: `trips` (إدارة الوجهات والرحلات)
يهتم بكل ما يخص الوجهات (Destinations) والرحلات المعروضة للبيع (Trips).

**الملفات والنماذج (Files & Models):** (موجودة في `backend/django_api/trips/`)
- `models.py`:
  1. **`Destination` (الوجهات السياحية)**
  2. **`Activity` (الأنشطة التابعة لوجهة)**
  3. **`Trip` (الرحلات الفعلية - STAY أو DAYUSE مع Public Code System)**
  4. **`LegacyCustomTrip` (أرشيف الرحلات القديمة)**
- `data.py`: بيانات سياحية أولية لتحميل وتغذية الداتا بيز المبدئية.
- `serializers.py`: Serializers لتحويل بيانات الوجهات والرحلات والأنشطة.
- `views.py` / `urls.py`: endpoints الاستعلام عن الوجهات والرحلات بالـ Slug والـ Public Code.
- `tests/`: مجلد الاختبارات (`test_lookup_by_code.py`, `test_slug_lookup.py`, `test_concurrency.py`).

---

### 2.2 التطبيق الثاني: `trip_requests` (إدارة الطلبات والحجوزات CRM)
يهتم بتسجيل طلبات العملاء وإدارتها وتتبعها داخل الـ CRM.

**الملفات والنماذج (Files & Models):** (موجودة في `backend/django_api/trip_requests/`)
- `models.py`:
  5. **`ReservationSequence` (عداد تسلسل الحجوزات R-value)**
  6. **`Customer` (بيانات العميل المؤمنة بـ `identity_hash` و `identity_last4` والمفهرسة بـ B-Tree indexes على `phone` و `email`)**
  7. **`TripRequest` (طلب الرحلة والحجوزات الفردية والأكواد الذكية والمفهرسة بـ B-Tree indexes على `customer` و `created_at`)**
  8. **`TripRequestNote` (ملاحظات الـ CRM للعميل)**
- `city_codes.py`: تحويل وجدول أكواد المدن المصرية.
- `permissions.py`: كلاس الصلاحيات `IsCRMUser` لحماية مسارات الـ CRM.
- `serializers.py`: DRF Serializers مع التحقق من الهويات والمرافقين وأعمار الأطفال.
- `views.py`:
  - **`TripRequestCRMListView`**: محسّنة بـ `.select_related("assigned_to", "customer")` للقضاء التام على مشكلة N+1 SQL، وتدعم البحث المتعدد عبر حقول `customer__` المباشرة (`full_name`, `phone`, `email`, `identity_last4`).
- `urls.py`: endpoints تسجيل الحجوزات وإدارة الـ Leads للموظفين.
- `tests.py`: وحدة اختبارات مسارات الحجز والـ CRM.

---

### 2.3 التطبيق الثالث: `properties` (محرك ومخزن أسعار وإتاحة وحدات الإقامة OTA)
يهتم هذا التطبيق بكل ما يخص موردي الأسعار، وحدات الإقامة، غرف الفنادق، خطط الأسعار والوفرة اليومية وقائمة الانتظار وقواعد الربحية.

**الملفات والنماذج (Files & Models):** (موجودة في `backend/django_api/properties/`)
- `models.py`:
  9. **`Supplier` (مورد الأسعار)**
  10. **`Accommodation` (وحدات الإقامة)**
  11. **`RoomType` (أنواع الغرف)**
  12. **`RatePlan` (خطط الأسعار)**
  13. **`InventoryPricing` (الأسعار والوفرة اليومية)**
  14. **`Waitlist` (قائمة الانتظار للتواريخ غير النشطة)**
  15. **`GranularMarkupRule` (قواعد الأرباح الدقيقة 4-Layer Markup)**
  16. **`VendorProfile` (ملف تعريف المورد B2B)**
- `otp_service.py`: خدمة توليد والتحقق من رموز OTP الرقمية لشركاء B2B عبر Redis.
- `serializers.py`: Serializers للبحث المجمع، الميتاداتا، وتحديث المخزون.
- `views.py`:
  - **`PropertyAvailabilityBulkUpdateView`**: محمية بـ `permission_classes = [IsAuthenticated]` مع التحقق الصارم من ملكية المورد `accommodation.vendor.user == request.user` أو صلاحية `request.user.is_staff` لمنع تعديلات الأسعار غير المصرح بها.
- `urls.py`: endpoints محرك البحث، تحديث الأسعار الجماعي، الميتاداتا، ومصادقة B2B (`partners_auth`).
- `tests.py`: اختبارات شاملة لمحرك البحث، عزل الموردين، وقواعد الربحية.

---

## 📌 3. التوثيق المرجعي
- **مسار المشروع الأساسي:** `backend/django_api/`
- يعتمد الـ Backend على `PostgreSQL` كمخزن بيانات، و`rest_framework` للإدارة والاتصال، مع `rest_framework_simplejwt` للمصادقة وتوليد الـ Tokens.
- أي مسار تحت `/api/crm/` محمي بصلاحيات staff عبر الكلاس `IsCRMUser`.

## 📌 4. نظام الأمان والمصادقة للشركاء (B2B Authentication & Token Blacklisting)
- **عزل المسارات (Route Isolation):** تم تعريف مسارات مصادقة شركاء B2B بشكل منفصل داخل مصفوفة `partner_urlpatterns` وربطها في موجه المسارات العام كمسار معزول تحت namespace مخصص باسم `partners_auth` لمنع التداخل مع مسارات الـ CRM.
- **إبطال الرموز وإبطال الجلسات (Token Blacklisting Schema):** يدعم خادم Django إبطال كافة رموز التحديث (Refresh Tokens) النشطة وتطهير جلسات المستخدم بمجرد نجاح تغيير كلمة المرور.
