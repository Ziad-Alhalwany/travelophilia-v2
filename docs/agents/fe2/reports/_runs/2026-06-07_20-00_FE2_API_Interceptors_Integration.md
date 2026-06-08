<div dir="rtl">

# 📋 تقرير التسليم النهائي — FE2 API Interceptors & OTA Integration

| الحقل | القيمة |
|-------|--------|
| **Task ID** | TP-OTA-INTEGRATION-005-v2 |
| **Agent** | FE2 (Integration & State Engineer) |
| **التاريخ** | 2026-06-07 |
| **Branch** | agent/fe2 |
| **الملف المعدل** | `src/services/apiClient.js` |
| **الخطوط قبل** | 213 سطر (5,652 bytes) |
| **الخطوط بعد** | 396 سطر (12,687 bytes) |
| **Breaking Changes** | صفر — كل الـ exports القديمة محفوظة |

---

## 🎯 ملخص التنفيذ (Execution Summary)

تم تنفيذ 4 ميزات معمارية أساسية داخل `apiClient.js` كطبقة شبكة مركزية (Global Network Layer) لربط واجهات الـ B2B Extranet وOTA Meta-Search بالـ Backend engine:

---

### ✅ Feature 1: Pluggable Global Error Handler (UI-Decoupled Pattern)

**المشكلة:** الـ Task الأصلي طلب ربط `react-hot-toast` مباشرة — لكن المكتبة مش في الـ `package.json`.

**الحل المُنفذ:** بدل ما نضيف dependency جديد، تم بناء Pluggable Callback Pattern:

```javascript
// الـ Default Handler — safe fallback
let _globalErrorHandler = (message, details) => {
  console.error(`[API Error] ${message}`, details);
};

// FE1 يربط الـ toast library مرة واحدة في App.jsx
export function setGlobalErrorHandler(handler) { ... }
```

**الفايدة:**
- صفر dependency friction
- FE1 يربط أي toast library بسطر واحد: `setGlobalErrorHandler(toast.error)`
- الـ apiClient يفضل UI-agnostic تماماً

---

### ✅ Feature 2: Django Validation Error Parser + Error Dispatcher

تم حقن `dispatchGlobalError()` في الـ Axios Response Error Interceptor **قبل** الـ 401 JWT refresh logic:

**الـ Error Routing Matrix:**

| HTTP Status | السلوك |
|-------------|--------|
| `400` | يحلل Django validation dict `{ field: [errors] }` ويحوله لـ human-readable string |
| `403` | رسالة صلاحيات واضحة |
| `404` | Resource not found |
| `≥ 500` | Server error عام |
| No Response | Network disconnect (بشرط مش `canceled` من AbortController) |

**الـ Bypass Mechanism:**
```javascript
// أي request يقدر يتجاوز الـ global handler
api.get('/sensitive/', { _silentError: true });
```

---

### ✅ Feature 3: AbortController Request Factory

تم بناء `createCancellableRequest()` كـ factory function لحماية من:
- **Race Conditions:** لو component عمل re-render وبعت request جديد قبل ما القديم يخلص
- **Memory Leaks:** لو component عمل unmount وفي request لسه pending

```javascript
const { execute, abort } = createCancellableRequest(
  (signal) => api.get('/properties/search/', { signal })
);

// في useEffect:
useEffect(() => { execute(); return abort; }, []);
```

**سلوك الـ CanceledError:** بيترجع `undefined` بهدوء بدل ما يرمي exception — صفر memory leak.

---

### ✅ Feature 4: B2B Extranet & OTA Service Functions (Sprint 2 Pre-wiring)

4 service functions جديدة تم pre-wire-هم للـ endpoints المنتظرة:

| Function | HTTP Method | Endpoint | Signal Support |
|----------|------------|----------|----------------|
| `fetchPropertyAvailability(propertyId, month, year, signal)` | GET | `/api/properties/{id}/availability/` | ✅ |
| `bulkUpdateInventory(propertyId, payload, signal)` | POST | `/api/properties/{id}/availability/bulk-update/` | ✅ |
| `fetchSearchAggregator(params, signal)` | GET | `/api/properties/search/` | ✅ |
| `submitWaitlistQueue(payload, signal)` | POST | `/api/waitlist/` | ✅ |

**ملاحظة مهمة:** هذه الـ endpoints مش موجودة في `api.md` حالياً — تم توثيقها كـ "pre-wired, pending api.md formal update" في الكود.

---

## 🔬 التحقق (Verification)

| الفحص | النتيجة |
|-------|---------|
| ESM Syntax Validation (Node.js parser) | ✅ PASS |
| Import Integrity Scan (7 consumers) | ✅ PASS — صفر breaking imports |
| Existing exports preserved (`api`, `getTrips`, `getTripBySlug`, etc.) | ✅ PASS |
| New exports added (`setGlobalErrorHandler`, `createCancellableRequest`, 4 OTA functions) | ✅ PASS |
| Production Build (`vite build`) | ⚠️ SKIP — `node_modules` مش installed في الـ worktree (pre-existing environment issue) |

---

## 📐 Interceptor Chain Order (بعد التعديل)

```
Request Flow:
  1. JWT Token Attachment (Authorization header)
  2. toSnakeDeep(config.data) — camelCase → snake_case
  3. toSnakeDeep(config.params) — camelCase → snake_case
  → Network Request →

Response Flow (Success):
  1. toCamelDeep(response.data) — snake_case → camelCase
  → Resolve to component

Response Flow (Error):
  1. toCamelDeep(error.response.data) — snake_case → camelCase
  2. dispatchGlobalError() — Toast routing (skippable via _silentError)
  3. 401 JWT Auto-Refresh (with race dedup via refreshInFlight)
  → Reject to component
```

---

## ⚠️ المخاطر والمتطلبات القادمة (Risks & Next Steps)

| البند | الحالة | المسؤول |
|-------|--------|---------|
| تحديث `api.md` بالـ 4 endpoints الجديدة | ⏳ Pending | Doc Agent / Ziad |
| ربط `setGlobalErrorHandler` بـ toast library في `App.jsx` | ⏳ Pending | FE1 Agent |
| إنشاء custom hooks لكل OTA service function (مع AbortController) | ⏳ Pending | FE2 (Sprint 2 hooks task) |
| Install `react-hot-toast` أو بديل | ⏳ Pending | Ziad approval + FE1 |

---

## 📁 الملفات المعدلة

| الملف | نوع التعديل | الوصف |
|-------|-------------|-------|
| `src/services/apiClient.js` | MODIFY | Global error handler, Django parser, AbortController factory, 4 OTA bindings |

---

**Commit المقترح:**
```
TP-OTA-INTEGRATION-005-v2: feat(fe2) - Global error interceptor + AbortController factory + OTA pre-wiring (agent:fe2)
```

</div>
