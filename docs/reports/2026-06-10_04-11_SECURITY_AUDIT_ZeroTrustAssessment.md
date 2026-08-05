# 🛡️ تقرير التقييم الأمني البرمجي (Zero-Trust Vulnerability Assessment)

- **معرف المهمة (Task ID):** TP-AUDIT-SEC-001
- **الوكيل (Agent):** Security & Compliance Auditor (`agent/security`)
- **التاريخ:** 2026-06-10
- **النموذج (Model):** Gemini 3.5 Flash (High)
- **نطاق العمل (Scope):** مراجعة إعدادات المصادقة (Auth)، الـ Guards في `authGuard.jsx`، الـ Middleware، الـ Masking، وتشفير البيانات والـ Environment Variables في المشروع بالكامل.
- **التزام المقترح (Proposed Commit):** `audit(security): TP-AUDIT-SEC-001 - zero-trust vulnerability assessment report`

---

## 1. ملخص التقييم (Executive Summary)
تم إجراء تدقيق أمني برمجي صارم مبني على مبدأ **الثقة الصفرية (Zero-Trust)** لكامل المستودع لفحص متانة حماية الهويات والبيانات الحساسة والمصادقة. 

النظام يظهر متانة هيكلية ممتازة في عزل وحماية البيانات الحساسة (PII) مثل أرقام الهويات وجوازات السفر عبر قاعدة البيانات، بالإضافة إلى تفعيل نظام إبطال الجلسات (Token Blacklisting) عند تغيير كلمة المرور. ومع ذلك، تم رصد ثغرات برمجية منطقية وتعارضات في مسارات المصادقة بين الواجهة الأمامية والخلفية، وتحديداً عدم تكامل تغييرات بوابة الشركاء B2B المستحدثة في بيئة العمل الحالية.

---

## 2. نتائج الفحص الجنائي (Forensic Checklist Findings)

### 2.1 تدقيق حراس الواجهة الأمامية (`authGuard.jsx`)
* **المسار المستهدف:** [authGuard.jsx](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/src/middleware/authGuard.jsx) و [App.jsx](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/src/App.jsx)
* **التقييم:** ⚠️ **حرجة تشغيلية (Operational Critical)**
* **التحليل التفصيلي:**
  * **الهيكلية:** الحراس `CRMGuard` و `PartnerGuard` يعتمدون على `<Outlet />` و `<Navigate replace />` للتحويل الفوري، مما يمنع تجاوز المسارات عبر التلاعب المباشر بالروابط على متصفح العميل (Client-Side Routing Bypass).
  * **ثغرة عزل التوكنات:** يتحقق `PartnerGuard` من صحة شكل التوكن عبر التعبير النمطي للـ JWT (well-formed JWT format). لكن يظل بإمكان أي مستخدم توليد توكن بالشكل المطلوب محلياً وتجاوز حارس الواجهة الأمامية ليفتح لوحة التحكم (رغم فشل جلب البيانات الحقيقية من الخادم).
  * **🔴 ثغرة عدم تطابق المسارات (Broken Login Flow):**
    * بوابة تسجيل دخول الشركاء في الواجهة الأمامية [PartnerLoginPage.jsx](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/src/pages/partners/PartnerLoginPage.jsx) تستدعي المسار الموثق `/api/auth/partners/token/`.
    * في بيئة عمل `security` الحالية، هذا المسار **غير معرف** على الإطلاق في ملف [urls.py](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/backend/django_api/djconfig/urls.py)، مما يؤدي إلى فشل كامل لعملية تسجيل دخول الموردين بـ `404 Not Found`.
    * بالرجوع لملفات وكيل الـ Backend الأول (`_worktrees/be1`)، نجد أنه قام بإنشاء المسار والـ View الخاصة بـ `PartnerTokenObtainView` وعزلها في `partner_urlpatterns` مع دمجها بـ namespace مخصص، ولكن هذه التغييرات **لم تدمج بعد** في فرع الـ `security`.

---

### 2.2 فحص إعدادات البيئة والثغرات الحساسة (`settings.py`)
* **المسار المستهدف:** [settings.py](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/backend/django_api/djconfig/settings.py)
* **التقييم:** 🔴 **خطورة عالية (High Risk)**
* **التحليل التفصيلي:**
  * **مفتاح السر (`SECRET_KEY`):** يطبق قاعدة عدم وجود قيم افتراضية (No fallbacks) بشكل سليم وينهار التشغيل فوراً برفع `ImproperlyConfigured`.
  * **🔴 ثغرة تجاوز كلمة مرور قاعدة البيانات (`DB_PASSWORD`):**
    * السطران 106-108 يتحققان من قيمة كلمة المرور كالتالي:
      ```python
      DB_PASSWORD = os.getenv("DB_PASSWORD")
      if DB_PASSWORD is None:
          raise ImproperlyConfigured("...")
      ```
    * **مخالفة منطقية أمنية:** في لغة Python، القيمة النصية الفارغة `""` لا تساوي `None`. إذا تم كتابة `DB_PASSWORD=` فارغة في ملف `.env` الحقيقي، سيتخطى الكود هذا الفحص ويحاول الاتصال بقاعدة البيانات بكلمة مرور فارغة بدلاً من انهيار التشغيل الفوري.
  * **المتغيرات الإضافية:** تحتوي الإعدادات على قيم افتراضية لـ `DB_NAME`, `DB_USER`, `DB_HOST`, `DB_PORT` و `REDIS_URL`. في بيئات الإنتاج الحقيقية، يجب حظر هذه القيم الافتراضية لضمان عدم الاتصال بقواعد بيانات التطوير بالخطأ.

---

### 2.3 مراجعة تشفير الهويات وحظر التخزين المحلي للوثائق
* **المسار المستهدف:** [models.py (trip_requests)](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/backend/django_api/trip_requests/models.py)
* **التقييم:**  **PASSED (مطابق لمعايير الأمان)**
* **التحليل التفصيلي:**
  * **تشفير الهويات:** نموذج العميل `Customer` لا يحتوي على حقل لحفظ رقم الهوية الخام في قاعدة البيانات. رقم الهوية يتم استقباله بشكل مؤقت كـ property، وعند الحفظ يتم تشفيره أحادياً باستخدام `make_password` لحفظه كـ `identity_hash` واستخلاص آخر 4 أرقام فقط لـ `identity_last4`. هذا يضمن حماية تامة للهويات من التسريب حتى لو تم اختراق قاعدة البيانات.
  * **الملفات المرفقة:** لا تحتوي نماذج التطبيقات (`trips`, `trip_requests`, `properties`) على أي حقول لرفع الملفات (`FileField` أو `ImageField`) تخص جوازات السفر أو الهويات، مما يضمن أمنياً عدم تخزين أي وثائق أو صور محلياً على السيرفر بما يطابق مستند `SECURITY.md`.

---

### 2.4 التحقق من إبطال التوكنات عند تغيير كلمة المرور
* **المسار المستهدف:** [views.py (properties)](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/backend/django_api/properties/views.py#L400-L451)
* **التقييم:**  **PASSED (مطابق ومعزز أمنياً)**
* **التحليل التفصيلي:**
  * في دالة `PasswordResetView` (المسؤولة عن تغيير كلمة المرور بعد التحقق من الـ OTP)، يتم استدعاء المنطق التالي لإبطال الجلسات:
    ```python
    outstanding_tokens = OutstandingToken.objects.filter(user=user)
    for token in outstanding_tokens:
        BlacklistedToken.objects.get_or_create(token=token)
    ```
  * تطبيق هذه الآلية بالاعتماد على تطبيق `token_blacklist` المدرج في الـ `INSTALLED_APPS` يضمن إبطال جميع رموز التحديث (Refresh Tokens) النشطة للمستخدم فور تغيير كلمة المرور لمنع استمرار الجلسات المخترقة.
  * **ملاحظة معمارية:** رموز الوصول (Access Tokens) الموزعة مسبقاً ستظل صالحة حتى تاريخ انتهاء صلاحيتها (30 دقيقة افتراضياً) لكون التحقق منها لا يمر على قاعدة البيانات بشكل مستمر لضمان الأداء، وهذا سلوك افتراضي ومتوقع لـ JWT.

---

## 3. سجل المخاطر (Security Risk Register)

| معرف الخطر | المكون المستهدف | مستوى الخطورة | وصف التهديد الأمني | الأثر المحتمل |
|---|---|---|---|---|
| **SEC-01** | `djconfig/urls.py` | 🔴 **حرجة جداً** | غياب مسار تسجيل دخول الموردين `/api/auth/partners/token/` عن موجه الـ Django الرئيسي في بيئة الأمان الحالية. | تعطل كامل لبوابة تسجيل دخول الشركاء وظهور خطأ 404 للموردين. |
| **SEC-02** | `settings.py` | 🔴 **عالية** | فحص `DB_PASSWORD` يقبل السلاسل النصية الفارغة ولا ينهار فوراً في حال عدم تعيين قيمة حقيقية للمتغير. | محاولة الاتصال بقاعدة البيانات ببيانات فارغة وسرقة الجلسات أو كشف بيانات الدخول الافتراضية. |
| **SEC-03** | `authGuard.jsx` | 🟡 **متوسطة** | إمكانية تجاوز حارس الشركاء `PartnerGuard` محلياً عبر وضع أي توكن متوافق هيكلياً في الـ Local Storage. | كشف واجهة الشركاء ومكوناتها الرسومية للعامة، على الرغم من عجزهم عن جلب البيانات. |

---

## 4. قائمة الإصلاحات والتوصيات الإلزامية (Next Steps & Action Plan)

1. **إصلاح ثغرة الـ DB_PASSWORD:**
   تحديث شرط التحقق في `settings.py` ليتحقق من القيم الفارغة:
   ```python
   DB_PASSWORD = os.getenv("DB_PASSWORD")
   if not DB_PASSWORD or DB_PASSWORD.strip() == "":
       raise ImproperlyConfigured("The DB_PASSWORD environment variable is required and must not be empty.")
   ```

2. **دمج مسار الشركاء من فرع be1:**
   يجب على مهندس الإصدارات (Release Agent) سحب التعديلات من فرع `be1` لدمج `PartnerTokenObtainView` في `properties/views.py` و `partner_urlpatterns` في ملفات التوجيه لضمان عمل المصادقة الحقيقية.

3. **تعزيز حارس الشركاء في الفرونت إند:**
   عند دمج الواجهة الأمامية بالكامل، ينصح بإجراء فحص أولي مبسط لصلاحية الـ JWT عبر فك تشفيره للتأكد من احتوائه على الصلاحيات المطلوبة (Scopes) قبل رسم اللوحة.

---

## 5. سيناريو اختبار التحقق (Verification Scenario)

### سيناريو تخطي حارس قاعدة البيانات بكلمة مرور فارغة:
1. قم بتهيئة ملف `.env` ليكون يحتوي على السطر التالي: `DB_PASSWORD=` (فارغ).
2. قم بتشغيل خادم التطوير: `python manage.py runserver`.
3. **النتيجة المتوقعة الحالية:** لن ينهار السيرفر فوراً وسيحاول الاتصال بقاعدة البيانات.
4. **النتيجة المطلوبة بعد التعديل:** ينهار الخادم فوراً برفع خطأ: `ImproperlyConfigured`.
