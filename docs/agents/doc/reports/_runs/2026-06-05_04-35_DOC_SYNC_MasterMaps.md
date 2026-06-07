# تقرير مزامنة المخططات والوثائق المركزية (Master Maps Synchronization Report)

**رمز المهمة الأساسي:** `TP-CORE-SEC-001`  
**تاريخ التنفيذ:** 2026-06-05 04:35  
**العميل المسؤول:** Doc Agent  

---

## 📌 ملخص العملية (Executive Summary)

تم بنجاح إتمام عملية المزامنة الشاملة (Full Synchronization) بين التوصيفات البرمجية والوثائق المركزية ومستودع الكود الفعلي (Physical Codebase) في مشروع **Travelophilia**. تضمن هذه العملية تطابقاً بنسبة 100% لمنع حدوث أي استدعاءات أو افتراضات خاطئة (Hallucinations) من قِبل المطورين أو عملاء الذكاء الاصطناعي (AI Agents) مستقبلاً. تم تحديث النسخ المشتركة (`_shared/docs/`) والنسخ المحلية (`Travelophilia v2/docs/`) بشكل متزامن.

---

## 🛠️ تفاصيل التحديثات المنجزة (Completed Sync Activities)

### 1. خريطة الباكيند (`BACKEND_MAP.md`)
تم توثيق كافة نماذج قاعدة البيانات الثمانية (**8 Active Models**) مع حقولها القيادية والخصائص المحسوبة (Computed Properties) كالتالي:
* **تطبيق `trips`:**
  - **`Destination`:** إدارة الوجهات السياحية مع معالجة الـ `slug` والـ `code` تلقائياً.
  - **`Activity`:** إدارة الأنشطة السياحية والـ Add-ons المرتبطة بالوجهات، مع قيد فريد مركب على `(destination, slug)`.
  - **`Trip`:** نموذج الرحلات (STAY/DAYUSE). تم توثيق نظام الأكواد العامة (`public_code`, `global_seq`, `dest_code`, `from_code`, `to_code`, `internal_key`, `internal_seq`) والخصائص والمنطق الداخلي مثل `_is_dayuse()`, `_compute_internal_key()`, و `_build_public_code()`.
  - **`LegacyCustomTrip`:** أرشفة الـ payloads لطلبات الرحلات القديمة بصيغة JSON.
* **تطبيق `trip_requests`:**
  - **`ReservationSequence`:** عداد تسلسل الحجوزات لضمان عدم تكرار الـ R-Values.
  - **`Customer`:** النموذج المؤمن والمعدل حديثاً تحت تذكرة الأمان (TP-CORE-SEC-001) والذي يشتمل على حقول الهوية المؤمنة: `identity_type`, `identity_last4`, وقيد التشفير الأحادي `identity_hash` لضمان حجب البيانات وحمايتها (Data Masking).
  - **`TripRequest`:** نموذج الطلبات والحجوزات الأساسي، وتم توثيق الخصائص المحسوبة لترميز الحجز والعملاء: `reservation_code`, `traveler_code`, `lead_code` والدوال الداخلية لـ CRM مثل `_build_internal_code()`.
  - **`TripRequestNote`:** ملاحظات موظفي الـ CRM مع تحديد حقول خيارات الاتصال (`Kind`).

---

### 2. عقد الـ API والمطابقة (`api.md`)
تم إعادة بناء الملف بالكامل ليعكس **14 مساراً نشطاً (Active Production Endpoints)** في بيئة الإنتاج:
1. **المصادقة:** `POST /api/auth/token` و `POST /api/auth/token/refresh` للحصول على وتحديث توكينات JWT.
2. **الرحلات والوجهات:** `GET /api/trips`, `GET /api/trips/<slug:identifier>`, `GET /api/destinations`, `GET /api/destinations/<slug_or_code>`, و `GET /api/destinations/<slug_or_code>/activities`.
3. **طلبات الحجز العامة:** `POST /api/custom-trip` (المسار القديم)، `POST /api/trip-requests` (المسار المعتمد)، و `GET /api/trip-requests/generate-code`.
4. **لوحة الـ CRM المحمية:** `GET /api/crm/trip-requests` (مع دعم الفلاتر والبحث والترتيب)، `GET /api/crm/trip-requests/<int:pk>`, `PATCH /api/crm/trip-requests/<int:pk>`, و `GET / POST /api/crm/trip-requests/<int:pk>/notes`.
* **مطابقة الحقول (Payload Mapping):** تم توثيق التحويل التلقائي المدمج في الـ Serializer من صيغة **camelCase** إلى **snake_case** مثل:
  - `originCity` ➡️ `origin_city`
  - `fullName` ➡️ `leader_full_name`
  - `termsAccepted` ➡️ `terms_accepted`
  - `docsAcknowledged` ➡️ `docs_acknowledged`

---

### 3. بنية الأمان في الدستور التقني (`ARCHITECTURE.md`)
تم إدراج بند أمني صارم وغير قابل للتفاوض (**Non-Negotiable Security Clause**) لمنع وجود أي كلمات مرور أو مفاتيح تشفير افتراضية صلبة (Hardcoded defaults) في السورس كود:
* **النص المضاف:** يُمنع منعاً باتاً وضع أي قيم افتراضية احتياطية (fallback dev defaults) للمفاتيح الحساسة أو كلمات المرور مثل `SECRET_KEY` أو `DB_PASSWORD` داخل الكود المصدري للمشروع (مثل `settings.py`). يجب قراءة هذه القيم حصرياً من متغيرات البيئة (`os.getenv`)، وفي حال عدم وجودها في بيئة الإنتاج أو التطوير، يجب أن يفشل تشغيل التطبيق فوراً بدلاً من استخدام قيم افتراضية قد تتسرب إلى مستودع الكود.

---

### 4. خريطة الفرونتيند ومسارات الموجه (`FRONTEND_MAP.md`)
تم تصحيح وتعديل مسارات الـ React router لتطابق البنية الفعلية لملفات الصفحات الديناميكية المعرّفة في الموجه الرئيسي (`App.jsx`):
* تم ربط المكون `CRMLoginPage.jsx` بالمسار الفعلي `/crm/login`.
* تم ربط المكون `CRMLeadsPage.jsx` بالمسار الفعلي `/crm/leads`.
* تم توثيق عملية التحويل التلقائي (Redirect) عند محاولة الدخول إلى `/crm` ليوجه المستخدم تلقائياً إلى `/crm/leads`.

---

## 🔒 التحقق والسلامة (Verification & Integrity)

1. **سلامة الكود:** لم يتم إجراء أي تعديل أو لمس لأي ملف برمي من سورس كود التطبيق (لا يوجد تغيير في كود الباكيند أو الفرونتيند).
2. **تطابق النسخ:** تم مراجعة كلا النسختين المشتركة والمحلية لملفات التوثيق والتأكد من مطابقتها التامة والتزامها بصيغة الماركدوان القياسية (Standard Markdown).
