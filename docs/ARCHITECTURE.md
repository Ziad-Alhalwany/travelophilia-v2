# 🏛️ Travelophilia Architecture & Design Decisions

> **قاعدة صارمة:** هذا الملف يمثل الدستور التقني للمشروع. يمنع إضافة مكتبات جديدة أو تغيير هيكل العمل دون توثيق هنا أولاً.

## 1. Tech Stack (التقنيات المعتمدة)

- **Frontend:** React.js (via Vite)
- **Styling:** Tailwind CSS v4 + Shadcn UI
- **Backend:** Django + Django REST Framework (DRF)
- **Database:** PostgreSQL
- **Authentication:** JWT (via rest_framework_simplejwt)

## 2. Frontend Rules (قواعد الواجهات)

- **ممنوع كتابة Custom CSS:** الاعتماد الكلي على Tailwind classes.
- **استخدام Shadcn:** لأي مكون UI جديد (أزرار، حقول إدخال، كروت)، يجب استخدام أو تحميل مكونات Shadcn في `src/components/ui`.
- **جلب البيانات (Data Fetching):** يتم مركزياً عبر `src/services/apiClient.js` باستخدام `axios`.
- **حالة المكونات (State):** يتم نقل الـ Logic الخاص بالصفحات القديمة إلى المكونات الجديدة دون فقدان الميزات (مثل FX Rates أو Coupons).

## 3. Backend Rules (قواعد الخوادم)

- **البيانات الحساسة:** تُقرأ حصرياً من `os.getenv` ولا تُكتب (Hardcoded) في `settings.py`.
- **بند أمني غير قابل للتفاوض (Non-Negotiable Security Clause):** يُمنع منعاً باتاً وضع أي قيم افتراضية احتياطية (fallback dev defaults) للمفاتيح الحساسة أو كلمات المرور مثل `SECRET_KEY` أو `DB_PASSWORD` داخل الكود المصدري للمشروع (مثل `settings.py`). يجب قراءة هذه القيم حصرياً من متغيرات البيئة (`os.getenv`)، وفي حال عدم وجودها في بيئة الإنتاج أو التطوير، يجب أن يفشل تشغيل التطبيق فوراً بدلاً من استخدام قيم افتراضية قد تتسرب إلى مستودع الكود.
- **الـ API Responses:** يجب الالتزام الصارم بملف `API_CONTRACT.md`.
- **حماية مسارات الإدارة (CRM):** أي مسار يبدأ بـ `/api/crm/` يجب أن يكون محمياً بصلاحيات `IsCRMUser` أو `IsAdminUser`.
- **فحص الذاكرة المؤقتة (Redis Caching & Fallback Engine):**
  - يدعم النظام فحصاً ديناميكياً غير معطل (Non-blocking TCP socket check) لمنفذ خادم Redis (المنفذ 6379) بمهلة تحقق تبلغ ثانية واحدة (`1-second timeout`).
  - في بيئة التطوير المحلي عند تفعيل وضع `DEBUG = True` وعدم تشغيل خادم Redis، يقوم النظام تلقائياً بالتحويل الآمن للذاكرة المؤقتة المحلية `LocMemCache` بدلاً من انهيار الخادم لتسهيل التطوير المحلي.
  - في بيئة الإنتاج عند وضع `DEBUG = False`، يتم إلغاء التحويل التلقائي وفرض خادم Redis الحقيقي وقراءته مباشرة من متغيرات البيئة دون أي قيم افتراضية، ويفشل تشغيل خادم Django فوراً (ImproperlyConfigured) في حال عدم توافره لضمان جودة الأداء والإنتاج الموثوق.

## 4. Git & Agents Workflow

- يتم العمل بنظام الفروع (Branches) المنفصلة لكل Agent (مثال: `agent/fe1`).
- لا يتم الدمج (Merge) في الفرع الرئيسي `owner/integration` إلا بعد تأكيد الـ Handoff بنجاح.
