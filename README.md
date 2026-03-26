<div dir="rtl">

# Travelophilia ✈️ — (Experience & Operations System)

Travelophilia ليس مجرد "موقع لحجز الرحلات"، بل هو نظام تشغيل متكامل يربط بين تجربة العميل (Frontend)، وقواعد العمل والتسعير (Backend)، وإدارة العمليات (CRM/Ops).

## 🎯 الرؤية (The Vision)

"أنت لست وحدك... نحن نبني التجربة ونتابعها، وكل خطوة واضحة."
رحلة العميل: **اكتشاف ← مقارنة ← تخصيص ← طلب ← متابعة CRM ← دفع ← برنامج رحلة.**

## 🛠️ التقنيات المستخدمة (Tech Stack)

- **Frontend:** React + Vite (استخدام `camelCase`)
- **Backend:** Django + Django REST Framework (استخدام `snake_case`)
- **Database:** PostgreSQL

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
