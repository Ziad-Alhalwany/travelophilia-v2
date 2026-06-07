> **ملاحظة صارمة (STRICT RULE):**
> يجب مراجعة هذا الملف قبل كتابة أي Import أو مسار API لتجنب الاستدعاءات الخاطئة (Hallucinations).

# Backend Architecture Map (Travelophilia)

## 📌 1. الإعدادات والبيئة (Settings & Config)
- **الموقع:** `backend/django_api/djconfig/`
- **الملفات الرئيسية:**
  - `settings.py`: إعدادات المشروع (Database, JWT, Middleware, Installed Apps, Throttling).
  - `urls.py`: موجه الـ URLs الرئيسي للمشروع، ويقوم بتصدير الروابط للتطبيقات الفرعية والـ JWT Auth.
  - `wsgi.py` / `asgi.py`: نقطة دخول السيرفر.

---

## 📌 2. التطبيقات والـ 8 نماذج الفعلية (Django Apps & 8 Models)

### 2.1 التطبيق الأول: `trips` (إدارة الوجهات والرحلات)
يهتم بكل ما يخص الوجهات (Destinations) والرحلات المعروضة للبيع (Trips).

**النماذج (Models):** (موجودة في `trips/models.py`)

1. **`Destination` (الوجهات السياحية):**
   - وجهة أساسية (Siwa, Dahab, Alexandria...) مع الأكواد الفريدة.
   - **الحقول:**
     - `code`: كود الوجهة (Unique, db_index, e.g. SIWA, DHB)
     - `slug`: الرابط الصديق لمحركات البحث (Unique, db_index, e.g. siwa, dahab)
     - `name`: اسم العرض (e.g. Siwa)
     - `country` / `city` / `description`
     - `cover_image_url` / `gallery_urls` (JSON) / `video_urls` (JSON)
     - `is_active` / `sort_order`
   - **المنطق المدمج:** توليد الـ `slug` تلقائياً من الـ `name` وتوحيد حالة الـ `code` إلى الأحرف الكبيرة (UPPERCASE) عند الحفظ.

2. **`Activity` (الأنشطة التابعة لوجهة):**
   - الأنشطة المتاحة كإضافات (Add-ons) لوجهة معينة.
   - **الحقول:**
     - `destination`: مفتاح أجنبي مرتبط بـ `Destination`
     - `title` / `slug`
     - `description`
     - `price` / `currency` (EGP) / `duration_label`
     - `options` (JSON) / `tags` (JSON)
     - `is_active` / `sort_order`
   - **الفهارس والقيود:** فهرس مركب على `[destination, is_active, sort_order]` وقيد فريد `unique_together` على `("destination", "slug")`.

3. **`Trip` (الرحلات الفعلية - STAY أو DAYUSE):**
   - الرحلات المتاحة للحجز والتي تتبع نظام توليد الأكواد العامة.
   - **الحقول الرئيسية:**
     - `legacy_id` / `slug` (Unique)
     - `name` / `location`
     - `type`: نوع الرحلة (STAY أو DAYUSE)
     - `priceFrom` / `priceTo` / `currency`
     - `durationNights`
     - `tags` (JSON) / `highlights` (JSON)
     - `media` (JSON) / `social_proof` (JSON)
     - `is_active`
   - **حقول نظام الكود العام (Public Code System):**
     - `public_code`: الكود العام الفريد (Unique, db_index, e.g. `ST-0000007-SIWA`)
     - `global_seq`: الرقم التسلسلي العام (Unique, db_index, مطابق لـ ID)
     - `dest_code` / `from_code` / `to_code`
     - `internal_key` / `internal_seq`
   - **الدوال والخصائص المحسوبة (Internal Computed Properties):**
     - `_is_dayuse()`: إرجاع True إذا كان النوع DAYUSE.
     - `_compute_internal_key()`: حساب المفتاح الداخلي (لـ STAY يعود بـ `dest_code` ولـ DAYUSE يعود بـ `FROM-TO`).
     - `_build_public_code()`: بناء الكود العام (ST-XXXXXXX-DEST أو DU-XXXXXXX-FROM-TO).
   - **المنطق المدمج:** دالة `save` مخصصة تقوم بتوليد التسلسلات الداخلية وتحديث الـ `public_code` والـ `internal_key` تلقائياً لضمان سلامة الهوية الفريدة للرحلة.

4. **`LegacyCustomTrip` (أرشيف الرحلات القديمة):**
   - لحفظ الـ Payload الخاص بالطلبات المخصصة القديمة للتتبع التاريخي.
   - **الحقول:** `payload` (JSON) و `created_at`.

---

### 2.2 التطبيق الثاني: `trip_requests` (إدارة الطلبات والحجوزات CRM)
يهتم بتسجيل طلبات العملاء وإدارتها وتتبعها داخل الـ CRM.

**النماذج (Models):** (موجودة في `trip_requests/models.py`)

5. **`ReservationSequence` (عداد تسلسل الحجوزات):**
   - لتعقب الحجوزات الفريدة لكل كود عام للرحلة لضمان توليد قيم R-Values صحيحة دون تكرار.
   - **الحقول:**
     - `trip_public_code`: كود الرحلة العام (Unique, db_index)
     - `last_r`: آخر رقم حجز تسلسلي مُصَدَّر للرحلة.

6. **`Customer` (بيانات العميل المؤمنة):**
   - يحتوي على البيانات الشخصية للعميل مع تطبيق معايير الأمان لحماية الخصوصية.
   - **الحقول:**
     - `full_name` / `phone` / `whatsapp` / `email`
     - `gender` / `age`
     - `nationality` / `resident_country`
     - `identity_type` (نوع الهوية)
     - `identity_last4` (آخر 4 أرقام من الهوية للعرض الآمن)
     - `identity_hash`: التشفير الأحادي للهوية (Hashed Identity) لضمان التحقق الفريد وحجب البيانات الأصلية (Data Masking) بنجاح تحت Task ID: TP-CORE-SEC-001.

7. **`TripRequest` (طلب الرحلة والحجوزات الفردية):**
   - النموذج الأساسي لتتبع طلبات العملاء ومراحل تحويلها لعملاء محتملين.
   - **الحقول والكود المحسوب:**
     - `trip_code`: الكود الداخلي الفريد لـ CRM (Unique, db_index, e.g. `ST-0000007-SIWA-R0003-P01-L-0000123`)
     - `trip_public_code` / `reservation_r` (رقم الحجز R) / `traveler_p` (رقم المسافر P)
     - `is_leader`: هل هو قائد المجموعة؟
     - `customer`: مفتاح أجنبي مرتبط بـ `Customer` (مؤمن)
     - `origin_city` / `destination_city` / `depart_date` / `return_date`
     - `adults_count` / `children_count` / `pax_total`
     - `travelers` (JSON) / `children_details` (JSON)
     - **بيانات حالة الـ CRM:**
       - `status`: حالة الطلب (Choices: NEW, CONTACTED, QUALIFIED, QUOTED, BOOKED, CLOSED_WON, CLOSED_LOST)
       - `priority`: الأولوية (Choices: LOW, MEDIUM, HIGH)
       - `assigned_to`: الموظف المسؤول (ForeignKey to User)
       - `next_followup_at` / `source` / `tags` (JSON)
   - **الخصائص والخصائص المحسوبة (Computed Properties):**
     - `reservation_code`: يجمع الكود العام للرحلة مع الـ R-value بنسق 4 خانات (e.g. `ST-0000007-SIWA-R0003`)
     - `traveler_code`: يجمع كود الحجز مع الـ P-value بنسق خانتين (e.g. `ST-0000007-SIWA-R0003-P01`)
     - `lead_code`: كود العميل المتوقع الفريد (e.g. `L-0000123`)
     - `_build_internal_code()`: يبني الكود الداخلي الكامل لـ CRM.

8. **`TripRequestNote` (ملاحظات الـ CRM للعميل):**
   - لتسجيل الأنشطة والملاحظات الخاصة بالاتصال والتواصل مع العملاء.
   - **الحقول:**
     - `trip_request`: مفتاح أجنبي مرتبط بـ `TripRequest`
     - `kind`: نوع الملاحظة (Choices: NOTE, WHATSAPP, CALL, EMAIL)
     - `body` (نص الملاحظة)
     - `created_at` / `created_by` (المستخدم المنشئ)

---

## 📌 3. التوثيق المرجعي
- **مسار المشروع الأساسي:** `backend/django_api/`
- يعتمد الـ Backend على `PostgreSQL` كمخزن بيانات، و`rest_framework` للإدارة والاتصال، مع `rest_framework_simplejwt` للمصادقة وتوليد الـ Tokens.
- أي مسار تحت `/api/crm/` محمي بصلاحيات staff عبر الكلاس `IsCRMUser`.
