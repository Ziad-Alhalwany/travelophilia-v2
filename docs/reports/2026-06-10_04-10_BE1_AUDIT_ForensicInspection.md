# تقرير الفحص الأمني والتقني والتدقيق المالي للمسارات والتحويلات - BE1

## معلومات التذكرة والتدقيق (Metadata)
* **Task ID:** TP-AUDIT-BE1-001
* **Agent:** BE1 (API & Business Logic Specialist)
* **Date:** 2026-06-10
* **Model:** Gemini 3.5 Flash
* **Scope:** `trips`, `trip_requests`, `properties` (views.py, serializers.py, urls.py)
* **Proposed Commit:** `None (Audit Only)`

---

## 1. ملخص الفحص والنتائج العامة (Executive Summary)
تم إجراء فحص دقيق (Forensic Inspection) لجميع مسارات الـ API والمحولات (Serializers) وموجهات العناوين (URLs) في تطبيقات `trips` و `trip_requests` و `properties` للتأكد من مطابقتها للقواعد المعمارية والأمنية المعتمدة في مشروع Travelophilia. 
تم التوصل إلى ما يلي:
1. **مسارات الرحلات:** مسار تفاصيل الرحلة `GET /api/trips/<identifier>/` يدعم بشكل صحيح Lookup المزدوج بالاعتماد أولاً على الكود التشغيلي `public_code` ثم الاسم الصديق لمحركات البحث `slug`.
2. **التحقق من الهويات:** هناك **ثغرة تحقق وتدقيق حرجة** في مسار إنشاء الحجوزات `POST /api/trip-requests/`؛ حيث لا يوجد أي كود برمجى يتحقق من صيغ بطاقات الرقم القومي المصري (National ID) أو جوازات سفر الأجانب (Foreigner Passports).
3. **عزل الموردين (B2B):** مسار الميتاداتا `/api/properties/metadata/` مؤمن بالكامل عبر `IsAuthenticated` ويعتمد على حقل المورد `vendor_profile` الخاص بالمستخدم المسجل لعزل البيانات وتأمينها. كما يوجد انفصال تشغيلي تام للمنافذ الخاصة بالشركاء تحت الـ Namespace المحدد `partners_auth` مقارنة بمسارات الـ CRM الخاصة بالموظفين.
4. **تحويل أنماط التسمية (Case Conversion):** لا يوجد Middleware أو Renderer عالمي لتحويل أنماط الكتابة تلقائياً. بدلاً من ذلك، يتم ذلك يدوياً في كلاسات الـ Serializer الفردية. هناك تسريبات واضحة لنمط `snake_case` إلى الواجهة الأمامية في استجابات عدة، وتفاوت في صياغة مدخلات ومخرجات محرك البحث B2B.

---

## 2. تفاصيل الفحص الفني (Detailed Forensic Checklist)

### 📌 البند الأول: التحقق من معرّف الرحلات المزدوج (GET /api/trips/<identifier>/)
* **المسار في الكود:** 
  * الموجه: [backend/django_api/trips/urls.py](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/be1/backend/django_api/trips/urls.py#L20-L24)
  * المتحكم: [backend/django_api/trips/views.py](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/be1/backend/django_api/trips/views.py#L40-L66)

* **التحليل الفني وسير الاستدعاء (Invocation Flow):**
  1. يقوم موجه العناوين بالتقاط المعرف `identifier` باستخدام محول `<slug:identifier>`.
  2. يتم تمرير المتغير إلى دالة `get` في الكلاس `TripsDetailView`.
  3. يتم استدعاء دالة `normalize_code_or_slug(identifier)` لتنظيف المدخلات.
  4. يتم البحث أولاً باستخدام الكود العام التشغيلي `public_code` بأسلوب البحث غير الحساس لحالة الأحرف (`public_code__iexact=s`).
  5. إذا لم يتم العثور على نتيجة، يتم الانتقال إلى البحث البديل باستخدام المعرف التسويقي `slug` بأسلوب (`slug__iexact=s`).
  6. إذا وُجدت الرحلة، تعود الاستجابة بـ `200 OK` والبيانات المعبأة عبر `TripSerializer`. وإلا، يتم إرجاع `404 Not Found` برسالة `"Trip not found"`.

```python
# كود الاستعلام الفعلي في views.py (الأسطر 53-57)
# ✅ 1) public_code (تشغيلي)
trip = Trip.objects.filter(is_active=True, public_code__iexact=s).first()

# ✅ 2) slug (SEO)
if not trip:
    trip = Trip.objects.filter(is_active=True, slug__iexact=s).first()
```

* **ملاحظات الثبات والاستقرار:**
  نظراً لأن الـ `public_code` يتم توليده مثل `ST-0000007-SIWA` (يحتوي فقط على أحرف، أرقام، وشرطات `-`)، فإن محول الـ URL الافتراضي من Django (`slug`) سيعمل بشكل صحيح تماماً ولن يقوم بحجب أو إفشال مطابقة الرابط قبل وصول الطلب للمتحكم.

---

### 📌 البند الثاني: فحص التحقق من الهويات (POST /api/trip-requests/)
* **المسار في الكود:** 
  * الـ Serializer المسؤول: [backend/django_api/trip_requests/serializers.py](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/be1/backend/django_api/trip_requests/serializers.py#L153-L302)
  * كود الحفظ في الموديل: [backend/django_api/trip_requests/models.py](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/be1/backend/django_api/trip_requests/models.py#L32-L81)

* **التحليل الفني والفجوات المكتشفة:**
  1. يقبل الـ Serializer حقول الهوية التالية كحقول اختيارية غير مفروضة بصيغة صارمة:
     * `leader_identity_type`: يمثل نوع الهوية (مثل `NATIONAL_ID` أو `PASSPORT`).
     * `leader_identity_number`: يمثل الرقم الكامل للهوية.
     * `leader_identity_last4`: يمثل آخر 4 أرقام من الهوية.
  2. في دالة `validate(self, attrs)` لا يوجد **أي كود تحقق برمجى** للتحقق من مطابقة المدخلات للأنماط الرسمية سواء للرقم القومي المصري المكون من 14 رقماً أو لجوازات سفر الأجانب.
  3. عند الحفظ، يقوم الـ Serializer أو الموديل باستخلاص آخر 4 أرقام وحفظ الهاش المؤمن `identity_hash` عن طريق `make_password` لحماية الخصوصية الشخصية (Data Masking) امتثالاً للتذكرة `TP-CORE-SEC-001` ولكن دون أي فحص مسبق لصحة الرقم الأصلي.

```python
# الكود في serializers.py يقوم فقط بتمريرها بدون فحص الصلاحية (Validation)
# وفي دالة create يتم الاستخلاص كالتالي:
identity_number = validated_data.pop("leader_identity_number", "")
identity_last4 = validated_data.pop("leader_identity_last4", "")
if identity_number and not identity_last4:
    identity_last4 = identity_number[-4:] if len(identity_number) >= 4 else identity_number
identity_hash = make_password(identity_number) if identity_number else ""
```

* **فجوة التنفيذ (Implementation Gap):**
  يمكن للمستخدم إدخال نصوص عشوائية، أو أرقام هويات غير صالحة البنية، أو أرقام قصيرة جداً (مثال: `"abcd"`) وسيتم قبولها وتجزئتها دون إطلاق أي خطأ (Validation Error).

---

### 📌 البند الثالث: مسار ميتاداتا الموردين وعزل الحسابات (GET /api/properties/metadata/)
* **المسار في الكود:**
  * الموجه: [backend/django_api/properties/urls.py](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/be1/backend/django_api/properties/urls.py#L46-L55)
  * المتحكم: [backend/django_api/properties/views.py](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/be1/backend/django_api/properties/views.py#L287-L343)

* **التحليل الفني وعزل البيانات (Tenant Isolation):**
  1. يفرض كلاس `B2BPropertyMetadataView` حماية صارمة عبر سطر الصلاحيات: `permission_classes = [IsAuthenticated]`.
  2. في داخل الطلب، يتم التحقق أولاً من ارتباط الحساب بملف مورد `vendor_profile`؛ فإذا لم يوجد، يتم إرجاع `403 Forbidden` برسالة حظر صريحة.
  3. يتم جلب وحدات الإقامة (`Accommodation`) المرتبطة **حصرياً** بهذا المورد النشط:
     `accommodations = Accommodation.objects.filter(vendor=vendor, is_active=True)`
  4. بناءً على هذه التصفية الضيقة، يتم قصر أنواع الغرف والخطط السعرية المستعلم عنها على الوحدات التي يملكها المورد فقط.
  5. تضمن هذه الآلية عزل البيانات التام والآمن؛ حيث يمنع المورد من استطلاع ميتاداتا أو خطط أسعار أو غرف المنافسين الآخرين.

* **الانفصال التشغيلي عن مسارات الموظفين (CRM):**
  * تم عزل مسارات مصادقة الشركاء `PartnerTokenObtainView` بالكامل في موجه العناوين الرئيسي للمشروع [backend/django_api/djconfig/urls.py](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/be1/backend/django_api/djconfig/urls.py#L17) تحت الـ Namespace الخاص والمحمي `partners_auth`.
  * تطلب مسارات الـ CRM صلاحيات Staff عبر الكلاس `IsCRMUser` لحماية العمليات الداخلية تماماً عن الموردين الخارجيين.

* **فجوة المخطط والمسارات في تطبيق properties:**
  بالبحث في ملفات `properties/urls.py` و `properties/views.py` وجدنا أن المسارات المذكورة في خريطة الـ Backend (`BACKEND_MAP.md`) للتعديل الجماعي والاستعلام عن الإتاحة الشهرية وقائمة الانتظار غير موجودة فعلياً في الكود البرمجي للملفات:
  * لا توجد مسارات لـ `/api/properties/<int:id>/availability/`
  * لا توجد مسارات لـ `/api/properties/<int:id>/availability/bulk-update/`
  * لا توجد مسارات لـ `/api/waitlist/`
  * الموديل `Waitlist` موجود في قاعدة البيانات ولكن لا يدعمه أي View حالي لخدمته.

---

### 📌 البند الرابع: جسر التحويل التلقائي وتسرب أنماط الأحرف (Casing Case Conversion)
* **التحليل الفني وأسلوب العمل:**
  * لا يعتمد المشروع على أي حزمة خارجية للتحويل التلقائي لحالة الأحرف (مثل `djangorestframework-camel-case`).
  * يتم تطبيق تحويل حالة الأحرف يدوياً ومجزأً على مستويين:
    1. **مستوى الاستجابة (Output):** تقوم كلاسات السيرياليزر بتسمية حقولها مباشرة بنسق الـ `camelCase` (مثل `pricePerNight` في `DayPriceSerializer`).
    2. **مستوى الاستقبال (Input):** يعتمد سيرياليزر الطلبات `TripRequestCreateSerializer` على تعريف متغيرات استقبال باسم الـ `camelCase` وجعلها `write_only=True` ثم إعادة تعيين قيمها إلى الحقول المقابلة بـ `snake_case` داخل دالة التحقق `validate()`.

* **تسريبات التسميات المزدوجة (Mixed Casing Styles Leaks):**
  تم رصد ثلاثة مواضع رئيسية لتسريب أنماط التسمية التي قد تسبب خللاً في اتساق الـ Frontend:
  1. **واجهة ميتاداتا الموردين (`/api/properties/metadata/`):**
     ترجع المفاتيح الرئيسية في استجابة الميتاداتا بنسق الـ `snake_case` الصريح للواجهة الأمامية:
     ```json
     {
         "properties": [...],
         "room_types": [...], // تسريب snake_case
         "rate_plans": [...]  // تسريب snake_case
     }
     ```
  2. **استجابة إنشاء طلب الحجز (`POST /api/trip-requests/`):**
     يعيد السيرياليزر استجابة نجاح الإنشاء (`Response 210/201`) متضمنة جميع الحقول الافتراضية لقاعدة البيانات بنسق الـ `snake_case` (مثل `origin_city`, `destination_city`, `terms_accepted`, `leader_full_name`) بدلاً من صيغة الـ `camelCase` التي يتوقعها الـ Frontend عادةً.
  3. **مدخلات محرك البحث المجمع (`GET /api/properties/search/`):**
     يستقبل المدخلات بنسق `snake_case` حصرياً (`accommodation_id`, `check_in`, `check_out`) بينما تعود الاستجابة ومصفوفة الأسعار اليومية بنسق الـ `camelCase` (`roomTypeId`, `totalStayPrice`, `pricePerNight`).

---

## 3. المخاطر والتهديدات التقنية (Risks & Vulnerabilities)
1. **تخطي التحقق الرقمي للهويات (Identity Validation Bypass):**
   إتاحة إدخال أي نصوص في حقول الرقم القومي أو جواز السفر يضر بدقة بيانات الحجوزات التشغيلية وصحتها القانونية قبل تصدير البيانات للفنادق أو شركات السياحة.
2. **عدم اتساق استهلاك المسارات بالواجهة الأمامية (Frontend Parsing Errors):**
   وجود تداخل وتسريب بين الحالات (تلقي طلبات بـ `camelCase` وإرجاع مخرجات بـ `snake_case` في بعض النقاط) يؤدي إلى أخطاء فك استجابة الـ JSON في الـ Frontend في حال إهمال المطابقة التلقائية بـ Interceptors.
3. **فجوة الميزات المعطلة بالـ OTA:**
   غياب منافذ تحديث الأسعار الجماعية وتوافر الغرف لـ Extranet الموردين يؤثر بشكل مباشر على وظائف التشغيل الأساسية.

---

## 4. الخطوات القادمة المقترحة والمخطط البرمجي للتعديل (Next Steps)
1. **تضمين محقق صيغ الهويات (Validation Regex):**
   إضافة دوال تحقق مخصصة في `validate` داخل `TripRequestCreateSerializer` للتحقق من أطوال وبنية أرقام الهويات وجوازات السفر.
2. **معالجة مخرجات ميتاداتا الموردين وجعلها متسقة:**
   تعديل مفاتيح الاستجابة في `B2BPropertyMetadataView` لتصبح `roomTypes` و `ratePlans`.
3. **تطوير مسارات وواجهات الإتاحة وقائمة الانتظار المفقودة:**
   برمجة منافذ `GET/POST` للإتاحة الشهرية للغرف والتعامل مع طلبات الانتظار.

---

## 5. سيناريو توضيحي عملي (Example/Scenario)

### سيناريو تخطي التحقق من الهوية (Validation Bypass Scenario)
* **طلب مرسل من الواجهة الأمامية:**
  ```json
  POST /api/trip-requests/
  {
      "originCity": "Cairo",
      "destinationCity": "Siwa",
      "termsAccepted": true,
      "leader_full_name": "Ziad Alhalwany",
      "leader_identity_type": "NATIONAL_ID",
      "leader_identity_number": "NOT_A_VALID_NATIONAL_ID_12345"
  }
  ```
* **سلوك النظام الفعلي:**
  1. يقبل `TripRequestCreateSerializer` الحقل `"NOT_A_VALID_NATIONAL_ID_12345"`.
  2. يقوم الموديل باستخلاص آخر 4 محارف `"2345"` ويخزنها في `identity_last4`.
  3. يتم تشفير النص كاملاً كهاش ويخزن في قاعدة البيانات بدون أي تحذير أو اعتراض.
  4. تعود الاستجابة بـ `201 Created` وتحتوي على حقول الـ `snake_case` المسربة مثل:
     ```json
     {
         "origin_city": "Cairo",
         "destination_city": "Siwa",
         "leader_identity_last4": "2345"
     }
     ```
