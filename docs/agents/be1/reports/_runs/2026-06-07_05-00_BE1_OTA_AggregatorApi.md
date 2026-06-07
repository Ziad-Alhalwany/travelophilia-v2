<div dir="rtl">

# 📦 تقرير تسليم: محرك البحث والتسعير متعدد المصادر (OTA Aggregator)

| البند             | القيمة                                                       |
| :---------------- | :----------------------------------------------------------- |
| **Task ID**       | TP-OTA-AGGREGATOR-002                                        |
| **Agent**         | BE1 (API & Business Logic Specialist)                        |
| **التاريخ**       | 2026-06-07                                                   |
| **Model**         | Claude Opus 4.6 (Thinking)                                   |
| **Sprint**        | Sprint 2 – Ticket 2                                          |
| **الفرع**         | `agent/be1`                                                  |
| **Commit المقترح**| `TP-OTA-AGGREGATOR-002: feat - Aggregator search API (agent:be1)` |

---

## 📌 1. ملخص المهمة (Scope Summary)

تنفيذ الـ **Public Search API Endpoint** على المسار `GET /api/properties/search/` الذي يعمل كمحرك بحث وتسعير متعدد المصادر (Multi-Source OTA Meta-Search Aggregator) مع:

1. تجزئة التقويم يوم بيوم (Day-by-Day Calendar Fragmentation)
2. محرك الربح الديناميكي ذو الأربع طبقات (4-Layer Dynamic Markup Engine)
3. إخفاء هوية الموردين (White-Label Identity Masking)
4. اعتراض التواريخ غير النشطة (Waitlist Queue Intercept)
5. تنسيق camelCase للتوافق مع الـ Frontend

---

## 📌 2. الملفات المعدّلة والمنشأة (Modified / Created Files)

### ✅ الملفات المنشأة (Allowed Paths)

| الملف                          | الحجم    | الوصف                                                |
| :----------------------------- | :------- | :--------------------------------------------------- |
| `properties/serializers.py`    | ~130 سطر | 3 Serializers: SearchQuery + DayPrice + SearchResult  |
| `properties/views.py`          | ~190 سطر | AccommodationSearchView + 4-Layer Markup Pipeline     |
| `properties/urls.py`           | ~35 سطر  | مساران: مع وبدون slash                               |

### ⚠️ ملف معدّل (Outside Allowed – Prerequisite Wiring)

| الملف                     | التعديل                                               |
| :------------------------ | :---------------------------------------------------- |
| `djconfig/urls.py`        | إضافة `path("api/", include("properties.urls"))` (+1 سطر) |

---

## 📌 3. المعمارية التفصيلية (Detailed Architecture)

### 3.1 مخطط التدفق (Flow Diagram)

```
Client Request (GET /api/properties/search/?accommodation_id=5&check_in=2026-07-01&check_out=2026-07-04)
    │
    ▼
┌──────────────────────────────────┐
│  SearchQuerySerializer           │  ← Validation Layer
│  • accommodation_id ≥ 1          │
│  • check_out > check_in          │
│  • max 30 nights                 │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Date Array Computation          │  ← [2026-07-01, 2026-07-02, 2026-07-03]
│  total_nights = 3                │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  InventoryPricing Query          │  ← Single SQL JOIN (N+1 safe)
│  select_related(                 │
│    rate_plan → room_type →       │
│    accommodation, supplier       │
│  )                               │
│  filter(date__in, rooms > 0)     │
└──────────┬───────────────────────┘
           │
     ┌─────┴─────┐
     │ 0 records? │──── YES ──→ {"status": "UNAVAILABLE_NOT_SET"} (200)
     └─────┬─────┘
           │ NO
           ▼
┌──────────────────────────────────┐
│  In-Memory Grouping              │  ← O(I) defaultdict
│  Key: (supplier_id, rate_plan_id)│
│  Strict: len(days) == nights     │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  4-Layer Markup Pipeline         │
│  ┌─ L1: Net Supplier Price ──┐   │
│  │  raw price_per_night      │   │
│  ├─ L2: Platform Markup ─────┤   │
│  │  × 1.10 (+10%)            │   │
│  ├─ L3: Percentage Rule ─────┤   │
│  │  × (1 ± factor)           │   │
│  ├─ L4: Fixed Amount Rule ───┤   │
│  │  ± fixed_amount EGP       │   │
│  └───────────────────────────┘   │
│  Accumulate → totalStayPrice     │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  White-Label Identity Masking    │
│  DIRECT → "Direct price..."     │
│  PARTNER/WHOLESALER → "Special  │
│  Travelophilia Rate"             │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Sort ASC by totalStayPrice      │  ← O(G log G)
│  Serialize → SearchResultSerializer │
│  Response 200                    │
└──────────────────────────────────┘
```

### 3.2 هيكل الـ Serializers

**`SearchQuerySerializer`** (Input Validation):
- `accommodation_id`: `IntegerField(min_value=1)` — يمنع القيم السالبة والصفرية
- `check_in` / `check_out`: `DateField(input_formats=["%Y-%m-%d"])` — صيغة موحدة
- `validate()`: Cross-field — يفرض `check_out > check_in` + حد أقصى 30 ليلة

**`DayPriceSerializer`** (Per-Day Output):
- أسماء الحقول بـ camelCase مباشرة: `pricePerNight`, `roomsAvailable`
- `DecimalField(max_digits=12, decimal_places=2)` — دقة مالية

**`SearchResultSerializer`** (Aggregated Option):
- 11 حقل شامل: `roomTypeId`, `roomTypeName`, `ratePlanId`, `boardType`, `boardTypeDisplay`, `displayTag`, `totalStayPrice`, `avgPricePerNight`, `currency`, `nights`, `dailyBreakdown`
- `dailyBreakdown = DayPriceSerializer(many=True)` — تداخل مباشر

### 3.3 قرار تصميم الـ camelCase

بدلاً من إضافة مكتبة خارجية (`djangorestframework-camel-case`), تم تعريف أسماء حقول الـ Serializer بصيغة camelCase مباشرة. المبرر:
- **YAGNI**: لا حاجة لمكتبة كاملة لملف واحد
- **Zero Dependencies**: يتوافق مع قاعدة `ARCHITECTURE.md` بعدم إضافة مكتبات بدون توثيق
- **Explicit Contract**: أسماء الحقول واضحة ومطابقة تماماً لما يستهلكه الـ Frontend

---

## 📌 4. تحليل الأداء وقواعد البيانات (Performance & Database Profiling)

### 4.1 ملخص الاستعلامات (SQL Query Profile)

| الرقم | الاستعلام                                  | العدد  | التعقيد        |
| :---: | :----------------------------------------- | :----: | :------------- |
| Q1    | `InventoryPricing` + JOINs (select_related) | **1**  | O(log n) B-Tree |
| Q2    | `GranularMarkupRule` + M2M prefetch         | **3**  | 1 main + 2 M2M |
| **Σ** | **الإجمالي**                               | **4**  | ثابت ∀ حجم البيانات |

> **ملاحظة صارمة:** صفر N+1 queries. الرقم 4 ثابت بغض النظر عن عدد الغرف أو الأيام أو الموردين.

### 4.2 تفاصيل استعلام Q1 (Inventory Fetch)

```sql
SELECT ip.*, rp.*, rt.*, acc.*, sup.*
FROM properties_inventorypricing ip
INNER JOIN properties_rateplan rp ON ip.rate_plan_id = rp.id
INNER JOIN properties_roomtype rt ON rp.room_type_id = rt.id
INNER JOIN properties_accommodation acc ON rt.accommodation_id = acc.id
INNER JOIN properties_supplier sup ON ip.supplier_id = sup.id
WHERE rt.accommodation_id = %s
  AND ip.date IN (%s, %s, ...)
  AND ip.rooms_available > 0
  AND sup.is_active = true
ORDER BY ip.date
```

**الفهارس المستخدمة (B-Tree Indexes):**
- `properties_inventorypricing.date` — `db_index=True`
- `properties_supplier.is_active` — `db_index=True`
- `unique_together(rate_plan, date, supplier)` — composite index

### 4.3 تحسين Markup Rules Pre-Cache

```python
# ❌ الطريقة البطيئة (N+1 داخل الحلقة):
for inv in inventory_list:
    rules = GranularMarkupRule.objects.filter(...)  # ← استعلام لكل سطر!

# ✅ الطريقة المطبقة (Pre-cache + frozenset):
rule_cache = []
for rule in markup_rules_qs:  # ← استعلام واحد فقط
    accom_ids = frozenset(a.id for a in rule.target_accommodations.all())  # ← من الـ prefetch cache
    rt_ids = frozenset(rt.id for rt in rule.target_room_types.all())       # ← من الـ prefetch cache
    rule_cache.append((rule, accom_ids, rt_ids))
```

**المنطق:** الـ `frozenset` يحول فحص العضوية (membership check) إلى O(1) بدلاً من O(n) مع القوائم.

### 4.4 تعقيد الخوارزمية الكلي (Overall Complexity)

| المرحلة                  | التعقيد الزمني   | التعقيد المكاني |
| :----------------------- | :-------------- | :-------------- |
| Date Array               | O(D)            | O(D)            |
| Inventory Query          | O(1) SQL        | O(I)            |
| In-Memory Grouping       | O(I)            | O(I)            |
| Markup Pipeline          | O(G × D × R)   | O(1) per iter   |
| Sorting                  | O(G log G)      | O(1)            |
| **الإجمالي**             | **O(I × R)**    | **O(I)**        |

حيث: I = inventory rows, G = groups, D = days, R = active rules

---

## 📌 5. معايير الأمان (OWASP Compliance)

| المعيار                          | الحالة | التفصيل                                                      |
| :------------------------------- | :----: | :----------------------------------------------------------- |
| **SQL Injection**                | ✅     | استخدام ORM فقط، لا raw SQL                                  |
| **IDOR**                         | ✅     | Endpoint عام — لا بيانات مستخدم خاصة مكشوفة                  |
| **XSS**                          | ✅     | DRF JSONRenderer — لا HTML rendering                          |
| **Data Leakage**                 | ✅     | White-Label masking يحجب أسماء الموردين وبياناتهم              |
| **Input Validation**             | ✅     | SearchQuerySerializer يفرض أنواع وقيود صارمة                  |
| **Rate Limiting**                | ✅     | يرث `AnonRateThrottle` (30/min) من `settings.REST_FRAMEWORK`  |
| **Negative Price Floor**         | ✅     | `price < 0 → price = 0.00` يمنع الأسعار السالبة               |

---

## 📌 6. عينة من الاستجابة المتوقعة (Example Response Payload)

### ✅ حالة النجاح (HTTP 200 — Available):

```json
[
  {
    "roomTypeId": 3,
    "roomTypeName": "Deluxe Suite",
    "ratePlanId": 7,
    "boardType": "BB",
    "boardTypeDisplay": "Bed & Breakfast",
    "displayTag": "Direct price from hotel",
    "totalStayPrice": "4950.00",
    "avgPricePerNight": "1650.00",
    "currency": "EGP",
    "nights": 3,
    "dailyBreakdown": [
      {
        "date": "2026-07-01",
        "pricePerNight": "1650.00",
        "roomsAvailable": 5
      },
      {
        "date": "2026-07-02",
        "pricePerNight": "1650.00",
        "roomsAvailable": 4
      },
      {
        "date": "2026-07-03",
        "pricePerNight": "1650.00",
        "roomsAvailable": 3
      }
    ]
  },
  {
    "roomTypeId": 3,
    "roomTypeName": "Deluxe Suite",
    "ratePlanId": 7,
    "boardType": "BB",
    "boardTypeDisplay": "Bed & Breakfast",
    "displayTag": "Special Travelophilia Rate",
    "totalStayPrice": "5280.00",
    "avgPricePerNight": "1760.00",
    "currency": "EGP",
    "nights": 3,
    "dailyBreakdown": [
      {
        "date": "2026-07-01",
        "pricePerNight": "1760.00",
        "roomsAvailable": 8
      },
      {
        "date": "2026-07-02",
        "pricePerNight": "1760.00",
        "roomsAvailable": 6
      },
      {
        "date": "2026-07-03",
        "pricePerNight": "1760.00",
        "roomsAvailable": 7
      }
    ]
  }
]
```

### ⚠️ حالة عدم التوفر (HTTP 200 — Unavailable):

```json
{
  "status": "UNAVAILABLE_NOT_SET"
}
```

### ❌ حالة خطأ التحقق (HTTP 400 — Validation Error):

```json
{
  "check_out": ["check_out must be strictly after check_in."]
}
```

---

## 📌 7. المخاطر والتوصيات (Risks & Next Steps)

### المخاطر (Risks)

| المخاطرة                        | الاحتمال | الأثر  | التخفيف                                                |
| :------------------------------- | :------: | :----: | :----------------------------------------------------- |
| `api.md` غير محدّث بالـ endpoint الجديد | مرتفع   | متوسط | Handoff لـ Doc Agent لتحديث العقد                       |
| `BACKEND_MAP.md` لا يحتوي properties models | مرتفع | منخفض | Handoff لـ Doc Agent                                    |
| Markup rules بنسبة DECREASE > 100% → سعر سالب | منخفض | منخفض | Floor guard مُطبق `price < 0 → 0.00`                   |

### الخطوات التالية (Next Steps)

1. **Handoff → Doc Agent:** تحديث `api.md` بالـ Endpoint رقم 15 + تحديث `BACKEND_MAP.md` بنماذج `properties`
2. **Handoff → QA Agent:** كتابة test cases للسيناريوهات الستة:
   - بحث ناجح بتواريخ كاملة
   - بحث بتواريخ ناقصة (partial availability)
   - فندق بدون أسعار (UNAVAILABLE_NOT_SET)
   - Markup rules: INCREASE + DECREASE + percentage + fixed
   - White-label: DIRECT vs PARTNER_AGENCY vs WHOLESALER
   - Input validation: check_out ≤ check_in, > 30 nights
3. **Handoff → FE2 Agent:** ربط الـ Frontend service layer مع الـ Endpoint الجديد

---

## 📌 8. التحقق (Verification)

| الفحص                    | النتيجة | التفصيل                              |
| :----------------------- | :-----: | :----------------------------------- |
| Python Syntax (`py_compile`) | ✅    | 3 ملفات تمر بدون أخطاء              |
| Import Chain             | ✅      | `views.py` → `models.py` + `serializers.py` |
| Django Check             | ⏸️      | لا يمكن تنفيذه من الـ worktree (venv في المشروع الأساسي) — مسؤولية زياد |

</div>
