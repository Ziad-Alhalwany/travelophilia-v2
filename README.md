<div dir="rtl">

# Travelophilia ✈️ — (Experience & Operations System)

Travelophilia ليس مجرد "موقع لحجز الرحلات"، بل هو نظام تشغيل متكامل يربط بين تجربة العميل (Frontend)، وقواعد العمل والتسعير (Backend)، وإدارة العمليات (CRM/Ops).

## 🎯 الرؤية (The Vision)

"أنت لست وحدك... نحن نبني التجربة ونتابعها، وكل خطوة واضحة."
رحلة العميل: **اكتشاف ← مقارنة ← تخصيص ← طلب ← متابعة CRM ← دفع ← برنامج رحلة.**

## 🛠️ التقنيات المستخدمة (Tech Stack)

- **الواجهة الأمامية (Frontend):**
  - React + Vite (ترميز بروتوكولات الحقول بصيغة `camelCase`).
  - Tailwind CSS v4 + Shadcn UI لبناء الواجهات الرسومية الداكنة وتأثيرات الـ Glassmorphism والتدرج الشعاعي الفاخر بـ `AppLayout`.
  - ✨ Magic Companion Link & Smart Reservation: توليد رابط المرافق السحري مع أزرار النسخ والمشاركة المباشرة عبر WhatsApp.
  - PWA (Progressive Web App) يدعم العمل غير المتصل (Offline Mode) ومقاطعات مرونة الاتصال (Connection Resilience Interceptors) التي تتتبع حالة الشبكة عبر `navigator.onLine`.
- **الخوادم والمنطق (Backend & Logic):**
  - Django + Django REST Framework (DRF) (ترميز الحقول في المعالجات بصيغة `snake_case`).
  - Redis Cache لتخزين وإدارة محرك الـ OTP الموحد ومصادقة الشركاء (مع محرك فحص TCP Socket بمهلة تحقق ثانية واحدة للتراجع لـ `LocMemCache` محلياً).
  - PostgreSQL كقاعدة بيانات معتمدة وحيدة للمشروع مع دعم تشفير وحجب الهويات الشخصية (Identity Hash).
  - SimpleJWT للمصادقة وتوفير رموز الجلسات مع إتاحة نظام إبطال وإدراج الرموز في القائمة السوداء (Token Blacklisting) عند تغيير كلمات المرور.
- **بوابات الدخول والمسارات (Gateways & Route Isolation):**
  - بوابة الموظفين والـ CRM المحمية بحارس `CRMGuard` (مستندة على مفاتيح التوكن `tp_crm_access`).
  - بوابة الشركاء وموردي B2B المحمية بحارس `PartnerGuard` (مستندة على مفاتيح التوكن `travelophilia_access_token` ومسار المصادقة المعزول `/api/auth/partners/token/` بـ namespace مستقل باسم `partners_auth`).


## 🤖 بنية الـ AI Agents

المشروع يُدار بالكامل بواسطة نظام وكلاء الذكاء الاصطناعي (AI Agents)، كلٌ في تخصصه:

- `Planner`: التخطيط وكتابة الـ Tickets.
- `FE1 / FE2`: بناء واجهات المستخدم وربط الـ APIs.
- `BE1 / BE2`: بناء المنطق البرمجي وقواعد البيانات.
- `OpsCRM / Marketing / Finance / QA`: وضع قواعد العمل، التسعير، التشغيل، والاختبار.
- `Release`: إدارة الدمج (Merge) ونظام الـ Locks.

## 🚀 كيفية التشغيل (Getting Started)

**1. تشغيل الـ Backend:**

```bash
cd backend/django_api
python -m venv venv
source venv/bin/activate  # (أو venv\Scripts\activate في الويندوز)
pip install -r requirements.txt
python manage.py runserver
```
