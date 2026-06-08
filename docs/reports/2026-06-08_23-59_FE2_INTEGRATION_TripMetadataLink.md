# تقرير إتمام المهمة: ربط البيانات الوصفية للرحلات والتصفية الديناميكية

* **Task ID:** TP-OTA-FE-METADATA-LINK-02
* **Agent:** FE2 (Integration & State)
* **Date:** 2026-06-08
* **Model:** Gemini 3.5 Flash (Medium)
* **Scope:** `src/services/apiClient.js`, `src/pages/ChooseYourTripPage.jsx` (مع استبعاد `PropertyCalendar.jsx` بالكامل)
* **Proposed Commit:** `feat(fe2): integrate verified trips metadata and UI_LAYOUT_CONFIG for ChooseYourTripPage`

---

## 1. ملخص التنفيذ (Summary)
تم ربط الواجهة الأمامية بالمسار الموثق والآمن من الواجهة الخلفية `GET /api/trips/metadata/` ليكون المصدر الوحيد للحقيقة (Source of Truth) لبيانات الفلاتر والتصنيفات.

التغييرات التفصيلية:
1. **Network Client (`apiClient.js`):**
   - إضافة الدالة المصدّرة `getTripMetadata(signal)` لإجراء طلب `GET` للمسار `/api/trips/metadata/`.
   - تحديث `getTrips(params, signal)` لتلقي وتمرير الـ `AbortSignal`.
2. **Dynamic UI Tabs (`ChooseYourTripPage.jsx`):**
   - إضافة مصفوفة الإعدادات `UI_LAYOUT_CONFIG` محلياً لتطبيق رغبات إدارة التسويق والتشغيل وتوزيع أنواع الرحلات من الـ Backend على 3 ألسنة تصفية:
     - `escapes` (روقان واستجمام) -> `STAY` و `SEA_ESCAPE`
     - `dayuse` (خروجات اليوم الواحد) -> `DAYUSE`
     - `adventure` (مغامرة واستكشاف) -> `ADVENTURE` و `CITY_ESCAPE`
   - تمكين جلب الرحلات والبيانات الوصفية بالتوازي (Parallel Fetching) باستخدام `AbortController` موحّد لتسريع وقت التحميل وتقليل وقت الـ LCP وحماية المتصفح من تسريبات الذاكرة (Memory Leaks).
3. **UI/UX Polishing:**
   - تصميم واجهة انتظار مهيكلة نابضة (Pulsing Dark Skeleton Loader) تحاكي تقسيم الـ Tabs والفلاتر والكروت للقضاء تماماً على Cumulative Layout Shift (CLS).
   - توفير شاشة خطأ مخصصة تحتوي على زر "إعادة المحاولة" (Retry) لتسهيل إعادة الاتصال بالخادم.
4. **تأكيد السلامة:**
   - تم تشغيل `npm run build` بنجاح وتجاوز مرحلة الـ build دون أي أخطاء أو تعارضات.

---

## 2. المخاطر والحلول (Risks & Mitigations)
- **المخاطر:** حدوث تعارض مع مكوّن `PropertyCalendar.jsx` الذي كان يستخدم `useOtaSearch`.
- **الحل:** تم استبعاد المكون تماماً من القفل والتعديل بناءً على التوجيه المعماري الصريح لزياد لتجنب كسر وظائف الـ B2B، وتم ترك الـ hooks في `useOtaServices.js` دون حذف لكي يعمل المكون بشكل سليم.

---

## 3. الخطوات التالية (Next Steps)
- يرجى مراجعة وتجربة الصفحة `/choose-your-trip` للتأكد من سلاسة التصفية اللحظية والانتقال بين الـ Tabs.
- تسليم التقرير لـ Doc/Release Agent لدمجه في الفرع الرئيسي.

---

## 4. سيناريو تجريبي (Example/Scenario)
عند دخول العميل لصفحة اختيار الرحلات:
1. يتم إطلاق طلبين متوازيين معاً بـ AbortSignal موحد (`/api/trips/` و `/api/trips/metadata/`).
2. تظهر واجهة الـ Skeleton المظلمة الأنيقة.
3. يتم تحميل البيانات، ويتم تقسيم الكروت لحظياً دون طلبات شبكة إضافية بناءً على الأقسام الجديدة (روقان واستجمام، خروجات اليوم الواحد، مغامرة واستكشاف).
4. تظهر الوجهات ديناميكياً داخل الفلتر من استجابة الـ metadata مباشرة.
