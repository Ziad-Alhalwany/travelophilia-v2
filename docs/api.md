<div dir="rtl">

# API — Travelophilia (MVP Contract)

> Base Path: `/api`  
> الهدف: عقد واضح بين React و Django.  
> **قاعدة:** أي اختلاف بين التنفيذ الفعلي والملف ده لازم يتوثق فورًا (Doc Agent بعد Handoff).

---

## 0) قواعد عامة

- كل Response لازم تكون JSON.
- Backend validation هو الحكم النهائي.
- Error format موحّد (آخر الملف).
- التاريخ/الوقت ISO 8601.
- أي بيانات حساسة ممنوع تتحط في logs أو responses بدون داعي.

---

## 1) Health

### GET `/api/health`

**الغرض:** التأكد إن السيرفر شغال.

**Response 200**

```json
{ "status": "ok" }


2) Custom Trip Request
POST /api/custom-trip

الغرض: استقبال طلب “رحلة مخصصة” وتحويله لـ Lead/TripRequest في الـDB.

Request (Example)

{
  "name": "Ahmed",
  "whatsapp": "01012345678",
  "destination": "Dahab",
  "startDate": "2026-02-10",
  "endDate": "2026-02-14",
  "pax": 2,
  "budgetRange": "medium",
  "accommodationType": "hotel",
  "notes": "quiet + sea view"
}


Validation (Minimum)

name: required, 2–80 chars

whatsapp: required, Egyptian mobile pattern (مثال: 01xxxxxxxxx)

pax: required, min 1, max 50

startDate/endDate: valid dates (لو اتبعتوا)

باقي الحقول optional

Response 201 (Example)

{
  "id": 123,
  "status": "new",
  "createdAt": "2026-01-15T10:00:00Z"
}


Common Errors

400 validation_error (format موحّد)

500 server_error

3) Trips (Templates)
GET /api/trips

الغرض: عرض قائمة الرحلات الجاهزة (Templates).

Response 200 (Example)

[
  {
    "id": 1,
    "title": "Dahab 4D",
    "priceFrom": 4500,
    "currency": "EGP"
  }
]

4) Destinations
GET /api/destinations

الغرض: عرض قائمة الوجهات.

Response 200 (Example)

[
  { "slug": "dahab", "title": "Dahab" }
]

GET /api/destinations/{slug}/

الغرض: تفاصيل وجهة بعينها.

Response 200 (Example)

{
  "slug": "dahab",
  "title": "Dahab",
  "highlights": ["sea", "diving"]
}


Errors

404 not_found

5) Bookings
POST /api/bookings

الغرض: إنشاء حجز (Booking) مرتبط برحلة جاهزة أو طلب مخصص (حسب التصميم).

Request (Example)

{
  "contactName": "Ahmed",
  "whatsapp": "01012345678",
  "tripId": 1,
  "pax": 2,
  "notes": "need airport pickup"
}


Response 201 (Example)

{
  "id": 9001,
  "status": "pending_payment",
  "createdAt": "2026-01-15T10:00:00Z"
}

6) Feedback
POST /api/feedback

الغرض: استقبال تقييم/ملاحظات بعد الرحلة أو بعد خدمة.

Request (Example)

{
  "bookingId": 9001,
  "rating": 5,
  "message": "Great experience"
}


Response 201

{ "ok": true }

7) Error Format (موحّد) — لازم كل الـEndpoints تستخدمه
Response 400 (Example)
{
  "error": {
    "code": "validation_error",
    "message": "Invalid whatsapp number",
    "fields": {
      "whatsapp": "Must be a valid Egyptian mobile number"
    }
  }
}

Response 404 (Example)
{
  "error": {
    "code": "not_found",
    "message": "Resource not found"
  }
}

Response 500 (Example)
{
  "error": {
    "code": "server_error",
    "message": "Unexpected error"
  }
}

8) Notes (Contracts)

لو الـBackend بيرجع snake_case: لازم FE يستخدم converter عام.

أي تغيير في أسماء الحقول أو statuses لازم يتوثق في docs/changelog.md.

أي إضافة event tracking لازم تتوثق في docs/analytics/.

</div>
```
