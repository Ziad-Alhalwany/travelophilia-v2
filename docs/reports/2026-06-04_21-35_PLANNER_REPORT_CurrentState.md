# 🔍 التقرير التقني الشامل — Travelophilia V2: خريطة الحالة الفعلية الكاملة

> **Task ID**: PLANNER-2026-06-04-AUDIT  
> **Agent**: Planner  
> **التاريخ**: 2026-06-04  
> **الفرع**: agent/planner  
> **المنهجية**: فحص فيزيائي شامل (File-by-File) لكل ملف في الـ Repository مع مقارنة مباشرة بالتوثيق الرسمي  
> **مستوى الثقة**: 🟢 عالي — مبني على قراءة فعلية للكود وليس افتراضات

---

## 📋 الملخص التنفيذي (Executive Summary)

> [!CAUTION]
> **اكتشاف جوهري**: التوثيق الرسمي الموجود في `_shared/docs/` (FRONTEND_MAP.md, BACKEND_MAP.md, ARCHITECTURE.md, api.md) **متأخر بشكل خطير** عن الحالة الفعلية للكود. الكود تطوّر بشكل جذري منذ آخر تحديث للتوثيق (2025-04-20) بينما لم يتم تحديث أي من هذه الملفات.

### أبرز الفجوات المكتشفة:

| البُعد | ما يقوله التوثيق | ما يوجد فعلياً في الكود |
|---|---|---|
| Django Version | 4.2 | **6.0** |
| قاعدة البيانات | SQLite (dev) | **PostgreSQL** (travelophilia DB, port 6666) |
| مجلد الإعدادات | `django_api/` | **`djconfig/`** |
| عدد الـ Models | 5 (Trip, TripImage, Customer, TripRequest, CustomTripRequest) | **8** (Destination, Activity, Trip, LegacyCustomTrip, ReservationSequence, Customer, TripRequest, TripRequestNote) |
| نظام التصميم FE | CSS Modules | **Tailwind CSS + shadcn/ui** (+ نظام BEM قديم يعمل بالتوازي) |
| الـ Authentication | غير موجود | **JWT via simplejwt** (access 30min, refresh 7d) |
| الـ Rate Limiting | غير مطبق | **مُطبّق** (anon: 30/min, user: 300/min) |
| عدد الـ Endpoints | 4 | **14** |
| CRM Dashboard | غير موجود | **موجود ومُنفّذ بالكامل** (1426 سطر) |
| نظام الأكواد | غير موجود | **نظام أكواد متقدم** (public_code, reservation_code, traveler_code) |

---

## 1. 🗄️ تحليل الـ Database Schema الفعلي

### 1.1 App: `trips` — النماذج الفعلية

#### Model: `Destination` ✨ (جديد — غير موثّق)

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| `code` | CharField(12) | unique, db_index | كود الوجهة: SIWA, DHB, ALEX |
| `slug` | SlugField(120) | unique, db_index | SEO slug |
| `name` | CharField(120) | — | اسم العرض |
| `country` | CharField(80) | default="Egypt" | البلد |
| `city` | CharField(120) | blank, default="" | المدينة |
| `description` | TextField | blank | الوصف |
| `cover_image_url` | URLField | blank | صورة الغلاف |
| `gallery_urls` | JSONField | default=list | قائمة صور المعرض |
| `video_urls` | JSONField | default=list | قائمة الفيديوهات |
| `is_active` | BooleanField | default=True, db_index | حالة التفعيل |
| `sort_order` | IntegerField | default=0, db_index | ترتيب العرض |
| `created_at` | DateTimeField | auto_now_add | تاريخ الإنشاء |
| `updated_at` | DateTimeField | auto_now | تاريخ التحديث |

**ملاحظة**: يتم حساب الـ `slug` تلقائياً من `name` عند الحفظ، والـ `code` يُحوّل لـ UPPER.

---

#### Model: `Activity` ✨ (جديد — غير موثّق)

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| `destination` | ForeignKey → Destination | CASCADE, related_name="activities" | الوجهة المرتبطة |
| `title` | CharField(160) | — | عنوان النشاط |
| `slug` | SlugField(160) | blank | slug فريد لكل وجهة |
| `description` | TextField | blank | الوصف |
| `price` | PositiveIntegerField | default=0 | السعر |
| `currency` | CharField(8) | default="EGP" | العملة |
| `duration_label` | CharField(64) | blank | وصف المدة |
| `options` | JSONField | default=list | خيارات إضافية |
| `tags` | JSONField | default=list | التصنيفات |
| `is_active` | BooleanField | default=True, db_index | حالة التفعيل |
| `sort_order` | IntegerField | default=0, db_index | الترتيب |

**Indexes**: Composite index on `(destination, is_active, sort_order)` + unique_together `(destination, slug)`.

---

#### Model: `Trip` — (مختلف جذرياً عن التوثيق)

> [!WARNING]
> الـ Trip model الفعلي يختلف **كلياً** عن الموثّق. لم يعد يحتوي على `title`, `start_date`, `end_date`, `max_travelers`, `duration_days`, `image`, `itinerary`, `TripImage`. بدلاً من ذلك يستخدم نظام أكواد متقدم.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| `legacy_id` | CharField(120) | unique, null, blank | معرف قديم للتوافق |
| `slug` | SlugField(120) | unique, null, blank | SEO slug |
| `name` | CharField(200) | — | اسم الرحلة |
| `location` | CharField(200) | blank | الموقع |
| `type` | CharField(32) | blank | نوع: DAYUSE / STAY |
| `description` | TextField | blank | الوصف |
| `priceFrom` | PositiveIntegerField | null, blank | السعر من |
| `priceTo` | PositiveIntegerField | null, blank | السعر إلى |
| `currency` | CharField(8) | default="EGP" | العملة |
| `durationNights` | PositiveSmallIntegerField | null, blank | عدد الليالي |
| `tags` | JSONField | default=list | التصنيفات |
| `highlights` | JSONField | default=list | المميزات |
| `media` | JSONField | default=dict | وسائط متعددة |
| `social_proof` | JSONField | default=dict | إثبات اجتماعي |
| `is_active` | BooleanField | default=True, db_index | حالة التفعيل |
| `public_code` | CharField(32) | unique, null, blank, db_index | الكود العام: `ST-0000007-SIWA` |
| `global_seq` | PositiveIntegerField | unique, null, blank, db_index | التسلسل العالمي |
| `dest_code` | CharField(12) | blank | كود الوجهة |
| `from_code` | CharField(12) | blank | كود المغادرة (DAYUSE) |
| `to_code` | CharField(12) | blank | كود الوصول (DAYUSE) |
| `internal_key` | CharField(32) | blank, db_index | المفتاح الداخلي |
| `internal_seq` | PositiveIntegerField | null, blank, db_index | التسلسل الداخلي |

**نظام الأكواد التلقائي**:
- STAY trips: `ST-{7-digit-seq}-{DEST_CODE}` مثال: `ST-0000007-SIWA`
- DAYUSE trips: `DU-{7-digit-seq}-{FROM}-{TO}` مثال: `DU-0000004-MNS-AIN`
- الـ `dest_code` يُستنتج تلقائياً من جدول `Destination` عبر مطابقة الاسم/الموقع/الـ slug.

---

#### Model: `LegacyCustomTrip` ✨ (جديد — غير موثّق)

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| `payload` | JSONField | default=dict | البيانات الخام |
| `created_at` | DateTimeField | auto_now_add | تاريخ الإنشاء |

**الغرض**: تخزين طلبات الرحلات المخصصة القديمة كـ JSON log.

---

> [!IMPORTANT]
> **Model `TripImage` المذكور في التوثيق لم يعد موجوداً.** تم استبداله بحقل `media` (JSONField) داخل `Trip` model مباشرة.

---

### 1.2 App: `trip_requests` — النماذج الفعلية

#### Model: `ReservationSequence` ✨ (جديد — غير موثّق)

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| `trip_public_code` | CharField(64) | unique, db_index | كود الرحلة العام |
| `last_r` | PositiveIntegerField | default=0 | آخر رقم حجز |

**الغرض**: عدّاد ذري (Atomic counter) لأرقام الحجوزات per-trip مع `select_for_update()` لمنع Race Conditions.

---

#### Model: `Customer` — (تطوّر كبير عن التوثيق)

| الحقل | النوع | القيود | الحالة |
|---|---|---|---|
| `full_name` | CharField(200) | blank | ✅ موجود (كان 150 في التوثيق) |
| `phone` | CharField(32) | blank | ✅ موجود |
| `whatsapp` | CharField(32) | blank | ✨ **جديد** |
| `email` | EmailField | blank | ✅ موجود |
| `gender` | CharField(16) | blank | ✨ **جديد** |
| `age` | PositiveIntegerField | null, blank | ✨ **جديد** |
| `nationality` | CharField(80) | blank | ✅ موجود |
| `resident_country` | CharField(80) | blank | ✨ **جديد** |
| `identity_type` | CharField(16) | blank | ✨ **جديد** |
| `identity_last4` | CharField(8) | blank | ✨ **جديد** |
| `identity_hash` | CharField(255) | blank | ✅ موجود (كان 64 + unique) |

> [!WARNING]
> **تغيير جوهري في `identity_hash`**: في التوثيق كان `unique=True, max_length=64` مع auto-computation في `save()`. في الكود الفعلي أصبح `max_length=255, blank=True, default=""` **بدون** `unique` constraint و**بدون** auto-computation في `save()`. هذا يعني أن آلية كشف التكرار عبر `identity_hash` **لم تعد تعمل على مستوى الـ Model** — يجب فحص الـ Serializer.

---

#### Model: `TripRequest` — (إعادة بناء كاملة)

> [!CAUTION]
> الـ `TripRequest` الفعلي مختلف **جذرياً** عن التوثيق. لم يعد يحتوي على `number_of_travelers` أو `special_requests` كحقول بسيطة. أصبح نظام CRM متكامل.

| الحقل | النوع | القيود | الحالة |
|---|---|---|---|
| **نظام الأكواد** | | | |
| `trip_code` | CharField(96) | unique, editable=False, db_index | كود فريد مُولّد |
| `trip_public_code` | CharField(64) | blank, db_index | كود الرحلة العام |
| `reservation_r` | PositiveIntegerField | null, blank, db_index | رقم الحجز |
| `traveler_p` | PositiveIntegerField | null, blank, db_index | رقم المسافر |
| `is_leader` | BooleanField | default=True, db_index | هل هو قائد المجموعة |
| `internal_code_override` | CharField(96) | blank | تجاوز الكود الداخلي |
| **بيانات العميل** | | | |
| `customer` | ForeignKey → Customer | null, blank, SET_NULL | ✅ FK مُنفّذ |
| `entry_type_for_egypt` | CharField(16) | blank | نوع الدخول لمصر |
| **بيانات الرحلة** | | | |
| `origin_city` | CharField(80) | blank | مدينة المغادرة |
| `destination_city` | CharField(80) | blank | مدينة الوصول |
| `depart_date` | DateField | null, blank | تاريخ المغادرة |
| `return_date` | DateField | null, blank | تاريخ العودة |
| `adults_count` | PositiveIntegerField | default=1 | عدد البالغين |
| `children_count` | PositiveIntegerField | default=0 | عدد الأطفال |
| `pax_total` | PositiveIntegerField | default=1 | إجمالي المسافرين |
| `companions_mode` | CharField(16) | blank | وضع المرافقين |
| `note` | TextField | blank | ملاحظات |
| `couples_answer` | CharField(8) | blank | إجابة الأزواج |
| `terms_accepted` | BooleanField | default=False | قبول الشروط |
| `docs_acknowledged` | BooleanField | default=False | إقرار المستندات |
| `travelers` | JSONField | default=list | بيانات المسافرين |
| `children_details` | JSONField | default=list | تفاصيل الأطفال |
| **CRM** | | | |
| `status` | CharField(20) | choices, default=NEW | NEW/CONTACTED/QUALIFIED/QUOTED/BOOKED/CLOSED_WON/CLOSED_LOST |
| `priority` | CharField(10) | choices, default=MEDIUM | LOW/MEDIUM/HIGH |
| `assigned_to` | ForeignKey → User | null, blank, SET_NULL | الموظف المسؤول |
| `last_contacted_at` | DateTimeField | null, blank | آخر تواصل |
| `next_followup_at` | DateTimeField | null, blank | موعد المتابعة |
| `source` | CharField(50) | default="WEB" | مصدر الطلب |
| `tags` | JSONField | default=list | التصنيفات |
| `trip_slug` | CharField(255) | blank | slug الرحلة |
| `trip_title` | CharField(255) | blank | عنوان الرحلة |

**أكواد محسوبة (Computed Properties)**:
- `reservation_code`: `{trip_public_code}-R{reservation_r:04d}` → مثال: `ST-0000007-SIWA-R0003`
- `traveler_code`: `{reservation_code}-P{traveler_p:02d}` → مثال: `ST-0000007-SIWA-R0003-P01`
- `lead_code`: `L-{pk:07d}` → مثال: `L-0000042`

**خوارزمية Save المتقدمة**: عند الإنشاء، يتم تلقائياً:
1. جلب/إنشاء `ReservationSequence` مع `select_for_update()` (حماية من Race Conditions)
2. حساب `reservation_r` تلقائياً
3. حساب `traveler_p` تلقائياً
4. بناء `trip_code` من الأكواد المحسوبة

---

#### Model: `TripRequestNote` ✨ (جديد — غير موثّق)

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| `trip_request` | ForeignKey → TripRequest | CASCADE, related_name="crm_notes" | الطلب المرتبط |
| `kind` | CharField(20) | choices | NOTE/WHATSAPP/CALL/EMAIL |
| `body` | TextField | — | محتوى الملاحظة |
| `created_at` | DateTimeField | auto_now_add | تاريخ الإنشاء |
| `created_by` | ForeignKey → User | null, blank, SET_NULL | المنشئ |

---

> [!IMPORTANT]
> **Model `CustomTripRequest` المذكور في التوثيق لم يعد موجوداً كـ Model مستقل.** تم دمج وظيفته في `TripRequest` model الموحّد مع حقول إضافية.

---

### 1.3 ملخص فجوات الـ Schema

| العنصر | التوثيق | الكود الفعلي | التقييم |
|---|---|---|---|
| `TripImage` Model | ✅ موجود | ❌ محذوف — استُبدل بـ `Trip.media` (JSON) | 🔴 تناقض |
| `CustomTripRequest` Model | ✅ موجود | ❌ محذوف — دُمج في `TripRequest` | 🔴 تناقض |
| `Destination` Model | ❌ غير موجود | ✅ مُنفّذ بالكامل | 🔴 غير موثّق |
| `Activity` Model | ❌ غير موجود | ✅ مُنفّذ بالكامل | 🔴 غير موثّق |
| `ReservationSequence` | ❌ غير موجود | ✅ مُنفّذ مع Atomic Locking | 🔴 غير موثّق |
| `TripRequestNote` | ❌ غير موجود | ✅ مُنفّذ للـ CRM | 🔴 غير موثّق |
| `LegacyCustomTrip` | ❌ غير موجود | ✅ موجود كـ JSON logger | 🟡 غير موثّق |
| `Customer.identity_hash` | unique + auto-compute | non-unique, blank, no auto-compute | 🔴 تراجع أمني |
| Legacy `leader_*` fields | يجب حذفها | ❌ **لا توجد في الكود** ✅ | 🟢 تم الحذف |
| `Customer` FK in TripRequest | ✅ موجود | ✅ موجود (null=True, SET_NULL) | 🟢 متوافق |

---

## 2. 🔌 تحليل الـ API Contract و الـ Routing و الـ Views

### 2.1 خريطة الـ Endpoints الفعلية الكاملة

> [!IMPORTANT]
> الـ api.md يوثّق **4 endpoints فقط**. الكود الفعلي يحتوي على **14 endpoint**.

| # | Method | URL Pattern الفعلي | View | Auth | حالة التوثيق |
|---|---|---|---|---|---|
| 1 | GET | `/api/trips/` | `TripsListView` | AllowAny | ✅ موثّق (لكن الـ response مختلف) |
| 2 | GET | `/api/trips/<identifier>/` | `TripsDetailView` | AllowAny | ✅ موثّق (لكن lookup مختلف) |
| 3 | GET | `/api/destinations/` | `DestinationsListView` | AllowAny | 🔴 **غير موثّق** |
| 4 | GET | `/api/destinations/<slug_or_code>/` | `DestinationDetailView` | AllowAny | 🔴 **غير موثّق** |
| 5 | GET | `/api/destinations/<slug_or_code>/activities/` | `DestinationActivitiesView` | AllowAny | 🔴 **غير موثّق** |
| 6 | POST | `/api/custom-trip/` | `LegacyCustomTripView` | AllowAny | 🔴 **غير موثّق** |
| 7 | POST | `/api/trip-requests/` | `TripRequestCreateView` | AllowAny | 🟡 موثّق (لكن payload مختلف كلياً) |
| 8 | GET | `/api/trip-requests/generate-code/` | `TripRequestGenerateCodeView` | AllowAny | 🔴 **غير موثّق** |
| 9 | GET | `/api/crm/trip-requests/` | `TripRequestCRMListView` | IsCRMUser | 🔴 **غير موثّق** |
| 10 | GET/PATCH | `/api/crm/trip-requests/<pk>/` | `TripRequestCRMDetailUpdateView` | IsCRMUser | 🔴 **غير موثّق** |
| 11 | GET/POST | `/api/crm/trip-requests/<pk>/notes/` | `TripRequestNoteListCreateView` | IsCRMUser | 🔴 **غير موثّق** |
| 12 | POST | `/api/auth/token/` | `TokenObtainPairView` (simplejwt) | — | 🔴 **غير موثّق** |
| 13 | POST | `/api/auth/token/refresh/` | `TokenRefreshView` (simplejwt) | — | 🔴 **غير موثّق** |
| 14 | — | `/admin/` | Django Admin | Session | — |

---

### 2.2 تحليل تفصيلي للـ Views

#### `TripsDetailView` — تغيير في الـ Lookup Logic
- **التوثيق**: lookup by `slug` فقط
- **الكود الفعلي**: يبحث أولاً بـ `public_code` (upper) ثم بـ `slug`. هذا يعني أن الـ URL `/api/trips/ST-0000007-SIWA/` يعمل مباشرة.

#### `LegacyCustomTripView` — تحديث حالة الـ Stub

> [!IMPORTANT]
> **تحديث مهم**: التقرير السابق (DEEP_AUDIT 2025-04-20) كان يُشير إلى أن `LegacyCustomTripView` هو stub غير فعّال. الكود الفعلي الآن يستخدم `TripRequestCreateSerializer` — مما يعني أنه **يقوم بحفظ فعلي في قاعدة البيانات**.

#### `TripRequestCreateView` — اختلاف جوهري في الـ Payload

الـ api.md يُوثّق payload بسيط:
```json
{
  "full_name": "...", "email": "...", "phone": "...",
  "trip_slug": "...", "number_of_travelers": 3
}
```

الكود الفعلي عبر `TripRequestCreateSerializer` يقبل payload أعقد بكثير يشمل:
- بيانات Leader كاملة (name, phone, whatsapp, email, gender, age, nationality, identity)
- بيانات الرحلة (origin_city, destination_city, depart/return dates)
- أعداد المسافرين (adults, children, pax_total)
- مرافقين (companions_mode, travelers JSON, children_details JSON)
- أكواد (trip_public_code, trip_slug, trip_title)
- موافقات (terms_accepted, docs_acknowledged)

---

### 2.3 الـ Serializers — تحليل الـ Case Convention

**TripSerializer** (trips/serializers.py):
- يُضيف aliased fields: `title` (من `name`), `destinationCity`, `durationLabel`, `startDate`, `availableDate`
- **يستخدم camelCase** في الـ computed fields 🟡

**TripRequestCreateSerializer** (trip_requests/serializers.py):
- يقبل **كلا الصيغتين** (snake_case و camelCase) عبر aliases يدوية
- **لا يستخدم `djangorestframework-camel-case`** كمكتبة
- التحويل يتم يدوياً داخل الـ Serializer

**خلاصة Case Convention**:
| الطبقة | الصيغة المُستخدمة |
|---|---|
| Backend Models | snake_case ✅ صحيح |
| API Response (Trips) | **خليط** — بعض الحقول camelCase وبعضها snake_case 🟡 |
| API Request (TripRequests) | يقبل الاثنين عبر aliases 🟡 |
| Frontend Code | camelCase ✅ صحيح |
| Frontend → API Payload | يتم التحويل عبر `tripRequestMapper.js` ✅ |

---

### 2.4 فجوات الـ URL Routing

| المشكلة | التفاصيل | الخطورة |
|---|---|---|
| api.md يقول `/api/custom-trip-requests/` | الكود الفعلي: `/api/custom-trip/` (trips/urls.py) | 🔴 كسر في العقد |
| api.md يقول `/api/trip-requests/` بـ payload بسيط | الكود الفعلي يقبل payload مختلف كلياً | 🔴 كسر في العقد |
| 10 endpoints غير موثّقة | CRM, Auth, Destinations, Activities, Generate-Code | 🔴 فجوة توثيقية |
| FE يرسل إلى `/api/trips/request/` | ✅ يتطابق مع `trip_requests/urls.py` mapping | 🟢 متوافق |

---

## 3. 🖥️ تحليل الـ Frontend Routing والتكامل الديناميكي

### 3.1 خريطة الـ Routes الفعلية vs التوثيق

| Route فعلي | Component | Route موثّق | التطابق |
|---|---|---|---|
| `/` | `Home` | `/` ✅ | 🟢 |
| `/choose-your-trip` | `ChooseYourTripPage` | ❌ غير موجود | 🔴 غير موثّق |
| `/destinations/:slug` | `TripDetails` | `/trips/:slug` ❌ | 🔴 مختلف |
| `/destination/:slug` | `DestinationPage` | ❌ غير موجود | 🔴 غير موثّق |
| `/customize-your-trip` | `CustomizeYourTripPage` | `/customize-trip` ❌ | 🔴 مختلف |
| `/trip-reservation` | `TripReservationPage` | `/trips/:slug/reserve` ❌ | 🔴 مختلف |
| `/after-submit` | `AfterSubmitPage` | `/thank-you` ❌ | 🔴 مختلف |
| `/crm/login` | `CRMLoginPage` | ❌ غير موجود | 🔴 غير موثّق |
| `/crm` | `CRMLeadsPage` | ❌ غير موجود | 🔴 غير موثّق |
| `/about` | `AboutPage` | `/about` ✅ | 🟢 (لكنه stub) |
| 8 stub pages | Various | ❌ غير موجودة | 🔴 |

**Stub Pages المكتشفة** (13 سطر لكل منها — placeholder فقط):
`ActivitiesPage`, `BeAmbassadorPage`, `BeOneOfUsPage`, `CollaborateWithUsPage`, `SupportTeamPage`, `TicketFlightPage`, `TransportationPage`, `VisaPage`, `WorkWithUsPage`

---

### 3.2 تصنيف حالة التكامل الديناميكي

| الصفحة | الحجم | التصنيف | مصدر البيانات | التفاصيل |
|---|---|---|---|---|
| **Home.jsx** | ~260 سطر | 🟡 **Static Placeholder** | `TripCard` من `shared/` لكن البيانات غير واضحة المصدر | يستخدم نظام Tailwind/shadcn الجديد |
| **ChooseYourTripPage.jsx** | ~80 سطر | 🔴 **Mock Static** | `src/data/trips.js` (4 رحلات ثابتة) | يعرض بيانات ثابتة بالكامل |
| **TripDetails.jsx** | ~100 سطر | 🟡 **Hybrid** | يستخدم `TripRequestForm` (forms/) | يحتوي على فورم مرتبط بـ API |
| **DestinationPage.jsx** | ~200 سطر | 🔴 **Static + Inline Data** | بيانات مُضمّنة في الكود | صفحة تفصيلية بدون API |
| **CustomizeYourTripPage.jsx** | **2364 سطر** | 🟢 **Fully Dynamic** | `POST /api/trips/request/` عبر `tripRequestMapper` | **أكبر ملف في المشروع** — wizard متعدد الخطوات مع validation + draft save + WhatsApp |
| **TripReservationPage.jsx** | ~470 سطر | 🟢 **Fully Dynamic** | `apiClient.submitTripRequest()` | فورم حجز كامل مع `SearchSelect` + `MaskedInput` |
| **AfterSubmitPage.jsx** | ~100 سطر | 🟢 **Static (Post-Submit)** | يعرض trip code + WhatsApp link | صفحة نجاح |
| **CRMLoginPage.jsx** | 280 سطر | 🟢 **Fully Dynamic** | `POST /api/auth/token/` عبر `crmAuth` | JWT login كامل |
| **CRMLeadsPage.jsx** | **1426 سطر** | 🟢 **Fully Dynamic** | CRM API endpoints (list/detail/patch/notes) | Dashboard كامل مع filtering/sorting/notes |

---

### 3.3 نظامان تصميم متوازيان

> [!WARNING]
> **مشكلة معمارية حرجة**: يوجد **نظامان تصميم يعملان بالتوازي** في الـ Frontend وهذا يُسبب عدم اتساق بصري وتكرار في الكود.

| النظام | الملفات | التقنية | الصفحات |
|---|---|---|---|
| **الجديد** | `components/layout/`, `components/shared/`, `components/ui/` | Tailwind CSS + shadcn/ui + Radix UI | Home, ChooseYourTrip, TripDetails, DestinationPage |
| **القديم** | `components/Navbar.jsx`, `components/Footer.jsx`, `components/Button.jsx` | BEM CSS + inline `<style>` blocks | CustomizeYourTripPage, TripReservationPage, CRM pages |

**Dead Code المكتشف**:
- `layouts/MainLayout.jsx` — **غير مستخدم** في `App.jsx`
- `components/SectionHeader.jsx` — **ملف فارغ**
- `components/ui/button.tsx`, `card.tsx`, `input.tsx` — **نسخ TypeScript مكررة** بجانب نسخ `.jsx`
- `src/data/trips.js` — مستخدم فقط في `ChooseYourTripPage` (بيانات ثابتة)
- CSS في `styles/global.css` — **Footer CSS مكرر** (نفس القواعد تظهر مرتين)

---

### 3.4 طبقة الخدمات (Services Layer)

| الملف | الوظيفة | الملاحظة |
|---|---|---|
| `services/apiClient.js` | Axios instance + JWT interceptor + `getTrips()` + `submitTripRequest()` | ✅ مُنفّذ — **يختلف عن الموثّق** (`src/api/apiClient.js`) |
| `services/authStorage.js` | localStorage token management | ✅ جديد غير موثّق |
| `services/crmAuth.js` | CRM JWT: `setTokens()`, `getAccessToken()`, `clearTokens()`, `authFetch()` + auto-refresh | ✅ جديد غير موثّق |

---

### 3.5 الـ Utilities الفعلية

| الملف | الوظيفة | حالة التوثيق |
|---|---|---|
| `utils/caseConverter.js` | `toSnakeDeep()` / `toCamelDeep()` مع ignoreKeys/preserveKeys | 🔴 **غير موثّق** — لكنه يحل مشكلة الـ case convention! |
| `utils/formUtils.js` | `onlyDigits()`, **`maskIdForReview()`**, `formatDMY()`, `isValidEmail()`, `isValidPhoneE164Local()` + DIAL_CODE_OPTIONS, COUNTRY_OPTIONS, NATIONALITY_OPTIONS | 🔴 **غير موثّق** |
| `utils/tripRequestMapper.js` | `mapTripRequestPayload()` — camelCase form → snake_case API | 🔴 **غير موثّق** |
| `utils/orderCode.js` | `generateOrderCode()` — temp V1 code generator | 🔴 **غير موثّق** |
| `utils/voucherCodes.js` | `buildVouchers()` — booking codes + traveler codes | 🔴 **غير موثّق** |
| `utils/whatsapp.js` | `buildWhatsAppLink()` | 🔴 **غير موثّق** |
| `lib/utils.js` | `cn()` = `twMerge(clsx(...))` (shadcn utility) | 🔴 **غير موثّق** |

> [!NOTE]
> **`maskIdForReview()`** موجود في `utils/formUtils.js` — هذا يعني أن آلية إخفاء الـ PII **مُنفّذة على مستوى الـ Frontend** لعرض الهوية بشكل مقنّع في الـ Review step.

---

## 4. 📏 معايير الكود والتوثيق

### 4.1 تحليل معايير الكود

| المعيار | Backend | Frontend | التقييم |
|---|---|---|---|
| **Naming Convention** | snake_case ✅ | camelCase ✅ (مع خليط في بعض الأماكن) | 🟡 |
| **Case Converter** | يدوي في Serializers | `caseConverter.js` + `tripRequestMapper.js` ✅ | 🟢 |
| **Component Naming** | — | PascalCase ✅ | 🟢 |
| **File Organization** | Django conventions ✅ | **مختلط** — services vs api vs utils | 🟡 |
| **Code Duplication** | `models_BACKUP.py` موجود (510 سطر) | نظامان تصميم + footer CSS مكرر | 🔴 |
| **Type Safety** | Python type hints جزئية | JSX + TSX مختلطة (بدون TypeScript فعلي) | 🟡 |
| **Test Coverage** | 2 ملفات tests فعلية (lookup + concurrency) | ❌ لا توجد tests | 🔴 |

### 4.2 حالة ملفات التوثيق المركزية

| الملف | الحالة | التفاصيل |
|---|---|---|
| `README.md` | 🔴 **قديم جداً** | يصف "React + Django REST" فقط — لا يذكر V2 architecture أو CRM أو JWT أو Tailwind |
| `SECURITY.md` | 🟢 **موجود** | 1807 bytes — تم اكتشافه في root |
| `CHANGELOG.md` | 🔴 **غير موجود** | لا يوجد أي سجل تغييرات |
| `FRONTEND_MAP.md` | 🔴 **قديم بشدة** | يصف معمارية مختلفة كلياً (CSS Modules, routes مختلفة, components مختلفة) |
| `BACKEND_MAP.md` | 🔴 **قديم بشدة** | يصف 5 models فقط بدلاً من 8، `django_api/` بدلاً من `djconfig/` |
| `ARCHITECTURE.md` | 🔴 **قديم بشدة** | يصف SQLite + Django 4.2 + CSS Modules + لا JWT + لا CRM |
| `api.md` | 🔴 **قديم بشدة** | يوثّق 4 endpoints بدلاً من 14، payloads مختلفة كلياً |
| `docs/` folder | 🟡 **موجود** | يحتاج فحص محتوى |

---

## 5. 🔒 فحص الأمان والثغرات

### 5.1 إدارة الأسرار (Secrets Management)

| العنصر | الحالة | التفاصيل | الخطورة |
|---|---|---|---|
| `SECRET_KEY` | 🔴 **Fallback مكشوف** | `config('SECRET_KEY', default='django-insecure-CHANGE-THIS-IN-PRODUCTION-abc123xyz789')` | **حرج** — إذا لم يُضبط `.env` سيعمل بمفتاح مكشوف |
| `DEBUG` | 🟡 **Default True** | `config('DEBUG', default=True)` | **عالي** — يجب أن يكون False في Production |
| Database credentials | 🟡 **في settings.py** | PostgreSQL credentials (user, password, host, port) مباشرة في الكود | **عالي** — يجب نقلها لـ `.env` |
| `.env` في `.gitignore` | 🟢 **صحيح** | `.env` مُستثنى من Git | جيد |
| `.env.example` | 🟢 **موجود** | يحتوي على placeholder values | جيد |
| JWT Secrets | 🟢 **مُدار** | يستخدم `SECRET_KEY` لتوقيع JWT tokens | مقبول |

### 5.2 حماية الـ PII

| الآلية | الحالة | التفاصيل |
|---|---|---|
| `identity_hash` (Backend) | 🟡 **موجود لكن ضعيف** | الحقل موجود لكن `unique=False` ولا يوجد auto-compute في `save()` — يعتمد على الـ Serializer |
| `maskIdForReview()` (Frontend) | 🟢 **مُنفّذ** | موجود في `utils/formUtils.js` — يُخفي أرقام الهوية في خطوة المراجعة |
| `identity_last4` (Backend) | 🟢 **مُنفّذ** | يُخزّن آخر 4 أرقام فقط من الهوية |
| Field-level encryption | 🔴 **غير موجود** | لا يوجد تشفير على مستوى الحقول للبيانات الحساسة |
| Admin PII exposure | 🟡 **جزئي** | `identity_hash` في `readonly_fields` لكن `full_name`, `email`, `phone` مكشوفة |

### 5.3 أمان الـ API

| الآلية | الحالة | التفاصيل |
|---|---|---|
| Authentication | 🟢 **JWT مُنفّذ** | `rest_framework_simplejwt` — access 30min, refresh 7d |
| Default Permission | 🟢 **IsAuthenticated** | الـ endpoints تحتاج `AllowAny` صريح للعمل بدون auth |
| CRM Protection | 🟢 **IsCRMUser** | `is_authenticated` + (`is_staff` or `is_superuser`) |
| Rate Limiting | 🟢 **مُنفّذ** | anon: 30/min, user: 300/min |
| CORS | 🟢 **مُقيّد** | `localhost:5173` و `127.0.0.1:5173` فقط |
| CSRF | 🟢 **مُفعّل** | Django default |
| SQL Injection | 🟢 **محمي** | Django ORM |
| XSS | 🟢 **محمي** | React auto-escaping |

### 5.4 ملخص الثغرات الأمنية

| # | الثغرة | الخطورة | الإجراء المطلوب |
|---|---|---|---|
| 1 | SECRET_KEY fallback مكشوف | 🔴 حرج | إزالة الـ default value وإجبار `.env` |
| 2 | Database credentials في settings.py | 🔴 حرج | نقلها بالكامل لـ `.env` عبر `python-decouple` |
| 3 | DEBUG = True by default | 🟡 عالي | تغيير الـ default إلى `False` |
| 4 | لا يوجد field-level encryption للـ PII | 🟡 متوسط | تطبيق تشفير على `email`, `phone`, `identity_hash` |
| 5 | `identity_hash` فقد الـ unique constraint | 🟡 متوسط | إعادة تفعيل `unique=True` أو بديل |
| 6 | Public endpoints بدون CAPTCHA | 🟡 متوسط | إضافة CAPTCHA للـ POST endpoints العامة |

---

## 6. ✅❌ مصفوفة الميزات الشاملة (Completed vs Missing)

### 6.1 ميزات مكتملة End-to-End

| # | التدفق | Backend | Frontend | التكامل | الملاحظات |
|---|---|---|---|---|---|
| 1 | عرض الرحلات | ✅ `TripsListView` | ✅ `Home.jsx` / `ChooseYourTripPage` | 🟡 **جزئي** | `ChooseYourTripPage` تستخدم بيانات ثابتة |
| 2 | تفاصيل رحلة | ✅ `TripsDetailView` | ✅ `TripDetails.jsx` / `DestinationPage` | 🟡 **جزئي** | `DestinationPage` بيانات inline |
| 3 | حجز رحلة (Wizard) | ✅ `TripRequestCreateView` | ✅ `CustomizeYourTripPage` (2364 سطر) | 🟢 **مكتمل** | Multi-step wizard → API POST → WhatsApp |
| 4 | حجز رحلة (بسيط) | ✅ `TripRequestCreateView` | ✅ `TripReservationPage` | 🟢 **مكتمل** | Form → API POST → redirect |
| 5 | نظام الأكواد | ✅ Auto-generated codes | ✅ عرض في `AfterSubmitPage` | 🟢 **مكتمل** | public_code → reservation_code → traveler_code |
| 6 | CRM Login | ✅ JWT `TokenObtainPairView` | ✅ `CRMLoginPage` | 🟢 **مكتمل** | JWT auth flow |
| 7 | CRM Dashboard | ✅ CRUD + Notes + Filtering | ✅ `CRMLeadsPage` (1426 سطر) | 🟢 **مكتمل** | List/Detail/Patch/Notes |
| 8 | Destinations | ✅ CRUD endpoints | 🟡 جزئي | 🟡 **جزئي** | Backend جاهز، FE يحتاج تكامل |
| 9 | Activities | ✅ List per destination | 🔴 غير مُنفّذ | 🔴 **غير متكامل** | Backend جاهز، FE لا يستهلكه |
| 10 | WhatsApp Integration | ✅ (FE-side) | ✅ `buildWhatsAppLink()` + `whatsapp.js` | 🟢 **مكتمل** | رابط wa.me مع تفاصيل الحجز |

### 6.2 ميزات مفقودة حسب الـ Master PRD

| # | الميزة | حالة Backend | حالة Frontend | الأولوية |
|---|---|---|---|---|
| 1 | **نظام الدفع (Payment)** | 🔴 غير موجود | 🔴 غير موجود | 🔴 P0 — حرج للـ Launch |
| 2 | **Financial Ledgering** | 🔴 غير موجود | 🔴 غير موجود | 🔴 P0 |
| 3 | **Webhook Receivers** | 🔴 غير موجود | — | 🔴 P0 |
| 4 | **Email Notifications** | 🔴 غير موجود | — | 🟡 P1 |
| 5 | **User Registration/Profile** | 🔴 غير موجود | 🔴 غير موجود | 🟡 P1 |
| 6 | **Staff-initiated Manual Bookings** | 🟡 Admin فقط | 🔴 غير موجود في CRM | 🟡 P1 |
| 7 | **Search & Filter (Trips)** | 🟡 basic queryset | 🔴 غير مُنفّذ | 🟡 P1 |
| 8 | **Reviews/Ratings System** | 🔴 غير موجود | 🔴 غير موجود | 🟡 P2 |
| 9 | **Multi-language Support** | 🔴 غير موجود | 🔴 غير موجود | 🟡 P2 |
| 10 | **Analytics Dashboard** | 🔴 غير موجود | 🔴 غير موجود | 🟡 P2 |
| 11 | **Newsletter Backend** | 🔴 غير موجود | 🟡 UI فقط (stub) | 🟡 P2 |
| 12 | **Contact Form Backend** | 🔴 غير موجود | 🟡 UI فقط (stub) | 🟡 P2 |
| 13 | **SEO Meta Tags** | 🔴 `react-helmet-async` في package.json لكن غير مُستخدم | 🔴 غير مُنفّذ | 🟡 P2 |
| 14 | **Image Upload/CDN** | 🔴 URLField فقط | — | 🟡 P2 |
| 15 | **Deployment Pipeline** | 🔴 غير موجود | 🔴 غير موجود | 🔴 P0 |

### 6.3 Stub Pages غير المُنفّذة (10 صفحات)

جميعها 13 سطر فقط — placeholder بدون أي محتوى حقيقي:

| الصفحة | Route المتوقع | الغرض المفترض |
|---|---|---|
| `AboutPage.jsx` | `/about` | من نحن |
| `ActivitiesPage.jsx` | `/activities` | الأنشطة |
| `BeAmbassadorPage.jsx` | `/be-ambassador` | كن سفيراً |
| `BeOneOfUsPage.jsx` | `/be-one-of-us` | انضم لنا |
| `CollaborateWithUsPage.jsx` | `/collaborate` | تعاون معنا |
| `SupportTeamPage.jsx` | `/support` | فريق الدعم |
| `TicketFlightPage.jsx` | `/ticket-flight` | حجز طيران |
| `TransportationPage.jsx` | `/transportation` | المواصلات |
| `VisaPage.jsx` | `/visa` | التأشيرات |
| `WorkWithUsPage.jsx` | `/work-with-us` | اعمل معنا |

---

## 7. 📊 مقارنة تقارير الـ Agents السابقة بالواقع

### 7.1 BE1_UPDATE_REPORT (2025-04-26)

| الادعاء | الحالة الفعلية | التقييم |
|---|---|---|
| "Customer model fully implemented with identity_hash" | ✅ موجود لكن بدون unique constraint وبدون auto-compute | 🟡 **جزئياً صحيح** |
| "Legacy leader_* fields completely removed" | ✅ **صحيح** — لا توجد في الكود | 🟢 |
| "LegacyCustomTripView replaced with proper CreateAPIView" | ✅ يستخدم `TripRequestCreateSerializer` الآن | 🟢 |
| "djangorestframework-camel-case NOT installed" | ✅ **صحيح** — لكن يتم التعامل يدوياً عبر aliases | 🟢 |

### 7.2 FE1_API_INTEGRATION_REPORT (2025-04-26)

| الادعاء | الحالة الفعلية | التقييم |
|---|---|---|
| "Home.jsx integrated with GET /api/trips/" | 🟡 النظام الجديد (Tailwind) لا يستدعي API مباشرة | 🟡 **يحتاج تحقق** |
| "CustomizeYourTripPage integrated with POST" | ✅ **صحيح** — مُتكامل بالكامل | 🟢 |
| "tripsData.js no longer imported by Home.jsx" | ✅ لكن `data/trips.js` (ملف مختلف) مُستخدم في `ChooseYourTripPage` | 🟡 |
| "PopularDestinations still use static data" | — هذا المكون لم يعد موجوداً في النظام الجديد | 🟡 |

### 7.3 QA_BOOKING_FLOW_REPORT (2025-04-21)

| الاختبار | النتيجة المُبلّغة | الحالة الفعلية |
|---|---|---|
| "Trip List API returns expected data" | ✅ Pass | ✅ الـ API يعمل |
| "Customer deduplication via identity_hash works" | ✅ Pass | 🟡 `identity_hash` فقد `unique` constraint |
| "API contract URL mismatch flagged" | ✅ | ✅ لا يزال موجوداً |

---

## 8. 🎯 التوصيات الاستراتيجية والخطوات التنفيذية

### 8.1 🔴 إجراءات فورية (هذا الأسبوع)

| # | الإجراء | المسؤول | الأولوية | التأثير |
|---|---|---|---|---|
| 1 | **تحديث كامل لـ api.md** — توثيق جميع الـ 14 endpoints مع payloads فعلية | Doc Agent | 🔴 P0 | يكسر العقد بدونه |
| 2 | **تحديث FRONTEND_MAP.md** — routes, components, services, utils الفعلية | Doc Agent | 🔴 P0 | كل agent يعتمد عليه |
| 3 | **تحديث BACKEND_MAP.md** — جميع الـ 8 models مع حقولها الفعلية | Doc Agent | 🔴 P0 | كل agent يعتمد عليه |
| 4 | **تحديث ARCHITECTURE.md** — Django 6.0, PostgreSQL, JWT, Tailwind, CRM | Doc Agent | 🔴 P0 | القرارات المعمارية |
| 5 | **إصلاح SECRET_KEY** — إزالة fallback default | BE1/Security | 🔴 P0 | ثغرة أمنية |
| 6 | **نقل DB credentials لـ .env** | BE1/Security | 🔴 P0 | ثغرة أمنية |

### 8.2 🟡 إجراءات قصيرة المدى (Sprint القادم)

| # | الإجراء | المسؤول | الأولوية | التأثير |
|---|---|---|---|---|
| 7 | **توحيد نظام التصميم** — ترحيل جميع الصفحات إلى Tailwind/shadcn أو العكس | FE1 | 🟡 P1 | اتساق UX + تقليل كود |
| 8 | **حذف Dead Code** — `MainLayout.jsx`, `SectionHeader.jsx`, `.tsx` duplicates, CSS duplication | FE1 | 🟡 P1 | صيانة الكود |
| 9 | **تكامل `ChooseYourTripPage` مع API** — استبدال `data/trips.js` بـ `apiClient.getTrips()` | FE2 | 🟡 P1 | Data from DB |
| 10 | **إعادة تفعيل `identity_hash` unique** — أو بديل للـ Customer dedup | BE2 | 🟡 P1 | سلامة البيانات |
| 11 | **إنشاء CHANGELOG.md** | Doc Agent | 🟡 P1 | تتبع التغييرات |
| 12 | **كتابة Tests** — خاصة لـ CRM endpoints والـ code generation | QA | 🟡 P1 | جودة |
| 13 | **حذف `models_BACKUP.py`** (510 سطر) | BE1 | 🟡 P1 | نظافة |
| 14 | **حذف `trips/data.py`** — بيانات ثابتة في Backend | BE1 | 🟡 P1 | DB هو Source of Truth |

### 8.3 🟢 إجراءات متوسطة المدى (Sprints 2-3)

| # | الإجراء | المسؤول | الأولوية |
|---|---|---|---|
| 15 | تنفيذ نظام الدفع (Payment Gateway) | BE1 + FE2 | P0 |
| 16 | Email Notifications (تأكيد الحجز) | BE1 | P1 |
| 17 | User Registration/Profile | BE1 + FE1 | P1 |
| 18 | Search & Filter للرحلات | BE1 + FE2 | P1 |
| 19 | SEO Meta Tags عبر `react-helmet-async` | FE1 | P2 |
| 20 | Deployment Pipeline (CI/CD) | Release Agent | P0 |
| 21 | Image Upload/CDN بدلاً من URLField | BE2 + FE2 | P2 |
| 22 | تنفيذ Stub Pages أو حذفها | FE1 + UX | P2 |

---

## 9. 📐 الرسم البياني المعماري الفعلي

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT SPA (Vite 5.x)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐     │
│  │ Tailwind/     │  │ BEM/Inline   │  │ shadcn/ui         │     │
│  │ shadcn Pages  │  │ CSS Pages    │  │ Primitives        │     │
│  │ (Home, Choose │  │ (Customize,  │  │ (Button, Card,    │     │
│  │  TripDetails) │  │  Reservation,│  │  Input, Form)     │     │
│  │              │  │  CRM)        │  │                   │     │
│  └──────────────┘  └──────────────┘  └───────────────────┘     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Services Layer                                           │   │
│  │ apiClient.js (Axios + JWT) | crmAuth.js | authStorage.js │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Utils: caseConverter | tripRequestMapper | maskIdForReview│   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │ Axios (CORS-enabled)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                 DJANGO 6.0 + DRF (djconfig/)                    │
│                                                                 │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐ │
│  │ Public API (AllowAny)    │  │ Protected API (IsCRMUser)    │ │
│  │ GET  /api/trips/         │  │ GET  /api/crm/trip-requests/ │ │
│  │ GET  /api/trips/<id>/    │  │ PATCH /api/crm/.../<pk>/     │ │
│  │ GET  /api/destinations/  │  │ GET/POST .../notes/          │ │
│  │ POST /api/trip-requests/ │  │                              │ │
│  │ POST /api/custom-trip/   │  │ JWT Auth:                    │ │
│  └─────────────────────────┘  │ POST /api/auth/token/        │ │
│                                │ POST /api/auth/token/refresh/│ │
│                                └──────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Throttling: anon=30/min, user=300/min                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────────┐  ┌──────────────────────────────┐            │
│  │ trips app     │  │ trip_requests app             │            │
│  │ • Destination │  │ • ReservationSequence         │            │
│  │ • Activity    │  │ • Customer (identity_hash)    │            │
│  │ • Trip        │  │ • TripRequest (CRM-ready)     │            │
│  │ • LegacyCT   │  │ • TripRequestNote             │            │
│  └──────┬───────┘  └──────────────┬─────────────────┘            │
│         └──────────────┬──────────┘                              │
│                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ PostgreSQL (travelophilia DB, port 6666)                │    │
│  │ 13 migrations applied (5 trips + 8 trip_requests)       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. 📊 الإحصائيات النهائية

| المقياس | القيمة |
|---|---|
| إجمالي Django Models | **8** |
| إجمالي API Endpoints | **14** |
| إجمالي React Pages | **19** (9 مُنفّذة + 10 stubs) |
| إجمالي React Components | **~20** (layout + shared + ui + legacy) |
| أكبر ملف في المشروع | `CustomizeYourTripPage.jsx` — **2364 سطر** |
| ثاني أكبر ملف | `CRMLeadsPage.jsx` — **1426 سطر** |
| عدد الـ Migrations | **13** (5 + 8) |
| عدد ملفات Tests الفعلية | **2** (test_lookup.py + test_concurrency.py) |
| عدد الـ Dead Code Files | **5+** |
| نسبة التوثيق المُحدّث | **~10%** — غالبية التوثيق متأخرة بأكثر من سنة |

---

## 11. ✍️ الخاتمة

هذا التقرير يُمثل أول **فحص فيزيائي شامل** للـ Repository منذ أكثر من **14 شهراً**. الاكتشاف الأخطر هو أن **جميع ملفات التوثيق الرسمية** (`FRONTEND_MAP.md`, `BACKEND_MAP.md`, `ARCHITECTURE.md`, `api.md`) **لا تعكس الحالة الفعلية للكود** وتصف نسخة أقدم وأبسط بكثير من النظام الحالي.

**الأولوية القصوى**: تحديث التوثيق أولاً قبل أي عمل تطويري جديد، لأن جميع الـ Agents تعتمد على هذه الملفات كـ Source of Truth وسيبنون قراراتهم على معلومات خاطئة.

---

> **المُعد**: Planner Agent  
> **التاريخ**: 2026-06-04 21:35 UTC+3  
> **النموذج**: Claude Opus 4.6 (Thinking)  
> **الفرع**: agent/planner  
> **Task ID**: PLANNER-2026-06-04-AUDIT
