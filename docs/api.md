<div dir="rtl">

# API — Travelophilia (MVP Contract)

> Base Path: `/api`  
> الهدف: عقد واضح بين React و Django.  
> **قاعدة:** الـ Backend هو مصدر الحقيقة الدائم (Source of Truth). يُمنع تعديل هذا الملف دون مهام (Task) و Handoff صريح.
> **نمط التسمية:** كل الـ Endpoints والمخرجات/المدخلات يجب أن تكون **snake_case** حصراً.

---

## 0) قواعد عامة

- كل المدخلات (Requests) والمخرجات (Responses) بصيغة `JSON`.
- الـ Backend validation هو الحكم النهائي في كل البيانات وحقول الـ Form.
- نمط الأخطاء (Error format) موحد عبر كل مسارات الـ API وفق معايير المشروع.
- تنسيق التواريخ هو `YYYY-MM-DD` والأوقات `ISO 8601`.

---

## 1) Trips (List / Detail)

### GET `/api/trips/`
**الغرض:** عرض قائمة الرحلات المتاحة (Templates/Packages).
**Method:** `GET`
**Response 200 (Success):**
```json
{
  "id": 1,
  "slug": "dahab-adventure",
  "public_code": "TP-0001-DAHAB",
  "global_seq": 100,
  "name": "Dahab 4 Days",
  "title": "Dahab 4 Days",
  "location": "Dahab, South Sinai",
  "type": "adventure",
  "description": "Amazing Dahab trip",
  "media": {},
  "social_proof": {},
  "priceFrom": 4500,
  "priceTo": 6000,
  "currency": "EGP",
  "durationNights": 3,
  "durationLabel": "3N",
  "tags": ["diving", "sea"],
  "highlights": ["Blue Hole", "Three Pools"],
  "destinationCity": "Dahab",
  "startDate": "2026-05-01",
  "availableDate": "2026-06-01",
  "is_active": true,
  "dest_code": "DHB",
  "from_code": "CAI",
  "to_code": "DHB",
  "internal_key": "dahab_3n",
  "internal_seq": 1
}
```

### GET `/api/trips/{identifier}/`
**الغرض:** عرض تفاصيل رحلة محددة معتمدة على `slug` أو `public_code`.
**Method:** `GET`
**Response 200 (Success):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "dahab-adventure",
    "public_code": "TP-0001-DAHAB",
    "title": "Dahab 4 Days"
  }
}
```
**Response 404 (Not Found):**
```json
{
  "success": false,
  "message": "Trip not found"
}
```

---

## 2) Destinations 

### GET `/api/destinations/`
**الغرض:** عرض الوجهات السياحية المتاحة.
**Method:** `GET`
**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "DHB",
      "slug": "dahab",
      "name": "Dahab",
      "country": "Egypt",
      "city": "Dahab",
      "description": "A small town on the southeast coast of the Sinai Peninsula.",
      "cover_image_url": "https://...",
      "gallery_urls": [],
      "video_urls": [],
      "is_active": true,
      "sort_order": 1
    }
  ]
}
```

### GET `/api/destinations/{slug_or_code}/`
**الغرض:** عرض تفاصيل وجهة بعينها.
**Method:** `GET`
**Response 200:**
```json
{
  "success": true,
  "data": {
    "slug": "dahab",
    "name": "Dahab"
  }
}
```

### GET `/api/destinations/{slug_or_code}/activities/`
**الغرض:** جلب جميع الأنشطة السياحية الخاصة بوجهة معينة.
**Method:** `GET`
**Response 200:**
```json
[
  {
    "id": 1,
    "title": "Diving at Blue Hole",
    "slug": "diving-blue-hole",
    "description": "Amazing diving experience",
    "price": "1500.00",
    "currency": "EGP",
    "duration": "4 Hours",
    "options": {},
    "tags": ["diving", "water"],
    "is_active": true,
    "sort_order": 1,
    "destinationCode": "DHB",
    "destinationSlug": "dahab"
  }
]
```

---

## 3) Trip Requests (Lead Capture - Website)

### POST `/api/trip-requests/`
**الغرض:** تسجيل طلب حجز جديد (Lead/Trip Request) من قِبل العميل (لا يتطلب تسجيل دخول).
**Method:** `POST`

> **Note:** يدعم الـ API أيضاً الحقول القديمة (legacy camelCase) توافقاً مع واجهات سابقة، لكن العقد الأساسي والمعتمد هو **snake_case**.

**Request (JSON) - Canonical Format:**
```json
{
  "trip_slug": "dahab-adventure",
  "trip_title": "Dahab 4 Days",
  "origin_city": "Cairo",
  "destination_city": "Dahab",
  "depart_date": "2026-07-01",
  "return_date": "2026-07-04",
  "adults_count": 2,
  "children_count": 1,
  "companions_mode": "family",
  "note": "Looking for sea view.",
  "couples_answer": "NO",
  "terms_accepted": true,
  "docs_acknowledged": true,
  "leader_full_name": "Ahmed Mohamed",
  "leader_phone": "01012345678",
  "leader_whatsapp": "01012345678",
  "leader_email": "ahmed@example.com",
  "travelers": [
    { "name": "Traveler 2", "age": 30 }
  ],
  "children_details": [
    { "age": 5 }
  ]
}
```

**Validation Rules:**
- `origin_city` & `destination_city`: Required.
- `terms_accepted`: Required, must be `true`.
- `docs_acknowledged`: Required if there are children (`children_count > 0` or `children_details` provided) OR `couples_answer` = `YES`.
- `travelers` / `children_details`: يتم فلترتها بشدة، يجب أن تكون قائمة الكائنات `(List of dicts)` لمنع حقن السلاسل النصية التالفة.

**Response 201 (Created):**
```json
{
  "trip_slug": "dahab-adventure",
  "trip_title": "Dahab 4 Days",
  "origin_city": "Cairo",
  "destination_city": "Dahab",
  "terms_accepted": true,
  "docs_acknowledged": true,
  "leader_full_name": "Ahmed Mohamed",
  "leader_phone": "01012345678"
}
```

---

## 4) CRM (Protected Endpoints)

> **Authorization:** يتطلب تسجيل الدخول وأن يكون المستخدم من ضمن مستخدمي الـ CRM.

### GET `/api/crm/trip-requests/`
**الغرض:** استعلام واسترجاع كافة طلبات الحجز (للوحة تحكم CRM) مع دعم البحث والترتيب والفلترة.
**Query Params المتاحة:**
- `status`
- `priority`
- `assigned_to`
- `q`: بحث شامل (Text search)
- `ordering`
**Response 200:**
```json
{
  "count": 50,
  "next": "http://...",
  "previous": null,
  "results": [
    {
      "id": 1,
      "created_at": "2026-03-14T12:00:00Z",
      "updated_at": "2026-03-14T12:00:00Z",
      "trip_code": "TP-0001-CAI-R001-P01-L-0000001",
      "trip_public_code": "TP-0001-CAI",
      "trip_slug": "cairo-trip",
      "trip_title": "Cairo Trip",
      "reservation_r": 1,
      "traveler_p": 1,
      "is_leader": true,
      "leader_full_name": "Ahmed Mohamed",
      "leader_phone": "01012345678",
      "origin_city": "Alexandria",
      "destination_city": "Cairo",
      "status": "NEW",
      "priority": "MEDIUM",
      "reservation_code_internal": "TP-0001-CAI-R001-P01-L-0000001",
      "lead_code": "L-0000001"
    }
  ]
}
```

### GET `/api/crm/trip-requests/{id}/`
**الغرض:** تفاصيل طلب محدد لـ CRM، متضمنةً الملاحظات (`notes`).
**Response 200:** كائن `TripRequest` متكامل يحتوي على تفاصيل Lead والـ CRM statuses والـ `notes` التابعة له.

### PATCH `/api/crm/trip-requests/{id}/`
**الغرض:** تحديث حالة الطلب من قِبل موظف CRM (status, priority, assigned_to).
**Request PATCH (JSON):**
```json
{
  "status": "CONTACTED",
  "priority": "HIGH",
  "assigned_to": 2,
  "next_followup_at": "2026-03-20T10:00:00Z"
}
```

### GET / POST `/api/crm/trip-requests/{id}/notes/`
**الغرض:** استرجاع وإضافة الملاحظات الخاصة بالرقم (Notes / Emails / Calls).
**Request POST (JSON):**
```json
{
  "kind": "CALL",
  "body": "Customer was extremely interested, will call back on Tuesday."
}
```
**Response 201:**
```json
{
  "id": 15,
  "kind": "CALL",
  "body": "Customer was extremely interested...",
  "created_by": 2,
  "created_at": "2026-03-14T10:00:00Z"
}
```

---

## 5) Error Format (Standard)
يتم إرجاع الأخطاء (مثل فقدان الحقول أو أنواع البيانات الخاطئة) بطريقة تسّهل على `Frontend` قراءتها وعرضها من خلال مفاتيح (keys) مطابقة للحقول، كالمثال التالي الخاص بطلب 400 Bad Request:
```json
{
  "terms_accepted": [
    "You must accept terms."
  ],
  "docs_acknowledged": [
    "This field is required."
  ],
  "children_details": [
    "Must be a list of objects."
  ]
}
```
</div>
```
