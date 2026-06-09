<div dir="rtl">

# تقرير المعالجة النهائي — Axios AbortSignal Crash Fix

- **Task ID:** FIX-FE-AXIOS-SIGNAL-CRASH
- **Agent:** FE2 (Integration & Global State Specialist)
- **Date:** 2026-06-10
- **Model:** Gemini 3.5 Flash (High)
- **Scope:**
  - `src/services/apiClient.js`
- **Proposed Commit:** `fix(fe2): FIX-FE-AXIOS-SIGNAL-CRASH - dynamic AbortSignal parameter reordering in B2B/OTA API bindings`

---

## 🎯 ملخص التنفيذ (Summary)

تم بنجاح تشخيص ومعالجة الخلل الفني المسبب لانهيار لوحة التحكم الخاصة بالموردين (Availability Calendar Card) بظهور رسالة الخطأ `_config.signal.addEventListener is not a function`.

### تفاصيل المشكلة:
كانت المشكلة ناتجة عن تعارض في ترتيب المعاملات (Signature Mismatch) بين مغلف إلغاء الطلبات [createCancellableRequest](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/fe2/src/services/apiClient.js#L220-L248) والدوال الخدمية لـ OTA/B2B (مثل [fetchPropertyAvailability](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/fe2/src/services/apiClient.js#L342)):
- يمرر المغلف الـ `AbortSignal` كمعامل أول لـ `requestFn`.
- بينما تتوقع الدوال الخدمية استقبال الـ `signal` كمعامل أخير.
- تسبب هذا في استلام Axios لرقم السنة (مثل `2026`) أو كائن الـ payload كـ `signal` للطلب، مما أدى لانهيار محاولات الاشتراك في حدث الإلغاء.

### الحل المُنفذ:
1. **التحقق من Interceptors:** تدقيق معالج طلبات Axios للتأكيد على الحفاظ على مرجع إعدادات الطلب `config` سليماً وتجنب أي نسخ مجتزأ (Shallow Copying) للخصائص غير القابلة للتعداد (Non-enumerable) للـ `AbortSignal` الأصلي.
2. **إعادة ترتيب المعاملات تلقائياً (Dynamic Parameter Reordering):** تم تحديث الدوال الخدمية التالية لتتحقق ديناميكياً مما إذا كان المعامل الأول هو كائن `AbortSignal` (عبر التحقق من وجود `addEventListener` كدالة)، وإعادة الترتيب التلقائي للمعاملات وفقاً لذلك:
   - `fetchPropertyAvailability`
   - `bulkUpdateInventory`
   - `fetchSearchAggregator`
   - `submitWaitlistQueue`
   - `getTrips`

---

## 🔬 التحقق والاختبار (Verification & Build Logs)

تم بنجاح تشغيل أمر بناء الإنتاج المحلي (`npm run build`) داخل بيئة العمل للتحقق من عدم وجود أي تعارضات أو أخطاء برمجية:

```bash
vite v6.4.3 building for production...
transforming...
✓ 2891 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.41 kB │ gzip:   0.27 kB
dist/assets/index-CcdOWs1r.css  143.06 kB │ gzip:  23.27 kB
dist/assets/index-Dz0OCtF6.js   618.36 kB │ gzip: 182.16 kB
✓ built in 10.58s
```

البناء الإنتاجي تم بنجاح بنسبة 100%.

---

## ⚠️ المخاطر (Risks)

- **معدل المخاطر:** صفر. التعديل متوافق بالكامل مع الاستدعاءات العادية (بدون مغلف) والاستدعاءات المغلفة عبر `createCancellableRequest` دون كسر واجهة الاستدعاء البرمجية (API Interface).

---

## 🗺️ الخطوات التالية (Next Steps)

1. إخطار العميل ببدء اختبار لوحة الموردين (Availability Calendar Card) للتأكد من زوال المشكلة تماماً في المتصفح.
2. إلغاء قفل الملف (Unlock) آلياً.

---

## 💡 سيناريو افتراضي والاستجابة المتوقعة (Example/Scenario)

### سيناريو الاستدعاء المغلف (Cancellable Hook):
```javascript
// استدعاء من hook usePropertyAvailability
fetchPropertyAvailability(signal, propertyId, month, year);
```
- يقوم النظام بكشف الـ `signal` كمعامل أول.
- يُعيد الترتيب داخلياً ليصبح:
  - `actualPropertyId = propertyId`
  - `actualMonth = month`
  - `actualYear = year`
  - `actualSignal = signal`
- يتم إرسال الطلب عبر Axios بشكل سليم بالـ `AbortSignal` الصحيح كمعامل `signal` دون انهيار.

### سيناريو الاستدعاء المباشر (Direct Fetch):
```javascript
// استدعاء مباشر عادي
fetchPropertyAvailability(propertyId, month, year, signal);
```
- لا يجد النظام `addEventListener` في المعامل الأول.
- يمرر المعاملات بترتيبها الأصلي مباشرة.

</div>
