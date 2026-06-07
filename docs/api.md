<div dir="rtl">

# API Contracts & Endpoints (Travelophilia Production Specs)

> **Base Path:** `/api`  
> **قاعدة صارمة:** الـ Backend هو المصدر النهائي للحقيقة (Source of Truth). أي طلبات أو استجابات يجب أن تطابق هذا المستند لمنع الـ Hallucinations.

---

## 0) قواعد عامة والتحويل التلقائي (General Rules & Field Mapping)

- كافة المدخلات والمخرجات بصيغة `JSON`.
- التسمية الافتراضية في قاعدة البيانات والـ API هي **snake_case**.
- يدعم نظام التوثيق والتحقق التحويل التلقائي لحقول **camelCase** القديمة القادمة من الواجهات الأمامية إلى حقول **snake_case** قبل المعالجة داخل الـ Serializer.

### 🔄 جدول مطابقة الحقول (camelCase to snake_case Mapping)
عند إرسال طلب إنشاء رحلة أو حجز (`TripRequestCreateSerializer`)، يتم تحويل الحقول تلقائياً كالتالي:

| الحقل المرسل من الواجهة الأمامية (camelCase) | الحقل المقابل في الـ Backend (snake_case) | نوع الحقل والتحقق (Validation) |
| :------------------------------------------ | :--------------------------------------- | :----------------------------- |
| `originCity`                                | `origin_city`                            | `CharField` (مطلوب)            |
| `destinationCity`                           | `destination_city`                       | `CharField` (مطلوب)            |
| `fullName`                                  | `leader_full_name`                       | `CharField` (يُحفظ في Customer) |
| `phone`                                     | `leader_phone`                           | `CharField` (يُحفظ في Customer) |
| `termsAccepted`                             | `terms_accepted`                         | `BooleanField` (يجب أن يكون True) |
| `docsAcknowledged`                          | `docs_acknowledged`                      | `BooleanField` (مطلوب في حال وجود أطفال أو إجابة نعم للمتزوجين) |
| `tripSlug_in`                               | `trip_slug`                              | `CharField` (اختياري)          |
| `tripTitle_in`                              | `trip_title`                             | `CharField` (اختياري)          |

---

## 📌 1. قائمة الـ 14 مساراً النشطة في النظام (14 Active Production Endpoints)

### 🔑 مسارات المصادقة وحماية الجلسة (JWT Authentication)

#### 1. طلب الحصول على التوكين (Obtain JWT Token)
- **المسار:** `POST /api/auth/token` أو `POST /api/auth/token/`
- **الغرض:** تسجيل الدخول للموظفين والحصول على توكين الجلسة وتوكين التحديث.
- **Request Payload:**
  ```json
  {
    "username": "employee_user",
    "password": "secure_password"
  }
  ```
- **Response 200:**
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### 2. تحديث التوكين المنتهي (Refresh JWT Token)
- **المسار:** `POST /api/auth/token/refresh` أو `POST /api/auth/token/refresh/`
- **الغرض:** الحصول على Access Token جديد باستخدام الـ Refresh Token.
- **Request Payload:**
  ```json
  {
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Response 200:**
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5..."
  }
  ```

---

### 🗺️ مسارات الرحلات والوجهات العامة (Trips & Destinations - Public)

#### 3. جلب قائمة الرحلات النشطة (List Trips)
- **المسار:** `GET /api/trips` أو `GET /api/trips/`
- **الغرض:** جلب كل عروض الرحلات الجاهزة والقوالب المتاحة (Templates/Packages).
- **Response 200:**
  ```json
  [
    {
      "id": 7,
      "slug": "siwa-oasis-magic",
      "public_code": "ST-0000007-SIWA",
      "name": "Siwa Magic Stay",
      "type": "STAY",
      "priceFrom": 3500,
      "priceTo": 5000,
      "currency": "EGP",
      "durationNights": 3
    }
  ]
  ```

#### 4. جلب تفاصيل رحلة معينة (Retrieve Trip Details)
- **المسار:** `GET /api/trips/<slug:identifier>` أو `GET /api/trips/<slug:identifier>/`
- **الغرض:** جلب تفاصيل رحلة كاملة باستخدام الـ `slug` أو الـ `public_code`.
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "id": 7,
      "slug": "siwa-oasis-magic",
      "public_code": "ST-0000007-SIWA",
      "name": "Siwa Magic Stay",
      "description": "Full details...",
      "highlights": ["Salt Lakes", "Cleopatra Bath"]
    }
  }
  ```

#### 5. جلب قائمة الوجهات النشطة (List Destinations)
- **المسار:** `GET /api/destinations` أو `GET /api/destinations/`
- **Response 200:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "code": "SIWA",
        "slug": "siwa",
        "name": "Siwa Oasis",
        "cover_image_url": "https://..."
      }
    ]
  }
  ```

#### 6. جلب تفاصيل وجهة معينة (Retrieve Destination Details)
- **المسار:** `GET /api/destinations/<slug:slug_or_code>` أو `GET /api/destinations/<slug:slug_or_code>/`
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "code": "SIWA",
      "slug": "siwa",
      "name": "Siwa Oasis",
      "description": "Details..."
    }
  }
  ```

#### 7. جلب الأنشطة الخاصة بوجهة (Retrieve Destination Activities)
- **المسار:** `GET /api/destinations/<slug:slug_or_code>/activities` أو `GET /api/destinations/<slug:slug_or_code>/activities/`
- **Response 200:**
  ```json
  [
    {
      "id": 12,
      "title": "4x4 Desert Safari",
      "slug": "4x4-desert-safari",
      "price": 800,
      "currency": "EGP",
      "duration_label": "Half-day"
    }
  ]
  ```

#### 8. طلب رحلة مخصصة بالطريقة القديمة (Legacy Custom Trip Request)
- **المسار:** `POST /api/custom-trip` أو `POST /api/custom-trip/`
- **الغرض:** واجهة خلفية متوافقة لدعم النماذج القديمة، تستقبل الـ payload وتحوله لـ TripRequest.
- **Request Payload:** يدعم الصيغتين (camelCase و snake_case).
- **Response 201:**
  ```json
  {
    "success": true,
    "message": "Custom trip request received.",
    "data": { "id": 45, "trip_slug": "..." }
  }
  ```

---

### 📝 مسارات طلبات العملاء العامة (Trip Requests - Public)

#### 9. تسجيل طلب حجز جديد (Create Trip Request)
- **المسار:** `POST /api/trip-requests` أو `POST /api/trip-requests/`
- **الغرض:** تسجيل طلب العميل ومرافقيه، مع حفظ وحجب الهوية الشخصية تلقائياً للمستندات المطلوبة.
- **Request Payload (Canonical):**
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
    "terms_accepted": true,
    "leader_full_name": "Ziad Alhalwany",
    "leader_phone": "01012345678",
    "leader_whatsapp": "01012345678",
    "leader_email": "ziad@example.com",
    "leader_identity_type": "NATIONAL_ID",
    "leader_identity_number": "29901011234567"
  }
  ```
- **Response 201:** يعود ببيانات الحجز المنشأ.

#### 10. توليد أكواد الحجز القديمة للتتبع (Generate Trip Code - Legacy)
- **المسار:** `GET /api/trip-requests/generate-code` أو `GET /api/trip-requests/generate-code/`
- **Response 200:**
  ```json
  {
    "trip_code": "TP-ABC123-XYZ8"
  }
  ```

---

### 💼 مسارات لوحة تحكم الـ CRM المحمية (Protected CRM Endpoints - Staff Only)
> تتطلب توكيد JWT صالح (`IsAuthenticated`) وأن يكون الحساب تابع لفريق خدمة العملاء (`IsCRMUser`).

#### 11. جلب وتصفية طلبات الحجز (List CRM Trip Requests)
- **المسار:** `GET /api/crm/trip-requests` أو `GET /api/crm/trip-requests/`
- **معاملات التصفية والبحث (Query Params):**
  - `status`: NEW, CONTACTED, etc.
  - `priority`: LOW, MEDIUM, HIGH.
  - `q`: بحث نصي في الأسماء، الأكواد، الهواتف، والوجهات.
  - `ordering`: الترتيب (`-created_at`, `priority`).
- **Response 200:** قائمة بـ TripRequests متضمنةً `reservation_code_internal` و `lead_code`.

#### 12. جلب تفاصيل طلب حجز محدد (Retrieve CRM Trip Request Detail)
- **المسار:** `GET /api/crm/trip-requests/<int:pk>` أو `GET /api/crm/trip-requests/<int:pk>/`
- **Response 200:** كائن تفصيلي متكامل يحتوي على بيانات العميل المؤمنة ومرافقيه والملاحظات.

#### 13. تحديث حالة وتفاصيل طلب حجز (PATCH CRM Trip Request)
- **المسار:** `PATCH /api/crm/trip-requests/<int:pk>` أو `PATCH /api/crm/trip-requests/<int:pk>/`
- **Request Payload:**
  ```json
  {
    "status": "QUALIFIED",
    "priority": "HIGH",
    "assigned_to": 3
  }
  ```
- **Response 200:** البيانات المحدثة للطلب.

#### 14. جلب وإنشاء ملاحظات تواصل العملاء (List/Create CRM Trip Request Notes)
- **المسار:** `GET` و `POST` على `/api/crm/trip-requests/<int:pk>/notes` أو `/api/crm/trip-requests/<int:pk>/notes/`
- **في حالة الـ GET:** ترجع مصفوفة بالملاحظات المسجلة.
- **Request Payload (POST):**
  ```json
  {
    "kind": "CALL",
    "body": "Ziad confirmed his travel plan on Tuesday morning."
  }
  ```
- **Response 201:** الملاحظة المنشأة في قاعدة البيانات.

---

### 🏨 مسارات إدارة وحدات الإقامة وتحديثات الإتاحة (Sprint 2: OTA & Extranet Endpoints)

#### 15. الاستعلام عن إتاحة غرف الفندق (Get Property Availability)
- **المسار:** `GET /api/properties/{id}/availability/`
- **الغرض:** الحصول على سجل إتاحة الغرف والأسعار لشهر وسنة حددين لوحدة إقامة معينة.
- **معاملات الاستعلام (Query Parameters):**
  - `month` (رقم صحيح، 1-12) - الشهر المطلوب.
  - `year` (رقم صحيح، e.g. 2026) - السنة المطلوبة.
- **Response 200 (Success):**
  ```json
  [
    {
      "date": "2026-06-01",
      "roomTypeId": 3,
      "ratePlanId": 5,
      "price": 2500.00,
      "allocation": 5,
      "isAvailable": true
    }
  ]
  ```

#### 16. التحديث الجماعي لإتاحة وأسعار الغرف (Bulk Update Property Availability)
- **المسار:** `POST /api/properties/{id}/availability/bulk-update/`
- **الغرض:** تحديث جماعي لأسعار وتخصيصات الغرف في فترة محددة.
- **Request Payload (dict):**
  - `roomTypeId` (int): معرّف نوع الغرفة.
  - `ratePlan` (string): خطة السعر المعتمدة (مثل RO, BB, HB, FB, AI).
  - `price` (decimal/float): سعر الغرفة لليلة.
  - `allocation` (int): عدد الغرف المتاحة.
  - `startDate` (date, YYYY-MM-DD): تاريخ بداية الفترة للتحديث.
  - `endDate` (date, YYYY-MM-DD): تاريخ نهاية الفترة للتحديث.
- **Response 200:**
  ```json
  {
    "success": true,
    "message": "Bulk availability update applied successfully."
  }
  ```

#### 17. محرك البحث المجمع لأسعار الإقامة (Property Aggregator Search)
- **المسار:** `GET /api/properties/search/`
- **الغرض:** البحث والمقارنة لأسعار وتوافر الغرف مع تطبيق خوارزمية الربح الرباعية (4-Layer Markup Pipeline) وحجب الموردين (Identity Masking).
- **Query Parameters:**
  - `accommodation_id` (int): معرّف وحدة الإقامة.
  - `check_in` (date): تاريخ الدخول.
  - `check_out` (date): تاريخ الخروج.
- **Response 200 (Success - camelCase keys after interceptor conversion):**
  ```json
  [
    {
      "roomTypeId": 1,
      "roomTypeName": "Deluxe Room",
      "ratePlanId": 2,
      "boardType": "BB",
      "boardTypeDisplay": "Bed & Breakfast",
      "displayTag": "Special Travelophilia Rate",
      "totalStayPrice": 12000.00,
      "avgPricePerNight": 4000.00,
      "currency": "EGP",
      "nights": 3,
      "dailyBreakdown": [
        {
          "date": "2026-06-01",
          "pricePerNight": 4000.00,
          "roomsAvailable": 5
        }
      ]
    }
  ]
  ```
- **Response 200 (No Inventory):**
  ```json
  {
    "status": "UNAVAILABLE_NOT_SET"
  }
  ```

#### 18. التسجيل في قائمة الانتظار (Join Waitlist Queue)
- **المسار:** `POST /api/waitlist/`
- **الغرض:** حجز مكان على قائمة الانتظار لتواريخ غير نشطة تسعيرياً أو عند نفاد الغرف.
- **Request Payload (dict):**
  - `accommodationId` (int): معرّف وحدة الإقامة.
  - `roomTypeId` (int): معرّف نوع الغرفة.
  - `requestedDate` (date, YYYY-MM-DD): التاريخ المطلوب.
  - `userEmail` (email): البريد الإلكتروني للمستخدم للطلب.
- **Response 201 (Created):**
  ```json
  {
    "id": 8,
    "accommodationId": 2,
    "roomTypeId": 1,
    "requestedDate": "2026-06-15",
    "userEmail": "customer@example.com",
    "status": "PENDING",
    "createdAt": "2026-06-07T12:00:00Z"
  }
  ```

---

## ⚠️ 2. هيكلية استجابة الأخطاء الموحدة (Standardized Error Responses)

في حال حدوث أخطاء تحقق (Validation Errors), يعود الـ Backend بكود 400 ومصفوفة بأسباب الأخطاء مطابقة للمفاتيح:
```json
{
  "terms_accepted": [
    "You must accept terms."
  ],
  "docs_acknowledged": [
    "This field is required."
  ]
}
```

</div>
