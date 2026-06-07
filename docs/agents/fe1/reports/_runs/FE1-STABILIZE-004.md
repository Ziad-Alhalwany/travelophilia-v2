# FE1-STABILIZE-004 — تقرير تثبيت الواجهة

**Task ID:** TP-FE1-STABILIZE-UI-004
**Agent:** fe1
**Date:** 2026-03-15
**Branch:** `agent/fe1`
**Scope:** `src/pages/Home.jsx`, `src/components/layout/Navbar.jsx`, `src/components/layout/Footer.jsx`

## ملخص التغييرات

### 1. Home.jsx — Hero Section
- استُبدل Grid من `1.3fr_1fr` إلى `grid-cols-2` المتوازن
- أزرار CTA أصبحت تعمل كروابط حقيقية: `Explore Destinations → /choose-your-trip`, `Customize Your Trip → /customize-your-trip`
- Badges (High-End Stays, Local Experts, Small Groups) تم تحويلها من `<span>` إلى `<Button variant="outline" className="rounded-full">`
- لم يُحذف أي State أو Effect — كامل المنطق البرمجي محفوظ

### 2. Home.jsx — Error State
- استُبدل شريط الخطأ الأحمر الكبير بمكون Alert-style يتضمن:
  - أيقونة `AlertTriangle`
  - عنوان واضح: "Unable to load destinations"
  - نص الخطأ الفعلي تحته بخط صغير
  - `role="alert"` للـ Accessibility

### 3. Navbar.jsx
- أُضيفت 3 روابط فعالة: `Destinations → /choose-your-trip`, `Customize Trip → /customize-your-trip`, `About → /about`
- جميع الروابط تستخدم تأثير hover متسق (accent underline animation)

### 4. Footer.jsx
- أُعيد بناؤه بالكامل باستخدام Shadcn tokens: `bg-secondary`, `text-muted-foreground`, `border-border`
- 3 أعمدة: Brand, Quick Links (مع routes فعالة), Contact
- Copyright bar في الأسفل
- `mt-auto` لضمان ثبات الـ Footer أسفل الصفحة دائماً

## Risks
- لم يتم حذف أي Logic — فقط JSX و Tailwind classes
- `AppLayout.jsx` كان يستدعي Footer بالفعل — لم يحتاج تعديل
- About page ليس لها route حالياً في App.jsx (الرابط موجود لكن الصفحة لم تُربط بعد)

## Proposed Commit
```
TP-FE1-STABILIZE-UI-004: feat - stabilize Hero layout, wire Navbar links, rebuild Footer with Shadcn tokens (agent:fe1)
```
