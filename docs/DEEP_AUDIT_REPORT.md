<div dir="rtl">

# Deep Codebase Audit & Predictive Gap Analysis
**Task ID:** TP-AUDIT-002  
**Agent:** Planner Agent  
**Date:** 2026-03-25  
**Branch:** `agent/planner`  
**Scope:** Read-only — فحص شامل بدون أي تعديل كود.

---

## 1. البنية التحتية وقواعد البيانات (Database & Models Deep Dive)

### 1.1 خريطة الجداول الحالية (Current Models Map)

#### تطبيق `trips`

| Model | الأعمدة الرئيسية | نوع البيانات | ملاحظات |
|---|---|---|---|
| **Destination** | `code`, `slug`, `name`, `country`, `city`, `description`, `cover_image_url`, `gallery_urls`, `video_urls`, `is_active`, `sort_order`, `created_at`, `updated_at` | CharField, SlugField, TextField, URLField, **JSONField** (gallery/video), BooleanField, IntegerField, DateTimeField | مرجعي — يربط الأكواد بالوجهات. `gallery_urls` و `video_urls` كـ JSONField (list[str]). |
| **Activity** | `destination` (FK), `title`, `slug`, `description`, `price`, `currency`, `duration_label`, `options`, `tags`, `is_active`, `sort_order`, `created_at`, `updated_at` | FK, CharField, SlugField, TextField, PositiveIntegerField, **JSONField** (options, tags) | مرتبط بوجهة. Unique Together على `(destination, slug)`. |
| **Trip** | `legacy_id`, `slug`, `name`, `location`, `type`, `description`, `priceFrom`, `priceTo`, `currency`, `durationNights`, `tags`, `highlights`, `media`, `social_proof`, `is_active`, `public_code`, `global_seq`, `dest_code`, `from_code`, `to_code`, `internal_key`, `internal_seq`, `created_at`, `updated_at` | CharField, SlugField, TextField, PositiveIntegerField, **JSONField** (tags, highlights, media, social_proof), BooleanField | **النموذج المركزي** — يحتوي نظام توليد أكواد ذكي. |
| **LegacyCustomTrip** | `payload`, `created_at` | **JSONField**, DateTimeField | سجل خام — لم يُستخدم فعلياً في الكود (الـ View لا تحفظ فيه). |

#### تطبيق `trip_requests` (الـ CRM)

| Model | الأعمدة الرئيسية | نوع البيانات | ملاحظات |
|---|---|---|---|
| **ReservationSequence** | `trip_public_code`, `last_r` | CharField (unique), PositiveIntegerField | عداد تسلسلي لحجوزات كل رحلة. يستخدم `select_for_update` لمنع التكرار. |
| **TripRequest** | `trip_code`, `trip_public_code`, `reservation_r`, `traveler_p`, `is_leader`, `internal_code_override`, `leader_full_name`, `leader_phone`, `leader_whatsapp`, `leader_email`, `leader_gender`, `leader_age`, `leader_nationality`, `leader_resident_country`, `leader_identity_type`, `leader_identity_last4`, `entry_type_for_egypt`, `nationality`, `resident_country`, `origin_city`, `destination_city`, `depart_date`, `return_date`, `adults_count`, `children_count`, `pax_total`, `companions_mode`, `note`, `couples_answer`, `terms_accepted`, `docs_acknowledged`, `travelers`, `children_details`, `status`, `priority`, `assigned_to` (FK), `last_contacted_at`, `next_followup_at`, `source`, `tags`, `trip_slug`, `trip_title`, `created_at`, `updated_at` | أنواع متعددة: CharField, EmailField, PositiveIntegerField, BooleanField, DateField, DateTimeField, **JSONField** (travelers, children_details, tags), TextChoices (Status, Priority), FK (User) | **قلب النظام**. يحتوي حقول CRM كاملة + بيانات المسافر المفصلة. |
| **TripRequestNote** | `trip_request` (FK), `kind` (TextChoices), `body`, `created_at`, `created_by` (FK) | FK, CharField, TextField, DateTimeField | ملاحظات الموظفين — يدعم أنواع: NOTE, WHATSAPP, CALL, EMAIL. |

### 1.2 تحليل الفجوات (Model Gaps vs Requirements)

> [!CAUTION]
> **الجداول الناقصة تماماً (Missing Models):**

| النموذج المطلوب | حالته | ملاحظات |
|---|---|---|
| **Customer / User Profile** | ❌ غير موجود | لا يوجد نموذج مستقل للعملاء. بيانات العميل مدمجة داخل `TripRequest` فقط (حقول `leader_*`). لا يوجد سجل عميل مركزي (Customer Record) يحفظ تاريخ التعاملات. |
| **Booking / Order** | ❌ غير موجود | الـ `TripRequest` يعمل كبديل مؤقت، لكنه ليس نموذج حجز فعلي. لا يوجد `total_price` أو `payment_status` أو ربط بالدفع. |
| **Payment / Transaction** | ❌ غير موجود | لا وجود لأي نموذج مالي أو تكامل مع بوابات الدفع. |
| **Loyalty Points** | ❌ غير موجود | مطلوب في الـ Requirements (Section 7) — لا أساس له حالياً. |
| **Feedback / Rating** | ❌ غير موجود | مطلوب في الـ Requirements (Section 2.1, 2.8) — لا جدول ولا Endpoint. |
| **Hotel / Accommodation** | ❌ غير موجود | الـ Requirements تطلب عرض فنادق وكامبات وهوستلز — لا جدول مخصص. |
| **Transportation / Vehicle** | ❌ غير موجود | مطلوب (Section 2.7) — لا أساس. |

> [!IMPORTANT]
> **حقول ناقصة داخل الجداول الموجودة:**

- `Trip`: لا يحتوي على حقل `category` (Luxury, Honeymoon, Camp, Hostel) — حالياً يحتوي فقط على `type` (DAYUSE/STAY) وهو لا يغطي فئات البراند.
- `Trip`: لا يحتوي على حقل `itinerary` (JSONField) لبرنامج الرحلة اليومي.
- `Trip`: لا يحتوي على `max_capacity` أو `seats_available` لعرض الأماكن المتاحة.
- `TripRequest`: لا يحتوي على `total_price` أو أي إشارة مالية.
- `TripRequest`: حقلي `nationality` و `resident_country` مكررين مع `leader_nationality` و `leader_resident_country` — تشويش.

---

## 2. لوجيك الأكواد والمعرفات (Smart Identifiers & Business Logic)

### 2.1 صيغة توليد Trip Public Code

| الخاصية | التفصيل |
|---|---|
| **STAY** | `ST-{global_seq:07d}-{dest_code}` → مثال: `ST-0000007-SIWA` |
| **DAYUSE** | `DU-{global_seq:07d}-{from_code}-{to_code}` → مثال: `DU-0000004-MNS-AIN` |
| **global_seq** | يساوي `pk` (الـ Primary Key) — يتم تعيينه تلقائياً بعد أول `save()`. |
| **dest_code inference** | إذا كان فارغاً لرحلة STAY، يحاول استنتاجه من جدول `Destination` عبر `name` أو `location` أو `slug`. |

### 2.2 صيغة توليد Trip Request Codes

| الكود | الصيغة | مثال |
|---|---|---|
| **Reservation Code** | `{trip_public_code}-R{reservation_r:04d}` | `ST-0000007-SIWA-R0003` |
| **Traveler Code** | `{reservation_code}-P{traveler_p:02d}` | `ST-0000007-SIWA-R0003-P01` |
| **Lead Code** | `L-{pk:07d}` | `L-0000123` |
| **Internal Code (trip_code)** | `{traveler_code}-{lead_code}` | `ST-0000007-SIWA-R0003-P01-L-0000123` |
| **Legacy Code** | `TP-{random 6}-{random 4}` | `TP-A3F9K2-X8M1` (عبر `generate_trip_code()`) |

### 2.3 مخاطر التكرار (Collision Risks)

> [!WARNING]
> **ثغرات محتملة:**

1. **`global_seq = pk`**: آمن من التكرار لأن `pk` فريد. لكن إذا تم حذف Trip وإعادة إنشائه، ستظل الأرقام تتزايد (لا إعادة استخدام).
2. **`dest_code` inference قد يفشل**: إذا لم يتطابق اسم الرحلة مع أي `Destination.name`، سيبقى الكود `ST-...-UNK`. هذا ليس خطأً تقنياً لكنه يضعف جودة البيانات.
3. **`ReservationSequence` safe**: يستخدم `select_for_update()` وهو آمن من التكرار في التزامن (Concurrency Safe).
4. **`generate_trip_code()` (Legacy)**: يولد كود عشوائي بدون ضمان فعلي لعدم التكرار — يحاول 10 محاولات فقط. ⚠️ احتمال Collision ضعيف ولكنه ليس صفراً.
5. **`slug` Uniqueness**: الـ `slug` يُولد تلقائياً من الـ `name`، وقد يتكرر إذا تم إنشاء رحلتين بنفس الاسم. `unique=True` سيرمي خطأً DB — لكن لا يوجد handling له في الكود.

---

## 3. الواجهة الأمامية (Frontend State & UI)

### 3.1 حصر ملفات الـ CSS

| الملف | الحجم | الملاحظات |
|---|---|---|
| `src/styles.css` | **38,546 bytes** | ⚠️ **ملف ضخم جداً** — يحتوي على أنماط مختلطة لكل الصفحات والمكونات. هذا هو الملف الأساسي الذي سيتعارض مع أي CSS framework جديد. |
| `src/styles/global.css` | 5,966 bytes | ⚠️ يحتوي على **كتل مكررة** (Footer و Header مكتوبان مرتين — السطور 228–302 مكررة تماماً في 303–377). |
| `src/styles/variables.css` | 1,197 bytes | ✅ نظيف — يحتوي على CSS Custom Properties (Design Tokens). |
| `src/components/Button.css` | 1,144 bytes | ✅ محدود النطاق. |
| `src/components/TripCard.css` | 2,128 bytes | ✅ محدود النطاق. |
| `src/components/Tag.css` | 265 bytes | ✅ محدود النطاق. |
| `trip_requests/admin.css` | 767 bytes | ✅ خاص بـ Django Admin فقط. |

> [!CAUTION]
> **التعارض مع Tailwind v4 + Shadcn:**
> - **لا يوجد Tailwind مثبت حالياً** — لا في `package.json`، ولا في أي ملف تكوين، ولا في أي JSX class.
> - الانتقال إلى Tailwind v4 يتطلب **إعادة كتابة** كاملة للـ CSS أو اعتماد نهج تدريجي (Layered Migration) لمنع التعارض.
> - ملف `src/styles.css` (38KB) هو العقبة الرئيسية — يحتوي أنماط مختلطة بأسماء classes يدوية.

### 3.2 تحليل الـ Forms والـ Dynamic Fields

- **نموذج الحجز `TripReservationPage.jsx` (27KB)**: يحتوي منطق متقدم — يدعم حقول ديناميكية بناءً على الجنسية (بطاقة مصرية vs جواز سفر أجنبي)، والأزواج (couples_answer)، والأطفال (children_details). المنطق موجود ومطبق فعلياً.
- **نموذج `CustomizeYourTripPage.jsx` (82KB)**: ⚠️ **أكبر ملف في المشروع** — يحتاج مراجعة لفهم ما إذا كان يطبق نفس المنطق الديناميكي أم لا.
- **`formUtils.js`**: يحتوي `maskIdForReview()` للتعتيم البصري فقط (UI masking) — لا يُطبق تشفير حقيقي.
- **Dial Codes / Nationality / Country Lists**: مكتوبة كـ static arrays في `formUtils.js` (12 دولة فقط) — قد تحتاج توسيع.

### 3.3 استخدام البيانات الوهمية (Hardcoded Data)

- **`src/data/trips.js`**: يحتوي على **4 رحلات ثابتة** بأسماء وأسعار مكتوبة يدوياً. لكن **لا يتم import-ها في أي صفحة حالياً** — يبدو أنها بقايا (Legacy) من مرحلة سابقة. ✅ آمنة للحذف.
- **الصفحات الأخرى**: `ChooseYourTripPage.jsx` (12KB) و `TripDetailsPage.jsx` (26KB) — تحتاج فحصاً لمعرفة هل تستخدم `getTrips()` من `apiClient.js` أم لا.

---

## 4. حالة الـ CRM ولوحات التحكم (Operations & CRM Status)

### 4.1 الشاشات المبنية فعلياً

| الشاشة | الملف | الحالة |
|---|---|---|
| **CRM Login** | `CRMLoginPage.jsx` (10KB) | ✅ مبنية — تستخدم JWT (`/api/auth/token/`) |
| **CRM Leads** | `CRMLeadsPage.jsx` (45KB) | ✅ مبنية بشكل شامل — تعرض قائمة الـ Leads مع فلاتر (status, priority, destination) وبحث وترتيب + تفاصيل Lead + إضافة ملاحظات + تغيير الحالة والأولوية. |
| **Django Admin** | `trip_requests/admin.py` | ✅ مبنية — واجهة إدارة كاملة مع Inline Notes وBulk Actions وFieldsets منظمة. |

### 4.2 إدخال حجز يدوي (Manual Booking)

> [!WARNING]
> **لا يوجد دعم فعلي لإدخال حجز يدوي من لوحة الموظفين.**

- الـ CRM يعرض ويعدل الطلبات الحالية فقط (PATCH لتغيير status/priority/tags).
- لا يوجد زر "إنشاء حجز جديد" في `CRMLeadsPage.jsx`.
- الطريقة الوحيدة حالياً لإدخال حجز يدوي هي عبر **Django Admin** مباشرة.

### 4.3 فصل الصلاحيات (Permissions)

| النوع | الآلية | التفاصيل |
|---|---|---|
| **Public API** | `AllowAny` | جميع endpoints العميل مفتوحة (trips, destinations, trip-requests POST). |
| **CRM API** | `IsCRMUser` | يتطلب `is_authenticated` + (`is_staff` OR `is_superuser`). |
| **Django Admin** | Built-in | `is_staff` = دخول. `is_superuser` = كل الصلاحيات. |

> [!IMPORTANT]
> **ما ينقصنا لتأمين لوحة العمليات:**
> 1. **لا يوجد RBAC (Role-Based Access Control)** — الصلاحيات ثنائية فقط (staff/superuser). لا توجد Groups أو Permissions مخصصة (مثلاً: Sales فقط يرى CRM، Finance يرى الإيرادات).
> 2. **لا يوجد Row-Level Security** — أي موظف staff يرى **كل** الـ Leads. لا يوجد تقييد بناءً على `assigned_to`.
> 3. **لا يوجد Audit Trail** — لا تسجيل لمن عدّل حالة Lead أو متى.

---

## 5. ربط الـ APIs وتدفق البيانات (API Connectivity & Orphan Endpoints)

### 5.1 خريطة الربط (API ↔ Frontend)

| Django Endpoint | الملف في Frontend | مربوط؟ |
|---|---|---|
| `GET /api/trips/` | `apiClient.js → getTrips()` | ✅ |
| `GET /api/trips/{identifier}/` | `apiClient.js → getTripBySlug()` | ✅ |
| `GET /api/destinations/` | ❌ لا يوجد دالة | ❌ **Orphan** |
| `GET /api/destinations/{slug}/` | ❌ لا يوجد دالة | ❌ **Orphan** |
| `GET /api/destinations/{slug}/activities/` | `apiClient.js → getDestinationActivities()` | ✅ |
| `POST /api/custom-trip/` | `apiClient.js → submitCustomTrip()` | ⚠️ مربوط لكن الـ Backend View **لا تحفظ البيانات** (Stub) |
| `POST /api/trip-requests/` | `apiClient.js → submitTripRequest()` | ✅ |
| `GET /api/trip-requests/generate-code/` | `apiClient.js → generateTripRequestCode()` | ✅ |
| `GET /api/crm/trip-requests/` | `CRMLeadsPage.jsx → authFetch()` | ✅ |
| `GET /api/crm/trip-requests/{id}/` | `CRMLeadsPage.jsx → authFetch()` | ✅ |
| `PATCH /api/crm/trip-requests/{id}/` | `CRMLeadsPage.jsx → authFetch()` | ✅ |
| `GET+POST /api/crm/trip-requests/{id}/notes/` | `CRMLeadsPage.jsx → authFetch()` | ✅ |
| `POST /api/auth/token/` | `CRMLoginPage.jsx` | ✅ |
| `POST /api/auth/token/refresh/` | `crmAuth.js → refreshAccessToken()` | ✅ |

### 5.2 Orphan Endpoints (Backend لا يستخدمه Frontend)

1. **`GET /api/destinations/`** — لا يتم استدعاؤها من أي صفحة.
2. **`GET /api/destinations/{slug}/`** — لا يتم استدعاؤها من أي صفحة (رغم وجود `DestinationPage.jsx`).

### 5.3 شاشات تعتمد على بيانات غير API

- **`src/data/trips.js`** — ملف يحتوي 4 رحلات ثابتة. **لكنه غير مُستخدم** في أي import فعلي حالياً. آمن كـ Legacy file.
- **الصفحات الجانبية** (`AboutPage`, `VisaPage`, `TransportationPage`, `ActivitiesPage`, `TicketFlightPage`, `SupportTeamPage`, `BeAmbassadorPage`, `BeOneOfUsPage`, `CollaborateWithUsPage`, `WorkWithUsPage`): معظمها صفحات **هيكلية فارغة** (233–273 bytes لكل واحدة). لا تحتوي على محتوى أو logic. هي Placeholders.

### 5.4 تحويل البيانات (snake_case ↔ camelCase)

- ✅ `src/utils/caseConverter.js` — يحتوي محول عام ثنائي الاتجاه (`toSnakeDeep` / `toCamelDeep`). مبني بشكل سليم ويتعامل مع حالات خاصة (FormData, Blob, etc.).
- ✅ `src/utils/tripRequestMapper.js` — يقبل أسماء camelCase أو snake_case ويرسل snake_case للـ Backend.
- ✅ `TripRequestCreateSerializer` — يقبل كلا الصيغتين ويوحدهما قبل الحفظ.
- ⚠️ **لا يوجد Interceptor عام** في `apiClient.js` يحول Responses من snake_case إلى camelCase تلقائياً — التحويل يتم يدوياً في كل مكان.
- ⚠️ `TripSerializer` يخلط بين الصيغتين: يُرسل `priceFrom` (camelCase) و `public_code` (snake_case) و `dest_code` (snake_case) في نفس الـ Response. **هذا يكسر أي Converter عام في الـ Frontend**.

---

## 6. الأمان (Security)

### 6.1 Data Masking & Encryption

| الحقل | الحالة | التحليل |
|---|---|---|
| `leader_identity_last4` | ❌ **Plain text** في الـ DB | لا يوجد تشفير. الحقل يخزن آخر 4 أرقام من البطاقة/الجواز كنص عادي. |
| `maskIdForReview()` في `formUtils.js` | ⚠️ **UI mask فقط** | يعتّم العرض بصرياً لكن البيانات الفعلية مكشوفة في الـ API Response. |
| `leader_phone` / `leader_whatsapp` | ❌ **Plain text** | مكشوفة بالكامل في الـ CRM API. |

### 6.2 API Keys & Secrets

- ✅ **لا توجد API Keys مكشوفة** في الكود المصدري.
- ⚠️ `SECRET_KEY` في `settings.py` مكتوب بشكل ثابت (hardcoded) — يجب نقله لـ `.env`.
- ⚠️ **كلمة مرور الـ DB** مكتوبة (hardcoded) في `settings.py`: `"PASSWORD": "123"`.
- ⚠️ `SIMPLE_JWT` مكتوب مرتين في `settings.py` (L123-126 و L129-132) — تكرار.

### 6.3 ثغرات أمنية أخرى

- ✅ Rate Limiting مطبق (30 req/min anon, 300 req/min user).
- ✅ CORS محدد على `localhost:5173` فقط.
- ⚠️ لا يوجد `CSRF_TRUSTED_ORIGINS` — قد يسبب مشاكل في الـ Production.
- ⚠️ `ALLOWED_HOSTS = []` — يجب تعبئته قبل الـ Production.

---

## 7. التحليل الإبداعي والتوقعي (Actionable Next Steps)

### 7.1 حالات حدية منسية (Edge Cases)

1. **رحلتان بنفس الاسم**: `slug` يُولد من `name` — إذا أُنشئت رحلتان "Dahab 5N" ستحدث IntegrityError على `slug` بدون handling.
2. **عميل بدون رقم واتس آب**: النظام يسمح بحفظ `leader_whatsapp` فارغاً — لكن الـ PRD يعتمد على WhatsApp كقناة أساسية. لا يوجد تنبيه أو validation.
3. **أطفال بدون تفاصيل**: `children_count > 0` لكن `children_details` فارغ — الـ Backend لا يُلزم بتطابقهما.
4. **عميل متكرر**: لا يوجد كشف تكرار — نفس الشخص يمكنه الحجز 10 مرات بدون ربط بين الحجوزات.
5. **`LegacyCustomTripView`**: يرد بـ 201 لكن **لا يحفظ شيئاً** — العميل يظن أن طلبه وصل لكنه ضاع.
6. **Expired Token without Refresh**: إذا انتهى الـ Refresh Token، الـ `authFetch` يعمل `logout()` صامتاً — لا يظهر رسالة للمستخدم.

### 7.2 خطة أول 5 تعديلات (Immediate Actionable Plan)

#### Edit 1: إصلاح `LegacyCustomTripView` (BE1)
- **المشكلة**: الـ View ترد 201 بدون حفظ — بيانات مفقودة.
- **الحل**: ربطها بـ `LegacyCustomTrip.objects.create(payload=request.data)` أو توجيهها لـ `TripRequestCreateView`.
- **الخطر**: **منخفض** — لا يكسر شيئاً.
- **الملفات**: `trips/views.py`

#### Edit 2: نقل الأسرار من `settings.py` إلى `.env` (BE1/Security)
- **المشكلة**: `SECRET_KEY` و `DB PASSWORD` مكتوبان في الكود.
- **الحل**: استخدام `python-dotenv` (مثبت بالفعل) لقراءة `os.environ` + حذف `SIMPLE_JWT` المكرر.
- **الخطر**: **متوسط** — يتطلب تنسيق مع زياد لتحديث `.env`.
- **الملفات**: `djconfig/settings.py`, `.env.example`

#### Edit 3: توحيد أسماء حقول `TripSerializer` (BE1)
- **المشكلة**: الـ Serializer يُرسل خليط snake/camel (`priceFrom` + `public_code`) مما يكسر أي Converter عام.
- **الحل**: جعل كل الحقول snake_case في الـ Response، وترك الـ Frontend Converter يتعامل مع التحويل.
- **الخطر**: **متوسط-عالي** — يتطلب تحديث الـ Frontend بالتوازي.
- **الملفات**: `trips/serializers.py`, `trips/models.py` (rename `priceFrom` to `price_from`)

#### Edit 4: تنظيف `global.css` وحذف التكرار (FE1)
- **المشكلة**: Footer و Header مكرران بالكامل (~75 سطر مكرر).
- **الحل**: حذف الكتلة المكررة (L303–L377).
- **الخطر**: **منخفض** — لا يغير سلوكاً.
- **الملفات**: `src/styles/global.css`

#### Edit 5: حذف `src/data/trips.js` (FE1)
- **المشكلة**: ملف بيانات وهمية قديم لا يُستخدم في أي مكان.
- **الحل**: حذف الملف لتقليل الارتباك.
- **الخطر**: **منخفض جداً** — تم التحقق من عدم وجود أي import.
- **الملفات**: `src/data/trips.js`

---

## ملحق: جدول كامل لـ Backend Endpoints

| # | Method | URL | Permission | View Class | ملاحظات |
|---|---|---|---|---|---|
| 1 | GET | `/api/trips/` | AllowAny | TripsListView | قائمة الرحلات |
| 2 | GET | `/api/trips/{identifier}/` | AllowAny | TripsDetailView | تفاصيل بـ slug أو public_code |
| 3 | GET | `/api/destinations/` | AllowAny | DestinationsListView | قائمة الوجهات |
| 4 | GET | `/api/destinations/{slug}/` | AllowAny | DestinationDetailView | تفاصيل وجهة |
| 5 | GET | `/api/destinations/{slug}/activities/` | AllowAny | DestinationActivitiesView | أنشطة وجهة |
| 6 | POST | `/api/custom-trip/` | AllowAny | LegacyCustomTripView | ⚠️ **STUB — لا يحفظ** |
| 7 | POST | `/api/trip-requests/` | AllowAny | TripRequestCreateView | إنشاء طلب حجز |
| 8 | GET | `/api/trip-requests/generate-code/` | AllowAny | TripRequestGenerateCodeView | توليد كود Legacy |
| 9 | GET | `/api/crm/trip-requests/` | IsCRMUser | TripRequestCRMListView | CRM: قائمة |
| 10 | GET/PATCH | `/api/crm/trip-requests/{id}/` | IsCRMUser | TripRequestCRMDetailUpdateView | CRM: تفاصيل + تعديل |
| 11 | GET/POST | `/api/crm/trip-requests/{id}/notes/` | IsCRMUser | TripRequestNoteListCreateView | CRM: ملاحظات |
| 12 | POST | `/api/auth/token/` | AllowAny | TokenObtainPairView | JWT Login |
| 13 | POST | `/api/auth/token/refresh/` | AllowAny | TokenRefreshView | JWT Refresh |

</div>
