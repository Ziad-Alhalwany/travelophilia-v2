# FE1-GLOBAL-UI-006 — تقرير الإصلاح والتحسين البصري

**Task ID:** TP-FE1-GLOBAL-UI-006
**Agent:** fe1
**Date:** 2026-03-15
**Branch:** `agent/fe1`

## ملخص

### 1. إصلاح خطأ جلب البيانات (Home.jsx)
- **المشكلة:** `Cannot read properties of undefined (reading 'results')`
- **السبب:** `apiClient.getTrips()` يستخدم `unwrap(res.data)` — فيرجع البيانات مباشرة وليس axios response. الكود كان يقرأ `response.data.results` وهو undefined.
- **الحل:** استبدال `response.data` بـ `data` مباشرة مع optional chaining

### 2. Glassmorphism Navbar
- تم استبدال: `bg-gradient-to-r from-[#060a0f]/98 to-[#061218]/96`
- بـ: `bg-background/80 backdrop-blur-lg border-border/50`
- زر Sign In: `bg-[#061218]/90` → `bg-background/60`

### 3. Gradient Hero Title
- أُضيف: `bg-gradient-to-r from-foreground via-primary to-[#00d8c0] bg-clip-text text-transparent`

### 4. TripCard Micro-interactions
- أُضيف: `hover:scale-[1.02]`
- تم استبدال: `bg-[radial-gradient(...)]` → `bg-card`
- تم استبدال: `border-white/10` → `border-border`
- تم استبدال: `hover:border-accent-strong/60` → `hover:border-primary/40`

## الملفات المُعدلة
| File | Changes |
|------|---------|
| `src/pages/Home.jsx` | Fix data fetch + gradient title |
| `src/components/layout/Navbar.jsx` | Glassmorphism + token cleanup |
| `src/components/shared/TripCard.jsx` | `hover:scale` + `bg-card` + `border-border` |

## Risks
- لم يُمس أي Logic/State/Effect
- الـ `bg-card` token يعتمد على تعريفه في `styles.css` `:root`
