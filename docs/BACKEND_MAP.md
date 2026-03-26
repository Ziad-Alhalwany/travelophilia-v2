> **ملاحظة صارمة (STRICT RULE):**
> يجب مراجعة هذا الملف قبل كتابة أي Import أو مسار API لتجنب الاستدعاءات الخاطئة (Hallucinations).

# Backend Architecture Map (Travelophilia)

## 📌 1. الإعدادات والبيئة (Settings & Config)

- **الموقع:** `backend/django_api/djconfig/`
- **الملفات الرئيسية:**
  - `settings.py`: إعدادات المشروع (Database, JWT, Middleware, Installed Apps).
  - `urls.py`: موجه الـ URLs الرئيسي للمشروع، ويقوم بتصدير الروابط للتطبيقات الفرعية.
  - `wsgi.py` / `asgi.py`: نقطة دخول السيرفر.

---

## 📌 2. التطبيقات (Django Apps)

### 2.1 التطبيق الأول: `trips` (إدارة الوجهات والرحلات)

يهتم بكل ما يخص الوجهات (Destinations) والرحلات المعروضة للبيع (Trips).

**النماذج (Models):** (موجودة في `trips/models.py`)

- `Destination`: الوجهات الأساسية (Siwa, Dahab, Alexandria...) مع الأكواد (مثل SIWA, DHB).
- `Activity`: الأنشطة الإضافية أو الخيارات التابعة لوجهة معينة.
- `Trip`: الرحلات الفعلية (Stay أو Dayuse) التي لها كود عام مثل `ST-0000007-SIWA`.
- `LegacyCustomTrip`: مخزن JSON لطلبات الرحلات المخصصة (Legacy Payload).

**الروابط الأساسية (URLs):** (موجودة في `trips/urls.py` ومربوطة بـ `/api/`)

- `GET /api/trips`: قائمة الرحلات.
- `GET /api/trips/<slug:identifier>`: تفاصيل رحلة محددة (يدعم الـ Slug أو الـ Public Code).
- `GET /api/destinations`: قائمة الوجهات.
- `GET /api/destinations/<slug_or_code>`: تفاصيل الوجهة.
- `GET /api/destinations/<slug_or_code>/activities`: أنشطة الوجهة.
- `POST /api/custom-trip`: نهاية مسار إنشاء الرحلات المخصصة القديمة.

---

### 2.2 التطبيق الثاني: `trip_requests` (إدارة الطلبات والحجوزات CRM)

يهتم بتسجيل طلبات العملاء وإدارتها داخل الـ CRM.

**النماذج (Models):** (موجودة في `trip_requests/models.py`)

- `TripRequest`: النموذج الأساسي لطلب الرحلة، يحتوي على بيانات المسافرين وحالة الطلب في الـ CRM.
- `ReservationSequence`: لتعقب عداد الحجوزات وإصدار أرقام تسلسلية صحيحة (R-Values).
- `TripRequestNote`: لتسجيل الملاحظات، المكالمات، ورسائل الواتساب الخاصة بطلب معين (CRM Notes).

**الروابط الأساسية (URLs):** (موجودة في `trip_requests/urls.py` ومربوطة بـ `/api/`)

- `POST /api/trip-requests`: إنشاء طلب رحلة جديد (من واجهة الموقع).
- `POST /api/trip-requests/generate-code`: إنشاء كود للرحلة (Legacy).
- `GET / POST /api/crm/trip-requests`: واجهة موظفي خدمة العملاء لعرض أو تحديث الطلبات (يتطلب الصلاحيات).
- `GET / POST /api/crm/trip-requests/<int:pk>/notes`: إضافة أو قراءة ملاحظات الـ CRM.

---

## 📌 3. التوثيق المرجعي

- **مسار المشروع الأساسي:** `backend/django_api/`
- يعتمد الـ Backend على `PostgreSQL`، و`rest_framework` كإطار عمل مع `rest_framework_simplejwt` للـ Authentication.
- أي مسار تحت `/api/crm/` يتطلب توثيق `Staff` عبر `IsCRMUser`.
