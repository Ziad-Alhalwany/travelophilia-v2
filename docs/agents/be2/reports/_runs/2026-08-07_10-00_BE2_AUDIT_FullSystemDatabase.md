# 📑 [BE2 AUDIT REPORT] Full System Database & PostgreSQL Optimization Audit

**Task ID:** `TP-AUDIT-BE2-FULL-SYSTEM-001`  
**Agent:** `BE2 (Database & Migrations Specialist)`  
**Date:** `2026-08-07 10:00`  
**Model:** `Gemini 3.6 Flash (High)`  
**Scope:** `backend/django_api/*/models.py`, `backend/django_api/*/migrations/**`  
**Target Path:** `../../_shared/agents/be2/reports/_runs/2026-08-07_10-00_BE2_AUDIT_FullSystemDatabase.md`  

---

## Executive Summary (الملخص التنفيذي)

تم بحمد الله إجراء فحص جنائي شامل (Forensic Database Schema & PostgreSQL Audit) لبنية قاعدة البيانات والمخططات (Schemas) والتسلسلات وتاريخ الترحيلات (Migrations) واستعلامات DRF ORM عبر **كافة النماذج الـ 16** الموزعة على الـ 3 تطبيقات الأساسية في نظام Travelophilia:
1. **`trips`** (إدارة الوجهات والرحلات): 4 نماذج (`Destination`, `Activity`, `Trip`, `LegacyCustomTrip`).
2. **`trip_requests`** (إدارة طلبات العملاء والـ CRM): 4 نماذج (`ReservationSequence`, `Customer`, `TripRequest`, `TripRequestNote`).
3. **`properties`** (محرك محرك البحث ومخزن الأسعار والإتاحة OTA/B2B): 8 نماذج (`Supplier`, `VendorProfile`, `Accommodation`, `RoomType`, `RatePlan`, `InventoryPricing`, `Waitlist`, `GranularMarkupRule`).

أظهر الفحص متانة عالية في الهيكل البرمجي وأنظمة الأمان (مثل تشفير هوية العملاء PII وسجلات الموردين والقيود المركبة لعدم الحجز الزائد)، بالإضافة لربط متقدم في محرك تجميع الأسعار (Aggregator Engine). ومع ذلك، تم اكتشاف **تأخير أداء حرج (N+1 Bottleneck)** و**خطأ استعلام ميداني (FieldError)** في مسار الـ CRM يسبب انهيار البحث عند الاستعلام بالاسم أو الهاتف.

---

## 1. Forensic Schema Audit — All 16 Models (فحص شامل للـ 16 نموذجاً)

### 📍 1.1 App: `trips` (4 Models)

#### 1. `Destination` (الوجهات السياحية)
- **Table Name:** `trips_destination`
- **Fields:**
  - `id`: BigAutoField (Primary Key, Auto-increment)
  - `code`: CharField(max_length=12, unique=True, db_index=True) — كود الوجهة فريد (مثل `SIWA`, `DHB`, `ALEX`)
  - `slug`: SlugField(max_length=120, unique=True, db_index=True) — الرابط الفريد لـ SEO
  - `name`: CharField(max_length=120) — اسم الوجهة
  - `country`: CharField(max_length=80, default="Egypt")
  - `city`: CharField(max_length=120, blank=True)
  - `description`: TextField(blank=True)
  - `cover_image_url`: URLField(blank=True)
  - `gallery_urls`: JSONField(default=list)
  - `video_urls`: JSONField(default=list)
  - `is_active`: BooleanField(default=True, db_index=True) — مفهرس للتصفية السريعة
  - `sort_order`: IntegerField(default=0, db_index=True) — مفهرس للترتيب
  - `created_at`: DateTimeField(auto_now_add=True)
  - `updated_at`: DateTimeField(auto_now=True)
- **Foreign Keys:** لا يوجد.
- **Unique Constraints:** `code`, `slug`
- **B-Tree Indexes:** `code`, `slug`, `is_active`, `sort_order`

#### 2. `Activity` (الأنشطة التابعة لوجهة)
- **Table Name:** `trips_activity`
- **Fields:**
  - `id`: BigAutoField (PK)
  - `destination_id`: ForeignKey(`Destination`, on_delete=CASCADE, related_name="activities")
  - `title`: CharField(max_length=160)
  - `slug`: SlugField(max_length=160, blank=True)
  - `description`: TextField(blank=True)
  - `price`: PositiveIntegerField(default=0)
  - `currency`: CharField(max_length=8, default="EGP")
  - `duration_label`: CharField(max_length=64, blank=True)
  - `options`: JSONField(default=list)
  - `tags`: JSONField(default=list)
  - `is_active`: BooleanField(default=True, db_index=True)
  - `sort_order`: IntegerField(default=0, db_index=True)
  - `created_at`: DateTimeField(auto_now_add=True)
  - `updated_at`: DateTimeField(auto_now=True)
- **Foreign Keys:** `destination` -> `Destination.id`
- **Unique Constraints:** `unique_together = [("destination", "slug")]`
- **B-Tree Indexes:** `models.Index(fields=["destination", "is_active", "sort_order"])`, `is_active`, `sort_order`

#### 3. `Trip` (الرحلات المعروضة للحجز)
- **Table Name:** `trips_trip`
- **Fields:**
  - `id`: BigAutoField (PK)
  - `legacy_id`: CharField(max_length=120, unique=True, null=True, blank=True)
  - `slug`: SlugField(max_length=120, unique=True, null=True, blank=True)
  - `name`: CharField(max_length=200)
  - `location`: CharField(max_length=200, blank=True)
  - `type`: CharField(max_length=32, blank=True) — (`STAY` / `DAYUSE`)
  - `description`: TextField(blank=True)
  - `priceFrom`: PositiveIntegerField(null=True, blank=True)
  - `priceTo`: PositiveIntegerField(null=True, blank=True)
  - `currency`: CharField(max_length=8, default="EGP")
  - `durationNights`: PositiveSmallIntegerField(null=True, blank=True)
  - `tags`: JSONField(default=list)
  - `highlights`: JSONField(default=list)
  - `media`: JSONField(default=dict)
  - `social_proof`: JSONField(default=dict)
  - `is_active`: BooleanField(default=True, db_index=True)
  - `public_code`: CharField(max_length=32, unique=True, null=True, blank=True, db_index=True) — الكود العام التشغيلي (مثل `ST-0000007-SIWA`)
  - `global_seq`: PositiveIntegerField(unique=True, null=True, blank=True, db_index=True) — التسلسل العام المستند لـ `id`
  - `dest_code`: CharField(max_length=12, blank=True) — كود الوجهة للرحلة الإقامية
  - `from_code`: CharField(max_length=12, blank=True) — كود القيام لرحلات اليوم الواحد
  - `to_code`: CharField(max_length=12, blank=True) — كود الوصول لرحلات اليوم الواحد
  - `internal_key`: CharField(max_length=32, blank=True, db_index=True) — المفتاح الداخلي (`SIWA` أو `CAI-ALEX`)
  - `internal_seq`: PositiveIntegerField(null=True, blank=True, db_index=True) — التسلسل الداخلي الموحد
  - `created_at`: DateTimeField(auto_now_add=True)
  - `updated_at`: DateTimeField(auto_now=True)
- **Foreign Keys:** لا يوجد روابط أجنبية مباشرة (يستخدم المطابقة النظيفة مع `Destination.code`).
- **Unique Constraints:** `legacy_id`, `slug`, `public_code`, `global_seq`
- **B-Tree Indexes:** `is_active`, `public_code`, `global_seq`, `internal_key`, `internal_seq`

#### 4. `LegacyCustomTrip` (أرشيف الطلبات المخصصة)
- **Table Name:** `trips_legacycustomtrip`
- **Fields:**
  - `id`: BigAutoField (PK)
  - `payload`: JSONField(default=dict)
  - `created_at`: DateTimeField(auto_now_add=True)
- **Foreign Keys:** لا يوجد.
- **Unique Constraints:** لا يوجد.
- **B-Tree Indexes:** Primary Key (`id`).

---

### 📍 1.2 App: `trip_requests` (4 Models)

#### 5. `ReservationSequence` (عداد تسلسل الحجوزات)
- **Table Name:** `trip_requests_reservationsequence`
- **Fields:**
  - `id`: BigAutoField (PK)
  - `trip_public_code`: CharField(max_length=64, unique=True, db_index=True) — كود الرحلة العام
  - `last_r`: PositiveIntegerField(default=0) — آخر رقم حجز مخصص للرحلة (R-Value)
- **Foreign Keys:** لا يوجد.
- **Unique Constraints:** `trip_public_code`
- **B-Tree Indexes:** `trip_public_code`

#### 6. `Customer` (بيانات العميل المؤمنة)
- **Table Name:** `trip_requests_customer`
- **Fields:**
  - `id`: BigAutoField (PK)
  - `full_name`: CharField(max_length=200, blank=True)
  - `phone`: CharField(max_length=32, blank=True)
  - `whatsapp`: CharField(max_length=32, blank=True)
  - `email`: EmailField(blank=True)
  - `gender`: CharField(max_length=16, blank=True)
  - `age`: PositiveIntegerField(null=True, blank=True)
  - `nationality`: CharField(max_length=80, blank=True)
  - `resident_country`: CharField(max_length=80, blank=True)
  - `identity_type`: CharField(max_length=16, blank=True) — نوع الهوية (Pass/National ID)
  - `identity_last4`: CharField(max_length=8, blank=True) — آخر 4 أرقام للعرض الآمن
  - `identity_hash`: CharField(max_length=255, unique=True, null=True, blank=True) — التشفير الأحادي للهوية (PBKDF2 SHA256)
  - `created_at`: DateTimeField(auto_now_add=True)
  - `updated_at`: DateTimeField(auto_now=True)
- **Foreign Keys:** لا يوجد.
- **Unique Constraints:** `identity_hash`
- **B-Tree Indexes:** `identity_hash`

#### 7. `TripRequest` (طلبات الرحلات وصفوف الـ CRM)
- **Table Name:** `trip_requests_triprequest`
- **Fields:**
  - `id`: BigAutoField (PK)
  - `trip_code`: CharField(max_length=96, unique=True, editable=False, db_index=True, null=True, blank=True) — الكود التشغيلي الداخلي المكتمل لـ CRM
  - `trip_public_code`: CharField(max_length=64, blank=True, db_index=True)
  - `reservation_r`: PositiveIntegerField(null=True, blank=True, db_index=True) — رقم الحجز R
  - `traveler_p`: PositiveIntegerField(null=True, blank=True, db_index=True) — رقم المسافر P
  - `is_leader`: BooleanField(default=True, db_index=True)
  - `internal_code_override`: CharField(max_length=96, blank=True)
  - `customer_id`: ForeignKey(`Customer`, null=True, blank=True, on_delete=SET_NULL, related_name="trip_requests")
  - `entry_type_for_egypt`: CharField(max_length=16, blank=True)
  - `origin_city`: CharField(max_length=80, blank=True)
  - `destination_city`: CharField(max_length=80, blank=True)
  - `depart_date`: DateField(null=True, blank=True)
  - `return_date`: DateField(null=True, blank=True)
  - `adults_count`: PositiveIntegerField(default=1)
  - `children_count`: PositiveIntegerField(default=0)
  - `pax_total`: PositiveIntegerField(default=1)
  - `companions_mode`: CharField(max_length=16, blank=True)
  - `note`: TextField(blank=True)
  - `couples_answer`: CharField(max_length=8, blank=True)
  - `terms_accepted`: BooleanField(default=False)
  - `docs_acknowledged`: BooleanField(default=False)
  - `travelers`: JSONField(default=list)
  - `children_details`: JSONField(default=list)
  - `status`: CharField(max_length=20, choices=Status.choices, default="NEW", db_index=True)
  - `priority`: CharField(max_length=10, choices=Priority.choices, default="MEDIUM", db_index=True)
  - `assigned_to_id`: ForeignKey(`User`, null=True, blank=True, on_delete=SET_NULL, related_name="assigned_trip_requests")
  - `last_contacted_at`: DateTimeField(null=True, blank=True)
  - `next_followup_at`: DateTimeField(null=True, blank=True)
  - `source`: CharField(max_length=50, default="WEB")
  - `tags`: JSONField(default=list)
  - `trip_slug`: CharField(max_length=255, blank=True)
  - `trip_title`: CharField(max_length=255, blank=True)
  - `created_at`: DateTimeField(auto_now_add=True)
  - `updated_at`: DateTimeField(auto_now=True)
- **Foreign Keys:** `customer` -> `Customer.id`, `assigned_to` -> `auth_user.id`
- **Unique Constraints:** `trip_code`
- **B-Tree Indexes:** `trip_code`, `trip_public_code`, `reservation_r`, `traveler_p`, `is_leader`, `status`, `priority`, `created_at` (via Meta ordering)

#### 8. `TripRequestNote` (ملاحظات وسجل تواصل الـ CRM)
- **Table Name:** `trip_requests_triprequestnote`
- **Fields:**
  - `id`: BigAutoField (PK)
  - `trip_request_id`: ForeignKey(`TripRequest`, on_delete=CASCADE, related_name="crm_notes")
  - `kind`: CharField(max_length=20, choices=Kind.choices, default="NOTE")
  - `body`: TextField()
  - `created_at`: DateTimeField(auto_now_add=True)
  - `created_by_id`: ForeignKey(`User`, null=True, blank=True, on_delete=SET_NULL, related_name="trip_request_notes")
- **Foreign Keys:** `trip_request` -> `TripRequest.id`, `created_by` -> `auth_user.id`
- **Unique Constraints:** لا يوجد.
- **B-Tree Indexes:** Primary Key (`id`), `created_at` (via Meta ordering)

---

### 📍 1.3 App: `properties` (8 Models)

#### 9. `Supplier` (مورّدو الأسعار والقنوات)
- **Table Name:** `properties_supplier`
- **Fields:**
  - `id`: BigAutoField (PK)
  - `name`: CharField(max_length=150, unique=True) — اسم المورد (مثل `Direct Hotel Owner`)
  - `kind`: CharField(max_length=20, choices=Kind.choices) — (`DIRECT`, `PARTNER_AGENCY`, `WHOLESALER`)
  - `is_active`: BooleanField(default=True, db_index=True)
  - `created_at`: DateTimeField(auto_now_add=True)
- **Foreign Keys:** لا يوجد.
- **Unique Constraints:** `name`
- **B-Tree Indexes:** `name`, `is_active`

#### 10. `VendorProfile` (ملف تعريف شركاء وموردي B2B)
- **Table Name:** `properties_vendorprofile`
- **Fields:**
  - `id`: BigAutoField (PK)
  - `user_id`: OneToOneField(`User`, on_delete=CASCADE, related_name="vendor_profile")
  - `company_name`: CharField(max_length=255)
  - `is_active`: BooleanField(default=True, db_index=True)
  - `created_at`: DateTimeField(auto_now_add=True)
- **Foreign Keys:** `user` -> `auth_user.id` (OneToOne)
- **Unique Constraints:** `user_id` (Unique OneToOne)
- **B-Tree Indexes:** `user_id`, `is_active`

#### 11. `Accommodation` (وحدات الإقامة المنشآت)
- **Table Name:** `properties_accommodation`
- **Fields:**
  - `id`: BigAutoField (PK)
  - `vendor_id`: ForeignKey(`VendorProfile`, null=True, blank=True, on_delete=SET_NULL, related_name="accommodations", db_index=True)
  - `type`: CharField(max_length=10, choices=AccommodationType.choices, db_index=True) — (`HOTEL`, `CAMP`, `CHALET`, `HOSTEL`)
  - `destination_id`: ForeignKey(`trips.Destination`, on_delete=CASCADE, related_name="accommodations")
  - `name`: CharField(max_length=255)
  - `is_active`: BooleanField(default=True, db_index=True)
  - `created_at`: DateTimeField(auto_now_add=True)
- **Foreign Keys:** `vendor` -> `VendorProfile.id`, `destination` -> `Destination.id`
- **Unique Constraints:** لا يوجد.
- **B-Tree Indexes:** `vendor_id`, `type`, `destination_id`, `is_active`

#### 12. `RoomType` (أنواع الغرف داخل الفندق)
- **Table Name:** `properties_roomtype`
- **Fields:**
  - `id`: BigAutoField (PK)
  - `accommodation_id`: ForeignKey(`Accommodation`, on_delete=CASCADE, related_name="room_types")
  - `name`: CharField(max_length=100)
  - `total_physical_rooms`: PositiveIntegerField()
  - `base_capacity`: PositiveIntegerField(default=2)
  - `max_extra_beds`: PositiveIntegerField(default=0)
- **Foreign Keys:** `accommodation` -> `Accommodation.id`
- **Unique Constraints:** لا يوجد.
- **B-Tree Indexes:** `accommodation_id`

#### 13. `RatePlan` (خطط الأسعار والوجبات)
- **Table Name:** `properties_rateplan`
- **Fields:**
  - `id`: BigAutoField (PK)
  - `room_type_id`: ForeignKey(`RoomType`, on_delete=CASCADE, related_name="rate_plans")
  - `board_type`: CharField(max_length=5, choices=BoardType.choices, db_index=True) — (`RO`, `BB`, `HB`, `FB`, `AI`)
  - `extra_bed_price`: DecimalField(max_digits=10, decimal_places=2, default=0.00)
- **Foreign Keys:** `room_type` -> `RoomType.id`
- **Unique Constraints:** لا يوجد.
- **B-Tree Indexes:** `room_type_id`, `board_type`

#### 14. `InventoryPricing` (الأسعار والوفرة اليومية — Dynamic Pricing Core)
- **Table Name:** `properties_inventorypricing`
- **Fields:**
  - `id`: BigAutoField (PK)
  - `rate_plan_id`: ForeignKey(`RatePlan`, on_delete=CASCADE, related_name="inventory")
  - `supplier_id`: ForeignKey(`Supplier`, on_delete=CASCADE, related_name="supplied_rates")
  - `date`: DateField(db_index=True) — تاريخ الليلة
  - `price_per_night`: DecimalField(max_digits=10, decimal_places=2)
  - `rooms_available`: PositiveIntegerField()
- **Foreign Keys:** `rate_plan` -> `RatePlan.id`, `supplier` -> `Supplier.id`
- **Unique Constraints:** `unique_together = ("rate_plan", "date", "supplier")` — الحماية الرياضية لمنع الحجز الزائد وتصادم الأسعار.
- **B-Tree Indexes:** `date`, `rate_plan_id`, `supplier_id`

#### 15. `Waitlist` (قائمة الانتظار للتواريخ غير التسعيرية)
- **Table Name:** `properties_waitlist`
- **Fields:**
  - `id`: BigAutoField (PK)
  - `accommodation_id`: ForeignKey(`Accommodation`, on_delete=CASCADE, related_name="waitlist_entries")
  - `room_type_id`: ForeignKey(`RoomType`, on_delete=CASCADE, related_name="waitlist_entries")
  - `requested_date`: DateField(db_index=True)
  - `user_email`: EmailField()
  - `status`: CharField(max_length=10, choices=Status.choices, default="PENDING", db_index=True)
  - `created_at`: DateTimeField(auto_now_add=True)
- **Foreign Keys:** `accommodation` -> `Accommodation.id`, `room_type` -> `RoomType.id`
- **Unique Constraints:** لا يوجد.
- **B-Tree Indexes:** `requested_date`, `status`, `accommodation_id`, `room_type_id`

#### 16. `GranularMarkupRule` (قواعد الأرباح الدقيقة — 4-Layer Markup Engine)
- **Table Name:** `properties_granularmarkuprule`
- **Fields:**
  - `id`: BigAutoField (PK)
  - `title`: CharField(max_length=255)
  - `action`: CharField(max_length=10, choices=Action.choices) — (`INCREASE` / `DECREASE`)
  - `percentage`: DecimalField(max_digits=5, decimal_places=2, default=0.00)
  - `fixed_amount`: DecimalField(max_digits=10, decimal_places=2, default=0.00)
  - `start_date`: DateField()
  - `end_date`: DateField()
  - `is_active`: BooleanField(default=True, db_index=True)
- **ManyToMany Fields:**
  - `target_accommodations` -> ManyToMany(`Accommodation`, blank=True, related_name="markup_rules")
  - `target_room_types` -> ManyToMany(`RoomType`, blank=True, related_name="markup_rules")
- **Foreign Keys:** لا يوجد مباشرة (يستخدم جداول M2M وسيطة).
- **Unique Constraints:** لا يوجد.
- **B-Tree Indexes:** `is_active`

---

## 2. Dynamic Computed Properties & Sequence Generators Audit

### ⚡ 2.1 Public Code Generator (`Trip.public_code`)
- **الصيغة العامّة:**
  - رحلات الإقامة (STAY): `ST-{global_seq:07d}-{dest_code}` (مثل `ST-0000007-SIWA`).
  - رحلات اليوم الواحد (DAYUSE): `DU-{global_seq:07d}-{from_code}-{to_code}` (مثل `DU-0000004-CAI-ALEX`).
- **منطق التوليد الداخلي:**
  - يتم استنتاج `global_seq` تلقائياً ليساوي المعرف الفريد `id` الخاص بالرحلة عند حفظ الكائن للمرة الأولى (`self.global_seq = int(self.pk)`).
  - يتم استنتاج `dest_code` تلقائياً لرحلات STAY عبر مطابقة اسم أو موقع الرحلة مع نموذج `Destination` لمنع توليد قيم غير معروفة `UNK`.
  - يتم إدارة التسلسل الداخلي `internal_seq` لكل مفتاح شركة `internal_key` عبر استعلام ترتيب تنازلي على `internal_seq`.

### ⚡ 2.2 Atomic Reservation R-Sequence Generator (`ReservationSequence`)
- **الصيغة العامّة:** `R0001`, `R0002`, `R0003` (4 أرقام).
- **المنطق والتزامن:**
  - في نموذج `TripRequest` عند إنشاء طلب حجز جديد مرتكيز على `trip_public_code` يتم الدخول في معاملة قفل قاعدة بيانات ذرية (`transaction.atomic()` مع `select_for_update()`) على جدول `ReservationSequence`.
  - يمنع هذا القفل تضارب القراءات عند تزامن طلبات حجز متعددة على نفس الرحلة، ويضمن زيادة `last_r` بمقدار +1 بشكل متسلسل فريد وصحيح.

### ⚡ 2.3 Traveler P-Sequence Generator (`traveler_p`)
- **الصيغة العامّة:** `P01`, `P02` (رقمين للمسافر في المبادرة).
- **المنطق:** يتم حساب أعلى رقم مسافر مسجل لنفس الحجز عبر تجميع `Max("traveler_p")` وزيادته بمقدار +1.

### ⚡ 2.4 Lead Code Generator (`lead_code`)
- **الصيغة العامّة:** `L-{pk:07d}` (مثل `L-0000123`).
- **المنطق:** خاصية محسوبة ديناميكية على كائن `TripRequest` تمثل كود العميل المتوقع وتعتمد على المفتاح الرئيسي `pk`.

### ⚡ 2.5 Full CRM Internal Code (`trip_code`)
- **الصيغة العامّة:** `ST-0000007-SIWA-R0003-P01-L-0000123`.
- **المنطق:** تجميع كامل لكود الرحلة العام + رقم الحجز R + رقم المسافر P + كود العميل L، ويتم تحديث حقل `trip_code` في قاعدة البيانات فورياً باستخدام `update()` لضمان عدم إعادة تفعيل دالة `save()` بشكل نهائي متكرر.

### ⚡ 2.6 Customer PII Security & Data Masking (`identity_hash`)
- **المنطق:** لحماية خصوصية بيانات هوية العملاء وسحب الأرقام القومية/جوازات السفر الأصلية من قاعدة البيانات، يتم احتجاز آخر 4 أرقام فقط في `identity_last4` لعرضها موظفي CRM، بينما يتم تشفير رقم الهوية بالكامل باستخدام التشفير الأحادي المعتمد في Django PBKDF2 SHA256 وحفظ التجزئة في `identity_hash` المضاف إليه قيد الفرادة `unique_true`.

---

## 3. Migration History & Health Audit

تم فحص شجرة الترحيلات (Migration Dependency Tree) لجميع التطبيقات الـ 3 للتأكد من خلوها من الانقسامات (Splits) أو التعارضات:

### 📦 3.1 App `trips` (5 Migrations)
1. `0001_initial.py`: إنشاء `Trip` الأصلي.
2. `0002_trip_dest_code_...py`: إضافة حقول نظام الأكواد العامة (`public_code`, `global_seq`, `internal_key`, `internal_seq`).
3. `0003_destination_activity.py`: إنشاء نموذجي `Destination` و `Activity` وتضمين الفهارس المركبة.
4. `0004_trip_media_trip_social_proof.py`: إضافة حقول الوسائط والمحتوى الترويجي.
5. `0005_alter_trip_...py`: تحسين قيود وأوصاف التسلسلات.
- **الحالة:** سليم ومستقر 100%.

### 📦 3.2 App `trip_requests` (9 Migrations)
1. `0001_initial.py`: إنشاء `TripRequest` المبدئي.
2. `0002_triprequest_assigned_to...py`: إضافة حقول الـ CRM وتعيين الموظفين والملاحظات.
3. `0003_triprequest_nationality...py`: إضافة الجنسية ودولة الإقامة.
4. `0004_triprequest_trip_slug...py`: إضافة عنوان الرحلة والـ slug.
5. `0005_alter_triprequest_trip_code.py`: تعديل أطوال حقل كود الرحلة.
6. `0006_reservationsequence...py`: إضافة جدول تسلسل الحجوزات والفهارس.
7. `0007_alter_triprequest_options...py`: تحديث خيارات الترتيب وأكواد النظام.
8. `0008_remove_reservationsequence...py`: تطهير الحقول الزائدة في التسلسل.
9. `0009_customer_remove_triprequest_leader_age...py`: **فصل بيانات العميل في نموذج `Customer` مستقل وتطبيق التشفير الأحادي PII Masking.**
- **الحالة:** شجرة ترحيلات متسلسلة وخالية من أي تعارض.

### 📦 3.3 App `properties` (2 Migrations)
1. `0001_initial.py`: الهيكل الأساسي لمجهود محرك البحث والأسعار (7 نماذج).
2. `0002_vendorprofile_accommodation_vendor.py`: إضافة نموذج `VendorProfile` وربطه بالمستخدمين والمنشآت.
- **الحالة:** سليم ومستقر 100%.

---

## 4. ORM N+1 Query Audit & Bottleneck Analysis

تم إجراء مراجعة دقيقة لطبقة العرض والخدمات (Views & Serializers) للكشف عن الاستعلامات المتكررة (N+1 Queries) وبطء الأداء:

### 🚨 BOTTLENECK 1 (حرج جداً - High Priority N+1):
- **الموقع:** `trip_requests/views.py` (في الكلاس `TripRequestCRMListView` - السطر 72).
- **الكود الحالي:**
  ```python
  qs = TripRequest.objects.all().select_related("assigned_to")
  ```
- **المشكلة:** المحول `TripRequestCRMListSerializer` يقرأ بيانات العميل عبر الحقول:
  `leader_full_name = serializers.CharField(source="customer.full_name")`
  `leader_phone = serializers.CharField(source="customer.phone")`
  نظراً لعدم تضمين `"customer"` داخل `select_related()`, فإن Django يقوم بإرسال **استعلام SQL منفصل لكل صف** لجلب بيانات `Customer`. عند عرض 100 طلب في الـ CRM, يتم إرسال **101 استعلام SQL بدلاً من استعلام واحد**!
- **التوصية والإصلاح:**
  ```python
  qs = TripRequest.objects.all().select_related("assigned_to", "customer")
  ```

---

### 🚨 BOTTLENECK 2 & RUNTIME BUG (حرج جداً - FieldError Exception):
- **الموقع:** `trip_requests/views.py` (في دالة التصفية `TripRequestCRMListView.get_queryset` - الأسطر 97-99).
- **الكود الحالي:**
  ```python
  search_q = (
      Q(trip_code__icontains=q)
      | Q(trip_public_code__icontains=q)
      | Q(leader_full_name__icontains=q)
      | Q(leader_phone__icontains=q)
      | Q(leader_email__icontains=q)
      | Q(destination_city__icontains=q)
      | Q(origin_city__icontains=q)
  )
  ```
- **المشكلة:** الحقول `leader_full_name` و `leader_phone` و `leader_email` **ليست حقولاً حقيقية في قاعدة البيانات** على نموذج `TripRequest`؛ بل هي خصائص Python (`@property`). عند تشغيل البحث واستخدام معلمة `q` في الاستعلام (`GET /api/crm/trip-requests/?q=ziad`), يتوقف خادم Django فوراً ويرمي خطأ استثناء حرج:
  `FieldError: Cannot resolve keyword 'leader_full_name' into field.`
- **التوصية والإصلاح:**
  يجب تعديل الاستعلام للمرور عبر العلاقة الأجنبية لجدول `Customer` الحقيقي:
  ```python
  search_q = (
      Q(trip_code__icontains=q)
      | Q(trip_public_code__icontains=q)
      | Q(customer__full_name__icontains=q)
      | Q(customer__phone__icontains=q)
      | Q(customer__email__icontains=q)
      | Q(destination_city__icontains=q)
      | Q(origin_city__icontains=q)
  )
  ```

---

### ⚠️ BOTTLENECK 3 (متوسط الأهمية - Detail View Optimization):
- **الموقع:** `trip_requests/views.py` (في الكلاس `TripRequestCRMDetailUpdateView` - السطر 141).
- **الكود الحالي:** `TripRequest.objects.all().select_related("assigned_to")`
- **المشكلة:** عند طلب تفاصيل الطلب (`GET /api/crm/trip-requests/<id>/`), يتم جلب ملاحظات الـ CRM عبر `notes = TripRequestNoteSerializer(...)` وجلب العميل. تقع استعلامات إضافية لجلب العميل ولجلب المستخدم المنشئ للملاحظات `created_by`.
- **التوصية والإصلاح:**
  ```python
  queryset = TripRequest.objects.all().select_related(
      "assigned_to", "customer"
  ).prefetch_related("crm_notes__created_by")
  ```

---

### 🏆 GOLD STANDARD BENCHMARK (نموذج أداء مثالي مثبت):
- **الموقع:** `properties/views.py` (في الكلاس `AccommodationSearchView`).
- **سبب الإشادة:** يستخدم الكلاس تقنية استعلام مثالية مع ضمان منع الـ N+1 بنسبة 100%:
  1. يجلب الأسعار بسلسلة علاقات موحدة:
     `.select_related("rate_plan__room_type__accommodation", "supplier")`
  2. يجلب قواعد الأرباح باستعلام M2M مسبق:
     `.prefetch_related("target_accommodations", "target_room_types")`
  3. يقوم بتخزين معرفات الأهداف داخل مجموعات مجمدة `frozenset` لإجراء الفحص بسرعة زمنية $O(1)$ داخل الحلقة التكرارية للأسعار اليومية.

---

## Summary of Recommendations (ملخص التوصيات لخطة العمل)

1. **إصلاح عاجل للـ CRM Query (Task BE1/BE2 Handoff):**
   تعديل `TripRequestCRMListView` في `trip_requests/views.py` لإضافة `.select_related("customer")` وتصحيح حقول البحث لـ `customer__full_name__icontains` لمنع خطأ `FieldError` والانهيار عند البحث.
2. **إضافة الفهارس الموصى بها مستقبلاً:**
   - إضافة B-Tree index على `TripRequest.customer` و `TripRequest.created_at`.
   - إضافة B-Tree index على `Customer.phone` و `Customer.email` لتسريع عمليات تصفية الـ CRM.

---
*تم إعداد هذا التقرير الفني الشامل بواسطة المطور **BE2 (Database & Migrations Specialist)** بموجب التكليف **TP-AUDIT-BE2-FULL-SYSTEM-001**.*
