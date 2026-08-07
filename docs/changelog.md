<div dir="rtl">

# Changelog — Travelophilia

## [Unreleased]

### Added

- **Magic Companion Link Feature (`AfterSubmitPage.jsx`):** إضافة كود توليد رابط المرافق السحري الشفاف `✨ Magic Companion Link` عند تحديد `companionsMode === "LATER"`. توليد رابط إلكتروني معزز برمز طلب الرحلة وتزويد الواجهة بأزرار النسخ التلقائي بلمسة واحدة (One-Click Copy) والمشاركة المباشرة عبر واتساب.
- **B2B Multi-Auth & Route Isolation:** بوابة مصادقة معزولة بالكامل لشركاء B2B تحت المسار المخصص `/api/auth/partners/token/` بـ namespace مستقل `partners_auth`.
- **Dual Authentication Logic:** دعم الدخول الثنائي عبر كلمة المرور التقليدية أو الرموز المؤقتة الرقمية (OTP) المكونة من 6 أرقام التي تعتمد على خادم Redis وتوفر فترات حظر ومحاولات محدودة لمنع التخمين.
- **B2B Multi-Tenant Models:** إنشاء نموذج `VendorProfile` للربط بين حساب المستخدم والـ `Supplier` وعلاقته بمفتاح أجنبي في جدول `Accommodation` لعزل البيانات.
- **Client Telemetry & Sharing Fraud Prevention:** دمج تتبع الأجهزة غير الشخصية (أبعاد الشاشة، المنطقة الزمنية للعميل، وبيانات المتصفح) أثناء تسجيل الدخول للحد من تداول الحسابات B2B.
- **PWA Connection Resilience Interceptors:** دمج تتبع حالة الاتصال عبر `navigator.onLine` مع معالج Axios لمنع سقوط الجلسات عند انقطاع الإنترنت والتحول التلقائي السلس للعمل غير المتصل.
- **B2B Metadata Endpoint:** إنشاء مسار `/api/properties/metadata/` المحمي والمنعزل لعزل جلب خصائص وغرف وعملات الشركاء والمنشآت التابعة لهم.

### Changed

- **Centralized Brand Layout (`App.jsx`):** تطبيق `AppLayout` كواجهة تجميع مسارات أساسية (`<Route element={<AppLayout />}>`) لتطبيق التدرج الشعاعي الفاخر (`bg-[radial-gradient(circle_at_top,#172634_0,#05090d_55%,#020306_100%)]`) والحدود البصرية الموحدة على كامل التطبيق.
- **TripReservationPage Refactoring (`TripReservationPage.jsx`):** تحويل صفحة حجز الرحلات بالكامل لاستخدام فئات Tailwind v4 المباشرة ومكونات Shadcn UI الرسمية (`Input`, `Button`) وإزالة أكواد الـ `<style>` المدمجة يدوياً.
- **React V2 SPA Routing Overhaul:** استبدال المكونات القديمة لصفحة العميل `Home.jsx` و `TripDetails.jsx` بنسخ الإنتاج الحديثة `HomePage.jsx` و `TripDetailsPage.jsx` مع لف المسارات بالكامل بحراس الحماية `CRMGuard` و `PartnerGuard` في ملف `authGuard.jsx`.
- **Project Structure Transition:** استبعاد كافة ملفات إعدادات Tailwind v3 القديمة (`tailwind.config.js`, `postcss.config.js`) بالكامل واعتماد محرك Tailwind v4 الافتراضي. تنظيف وتطهير هيكل Section 0 في ملف PRD (`requirements.md`) لاستبدال هيكلية Node.js/Express بهيكلية Django/DRF الحقيقية.

### Fixed

- **Purge Duplicate UI Component Leaks (`button.tsx`):** التخلص النهائي من الملف المُضاعف `src/components/ui/button.tsx` لمنع تسريبات وتضارب حزمة Vite أثناء عملية البناء والتجميع والاعتماد الحصري على `button.jsx`.
- **ApiClient Conflict Markers Resolution (`src/services/apiClient.js`):** معالجة وإزالة كافة علامات تعارض Git unmerged conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) في ملف `apiClient.js` والتحقق من سلامة بناء وحدات ES modules وتفعيل خطوط معالجات Axios.
- **Redis Connection Crash Mitigation:** بناء محرك فحص منفذ Redis TCP socket بمهلة تحقق (1 ثانية) للتحول التلقائي للذاكرة المؤقتة المحلية `LocMemCache` في التطوير المحلي عند توقف خادم Redis وتفعيل `DEBUG = True` دون التسبب بانهيار الموقع.
- **CRM Login OTP Payload Bug:** تصحيح ثغرة تمرير حقول كلمة المرور فارغة عند استخدام الـ OTP في تسجيل دخول الموظفين بالواجهة الأمامية وتوجيهها بشكل صحيح.
- **JWT Token Blacklisting Validation:** حظر وتطهير كافة رموز التحديث (Refresh Tokens) النشطة للمستخدم تلقائياً عند تغيير أو إعادة تعيين كلمة المرور عبر `simplejwt.token_blacklist` لضمان سد الثغرات الأمنية الفيدرالية.

---

## [0.1.0] — 2026-01-XX

### Added

- Initial docs system (marketing/analytics/ops/crm/finance/pricing/product)
- Agent workflows + templates + lock protocol

</div>
