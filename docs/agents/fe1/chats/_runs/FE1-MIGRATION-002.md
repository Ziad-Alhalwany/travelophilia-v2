# FE1-MIGRATION-002 Chat Summary

## What was discussed
- ضرورة دمج المنطق البرمجي من الملفات القديمة (TripDetailsPage) في الواجهات الجديدة بـ Shadcn.
- تحديد الملفات التي يمكن حذفها بأمان (HomePage) مقابل تلك التي تحتاج إبقاء مع إضافة route (ChooseYourTripPage, etc).
- تحليل منطق الـ FX/Checkout/Coupons/Activities كمنطق حرج لا يمكن فقده.

## Decisions made
- دمج كامل لـ TripDetailsPage في TripDetails مع Shadcn UI.
- إبقاء الصفحات القديمة التي لم يتم ترقيتها بعد (ChooseYourTrip, Customize, Reservation) مع إضافة routes.
- حذف HomePage.jsx و TripDetailsPage.jsx بعد التأكد من نقل كل الميزات.

## Open questions
- ChooseYourTripPage تحتاج ترقية Shadcn — هل تذكرة جديدة؟
- كوبونات الـ MVP hardcoded — متى يتم ربطها بالـ Backend؟

## Related report
- `FE1-MIGRATION-002.md`
