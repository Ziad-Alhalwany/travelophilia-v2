<div dir="rtl">

# 📦 تقرير التسليم — OTA Hooks Pipeline (Sprint 2)

| الحقل | القيمة |
|-------|--------|
| **Task ID** | `TP-OTA-HOOKS-GENERATION-006B` |
| **Agent** | FE2 (Integration & State Engineer) |
| **التاريخ** | 2026-06-07 |
| **الفرع** | `agent/fe2` |
| **الملف المُنشأ** | `src/hooks/useOtaServices.js` |

---

## 1. ملخص التنفيذ (Execution Summary)

تم بناء طبقة الـ Custom Hooks الخاصة بمحرك OTA كجسر بين طبقة الـ Service Layer (`apiClient.js`) وطبقة الـ UI Components. الملف الجديد `useOtaServices.js` يوفر 4 hooks مستقلة تغلّف الـ Network Functions المبنية مسبقاً مع إدارة كاملة لدورة حياة الـ React Component.

---

## 2. الـ Hooks المُسلّمة (Delivered Hooks)

### 2.1 `usePropertyAvailability()`
- **Endpoint:** `GET /api/properties/{id}/availability/` (Contract #15)
- **الوظيفة:** جلب شبكة الإتاحة والأسعار الشهرية لوحدة إقامة محددة.
- **Signature:** `execute(propertyId, month, year)` → `Promise<Array>`
- **State:** `{ loading, error, data, execute, abort, reset }`

### 2.2 `useBulkInventoryUpdate()`
- **Endpoint:** `POST /api/properties/{id}/availability/bulk-update/` (Contract #16)
- **الوظيفة:** تنفيذ التحديث الجماعي لأسعار وتخصيصات الغرف من شبكة الـ Extranet.
- **Signature:** `execute(propertyId, payload)` → `Promise<Object>`
- **State:** `{ loading, error, data, execute, abort, reset }`

### 2.3 `useOtaSearch()`
- **Endpoint:** `GET /api/properties/search/` (Contract #17)
- **الوظيفة:** تنفيذ بحث الـ Aggregator المُجمّع مع حماية مدمجة ضد Race Conditions.
- **آلية الحماية:** كل استدعاء جديد لـ `execute()` يلغي تلقائياً أي طلب سابق قيد التنفيذ عبر `createCancellableRequest` — مما يمنع عرض بيانات قديمة (Stale Data) عند البحث السريع المتتالي.
- **Signature:** `execute(params?)` → `Promise<Array|Object>`
- **State:** `{ loading, error, data, execute, abort, reset }`

### 2.4 `useWaitlistSubmit()`
- **Endpoint:** `POST /api/waitlist/` (Contract #18)
- **الوظيفة:** تسجيل رغبة العميل في قائمة الانتظار للتواريخ غير النشطة تسعيرياً.
- **Signature:** `execute(payload)` → `Promise<Object>`
- **State:** `{ loading, error, data, execute, abort, reset }`

---

## 3. القرارات الهندسية (Engineering Decisions)

### 3.1 نمط `useOtaRequest` الداخلي (Internal State Factory)
تم بناء دالة مشتركة داخلية `useOtaRequest(requestFn)` تعمل كـ Factory لتوحيد:
- إدارة الـ State tuple: `{ loading, error, data }`
- ربط الـ `createCancellableRequest` عبر `useRef` لضمان ثبات المرجع عبر الـ Re-renders.
- حراسة الـ `mountedRef` لمنع `setState` بعد الـ Unmount (Memory Leak Prevention).

> **مبرر القرار (YAGNI/DRY):** بدون هذا النمط، كل hook كان سيكرر ~40 سطر من نفس الـ Boilerplate. تطبيق Rule of Three محقق (4 hooks > 3).

### 3.2 إدارة الـ AbortController Lifecycle
- **على مستوى الـ Hook:** كل hook يحتفظ بمرجع `cancellableRef` يحتوي على `{ execute, abort }` من `createCancellableRequest`.
- **على مستوى الـ Component Unmount:** يتم استدعاء `abort()` تلقائياً في الـ Cleanup Function لـ `useEffect` — لضمان إلغاء أي طلب معلق ومنع تسرب الذاكرة.
- **على مستوى الاستدعاء المتتالي:** `createCancellableRequest` نفسها تلغي الطلب السابق قبل إطلاق طلب جديد (Race Condition Shield مبني مسبقاً في apiClient.js).

### 3.3 الـ `reset()` Utility
تمت إضافة دالة `reset()` لإعادة الـ State إلى وضعها الأولي — مفيدة عند الحاجة لمسح بيانات قديمة قبل إعادة التنفيذ أو عند تغيير السياق في الـ UI.

---

## 4. التوافق مع المستندات المرجعية (Contract Compliance)

| المستند | النتيجة |
|---------|---------|
| `FRONTEND_MAP.md` | ✅ تم التحقق — `apiClient.js` يصدّر الـ 4 functions والـ utility (سطر 89) |
| `BACKEND_MAP.md` | ✅ تم التحقق — Endpoints 15-18 تحت `properties/urls.py` (سطور 164-167) |
| `ARCHITECTURE.md` | ✅ جلب البيانات مركزي عبر `apiClient.js` (سطر 17) |
| `api.md` | ✅ Contracts 15-18 مطابقة — Signatures/Payloads متوافقة |

---

## 5. الملفات المُعدّلة (Changed Files)

| الملف | النوع | التفاصيل |
|-------|-------|----------|
| `src/hooks/useOtaServices.js` | **[NEW]** | 4 custom hooks + internal factory + JSDoc |

**لم يتم تعديل أي ملف آخر.** — الملف يعمل ضمن حدود الـ Allowed Paths فقط.

---

## 6. المخاطر (Risks)

| المخاطرة | الاحتمال | التأثير | الإجراء |
|----------|----------|---------|---------|
| الـ `requestFn` identity تتغير في كل Render مسببة إعادة بناء الـ Cancellable | منخفض | تأخر بسيط | الـ Functions مستوردة كـ Module-level exports (stable identity) |
| Component يستدعي `execute` بعد Unmount | منخفض | Memory Leak | محمي بـ `mountedRef` guard |

---

## 7. التسليمات المطلوبة (Handoff Items)

> [!IMPORTANT]
> ### Handoff إلى Doc Agent
> يجب تحديث `FRONTEND_MAP.md` لتسجيل المجلد والملف الجديد:
> ```
> ## `/src/hooks`
> | File | Purpose |
> |------|---------|
> | `useOtaServices.js` | OTA engine React hooks: usePropertyAvailability, useBulkInventoryUpdate, useOtaSearch, useWaitlistSubmit |
> ```

> [!NOTE]
> ### Handoff إلى FE1 Agent
> الـ Hooks جاهزة للاستهلاك في أي UI component. مثال الاستخدام:
> ```jsx
> import { usePropertyAvailability } from "@/hooks/useOtaServices";
> 
> function CalendarGrid({ propertyId }) {
>   const { data, loading, error, execute, abort } = usePropertyAvailability();
>   useEffect(() => { execute(propertyId, 6, 2026); return abort; }, [propertyId]);
>   // ...
> }
> ```

---

## 8. الخطوات التالية (Next Steps)

1. **FE1:** ربط الـ Hooks بالـ UI Components الخاصة بالـ Extranet Calendar وصفحة البحث.
2. **QA:** كتابة Test Plan للتحقق من سلوك الـ Loading/Error states والـ Abort scenarios.
3. **Doc:** تحديث `FRONTEND_MAP.md` بالـ `/src/hooks` directory.

---

**الحالة:** ✅ **مكتمل — جاهز للـ Integration**

</div>
