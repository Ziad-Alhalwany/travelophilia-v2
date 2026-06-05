# FE1-FIX-MAP-003 Chat Summary

## What was discussed
- Vite Internal Server Error بسبب مكونات "وهمية" مستدعاة
- بعد التحقيق: الملفات (AppLayout, TripRequestForm) موجودة فعلاً — المشكلة الحقيقية: Double BrowserRouter
- إنشاء خريطة مشروع شاملة كمرجع دائم

## Decisions made
- أزلنا `<BrowserRouter>` من `App.jsx` (main.jsx يوفره)
- أزلنا imports غير مستخدمة (apiClient default, MapPin, Star, TripRequestForm)
- أنشأنا `FRONTEND_MAP.md` في `_shared/docs/` يغطي 59 ملف

## Open questions
- هل نضيف routes للصفحات المتبقية (About, Visa, etc)؟
- هل نحذف Legacy components (flat `/src/components/`) بعد ترقية كل الصفحات؟

## Related report
- `FE1-FIX-MAP-003.md`
