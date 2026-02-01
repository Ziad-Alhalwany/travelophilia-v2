<div dir="rtl">

# Cost Model — رحلة داخل مصر (Template)

## 1) تقسيم التكاليف
### A) Direct Costs (مباشرة)
- فندق/شاليه
- نقل (ميكروباص/أتوبيس/سيارة)
- أنشطة/تذاكر
- مرشد/منظم (لو موجود)
- وجبات (لو ضمن الباكدج)

### B) Variable Per Person (متغيرة لكل فرد)
- تذاكر/أنشطة لكل شخص
- وجبات/مستلزمات
- تأمين/خدمة (لو موجود)

### C) Fixed/Overhead Allocation (تقديري)
- تسويق (متوسط تكلفة Lead)
- عمولات/بوابات دفع
- إدارة/تنسيق
- خسائر متوقعة (Buffer)

---

## 2) نموذج حساب سريع (Template)
**Inputs:**
- عدد الأفراد = PAX
- تكلفة الفندق الإجمالية = HotelTotal
- تكلفة النقل الإجمالية = TransportTotal
- الأنشطة الإجمالية = ActivitiesTotal
- متغيرات/فرد = VarPP
- Overhead% = OH%

**Cost per person**
- DirectPerPerson = (HotelTotal + TransportTotal + ActivitiesTotal) / PAX
- TotalCostPerPerson = DirectPerPerson + VarPP
- CostWithOH = TotalCostPerPerson * (1 + OH%)

---

## 3) Buffers إلزامية (حماية)
- Buffer تشغيل 3%–7% (حسب الموردين)
- Buffer تقلبات أسعار 2%–5%
- Buffer طوارئ (اختياري): 1%–3%

> الهدف: ما نطلعش “مكسب وهمي” يضيع في التشغيل.

</div>
