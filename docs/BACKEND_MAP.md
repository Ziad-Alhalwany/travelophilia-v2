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

### 2.3 التطبيق الثالث: `properties` (محرك ومخزن أسعار وإتاحة وحدات الإقامة OTA)
يهتم هذا التطبيق بكل ما يخص موردي الأسعار، وحدات الإقامة، غرف الفنادق، خطط الأسعار والوفرة اليومية وقائمة الانتظار وقواعد الربحية.

**النماذج (Models):** (موجودة في `properties/models.py`)

9. **`Supplier` (مورد الأسعار):**
   - يمثل القنوات أو الموردين الموفرين للأسعار (Direct Hotel Owner, Partner Travel Agency, Global Wholesaler).
   - **الحقول:** `name` (فريد)، `kind` (DIRECT, PARTNER_AGENCY, WHOLESALER)، `is_active` (مفهرس)، `created_at`.
   - **المنطق واستراتيجيات الفهارس:** مفهرس على حقل النشاط `is_active` لتسريع التصفية المباشرة.

10. **`Accommodation` (وحدات الإقامة):**
    - يمثل المنشآت الفندقية أو غيرها (Hotel, Camp, Chalet, Hostel) المرتبطة بوجهة معينة.
    - **الحقول:** `type` (HOTEL, CAMP, CHALET, HOSTEL - مفهرس)، `destination` (ForeignKey to Destination)، `name` (اسم المنشأة)، `is_active` (مفهرس)، `created_at`.
    - **الفهارس:** مفهرس على `type` و `is_active` لسرعة استعلامات محرك البحث.

11. **`RoomType` (أنواع الغرف):**
    - يمثل فئات الغرف المتوفرة في وحدة الإقامة (مثل Standard, Suite, Deluxe Room).
    - **الحقول:** `accommodation` (ForeignKey to Accommodation)، `name`، `total_physical_rooms` (إجمالي الغرف الفيزيائية)، `base_capacity` (السعة الأساسية)، `max_extra_beds` (الحد الأقصى للأسرة الإضافية).

12. **`RatePlan` (خطط الأسعار):**
    - يمثل خيارات الإقامة والوجبات المرتبطة بنوع الغرفة (Board Type: RO, BB, HB, FB, AI).
    - **الحقول:** `room_type` (ForeignKey to RoomType)، `board_type` (مفهرس)، `extra_bed_price` (سعر السرير الإضافي).
    - **الفهارس:** مفهرس على `board_type` للتصفية خلال جلب الحجوزات.

13. **`InventoryPricing` (الأسعار والوفرة اليومية):**
    - الجدول الأساسي لتخزين تسعير كل ليلة ووفرة الغرف لكل خطة سعرية ومورد.
    - **الحقول:** `rate_plan` (ForeignKey to RatePlan)، `supplier` (ForeignKey to Supplier)، `date` (تاريخ الليلة - مفهرس)، `price_per_night` (السعر الأساسي لليلة)، `rooms_available` (عدد الغرف الشاغرة).
    - **القيود والفهارس:** قيد فريد مركب `unique_together` على `("rate_plan", "date", "supplier")` كحماية رياضية ضد الحجز الزائد (Overbooking). مفهرس على الحقل `date` لتسريع عمليات التصفية الزمنية لرحلات الموردين.

14. **`Waitlist` (قائمة الانتظار للتواريخ غير النشطة):**
    - لتسجيل رغبات العملاء بالتواريخ غير النشطة تسعيرياً أو التي لا يتوفر فيها غرف شاغرة.
    - **الحقول:** `accommodation` (ForeignKey to Accommodation)، `room_type` (ForeignKey to RoomType)، `requested_date` (تاريخ الطلب - مفهرس)، `user_email` (البريد الإلكتروني للعميل)، `status` (PENDING, NOTIFIED, CONVERTED - مفهرس)، `created_at`.
    - **الفهارس:** مفهرس على `requested_date` و `status` لإدارة طابور الانتظار بفاعلية.

15. **`GranularMarkupRule` (قواعد الأرباح الدقيقة):**
    - لتعريف قواعد الربح المرنة ذات الأربع طبقات (4-Layer Markup Pipeline) لتعديل الأسعار ديناميكياً للفنادق أو أنواع الغرف المستهدفة.
    - **الحقول:** `title`، `target_accommodations` (ManyToMany to Accommodation)، `target_room_types` (ManyToMany to RoomType)، `action` (INCREASE, DECREASE)، `percentage` (نسبة مئوية)، `fixed_amount` (مبلغ ثابت بالجنيه المصري)، `start_date`، `end_date`، `is_active` (مفهرس).
    - **الفهارس:** مفهرس على حقل النشاط `is_active` لتصفية القواعد الفعالة مباشرة.

**الروابط الأساسية (URLs):** (موجودة في `properties/urls.py` ومربوطة بـ `/api/`)
- `GET /api/properties/search`: محرك البحث المجمع وتطبيق قواعد الأرباح وحجب هوية الموردين.
- `GET /api/properties/<int:id>/availability`: الاستعلام عن الإتاحة والأسعار لشهر/سنة.
- `POST /api/properties/<int:id>/availability/bulk-update`: التحديث الجماعي للإتاحة والأسعار.
- `POST /api/waitlist`: التسجيل في قائمة الانتظار للتواريخ غير النشطة.

---

## 📌 3. التوثيق المرجعي
- **مسار المشروع الأساسي:** `backend/django_api/`
- يعتمد الـ Backend على `PostgreSQL` كمخزن بيانات، و`rest_framework` للإدارة والاتصال، مع `rest_framework_simplejwt` للمصادقة وتوليد الـ Tokens.
- أي مسار تحت `/api/crm/` محمي بصلاحيات staff عبر الكلاس `IsCRMUser`.
