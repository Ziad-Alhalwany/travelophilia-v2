# تقرير التدقيق الهيكلي للمسارات والتصميم (Structural Routing & Layout Audit)

- **Task ID**: TP-AUDIT-FE1-001
- **Agent**: FE1 (UI & Layout Components Developer)
- **Date**: 2026-06-10
- **Model**: Gemini 3.5 Flash (High)
- **Scope**: `/src/pages/`, `/src/components/`, Tailwind v4, Shadcn UI
- **Proposed Commit**: none (تدقيق هيكلي فقط بدون تعديل كود)

---

## 1. ملخص التدقيق والنتائج الرئيسية (Summary & Forensic Findings)

تم إجراء تدقيق هيكلي شامل لمسارات التطبيق (Routing) المعرفة في `App.jsx` ومقارنتها بالملفات الفعلية في `/src/pages/` و `/src/components/` للتحقق من توافقها مع خريطة المشروع وتجنب أي تداخل في التصميم (Design Syntax Violations) بين المكونات الحديثة والمكونات القديمة (Legacy Components) وتحت قواعد Tailwind v4.

### أهم الملاحظات المكتشفة:
1. **عدم تطابق أسماء الملفات مع الخريطة المعتمدة**: بعض الصفحات النشطة تستخدم أسماء ملفات لا تطابق الأسماء المحددة في `FRONTEND_MAP.md` (مثل `Home.jsx` بدلاً من `HomePage.jsx` و `TripDetails.jsx` بدلاً من `TripDetailsPage.jsx`).
2. **تخطي الـ Layout Wrapper الرئيسي**: ملف الـ Layout المشترك `AppLayout.jsx` معرف ولكنه غير مستخدم أو مستورد في `App.jsx` إطلاقاً، حيث تقوم `App.jsx` بعمل الـ Wrapper الخاص بها مباشرة بقيم وتنسيقات مختلفة.
3. **تلوث التصميم ومكونات Legacy**: لا يزال هناك استخدام مكثف لعناصر الأزرار القديمة `<button className="btn-primary">` و `<button className="btn-ghost">` المعتمدة على تنسيقات قديمة في `styles.css` بدلاً من استخدام مكونات Shadcn UI الحديثة (`import { Button } from "@/components/ui/button"`).
4. **تكرار امتدادات المكونات (Compilation Leaks)**: وجود ملفات مكررة بنفس الاسم بامتدادات `.jsx` و `.tsx` داخل مجلد Shadcn الموحد `src/components/ui/` (مثل `button.jsx` و `button.tsx`)، حيث يحتوي ملف الـ `.jsx` على التنسيقات المخصصة للهوية البصرية لشركة Travelophilia بينما يحتوي ملف الـ `.tsx` على الكود الافتراضي (Boilerplate)، مما قد يتسبب في أخطاء تجميع وحل مسارات عشوائية بواسطة Vite.
5. **غياب Magic Companion Link**: توجد هيكلية تدعم إدخال بيانات المرافقين لاحقاً (`companionsMode === "LATER"`)، لكن لا توجد أي معاملات لإنشاء الرابط السحري (Magic Companion Link) أو صفحة استقبال خاصة لاستكمال البيانات.

---

## 2. جدول مطابقة المسارات والمكونات الفعلية (Routing-to-Component Mapping)

يوضح الجدول التالي الحالة الفعلية لكل مسار نشط والمكون المقابل له، مع رصد أي مخالفات لتصميم النظام أو تداخل مع كود قديم:

| المسار (Route) | المكون الفعلي المستورد | مسار الملف الفعلي | حالة المطابقة مع FRONTEND_MAP / المخالفات المرصودة |
| :--- | :--- | :--- | :--- |
| `/` | `Home` | `src/pages/Home.jsx` | ⚠️ **مخالفة تسمية**: الملف الحقيقي اسمه `Home.jsx` بينما الخريطة تتوقع `HomePage.jsx`. |
| `/destinations/:slug` | `TripDetails` | `src/pages/TripDetails.jsx` | ⚠️ **مخالفة تسمية**: الملف الحقيقي اسمه `TripDetails.jsx` بينما الخريطة تتوقع `TripDetailsPage.jsx`. |
| `/trips/:slug` | `TripDetails` | `src/pages/TripDetails.jsx` | ⚠️ **مخالفة تسمية**: الملف الحقيقي اسمه `TripDetails.jsx` بينما الخريطة تتوقع `TripDetailsPage.jsx`. |
| `/choose-your-trip` | `ChooseYourTripPage` | `src/pages/ChooseYourTripPage.jsx` | ⚠️ **مخالفة تصميم**: يستخدم أزرار قديمة بـ classes مثل `btn-primary` بدلاً من Shadcn UI `Button`. |
| `/customize-your-trip` | `CustomizeYourTripPage` | `src/pages/CustomizeYourTripPage.jsx` | ⚠️ **مخالفة تصميم**: يحتوي على Wizard مخصص، ولكنه يستخدم عناصر أزرار HTML قديمة وتنسيقات غير موحدة. |
| `/reserve/:slug` | `TripReservationPage` | `src/pages/TripReservationPage.jsx` | ⚠️ **مخالفة صارمة**: يستخدم وسم `<style>` مدمج داخل كود المكون مع كلاسات تنسيق مخصصة تلتف على Tailwind v4 ونظام Shadcn (`.res-input`, `.res-btn.primary`). |
| `/after-submit` | `AfterSubmitPage` | `src/pages/AfterSubmitPage.jsx` | ⚠️ **مخالفة تصميم**: يستخدم أزرار قديمة بـ classes مثل `btn-ghost` بدلاً من Shadcn UI. |
| `/crm/login` | `CrmLoginPage` | `src/pages/crm/CrmLoginPage.jsx` | ⚠️ **ملف زائد ومربك**: يوجد ملف قديم وغير مستخدم اسمه `src/pages/CRMLoginPage.jsx` مباشرة في المجلد الرئيسي للصفحات قد يسبب ارتباكاً أثناء التطوير. |
| `/crm/leads` | `CRMLeadsPage` | `src/pages/CRMLeadsPage.jsx` | متطابق مع الخريطة ويخضع لـ `CRMGuard`. |
| `/partners/login` | `PartnerLoginPage` | `src/pages/partners/PartnerLoginPage.jsx` | متطابق مع الخريطة. يحتوي على معالج Telemetry و Wizard دخول من خطوتين. |
| `/partners/inventory` | `InventoryDashboard` | `src/pages/partners/InventoryDashboard.jsx` | متطابق مع الخريطة ويخضع لـ `PartnerGuard`. |
| `/admin/markup-rules` | `MarkupRulesManager` | `src/pages/admin/MarkupRulesManager.jsx` | متطابق مع الخريطة ويخضع لـ `PartnerGuard`. |

---

## 3. تفصيل تداخلات الـ Layout و Legacy CSS (Legacy Pollution)

1. **الـ Layout Wrapper**:
   - ملف `src/components/layout/AppLayout.jsx` يحتوي على خلفية مميزة بتدرج شعاعي:
     `bg-[radial-gradient(circle_at_top,#172634_0,#05090d_55%,#020306_100%)]` ومعرف كـ Layout Wrapper افتراضي.
   - لكن في `App.jsx` يتم تجاهل هذا المكون تماماً، ويتم لف الـ Routes مباشرة داخل حاوية:
     `<div className="min-h-screen flex flex-col bg-background text-foreground">`
     مع تحديد الحد الأقصى للعرض بـ `max-w-[85%]` بدلاً من الـ `max-w-7xl` المعرف في `AppLayout`.
   - هذا يسبب فقدان الهوية البصرية الموحدة وتدرجات الألوان الفاخرة للعلامة التجارية عند الانتقال بين بعض الشاشات.

2. **الأزرار القديمة (Pre-Shadcn CSS)**:
   - تم رصد كلاسات الأزرار القديمة (مثل `.btn-primary` و `.btn-ghost` و `.tp-btn`) معرفة في `styles.css` ومستعملة كـ HTML raw `<button>` في الصفحات: `ChooseYourTripPage`, `CustomizeYourTripPage`, `AfterSubmitPage` و `CRMLoginPage`.
   - يجب ترحيل جميع هذه الأزرار لاستخدام مكون Shadcn الموحد `<Button variant="default">` لضمان الاتساق البصري وتوافق سمات إمكانية الوصول (a11y) والأبعاد.

---

## 4. التحقق من الـ Wizards ورابط المرافقين السحري (Wizards & Magic Links)

1. **الـ Wizards الحالية**:
   - **Wizard طلب رحلة مخصصة (`CustomizeYourTripPage.jsx`)**: يحتوي على آلية تحكم بالخطوات (Step Index) والتقدم التفاعلي (Progress Bar) عبر 3 خطوات رئيسية: بيانات قائد الرحلة (Leader) -> اختيار طريقة تعبئة المرافقين (Companion Mode) -> تفاصيل المرافقين (Companion Details).
   - **Wizard تسجيل دخول الشركاء (`PartnerLoginPage.jsx`)**: يحتوي على آلية انتقال من خطوتين: التحقق من اسم المستخدم/الهاتف -> التحقق من كلمة المرور أو الرمز المؤقت (OTP) مع جمع Telemetry المتصفح.

2. **رابط المرافقين السحري (Magic Companion Link)**:
   - عند اختيار خيار "تعبئة بيانات المرافقين لاحقاً" (`companionsMode === "LATER"`) في صفحة حجز الرحلة المخصصة، لا يتم توليد رابط سحري للمرافقين أو معاملات إرسال وتعبئة منفصلة في شاشة التأكيد بعد الإرسال (`AfterSubmitPage`).
   - هذا يمثل فجوة وظيفية وتصميمية، حيث يقتصر عمل صفحة التأكيد حالياً على إرسال تفاصيل الرحلة الأساسية عبر واتساب فقط، دون إتاحة خيار توليد رابط استكمال مخصص للمرافقين.

---

## 5. مخاطر تسريب تجميع الواجهة والتوصيات (Risks & Recommendations)

### المخاطر (Risks):
- **تعارض التجميع (Compilation Collision)**: وجود `button.jsx` و `button.tsx` معاً في `src/components/ui/` قد يؤدي إلى قيام Vite بدمج أو تفضيل النسخة الافتراضية `.tsx` في وضع الإنتاج (Production Build)، مما يتسبب في اختفاء الحواف المدورة المخصصة والـ variants الجديدة المعرفة في نسخة الـ `.jsx`.
- **تفكك التصميم البصري (Visual Fragmentation)**: استخدام ملف `<style>` مدمج داخل `TripReservationPage.jsx` بألوان وتنسيقات خارج نظام التصميم المعتمد يعطي انطباعاً بعدم اكتمال المنتج ويصعب صيانته في المستقبل.

### التوصيات الفورية (Next Steps):
1. **تنظيف مجلد المكونات**: إزالة أو نقل المكونات القديمة غير المستخدمة في `src/components/` (الهيكل المسطح القديم) لضمان نظافة مجلد المكونات المشترك.
2. **حذف الملفات المكررة**: حذف ملفات البويلربليت غير المستخدمة بامتداد `.tsx` في مجلد `src/components/ui/` والاعتماد التام على المكونات المعرفة بـ `.jsx` والتي تحتوي على الهوية المخصصة لـ Travelophilia.
3. **تطبيق الـ Layout الموحد**: إعادة استخدام `AppLayout.jsx` كـ Layout Route حقيقي في `App.jsx` لضمان عمل التدرجات الخلفية الفاخرة بشكل موحد في جميع الصفحات.
4. **توطين التنسيقات**: ترحيل التنسيقات المكتوبة في وسم `<style>` بصفحة الحجز (`TripReservationPage.jsx`) إلى كلاسات Tailwind v4 والاستعاضة عن الحقول المكتوبة يدوياً بمكونات Shadcn UI الموحدة.
5. **تطوير رابط المرافقين**: إسناد مهمة لتطوير صفحة استقبال خاصة بالرابط السحري للمرافقين مع معالج المعلمات المناسب عند اختيار التعبئة اللاحقة.

---

### سيناريو تجريبي موصى به للتحقق (Scenario/Verification Test Plan):
1. قم بتنفيذ أمر البناء التجريبي للتأكد من عدم وجود تعارض بين امتدادات الملفات: `npm run build`
2. افتح كونسول المتصفح وتأكد من عدم وجود تحذيرات متعلقة بتعارض في تعاريف المتغيرات أو كلاسات مفقودة في Tailwind v4.
3. تفحص شاشات الحجز للتأكد من عدم تأثر الأزرار والمدخلات بتحديثات الثيم الموحد.
