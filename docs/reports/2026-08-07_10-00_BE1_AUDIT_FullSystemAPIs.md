# 📑 تقرير الفحص والتنسيق الشامل لنظام الـ APIs (Full System API Audit)

- **Task ID:** `TP-AUDIT-BE1-FULL-SYSTEM-001`
- **Agent:** `BE1 (API & Business Logic Specialist)`
- **Date:** `2026-08-07 10:00`
- **Model:** `Gemini 3.6 Flash (High)`
- **Scope:** `backend/django_api/trips/**`, `backend/django_api/trip_requests/**`, `backend/django_api/properties/**`, `backend/django_api/djconfig/urls.py`

---

## 🎯 Summary (الملخص التنفيذي)

تم إجراء مراجعة وفحص دقيق شامل لجميع مسارات الـ API (URL Routes)، والـ Views، والـ Serializers، وقواعد التحقق (Validation Rules)، وآليات توليد الأكواد الفريدة، وحماية البيانات الشخصية (PII Security)، وإدارة المعاملات الماليّة والوفرة عبر تطبيقات Django الثلاثة المعتمدة: `trips`، `trip_requests`، و`properties` بالإضافة إلى مسارات المصادقة العامة والخاصة بالشركاء B2B.

أسفر الفحص عن توثيق **23 مساراً فعالاً** في الخادم مع تحديد كامل لشكل الـ Payload والـ Response، وصلاحيات الوصول، وتحليل دقيق للـ Validation Logic والفجوات التشغيلية مقارنة بمتطلبات الـ Master PRD.

---

## 📌 1. التوثيق الشامل لمسارات النظام (Active API Endpoints Registry)

### 🔑 1.1 مسارات المصادقة والأمان (JWT Auth & B2B Partner Security)

#### 1. POST `/api/auth/token` & `/api/auth/token/`
- **View Class:** `TokenObtainPairView`
- **Permissions:** `AllowAny`
- **Request Payload (snake_case):**
  ```json
  {
    "username": "employee_user",
    "password": "secure_password"
  }
  ```
- **Response Data (200 OK):**
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### 2. POST `/api/auth/token/refresh` & `/api/auth/token/refresh/`
- **View Class:** `TokenRefreshView`
- **Permissions:** `AllowAny`
- **Request Payload (snake_case):**
  ```json
  {
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Response Data (200 OK):**
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5..."
  }
  ```

#### 3. POST `/api/auth/partners/token` & `/api/auth/partners/token/`
- **Namespace:** `partners_auth` (معزول لمنع Routing Collision)
- **View Class:** `PartnerTokenObtainView`
- **Permissions:** `AllowAny`
- **Description:** تسجيل دخول شركاء B2B بدعم المصادقة المزدوجة (كلمة المرور أو رمز OTP المكون من 6 أرقام).
- **Request Payload (snake_case):**
  ```json
  {
    "username": "vendor_partner@example.com",
    "password": "password_or_6digit_otp"
  }
  ```
- **Response Data (200 OK):**
  ```json
  {
    "access": "eyJhbGciOiJIUzI1...",
    "refresh": "eyJhbGciOiJIUzI1..."
  }
  ```

#### 4. POST `/api/auth/otp/send` & `/api/auth/otp/send/`
- **View Class:** `OTPSendView`
- **Permissions:** `AllowAny`
- **Request Payload:**
  ```json
  {
    "portal_name": "partners",
    "email": "vendor@example.com"
  }
  ```
- **Response Data (200 OK):**
  ```json
  {
    "message": "OTP sent successfully."
  }
  ```

#### 5. POST `/api/auth/otp/verify` & `/api/auth/otp/verify/`
- **View Class:** `OTPVerifyView`
- **Permissions:** `AllowAny`
- **Request Payload:**
  ```json
  {
    "portal_name": "partners",
    "email": "vendor@example.com",
    "otp_code": "123456"
  }
  ```
- **Response Data (200 OK):**
  ```json
  {
    "message": "OTP verified successfully."
  }
  ```

#### 6. POST `/api/auth/otp/password-reset` & `/api/auth/otp/password-reset/`
- **View Class:** `PasswordResetView`
- **Permissions:** `AllowAny`
- **Request Payload:**
  ```json
  {
    "portal_name": "partners",
    "email": "vendor@example.com",
    "otp_code": "123456",
    "new_password": "new_secure_password"
  }
  ```
- **Response Data (200 OK):**
  ```json
  {
    "message": "Password reset successfully. All active sessions have been revoked."
  }
  ```

---

### 🗺️ 1.2 تطبيق الرحلات والوجهات (`trips` App)

#### 7. GET `/api/trips` & `/api/trips/`
- **View Class:** `TripsListView`
- **Permissions:** `AllowAny`
- **Serializer:** `TripSerializer`
- **Response Data (200 OK):**
  ```json
  [
    {
      "id": 7,
      "slug": "siwa-oasis-magic",
      "public_code": "ST-0000007-SIWA",
      "global_seq": 7,
      "name": "Siwa Magic Stay",
      "title": "Siwa Magic Stay",
      "location": "Siwa, Matrouh",
      "type": "STAY",
      "description": "Full itinerary description...",
      "media": {},
      "social_proof": {},
      "priceFrom": 3500,
      "priceTo": 5000,
      "currency": "EGP",
      "durationNights": 3,
      "durationLabel": "3N",
      "tags": ["Safari", "Relaxation"],
      "highlights": ["Salt Lakes"],
      "destinationCity": "Siwa",
      "startDate": "",
      "availableDate": "",
      "is_active": true,
      "dest_code": "SIWA",
      "from_code": "",
      "to_code": "",
      "internal_key": "SIWA",
      "internal_seq": 7
    }
  ]
  ```

#### 8. GET `/api/trips/metadata` & `/api/trips/metadata/`
- **View Class:** `TripMetadataView`
- **Permissions:** `AllowAny`
- **Response Data (200 OK):**
  ```json
  {
    "destinations": [
      { "code": "SIWA", "name": "Siwa Oasis" },
      { "code": "DHB", "name": "Dahab" }
    ],
    "categories": ["DAYUSE", "STAY"],
    "trip_types": ["DAYUSE", "STAY"]
  }
  ```

#### 9. GET `/api/trips/<slug:identifier>` & `/api/trips/<slug:identifier>/`
- **View Class:** `TripsDetailView`
- **Permissions:** `AllowAny`
- **Matching Rule:** يبحث أولاً بكود الرحلة العام `public_code__iexact` ثم بالـ `slug__iexact`.
- **Response Data (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": 7,
      "slug": "siwa-oasis-magic",
      "public_code": "ST-0000007-SIWA",
      "name": "Siwa Magic Stay",
      "type": "STAY",
      "priceFrom": 3500,
      "currency": "EGP"
    }
  }
  ```

#### 10. GET `/api/destinations` & `/api/destinations/`
- **View Class:** `DestinationsListView`
- **Permissions:** `AllowAny`
- **Serializer:** `DestinationSerializer`
- **Response Data (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "code": "SIWA",
        "slug": "siwa",
        "name": "Siwa Oasis",
        "country": "Egypt",
        "city": "Siwa",
        "cover_image_url": "https://...",
        "gallery_urls": [],
        "video_urls": [],
        "is_active": true,
        "sort_order": 1
      }
    ]
  }
  ```

#### 11. GET `/api/destinations/<slug:slug_or_code>` & `/api/destinations/<slug:slug_or_code>/`
- **View Class:** `DestinationDetailView`
- **Permissions:** `AllowAny`
- **Response Data (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "code": "SIWA",
      "slug": "siwa",
      "name": "Siwa Oasis",
      "description": "Full description..."
    }
  }
  ```

#### 12. GET `/api/destinations/<slug:slug_or_code>/activities` & `/api/destinations/<slug:slug_or_code>/activities/`
- **View Class:** `DestinationActivitiesView`
- **Permissions:** `AllowAny`
- **Serializer:** `ActivitySerializer`
- **Response Data (200 OK):**
  ```json
  [
    {
      "id": 12,
      "title": "4x4 Desert Safari",
      "slug": "4x4-desert-safari",
      "description": "Safari trip across dunes",
      "price": 800,
      "currency": "EGP",
      "duration": "Half-day",
      "options": [],
      "tags": ["Adventure"],
      "is_active": true,
      "sort_order": 1,
      "destinationCode": "SIWA",
      "destinationSlug": "siwa"
    }
  ]
  ```

#### 13. POST `/api/custom-trip` & `/api/custom-trip/`
- **View Class:** `LegacyCustomTripView`
- **Permissions:** `AllowAny`
- **Serializer:** `TripRequestCreateSerializer`
- **Response Data (201 Created):**
  ```json
  {
    "success": true,
    "message": "Custom trip request received.",
    "data": { ... }
  }
  ```

---

### 📝 1.3 تطبيق طلبات الحجز والـ CRM (`trip_requests` App)

#### 14. POST `/api/trip-requests` & `/api/trip-requests/`
- **View Class:** `TripRequestCreateView`
- **Permissions:** `AllowAny`
- **Serializer:** `TripRequestCreateSerializer`
- **Request Payload (Canonical snake_case & legacy camelCase support):**
  ```json
  {
    "trip_slug": "siwa-oasis-magic",
    "trip_title": "Siwa Magic Stay",
    "origin_city": "Cairo",
    "destination_city": "Siwa",
    "depart_date": "2026-10-15",
    "return_date": "2026-10-18",
    "adults_count": 2,
    "children_count": 0,
    "pax_total": 2,
    "terms_accepted": true,
    "docs_acknowledged": false,
    "leader_full_name": "Ziad Alhalwany",
    "leader_phone": "01012345678",
    "leader_whatsapp": "01012345678",
    "leader_email": "ziad@example.com",
    "leader_identity_type": "NATIONAL_ID",
    "leader_identity_number": "29901011234567"
  }
  ```
- **Response Data (201 Created):**
  ```json
  {
    "id": 105,
    "trip_code": "ST-0000007-SIWA-R0003-P01-L-0000105",
    "trip_public_code": "ST-0000007-SIWA",
    "reservation_r": 3,
    "traveler_p": 1,
    "origin_city": "Cairo",
    "destination_city": "Siwa",
    "status": "NEW",
    "priority": "MEDIUM"
  }
  ```

#### 15. GET `/api/trip-requests/generate-code` & `/api/trip-requests/generate-code/`
- **View Class:** `TripRequestGenerateCodeView`
- **Permissions:** `AllowAny`
- **Response Data (200 OK):**
  ```json
  {
    "trip_code": "TP-ABC123-XYZ8"
  }
  ```

#### 16. GET `/api/crm/trip-requests` & `/api/crm/trip-requests/`
- **View Class:** `TripRequestCRMListView`
- **Permissions:** `IsCRMUser` (`IsAuthenticated` AND (`is_staff` OR `is_superuser`))
- **Query Parameters:** `status`, `priority`, `destination_city`, `origin_city`, `assigned_to`, `q`, `created_from`, `created_to`, `ordering`
- **Serializer:** `TripRequestCRMListSerializer`
- **Response Data (200 OK):**
  ```json
  [
    {
      "id": 105,
      "created_at": "2026-08-07T10:00:00Z",
      "updated_at": "2026-08-07T10:00:00Z",
      "trip_code": "ST-0000007-SIWA-R0003-P01-L-0000105",
      "trip_public_code": "ST-0000007-SIWA",
      "trip_slug": "siwa-oasis-magic",
      "trip_title": "Siwa Magic Stay",
      "reservation_r": 3,
      "traveler_p": 1,
      "is_leader": true,
      "leader_full_name": "Ziad Alhalwany",
      "leader_phone": "01012345678",
      "origin_city": "Cairo",
      "destination_city": "Siwa",
      "status": "NEW",
      "priority": "MEDIUM",
      "reservation_code_internal": "ST-0000007-SIWA-R0003-P01-L-0000105",
      "lead_code": "L-0000105"
    }
  ]
  ```

#### 17. GET & PATCH `/api/crm/trip-requests/<int:pk>` & `/api/crm/trip-requests/<int:pk>/`
- **View Class:** `TripRequestCRMDetailUpdateView`
- **Permissions:** `IsCRMUser`
- **Serializers:** `TripRequestDetailSerializer` (GET), `TripRequestCRMUpdateSerializer` (PATCH)
- **PATCH Request Payload:**
  ```json
  {
    "status": "QUALIFIED",
    "priority": "HIGH",
    "assigned_to": 2,
    "next_followup_at": "2026-08-10T12:00:00Z"
  }
  ```
- **Response Data (200 OK):** الكائن التفصيلي الكامل متضمناً بيانات العميل المؤمنة ومرافقيه والملاحظات.

#### 18. GET & POST `/api/crm/trip-requests/<int:pk>/notes` & `/api/crm/trip-requests/<int:pk>/notes/`
- **View Class:** `TripRequestNoteListCreateView`
- **Permissions:** `IsCRMUser`
- **Serializer:** `TripRequestNoteSerializer`
- **POST Request Payload:**
  ```json
  {
    "kind": "CALL",
    "body": "Customer confirmed booking details and dates."
  }
  ```
- **Response Data (201 Created):**
  ```json
  {
    "id": 12,
    "kind": "CALL",
    "body": "Customer confirmed booking details and dates.",
    "created_by": 2,
    "created_at": "2026-08-07T10:30:00Z"
  }
  ```

---

### 🏨 1.4 تطبيق الفنادق والوفرة والأسعار (`properties` App)

#### 19. GET `/api/properties/search` & `/api/properties/search/`
- **View Class:** `AccommodationSearchView`
- **Permissions:** `AllowAny`
- **Serializers:** `SearchQuerySerializer` (التحقق من المدخلات), `SearchResultSerializer` (تنسيق المخرجات)
- **Query Parameters:**
  - `accommodation_id` (int, required)
  - `check_in` (date YYYY-MM-DD, required)
  - `check_out` (date YYYY-MM-DD, required)
- **Response Data (200 OK - Available Options):**
  ```json
  [
    {
      "roomTypeId": 1,
      "roomTypeName": "Deluxe Room",
      "ratePlanId": 2,
      "boardType": "BB",
      "boardTypeDisplay": "Bed & Breakfast",
      "displayTag": "Special Travelophilia Rate",
      "totalStayPrice": "12000.00",
      "avgPricePerNight": "4000.00",
      "currency": "EGP",
      "nights": 3,
      "dailyBreakdown": [
        {
          "date": "2026-10-15",
          "pricePerNight": "4000.00",
          "roomsAvailable": 5
        }
      ]
    }
  ]
  ```
- **Response Data (200 OK - No Inventory):**
  ```json
  {
    "status": "UNAVAILABLE_NOT_SET"
  }
  ```

#### 20. GET `/api/properties/<int:id>/availability` & `/api/properties/<int:id>/availability/`
- **View Class:** `PropertyAvailabilityView`
- **Permissions:** `AllowAny`
- **Query Parameters:** `start_date`, `end_date`
- **Response Data (200 OK):**
  ```json
  {
    "success": true,
    "accommodationId": 1,
    "availability": [
      {
        "id": 45,
        "ratePlanId": 2,
        "roomTypeId": 1,
        "supplierId": 1,
        "supplierName": "Direct Owner",
        "date": "2026-10-15",
        "pricePerNight": "3500.00",
        "roomsAvailable": 5
      }
    ]
  }
  ```

#### 21. POST `/api/properties/<int:id>/availability/bulk-update` & `/api/properties/<int:id>/availability/bulk-update/`
- **View Class:** `PropertyAvailabilityBulkUpdateView`
- **Permissions:** `AllowAny`
- **Request Payload:**
  ```json
  {
    "updates": [
      {
        "rate_plan_id": 2,
        "supplier_id": 1,
        "date": "2026-10-15",
        "price_per_night": 3600.00,
        "rooms_available": 8
      }
    ]
  }
  ```
- **Response Data (200 OK):**
  ```json
  {
    "success": true,
    "message": "Successfully updated 1 inventory records.",
    "updatedCount": 1
  }
  ```

#### 22. POST `/api/waitlist` & `/api/waitlist/`
- **View Class:** `WaitlistCreateView`
- **Permissions:** `AllowAny`
- **Request Payload:**
  ```json
  {
    "accommodation_id": 1,
    "room_type_id": 1,
    "requested_date": "2026-10-20",
    "user_email": "customer@example.com"
  }
  ```
- **Response Data (201 Created):**
  ```json
  {
    "success": true,
    "message": "Successfully added to waitlist queue.",
    "data": {
      "id": 8,
      "accommodationId": 1,
      "roomTypeId": 1,
      "requestedDate": "2026-10-20",
      "userEmail": "customer@example.com",
      "status": "PENDING",
      "createdAt": "2026-08-07T10:00:00Z"
    }
  }
  ```

#### 23. GET `/api/properties/metadata` & `/api/properties/metadata/`
- **View Class:** `B2BPropertyMetadataView`
- **Permissions:** `IsAuthenticated` (يتطلب ربطه بـ VendorProfile)
- **Response Data (200 OK):**
  ```json
  {
    "properties": [
      { "id": 1, "name": "Siwa Safari Camp" }
    ],
    "room_types": ["Bedouin Tent", "Standard Room"],
    "rate_plans": ["BB", "Half Board"]
  }
  ```

---

## 🔍 2. مراجعة ودراسة الـ Serializer Validation Logic

### 2.1 حماية البيانات الشخصية للتشفير الأحادي (PII Cryptographic Hashing)
- **النموذج والـ Serializer:** `Customer` / `TripRequestCreateSerializer`
- **المنطق:** عند استلام رقم الهوية الشخصية (`leader_identity_number`) سواءً كان رقماً وطنياً أو جواز سفر:
  - يتم اقتطاع آخر 4 أرقام فقط وحفظها في `identity_last4` للعرض الآمن داخل لوحة CRM.
  - يتم تشفير الرقم كاملاً أحادياً باستخدام `django.contrib.auth.hashers.make_password` وحفظه في `identity_hash` المتميز بقيد `unique=True` و `db_index`.
  - يمنع حفظ أرقام الهوية بـ Plain-Text نهائياً في قاعدة البيانات متوافقاً مع معيار الأمن وحماية البيانات `TP-CORE-SEC-001`.

### 2.2 التحقق من الصيغ الرقمية للهوية (PII Regex Validation Rules)
- **المنطق في `TripRequestCreateSerializer.validate()`:**
  - **الرقم القومي المصري (`NATIONAL_ID`):** يتطلب مطابقة صريحة لـ 14 رقماً عدادياً بالتمام (`r"^\d{14}$"`).
  - **جواز السفر الأجنبي (`PASSPORT` / `FOREIGN_PASSPORT`):** يتطلب صياغة حرفية ورقمية بين 6 و 15 خانة (`r"^[A-Za-z0-9]{6,15}$"`).

### 2.3 التسلسل الذري ومنع التضارب للحجوزات (Atomic Sequence Code Generation)
- **الكلاس:** `ReservationSequence`
- **المنطق:**
  - عند إنشاء حجز جديد في `TripRequestCreateSerializer` يتم تنفيذ `ReservationSequence.objects.select_for_update().get_or_create(trip_public_code=tpc)` داخل `transaction.atomic()`.
  - يضمن ذلك عدم تكرار رقم الحجز (`reservation_r`) تحت نفس كود الرحلة العام حتى تحت ضغط الحجوزات المتزامنة الحالية High Concurrency.
  - يتم بناء الكود الداخلي لـ CRM تلقائياً بالصيغة: `ST-0000007-SIWA-R0003-P01-L-0000105`.

### 2.4 التحقق الشرطي للمستندات والوثائق (Conditional Document Acknowledgment)
- **المنطق:** يتم حساب المتطلب `needs_docs = (children_count > 0) or (couples_answer == "YES") or (len(children_details) > 0)`.
- إذا تحقق أحد هذه الشروط ولم يكن الحقل `docs_acknowledged` مساوياً لـ `True` يفشل التحقق مباشرة بكود `400 Bad Request` واستجابة موحدة: `{"docs_acknowledged": ["This field is required."]}`.

### 2.5 محرك الأسعار ذو الأربع طبقات وحظر هوية الموردين (4-Layer Markup Pipeline & Identity Masking)
- **المنطق في `AccommodationSearchView`:**
  - **الطبقة الأولى:** سعر المورد الأساسي Net Price.
  - **الطبقة الثانية:** فائدة المنصة العامة (+10%).
  - **الطبقة الثالثة والرابعة:** تصفية وتطبيق قواعد الأرباح الديناميكية `GranularMarkupRule` (نسبة أو مبلغ ثابت / زيادة أو تخفيض).
  - **حظر هوية المورد (White-Label Masking):** إذا كان المورد `DIRECT` يظهر `Direct price from hotel`؛ أما إذا كان `PARTNER_AGENCY` أو `WHOLESALER` يظهر Tag موحد `Special Travelophilia Rate` لحماية هوية المورد التجارية.

---

## 🚨 3. الفجوات والمسارات المفقودة (Missing Endpoints Gap Analysis vs Master PRD)

بناءً على مراجعة متطلبات النظام الشاملة في Master PRD، تم تحديد الفجوات التالية التي تتطلب إنشاء مسارات جديدة في المراحل القادمة:

| المسار المطلوب (Missing Endpoint) | HTTP Method | الغرض والوصف الوظيفي | التطبيق المستهدف |
| :--- | :--- | :--- | :--- |
| `/api/payments/initiation/` | `POST` | بدء عملية الدفع الرقمي وإنشاء توكين بوابات الدفع (Paymob / Fawry / Stripe). | `payments` (جديد) |
| `/api/payments/webhook/` | `POST` | استقبال الإشعارات الفورية اللحظية من بوابات الدفع وتحديث حالة الحجز تلقائياً. | `payments` (جديد) |
| `/api/coupons/validate/` | `POST` | التحقق من صحة كود الخصم (Promo Code) وحساب قيمة الخصم المتاحة قبل الحجز. | `trips` |
| `/api/trip-requests/lookup/` | `GET` | تمكين العميل من الاستعلام عن حالة حجزه عبر كود الحجز ورقم الهاتف دون الحاجة لتسجيل دخول. | `trip_requests` |
| `/api/crm/reports/summary/` | `GET` | تقديم إحصائيات ولوحة مؤشرات أداء الـ CRM لمشرفي النظام (Total Leads, Conversion Rate). | `trip_requests` |
| `/api/properties/inventory/sync/` | `POST` | واجهة ربط لشركاء B2B لاستيراد وتحديث الأسعار والوفرة عبر ملفات CSV/JSON ضخمة. | `properties` |

---

## 🔒 4. المخاطر التقنية وتوصيات التطوير (Risks & Recommendations)

1. **إعادة تفعيل حماية المسارات في `properties/urls.py`:**
   - حالياً مسارات مثل `/api/properties/<int:id>/availability/bulk-update` تقبل `AllowAny`. يُوصى بربطها بصلاحيات `IsAuthenticated` والتأكد من ملكية المورد للمنشأة المحدثة لمنع التلاعب بالأسعار من أطراف خارجية.
2. **فصل منطق الدفع (Payment Layer Isolation):**
   - ينصح بإنشاء تطبيق مخصص `payments` ينظم التعامل مع Paymob والـ Webhooks للحفاظ على ACID Transactions وعزل العمليات الماليّة.

---

## 📝 Proposed Commit & Summary

- **Proposed Commit:** `audit(be1): complete deep audit report of all DRF views serializers and routing contracts`
- **Status:** Complete & Saved to `../../_shared/agents/be1/reports/_runs/2026-08-07_10-00_BE1_AUDIT_FullSystemAPIs.md`.
