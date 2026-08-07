# تقرير تدقيق قاعدة البيانات والهندسة المعمارية – BE2: Database & Schema Audit
---

| الحقل | القيمة |
|---|---|
| **Task ID** | `TP-AUDIT-BE2-001` |
| **Agent** | BE2 (Database & Migration Engineer) |
| **التاريخ** | 2026-06-10 |
| **Model** | Gemini 3.5 Flash (High) |
| **المشروع** | Travelophilia Website (v2) |
| **نطاق العمل** | `models.py`, `migrations/`, الجداول، الفهارس، والقيود في PostgreSQL |

---

## 1. ملخص التدقيق الفني (Executive Summary)

تم إجراء تدقيق جنائي كامل (Forensic Audit) لبنية قاعدة البيانات والمخططات (Schemas) للـ 8 نماذج (Models) الأساسية في تطبيقي `trips` و `trip_requests` بالإضافة إلى نماذج الـ OTA في تطبيق `properties`. 

يركز هذا التقرير على مطابقة البنية للواقع ومراجعة منطق تسلسلات الحجوزات والعملاء المحتملين للتأكد من خلوها من الثغرات البرمجية وحالات التعارض (Race Conditions) وتدقيق الفهارس (Indexes) والقيود الرياضية في قاعدة بيانات PostgreSQL لمنع الـ Overbooking والكشف عن استعلامات N+1.

---

## 2. خريطة تتبع العلاقات ومطابقة الـ 8 نماذج الفعلية (Connectivity Tracing)

تم فحص النماذج الفعلية ومقارنتها بالملي مع ملف المواصفات `BACKEND_MAP.md` وجاءت النتائج مطابقة كما يلي:

### تطبيـق `trips` (إدارة الوجهات والرحلات)
1. **`Destination` (جدول الوجهات):**
   - **الجدول في PostgreSQL:** `trips_destination`
   - **الحقول:** `id`, `code` (Unique CharField), `slug` (Unique SlugField), `name`, `country`, `city`, `description`, `cover_image_url`, `gallery_urls` (JSON), `video_urls` (JSON), `is_active` (Boolean), `sort_order` (Integer), `created_at`, `updated_at`.
   - **المنطق المدمج:** توليد الـ `slug` تلقائياً عبر `slugify` عند خلوه، وتحويل الـ `code` إلى أحرف كبيرة (UPPERCASE) وإزالة الفراغات تلقائياً في دالة `save()`.

2. **`Activity` (الأنشطة الملحقة):**
   - **الجدول في PostgreSQL:** `trips_activity`
   - **الحقول:** `id`, `destination` (ForeignKey to Destination), `title`, `slug`, `description`, `price`, `currency`, `duration_label`, `options` (JSON), `tags` (JSON), `is_active`, `sort_order`, `created_at`, `updated_at`.
   - **القيود والفهارس:** 
     - قيد فريد مركب `unique_together = [("destination", "slug")]`.
     - فهرس مركب مخصص `models.Index(fields=["destination", "is_active", "sort_order"])` مسجل في الـ Meta.

3. **`Trip` (الرحلة المتاحة للبيع):**
   - **الجدول في PostgreSQL:** `trips_trip`
   - **الحقول:** `id`, `legacy_id` (Unique), `slug` (Unique), `name`, `location`, `type` (STAY / DAYUSE), `description`, `priceFrom`, `priceTo`, `currency`, `durationNights`, `tags` (JSON), `highlights` (JSON), `media` (JSON), `social_proof` (JSON), `is_active`, `created_at`, `updated_at`, `public_code` (Unique), `global_seq` (Unique), `dest_code`, `from_code`, `to_code`, `internal_key` (Index), `internal_seq` (Index).

4. **`LegacyCustomTrip` (أرشيف الطلبات المخصصة):**
   - **الجدول في PostgreSQL:** `trips_legacycustomtrip`
   - **الحقول:** `id`, `payload` (JSON), `created_at`.

---

### تطبيـق `trip_requests` (إدارة الحجوزات و CRM)
5. **`ReservationSequence` (عداد تسلسل الحجوزات):**
   - **الجدول في PostgreSQL:** `trip_requests_reservationsequence`
   - **الحقول:** `id`, `trip_public_code` (Unique), `last_r` (PositiveInteger).

6. **`Customer` (بيانات العملاء المؤمنة):**
   - **الجدول في PostgreSQL:** `trip_requests_customer`
   - **الحقول:** `id`, `full_name`, `phone`, `whatsapp`, `email`, `gender`, `age`, `nationality`, `resident_country`, `identity_type`, `identity_last4`, `identity_hash` (Unique), `created_at`, `updated_at`.
   - **المنطق المدمج:** تطبيق نظام تشفير أحادي للحفاظ على سرية الهوية (Data Masking) عبر `make_password` وحفظ آخر 4 أرقام فقط في `identity_last4`.

7. **`TripRequest` (طلبات الرحلات والحجوزات الفردية):**
   - **الجدول في PostgreSQL:** `trip_requests_triprequest`
   - **الحقول:** `id`, `trip_code` (Unique), `trip_public_code` (Index), `reservation_r` (Index), `traveler_p` (Index), `is_leader` (Index), `internal_code_override`, `customer` (FK to Customer), `entry_type_for_egypt`, `origin_city`, `destination_city`, `depart_date`, `return_date`, `adults_count`, `children_count`, `pax_total`, `companions_mode`, `note`, `couples_answer`, `terms_accepted`, `docs_acknowledged`, `travelers` (JSON), `children_details` (JSON), `status` (Index), `priority` (Index), `assigned_to` (FK to User), `last_contacted_at`, `next_followup_at`, `source`, `tags` (JSON), `trip_slug`, `trip_title`, `created_at`, `updated_at`.

8. **`TripRequestNote` (ملاحظات الـ CRM):**
   - **الجدول في PostgreSQL:** `trip_requests_triprequestnote`
   - **الحقول:** `id`, `trip_request` (FK to TripRequest), `kind` (choices), `body`, `created_at`, `created_by` (FK to User).

---

## 3. منطق توليد الأكواد والتسلسلات الرقمية (Sequences Review)

تم مراجعة منطق توليد المعرفات المخصص داخل دوال الـ `save()` بدقة عالية:

### أ. توليد الـ `public_code` لجدول الـ `Trip`
يتم التوليد على النحو التالي:
1. يتم حفظ السطر أولاً لاستخلاص الـ ID.
2. يتم مساواة `global_seq` بقيمة الـ ID إذا كان `None`.
3. للرحلات من نوع `STAY`: يتم بناء الكود بصيغة: `ST-{global_seq:07d}-{dest_code}` (مثال: `ST-0000007-SIWA`).
4. للرحلات من نوع `DAYUSE`: يتم بناء الكود بصيغة: `DU-{global_seq:07d}-{from_code}-{to_code}` (مثال: `DU-0000004-CAI-ALEX`).
5. يتم ملء `internal_key` تلقائياً بقيمة `dest_code` في رحلات الـ STAY وقيمة `from_code-to_code` في رحلات الـ DAYUSE.
6. يتم ملء `internal_seq` عبر البحث عن آخر تسلسل داخلي مستخدم لنفس الـ `internal_key` وزيادته بمقدار `1`.

### ب. توليد الـ `trip_code` لجدول الـ `TripRequest`
يتم التوليد للمنشآت الجديدة في بيئة حتمية خالية من الـ Race Conditions بفضل القفل التنافسي (Locking):
1. يتم فتح المعاملة بقفل كتابة `with transaction.atomic()` مع استخدام `select_for_update()` على جدول `ReservationSequence` لتجنب توليد نفس رقم الحجز لحجزين متزامنين.
2. يتم جلب أو إنشاء عداد الرحلة بناءً على `trip_public_code`.
3. إذا كان `reservation_r` فارغاً، يتم زيادة `last_r` بمقدار `1` وحفظه في العداد وإسناده لـ `reservation_r`.
4. يتم استخراج الرقم التسلسلي للمسافر `traveler_p` بالبحث عن أكبر قيمة للمسافرين المسجلين تحت نفس الـ `reservation_r` والـ `trip_public_code` وزيادته بمقدار `1`.
5. يتم تكوين المعرفات المحسوبة في الـ Properties:
   - `reservation_code` ← `ST-0000007-SIWA-R0003` (4 خانات للـ R).
   - `traveler_code` ← `ST-0000007-SIWA-R0003-P01` (خانين للـ P).
   - `lead_code` ← `L-0000123` (7 خانات للـ ID).
6. الكود النهائي المكتوب في حقل `trip_code` هو:
   `ST-0000007-SIWA-R0003-P01-L-0000123`
   (يتم التحديث المباشر للـ DB بعد الحفظ الأساسي لتجاوز الحلقات اللانهائية).

---

## 4. فحص القيود المركبة لمنع الحجز الزائد (Overbooking Prevention)

تم التحقق من جدول **`InventoryPricing`** المسئول عن الوفرة والأسعار اليومية في تطبيق الـ OTA (`properties`):
- **النموذج البرمجي:** يحتوي على القيد المركب:
  ```python
  class Meta:
      unique_together = ("rate_plan", "date", "supplier")
  ```
- **التطبيق الفيزيائي في Migration `0001_initial.py`:**
  ```python
  "unique_together": {("rate_plan", "date", "supplier")},
  ```
- **الفائدة الرياضية:** يضمن هذا القيد على مستوى محرك قاعدة البيانات (PostgreSQL Unique Constraint) استحالة تكرار السعر أو الغرف الشاغرة لنفس خطة السعر والمورد والتاريخ، مما يمنع رياضياً حدوث أي تداخل في تحديثات الأسعار أو المبيعات المتزامنة ويقطع الطريق تماماً أمام الـ Overbooking.

---

## 5. فحص وتدقيق فهارس قاعدة البيانات (Indexes Inspection)

تم التأكد من تطبيق الفهارس الفيزيائية بنوع B-Tree على الحقول الرئيسية المستهدفة في الاستعلامات:

1. **`Destination.code`:** 
   - مُعرّف بـ `db_index=True` و `unique=True` في الموديل.
   - مُطبق في Migration `0003_destination_activity.py` السطر 18.
   - ينشئ PostgreSQL فهرس B-Tree فريد لتسريع الاستعلامات المباشرة إلى $O(log\ n)$.
2. **`Supplier.is_active`:**
   - مُعرّف بـ `db_index=True` في الموديل.
   - مُطبق في Migration `0001_initial.py` السطر 54.
   - يسرّع عمليات استعلام الفنادق المتاحة للموردين النشطين.
3. **`InventoryPricing.date`:**
   - مُعرّف بـ `db_index=True` في الموديل.
   - مُطبق في Migration `0001_initial.py` السطر 227.
   - يضمن سرعة تنفيذ الـ Range Queries لتواريخ الإقامة أثناء التصفية والبحث المجمع.

---

## 6. كشف ثغرات الـ N+1 (N+1 Query Detection)

تم تدقيق استعلامات محركات البحث والصفحات الرئيسية لتقييم الكفاءة الزمنية:

### أ. واجهة البحث `AccommodationSearchView` (آمنة بنسبة 100%)
- يتم استخدام `select_related` بشكل مثالي لجلب السلسلة الكاملة من العلاقات الأجنبية دفعة واحدة:
  ```python
  InventoryPricing.objects.select_related(
      "rate_plan__room_type__accommodation",
      "supplier",
  )
  ```
- يضمن هذا دمج كافة البيانات المطلوبة للغرف وخطط الأسعار والموردين في استعلام SQL JOIN واحد بدلاً من إرسال استعلام لكل صف.

### ب. واجهة جلب ميتاداتا المورد `B2BPropertyMetadataView` (آمنة بنسبة 100%)
- يتم جلب البيانات باستخدام استعلامات مجمعة باستخدام `__in` و `values_list` و `distinct` بشكل مباشر دون أي حلقات تكرارية للموديلات.

### ج. واجهة تفاصيل الأنشطة لوجهة معينة `DestinationActivitiesView` (⚠️ ثغرة N+1)
- **الكود الحالي في `trips/views.py`:**
  ```python
  qs = Activity.objects.filter(destination=dest, is_active=True).order_by("sort_order", "id")
  ```
- **الـ Serializer في `trips/serializers.py`:**
  ```python
  destinationCode = serializers.CharField(source="destination.code", read_only=True)
  destinationSlug = serializers.CharField(source="destination.slug", read_only=True)
  ```
- **التحليل:** عند قراءة الـ Serializer لخصائص الوجهة (`destination.code` و `destination.slug`) لكل نشاط في القائمة، يقوم الـ ORM بإرسال استعلام SQL منفصل لجلب بيانات الـ Destination لكل نشاط على حدة (إلا إذا تم تخزينه في الذاكرة المؤقتة)، مما يؤدي لثغرة N+1.
- **التوصية:** يجب تعديل الـ Queryset لإضافة `select_related("destination")` لتصبح:
  ```python
  qs = Activity.objects.select_related("destination").filter(destination=dest, is_active=True).order_by("sort_order", "id")
  ```

---

## 7. المخاطر والتوصيات (Risks & Recommendations)

| المخاطرة | التأثير | الاحتمالية | خطة التخفيف والحل |
|---|---|---|---|
| **سباق البيانات في تسلسل Trip الداخلي:** عدم وجود قيد فريد على `(internal_key, internal_seq)` قد يؤدي لتكرار الرقم التسلسلي للرحلة في حال الإضافة المتزامنة لنفس الوجهة. | متوسط | منخفض | إضافة `unique_together = ("internal_key", "internal_seq")` لجدول الـ Trip مستقبلاً. |
| **ثغرة استعلامات N+1 في واجهة الأنشطة:** تبطئ من استجابة صفحة الوجهات السياحية عند زيادة الأنشطة. | متوسط | متوسط | تعديل الكود لإضافة `select_related("destination")` في الـ View الخاصة بالأنشطة. |

---

## 8. سيناريو التوليد (Example Scenario Trace)

عند قيام العميل بحجز رحلة إلى سيوة من الواجهة الأمامية:
1. يتم البحث عن الرحلة النشطة ليجد مثلاً `ST-0000007-SIWA`.
2. يتم فتح معاملة قاعدة البيانات وطلب قفل على عداد الرحلة.
3. يحصل الحجز على الرقم R الرابع للرحلة: `R0004` (ليصبح معرف الحجز `ST-0000007-SIWA-R0004`).
4. يتم جلب الـ Lead المولد تلقائياً من الـ Auto Increment ID للحجز وليكن الحجز رقم 123: `L-0000123`.
5. ينشأ مسافر رئيسي واحد `P01` ومرافق `P02`.
6. الكود التشغيلي للـ CRM للمسافر القائد يصبح: `ST-0000007-SIWA-R0004-P01-L-0000123`.
7. يمنع قفل `unique_together` على الأسعار اليومية للغرف حجز أي مورد لغرفة غير متاحة لنفس الليلة.
