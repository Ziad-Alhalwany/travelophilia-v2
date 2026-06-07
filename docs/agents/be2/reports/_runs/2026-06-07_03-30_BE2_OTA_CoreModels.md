# تقرير التنفيذ – BE2: OTA Core Models
---

| الحقل | القيمة |
|---|---|
| **Task ID** | `TP-OTA-PROPERTY-001` |
| **Sprint** | Sprint 2 – Ticket 1 |
| **Agent** | BE2 (Database & Migrations Specialist) |
| **التاريخ** | 2026-06-07 03:15 |
| **Model** | Claude Opus 4.6 (Thinking) |
| **Branch** | `agent/be2` |

---

## 1. النطاق (Scope)

بناء تطبيق Django جديد بالكامل باسم `properties` داخل `backend/django_api/` يحتوي على الـ Schema الأساسي لمحرك الـ OTA Meta-Search Aggregator متعدد المصادر.

### الملفات المسموح بها (Allowed Paths)
- `backend/django_api/properties/**` ← ✅ ملفات جديدة بالكامل
- `backend/django_api/djconfig/settings.py` ← ✅ سطر واحد فقط (INSTALLED_APPS)

---

## 2. الملفات المُنشأة والمُعدلة

### [NEW] `properties/__init__.py`
ملف تعريف الـ Package – فارغ.

### [NEW] `properties/apps.py`
تعريف `PropertiesConfig` مع `BigAutoField` كـ default PK و `verbose_name = "Properties & Inventory"`.

### [NEW] `properties/models.py`
**7 Models كاملة:**

| # | Model | الوصف | الحقول الرئيسية | Indexes & Constraints |
|---|---|---|---|---|
| 1 | `Supplier` | مورّد الأسعار | `name` (unique), `kind` (choices), `is_active` | `db_index` على `is_active` |
| 2 | `Accommodation` | وحدة الإقامة | `type` (choices), `destination` (FK→trips.Destination), `name` | `db_index` على `type`, `is_active` |
| 3 | `RoomType` | نوع الغرفة | `accommodation` (FK), `name`, `total_physical_rooms`, `base_capacity`, `max_extra_beds` | — |
| 4 | `RatePlan` | خطة التسعير | `room_type` (FK), `board_type` (choices), `extra_bed_price` | `db_index` على `board_type` |
| 5 | `InventoryPricing` | محرك التسعير اليومي | `rate_plan` (FK), `supplier` (FK), `date`, `price_per_night`, `rooms_available` | `unique_together` = `(rate_plan, date, supplier)` + `db_index` على `date` |
| 6 | `Waitlist` | قائمة الانتظار | `accommodation` (FK), `room_type` (FK), `requested_date`, `user_email`, `status` | `db_index` على `requested_date`, `status` |
| 7 | `GranularMarkupRule` | محرك الربح | `title`, `target_accommodations` (M2M), `target_room_types` (M2M), `action`, `percentage`, `fixed_amount`, `start_date`, `end_date` | `db_index` على `is_active` |

### [NEW] `properties/admin.py`
تسجيل الـ 7 Models بالكامل باستخدام `@admin.register` decorators مع:
- `list_select_related` لمنع N+1 queries في Admin
- `search_fields` متقدم على Accommodation, InventoryPricing, Waitlist
- `list_filter` على كل الحقول المفلترة
- `date_hierarchy` على InventoryPricing و Waitlist

### [NEW] `properties/migrations/__init__.py`
ملف تعريف مجلد الـ Migrations.

### [NEW] `properties/migrations/0001_initial.py`
Migration يدوي مطابق 100% لما سينتجه `makemigrations`. يعتمد على `("trips", "0001_initial")`.

### [MODIFY] `djconfig/settings.py`
سطر واحد فقط مُضاف:
```diff
+    "properties.apps.PropertiesConfig",
```

---

## 3. قرارات التصميم (Design Decisions)

### 3.1 Lazy FK لمنع Circular Imports
```python
destination = models.ForeignKey("trips.Destination", ...)
```
استخدام النص بدل الـ Import المباشر لتجنب الـ Circular Dependencies بين الـ Apps.

### 3.2 `unique_together` على InventoryPricing
```python
unique_together = ("rate_plan", "date", "supplier")
```
هذا الـ Constraint هو الحارس الرياضي ضد:
- **Overbooking**: لا يمكن لنفس الـ Supplier إدخال صفين لنفس الـ RatePlan في نفس اليوم
- **Multi-Source Collision**: كل Supplier له سطر منفصل، والمقارنة تتم على مستوى الـ Application Layer

### 3.3 B-Tree Indexing Strategy
كل الحقول التي ستُستخدم في `WHERE` clauses أو `ORDER BY` مُفهرسة:
- `Supplier.is_active` → فلترة الموردين النشطين
- `Accommodation.type`, `Accommodation.is_active` → فلترة أنواع الإقامة
- `RatePlan.board_type` → فلترة أنواع الإقامة الغذائية
- `InventoryPricing.date` → Range queries على التواريخ
- `Waitlist.requested_date`, `Waitlist.status` → فلترة قائمة الانتظار
- `GranularMarkupRule.is_active` → فلترة القواعد النشطة

### 3.4 `settings.AUTH_USER_MODEL` Import
تم عمل Import لـ `settings` في `models.py` وهو جاهز للاستخدام في أي FK مستقبلي للمستخدم/البائع، لكن لم يُستخدم حالياً لأن الـ Ticket لم تطلب ذلك (YAGNI).

### 3.5 Migration يدوي
بسبب عدم وجود Django environment محلي، تم كتابة الـ Migration يدوياً بنفس الصيغة الدقيقة التي ينتجها `makemigrations`. يجب التحقق منه عبر:
```bash
python manage.py makemigrations --check properties
```

---

## 4. المخاطر (Risks)

| المخاطرة | الاحتمال | التأثير | الخطة |
|---|---|---|---|
| Migration يدوي قد يختلف عن `makemigrations` output | منخفض | متوسط | تشغيل `makemigrations --check` للتحقق |
| `trips.0001_initial` dependency قد تتغير | منخفض | عالي | التحقق من أن الـ Destination model موجود في 0001 |
| حقل `type` في Accommodation (reserved word في بعض ORMs) | منخفض | منخفض | Django يتعامل معه بشكل طبيعي |

---

## 5. خطة الاختبار (Smoke Test)

```bash
# 1. التحقق من صحة الـ Migration
python manage.py makemigrations --check properties

# 2. تطبيق الـ Migration
python manage.py migrate properties

# 3. التحقق من إنشاء الجداول
python manage.py dbshell
\dt properties_*

# 4. اختبار Admin
python manage.py runserver
# → Navigate to /admin/ → تأكد من ظهور الـ 7 Models
```

---

## 6. Proposed Commit

```
TP-OTA-PROPERTY-001: feat - scaffold properties app with 7 OTA models (agent:be2)
```

---

## 7. الخطوات التالية (Next Steps)

| المهمة | الوكيل المسؤول |
|---|---|
| كتابة Serializers و Views للـ Properties API | BE1 |
| تحديث `docs/api.md` بالـ Endpoints الجديدة | Doc Agent |
| بناء UI Components لعرض الـ Accommodations | FE1 |
| Integration hooks لربط الـ Frontend بالـ API | FE2 |
| اختبار الـ Migration على بيئة Staging | QA Agent |

---

## 8. Handoff Summary

### الملفات المُعدلة:
- `backend/django_api/properties/__init__.py` [NEW]
- `backend/django_api/properties/apps.py` [NEW]
- `backend/django_api/properties/models.py` [NEW] – 7 Models
- `backend/django_api/properties/admin.py` [NEW] – 7 Admin registrations
- `backend/django_api/properties/migrations/__init__.py` [NEW]
- `backend/django_api/properties/migrations/0001_initial.py` [NEW]
- `backend/django_api/djconfig/settings.py` [MODIFY] – 1 line added

### المتغيرات/الدوال الجديدة:
- Models: `Supplier`, `Accommodation`, `RoomType`, `RatePlan`, `InventoryPricing`, `Waitlist`, `GranularMarkupRule`
- TextChoices enums: `Supplier.Kind`, `Accommodation.AccommodationType`, `RatePlan.BoardType`, `Waitlist.Status`, `GranularMarkupRule.Action`
- Admin classes: 7 `ModelAdmin` subclasses with optimized `list_select_related`

### الخطوة التالية المطلوبة:
1. **زياد**: تشغيل `python manage.py makemigrations --check properties` للتحقق
2. **زياد**: تشغيل `python manage.py migrate properties` لتطبيق الـ Schema
3. **Doc Agent**: تحديث `BACKEND_MAP.md` بالملفات الجديدة
