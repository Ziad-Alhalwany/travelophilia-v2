# 🛡️ تقرير التدقيق الأمني لرمز التحقق والمسارات المعزولة والبيانات الوصفية
## Security & Code Audit Report: Auth Guards, Route Isolation, and Metadata Endpoint

- **معرف المهمة (Task ID):** SEC-AUDIT-AUTH-METADATA-09
- **الوكيل (Agent):** Security Specialist Agent (`agent/security`)
- **التاريخ:** 2026-06-09
- **الحالة:** ⚠️ **PASSED WITH CONDITIONS (مقبول مع شروط حرجة)**
- **النموذج:** Gemini 3.5 Flash (Medium)

---

## 1. ملخص التقييم (Executive Summary)

تم إجراء تدقيق أمني برمجى شامل على التغييرات المعمارية الأخيرة التي شملت:
1. نظام عزل المسارات للشركاء والموظفين في الواجهة الأمامية (`CRMGuard` و `PartnerGuard` داخل `src/middleware/authGuard.jsx`).
2. آلية تخزين وعزل الرموز الأمنية (Tokens) للموظفين والشركاء.
3. تكوين مسار البيانات الوصفية العام `GET /api/trips/metadata/` من الناحية الأمنية.
4. مطابقة استجابات الأخطاء (401/403) وسلامة واجهة المستخدم.

النظام يظهر متانة ممتازة في عزل الموظفين عن الشركاء وفي إعدادات الحماية الافتراضية للـ Backend. ومع ذلك، تم رصد **ثغرة منطقية حرجة** تتعلق بمصادقة الواجهة الأمامية للشركاء (Mock Authentication) وتعارض في مسارات استدعاء البيانات الوصفية للشركاء، والتي يجب معالجتها قبل الدمج النهائي.

---

## 2. نتائج التدقيق التفصيلية (Detailed Audit Findings)

### 2.1 مراجعة متانة حراس الواجهة الأمامية (Frontend Guard Robustness)
* **المسارات المدققة:** [App.jsx](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/src/App.jsx) و [authGuard.jsx](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/fe1/src/middleware/authGuard.jsx).
* **التقييم:** **PASSED** (من الناحية الهيكلية).
* **التحليل:**
  * استخدام `<Outlet />` و `<Navigate replace />` من `react-router-dom` يمنع تماماً محاولات تجاوز المسارات المحمية على متصفح العميل (Client-Side Bypass).
  * لا توجد تسريبات أمنية ناتجة عن حالات السباق (Race Conditions) لأن عملية التحقق من وجود التوكن تتم بشكل متزامن (Synchronous Check) مباشرة من الـ Local Storage دون انتظار استجابة وعود غير متزامنة (Promises) عند تحميل المكون.
  * **ملاحظة أمنية:** حارس الموظفين `CRMGuard` يتحقق من البنية الأساسية للتوكن عبر تعبير نمطي (`isValidJwt`) في [crmAuth.js](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/src/services/crmAuth.js#L57-L60)، بينما حارس الشركاء `PartnerGuard` يتحقق فقط من وجود أي قيمة نصية (`!!authStorage.getAccessToken()`). هذا يسمح لأي مستخدم بتجاوز الحارس الواجهة الأمامية بمجرد وضع أي نص عشوائي في الـ Local Storage (بالرغم من أن الـ Backend سيمنع جلب البيانات الحقيقية).

### 2.2 نظافة وعزل تخزين الرموز (Token Storage Hygiene)
* **المسارات المدققة:** [crmAuth.js](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/src/services/crmAuth.js) و [authStorage.js](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/src/services/authStorage.js).
* **التقييم:** **ACTION REQUIRED (يتطلب تدخل فوري)**.
* **التحليل:**
  * **عزل كامل للمفاتيح:** يتم حفظ رموز الموظفين تحت مفاتيح مستقلة (`tp_crm_access` / `tp_crm_refresh`) عن رموز الشركاء (`travelophilia_access_token` / `travelophilia_refresh_token`). هذا يمنع تماماً تداخل الجلسات أو التلوث المتبادل (Cross-Contamination).
  * 🔴 **ثغرة حرجة (Mock Auth Bypass):** في ملف [PartnerLoginPage.jsx](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/fe1/src/pages/partners/PartnerLoginPage.jsx#L35-L60)، لا يتم إرسال طلب حقيقي للتحقق من هوية الشريك إلى الخادم. يقوم النموذج بتوليد توكن وهمي تلقائياً وحفظه وتخطي صفحة تسجيل الدخول لأي مدخلات عشوائية. **هذا يمثل ثغرة منطقية يجب استبدالها بربط حقيقي بالخادم قبل الإنتاج.**
  * 🟡 **خلل وظيفي في تسجيل دخول الموظفين (OTP Bug):** في ملف [CrmLoginPage.jsx](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/fe1/src/pages/crm/CrmLoginPage.jsx#L58-L68)، عند تفعيل خيار الـ OTP، يتم فحص الرمز محلياً (`123456`) ثم يتم إرسال طلب `POST` إلى `/api/auth/token/` بكلمة مرور فارغة، مما يؤدي دائماً لفشل المصادقة من جهة الخادم.
  * ⚠️ **خطر XSS:** تخزين الرموز الأمنية النشطة في `localStorage` يجعلها عرضة للسرقة في حال حدوث أي ثغرة حقن نصوص (XSS) عبر حزم الـ JavaScript.
    * *توصية:* يفضل مستقبلاً استخدام ملفات تعريف ارتباط مؤمنة (HttpOnly, Secure, SameSite=Strict Cookies) لنقل التوكنز. للموظفين، يفضل تفضيل `sessionStorage` للحد من عمر الجلسة.

### 2.3 فحص نطاق مسار البيانات الوصفية العام (Backend Public Scope Scan)
* **المسارات المدققة:** [views.py](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/backend/django_api/trips/views.py#L122-L141) و [urls.py](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/backend/django_api/trips/urls.py#L52).
* **التقييم:** **PASSED (آمن وسليم)**.
* **التحليل:**
  * **صلاحيات مفتوحة مبررة:** استخدام `AllowAny` لمسار البيانات الوصفية للرحلات `/api/trips/metadata/` سليم، لكونه يعرض بيانات عامة ضرورية لتشغيل فلاتر البحث للزوار غير المسجلين.
  * **أمان استعلامات الـ SQLi:** يعتمد المسار كلياً على محرك استعلامات Django ORM الآمن (`filter()`, `exclude()`, `values()`, `distinct()`). لا توجد أي استعلامات خام (Raw SQL) أو دمج نصوص، مما يضمن الحماية التامة ضد هجمات حقن SQL.
  * **منع حصاد البيانات (Data Harvesting):** المسار لا يقبل أي بارامترات مدخلة يمكن التلاعب بها لتوسيع النطاق، وهو مقتصر حصرياً على جلب حقول الوجهات السياحية النشطة (`code`, `name`) وأنواع الرحلات النشطة. لا يتم تصدير أي معلومات حساسة للرحلات، أو بيانات المستخدمين، أو الأسعار الخاصة بالشركاء.

### 2.4 الامتثال والاستجابات (Compliance & Responses)
* **التقييم:** **PASSED**.
* **التحليل:**
  * يفرض خادم Django حماية صارمة افتراضية عبر إعدادات `REST_FRAMEWORK` في [settings.py](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/backend/django_api/djconfig/settings.py#L117-L119) لتقييد كافة المسارات غير المحددة بصلاحيات عامة إلى `IsAuthenticated`.
  * محاولة الوصول للمسارات المحمية للموظفين (مثل `/api/crm/trip-requests/`) بدون توكن صالح تُرجع فوراً استجابة JSON معيارية برمز خطأ `401 Unauthorized` دون كشف هيكلية الملفات أو المكونات.
  * الحراس في الواجهة الأمامية تقوم بعملية إعادة التوجيه الفورية وتمنع رسم (Render) المكونات الحساسة للزوار غير المصرح لهم.

---

## 3. فجوة ربط وتكامل هامة (Integration Gap - Critical UX Issue)

أثناء مراجعة الأكواد، تبين وجود تعارض يعطل عمل لوحات تحكم الشركاء:
* في الواجهة الخلفية (Backend)، تم تفعيل مسار البيانات الوصفية كـ `/api/trips/metadata/` ويقوم بإرجاع (`destinations`, `trip_types`).
* في الواجهة الأمامية (Frontend)، تقوم مكونات الشركاء [InventoryDashboard.jsx](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/src/pages/partners/InventoryDashboard.jsx#L183) و [inventoryApi.js](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/src/pages/partners/inventoryApi.js#L25) و [markupApi.js](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/security/src/pages/admin/markupApi.js#L56) بطلب المسار `/api/properties/metadata/` الذي **لا وجود له على الخادم**.
* هذا التعارض سيؤدي إلى فشل تحميل بيانات لوحات تحكم الشركاء بـ `404 Not Found`. كما أن لوحة التحكم للشركاء تتوقع من الـ metadata الحقول التالية: `room_types` و `rate_plans` و `properties` وهي تختلف كلياً عما يقدمه مسار الرحلات العام. يجب على مطور الـ Backend إنشاء المسار المخصص للشركاء وتأمينه.

---

## 4. قائمة الإصلاحات الإلزامية وتوصيات الحماية (Mandatory Patches & Recommendations)

| # | المكون المستهدف | مستوى الخطورة | الإجراء المطلـوب |
|---|---|---|---|
| 1 | `PartnerLoginPage.jsx` | 🔴 **حرجة جداً** | إيقاف آلية الـ Mock Authentication التلقائية وربط عملية تسجيل الدخول بطلب مصادقة حقيقي يرسل للخادم للتحقق من بيانات الشريك. |
| 2 | `CrmLoginPage.jsx` | 🟡 **متوسطة** | إصلاح ثغرة إرسال كلمة مرور فارغة للخادم عند استخدام الـ OTP، وضمان معالجة الـ OTP بشكل متكامل مع الـ Backend أو إزالتها مؤقتاً لتجنب تضليل المستخدم. |
| 3 | `authGuard.jsx` | 🟢 **منخفضة** | تحديث `PartnerGuard` ليتحقق من صلاحية شكل الـ JWT المسترجع (بأن يكون well-formed JWT) باستخدام دالة تحقق موازية لتلك المستخدمة في الموظفين بدلاً من التحقق من مجرد وجود نص. |
| 4 | `properties` (Backend App) | 🔴 **حرجة تشغيلية** | تنفيذ وتأمين مسار `/api/properties/metadata/` لخدمة لوحات تحكم الموردين وإرجاع قائمة الفنادق والعملات وأنواع الغرف والخطط السعرية المرتبطة بالمورد المسجل. |
| 5 | `settings.py` (Production configuration) | 🟡 **متوسطة** | التأكد من إغلاق خيار `DEBUG=False` في بيئة الإنتاج لمنع تسريب الـ Tracebacks وهياكل قاعدة البيانات عند حدوث استجابات أخطاء 500. |

---

## 5. خطة التحقق المقترحة (Verification Plan)

بعد تطبيق الإصلاحات البرمجية من قبل فريقي التطوير (FE & BE):
1. **اختبار عزل المسارات:**
   * محاولة الدخول المباشر إلى `/crm/leads` بدون توكن -> التحقق من التحويل الفوري إلى `/crm/login`.
   * تسجيل الدخول كشريك B2B ثم محاولة فتح `/crm/leads` -> التحقق من إعادة التوجيه لصفحة تسجيل دخول الموظفين وعزل البيانات تماماً.
2. **اختبار المصادقة الحقيقية:**
   * إدخال بيانات خاطئة في صفحة دخول الشريك والتحقق من الرفض.
3. **التحقق من حظر الرموز الزائفة:**
   * وضع قيمة عشوائية `token = "invalid_string"` في `localStorage` للشركاء ومحاولة جلب لوحة التحكم -> التحقق من حظر استدعاءات الـ Backend ورفع استجابة 401.
