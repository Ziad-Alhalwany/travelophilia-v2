# 🛠️ تقرير تشغيل الوكيل BE1 - مسار مصادقة الشركاء B2B

- **معرف المهمة (Task ID):** SEC-BE-OTP-METADATA-CORE
- **الوكيل (Agent):** BE1 (API/Logic)
- **التاريخ:** 2026-06-10
- **النموذج المستخدم (Model):** Gemini 3.5 Flash (High)
- **النطاق (Scope):** `properties` app (views.py, urls.py) & `djconfig/urls.py`
- **المقترح لرسالة الالتزام (Proposed Commit):** `feat(be1): SEC-BE-OTP-METADATA-CORE - B2B partner auth view with OTP/Password dual authentication`

---

## 📝 ملخص التغييرات (Summary)
تم تصميم وبرمجة مسار مصادقة شركاء B2B حقيقي، آمن وقابل للتوسع للتصدي لثغرة الـ Mock Authentication بالواجهة الأمامية وتوفير نقطة نهاية إنتاجية معتمدة على المسار `/api/auth/partners/token/`.

### 1. عزل المسارات ومنع التداخل (Route Isolation & Collision Guard):
- قمنا بتعريف مصفوفة مسارات مستقلة باسم `partner_urlpatterns` داخل ملف [urls.py](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/be1/backend/django_api/properties/urls.py).
- قمنا بدمج هذه المصفوفة بشكل معزول وآمن داخل ملف الإعدادات الرئيسي [urls.py](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/be1/backend/django_api/djconfig/urls.py) باستخدام namespace خاص:
  `path("api/auth/partners/", include((partner_urlpatterns, "properties"), namespace="partners_auth"))`
- هذا الفصل يضمن عدم تسرب مسارات البحث المجمع للـ OTA أو الميتاداتا المالية العامة تحت مسار الشركاء، مما يحل تماماً مشكلة التداخل (Routing Collision).

### 2. منطق التحقق الثنائي الاحترافي (Dual-Auth Engine):
- يستقبل المسار مدخلات تسجيل الدخول (`username`, `password`).
- يتم البحث عن حساب الشريك في قاعدة البيانات ومطابقته بملف تعريف المورد النشط `vendor_profile`.
- **المصادقة بالرمز المؤقت OTP:** إذا كانت كلمة المرور المدخلة مكونة من 6 أرقام، يتم اعتراضها وإحالتها فوراً للتحقق عبر نظام الـ OTP الموحد `OTPService.verify_otp("partners", email, password)`.
- **المصادقة العادية:** في حالة فشل التحقق من الـ OTP أو إذا كانت كلمة المرور غير رقمية، يتم التحقق منها عبر المنطق الافتراضي لـ Django `check_password(password)`.
- **معالجة الأخطاء التفصيلية:** يتم إرجاع أخطاء بدقة على مستوى الحقول (مثال: `{"password": ["Invalid password or OTP code."]}`) بكود 400 Bad Request بدلاً من أخطاء عامة مجهولة.

### 3. خطط التوسع والنمو السحابي (SaaS & Enterprise Hooks):
- **Scoped JWT Tokens:** قمنا بحقن صلاحيات وصول الشريك الهيكلية مباشرة داخل حزمة توكن التنشيط `RefreshToken`:
  `refresh["scopes"] = ["properties:read", "properties:write", "inventory:sync"]`
  `refresh["vendor_id"] = user.vendor_profile.id`
- **التدقيق الأمني الفيدرالي:** قمنا بدمج نظام تسجيل الدخول مع محرك الـ Logging الافتراضي لتسجيل كل تسجيل دخول ناجح مع إرفاق عنوان الـ IP وبيانات العميل (User-Agent) لمنع مشاركة الحسابات والاحتيال.
- **التوافق الجغرافي وحظر الـ VPN:** تم وضع خطاف التحقق الجغرافي وجمع الـ IP للتحقق مستقبلاً من تطابق النطاق وتفادي التلاعب بالأسعار دولياً عبر الشبكات الافتراضية.

---

## ⚠️ المخاطر (Risks)
- لا توجد مخاطر على العمليات الحالية لأن المسار الجديد مضاف بشكل معزول تماماً ومخصص لبوابة الشركاء B2B فقط.

---

## 🗺️ الخطوات التالية (Next Steps)
1. التنسيق مع فريق الواجهة الأمامية (FE1/FE2) لتجربة تسجيل دخول الشريك والتأكد من استقبال وحفظ توكنات الـ Access والـ Refresh بنجاح.
2. مراجعة صلاحيات التوكنات (JWT scopes) على مستوى مسارات الميتاداتا والأسعار المحمية وتفعيل التحقق منها.

---

## 💡 سيناريو افتراضي والاستجابة المتوقعة (Example/Scenario)

### طلب الاستعلام (Request):
`POST /api/auth/partners/token/`
```json
{
  "username": "partner@travelophilia.com",
  "password": "correct_password_or_otp"
}
```

### استجابة السيرفر (Response - 200 OK):
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5..."
}
```

### استجابة السيرفر عند وجود خطأ بالتحقق (Response - 400 Bad Request):
```json
{
  "password": [
    "Invalid password or OTP code."
  ]
}
```
