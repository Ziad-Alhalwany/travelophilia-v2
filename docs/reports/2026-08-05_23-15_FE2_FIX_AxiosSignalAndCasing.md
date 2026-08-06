# 📝 تقرير التنفيذ: TP-FIX-FE2-AXIOS-SIGNAL-PRISTINE-REF-001

- **Task ID:** `TP-FIX-FE2-AXIOS-SIGNAL-PRISTINE-REF-001`
- **Agent:** FE2 (Integration & Global State Specialist)
- **Date:** 2026-08-07
- **Model:** Gemini 3.6 Flash
- **Scope:** `src/services/apiClient.js`

---

## 🎯 ملخص المهمة (Summary)

تم حل مشكلة Axios interceptor التي كانت تسبب خطأ `_config.signal.addEventListener is not a function` عن طريق الحفاظ على المرجع الأصلي للـ `_config` ومنع عمل shallow copy أو إعادة إنشاء الكائن، مع ضمان إضافة الهيدر الخاص بالتليميتري `X-Client-Telemetry` والرمز الخاص بالمصادقة `Authorization` والتحويل إلى `snake_case` بشكل مباشر دون المساس بـ `AbortSignal` أو الكائنات الخاصة بالويب (`FormData`, `Blob`, `Date`, `URLSearchParams`).

---

## 🔍 التفاصيل التقنية والإصلاحات (Technical Details)

1. **الحفاظ على المرجع الأصلي (Pristine Config Reference):**
   - تم تعديل `api.interceptors.request.use` لاستقبال `_config` والتعديل المباشر (Direct Mutation) على الخصائص `_config.headers`, `_config.data`, `_config.params`.
   - إرجاع `_config` نفسه بدلاً من كائن جديد مجزأ `{ ...config }` يضمن عدم فقدان prototype الخاص بـ `AbortSignal` المرفق مع الطلبات الملغاة (Cancellable Requests).

2. **حقن بيانات التليميتري (Client Telemetry Injection):**
   - إضافة الهيدر `X-Client-Telemetry` بحمولة JSON تحتوي على `timestamp` و `userAgent` بشكل آمن داخل كتل `try...catch`.

3. **التحقق من محول الحالات (Casing Conversion Pipeline):**
   - التثبت من وجود شرط الاستثناء `shouldSkip` في `src/utils/caseConverter.js` الذي يضمن التجاهل التام للكائنات التالية:
     - `FormData`
     - `URLSearchParams`
     - `Date`
     - `Blob`

---

## 💻 Commit الـ المقترح (Proposed Commit)

```bash
git commit -m "fix(fe2): preserve pristine axios config reference and fix AbortSignal prototype handling (agent:fe2)"
```

---

## ⚠️ المخاطر وإدارة الآثار الجانبية (Risks & Mitigations)

- **المخاطر:** التعديل المباشر على كائن `_config` في Axios قد يؤثر على طلبات متوازية إذا كانت تشارك نفس كائن الإعدادات.
- **الحل:** Axios يقوم بإنشاء كائن `config` منفصل لكل طلب تلقائياً، وبالتالي التعديل المباشر آمن ويمنع كسر prototype الخاص بالـ Native Objects.

---

## 🧪 السيناريو والتجربة (Scenario & Verification)

عند استدعاء أي مسار يلغي الطلب السابق باستخدام `createCancellableRequest` أو `AbortController`:
```javascript
const { execute, abort } = createCancellableRequest((signal) =>
  api.get("/properties/search/", { signal })
);
```
يقوم Axios بربط listener على `_config.signal` من خلال `_config.signal.addEventListener('abort', ...)` بدون حدوث أي TypeError.

---

## ➡️ الخطوات القادمة (Next Steps)

1. إجراء Handoff لـ QA Agent لاختبار مسارات البحث والإلغاء `useOtaSearch`.
2. تسليم التقرير إلى Doc Agent للتحديث إذا لزم الأمر.
