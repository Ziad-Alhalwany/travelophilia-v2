# 🗺️ FRONTEND PROJECT MAP (Source of Truth)

> **⚠️ قاعدة صارمة:** يجب على أي Agent قراءة هذا الملف والتأكد من وجود المسارات قبل كتابة أي Import.
> آخر تحديث: 2026-08-09 — Audit Commit: `TP-DOC-SPRINT3.5-FULL-SYSTEM-SYNC-001`

---

## `/src` — Root

| File | Purpose |
|------|---------|
| `App.jsx` | Router — يعرّف كل الـ Routes ويلف المكونات بـ `AppLayout` |
| `main.jsx` | Entry point — يعمل render لـ `<App>` داخل `<BrowserRouter>` و `<StrictMode>` |
| `styles.css` | Tailwind v4 directives + Shadcn CSS variables (`:root` theme) + `@theme inline` design tokens |

---

## `/src/pages` — Page Components

| File | Route | Purpose |
|------|-------|---------|
| `Home.jsx` | `/` | الصفحة الرئيسية — Hero section + trip cards grid |
| `TripDetails.jsx` | `/destinations/:slug`, `/trips/:slug` | تفاصيل الرحلة — FX rates, checkout, coupons, activities, media, reviews, mobile sheet |
| `ChooseYourTripPage.jsx` | `/choose-your-trip` | قائمة الرحلات مع tabs (DAYUSE/STAY) + filters + sorting |
| `CustomizeYourTripPage.jsx` | `/customize-your-trip` | نموذج طلب رحلة مخصصة |
| `TripReservationPage.jsx` | `/reserve/:slug` | نموذج حجز الرحلة |
| `AfterSubmitPage.jsx` | `/after-submit` | صفحة تأكيد بعد إرسال الطلب + رابط المرافق السحري وتوجيه واتساب |
| `CRMLeadsPage.jsx` | `/crm/leads` | لوحة CRM leads (محمية بـ `CRMGuard`) |
| `crm/CrmLoginPage.jsx` | `/crm/login` | صفحة تسجيل الدخول لموظفي الـ CRM (تتصل بـ Django Auth) |
| `partners/PartnerLoginPage.jsx` | `/partners/login` | صفحة تسجيل الدخول لشركاء B2B (Two-Step Login Wizard) |
| `partners/InventoryDashboard.jsx` | `/partners/inventory` | لوحة تحكم مخزن وأسعار وإتاحة غرف الشركاء B2B (محمية بـ `PartnerGuard`) |
| `partners/inventoryApi.js` | N/A | خدمة طلبات API لإدارة مخزن الشركاء B2B |
| `admin/MarkupRulesManager.jsx` | `/admin/markup-rules` | لوحة مدير قواعد الربحية الدقيقة B2B (محمية بـ `PartnerGuard`) |
| `admin/markupApi.js` | N/A | خدمة طلبات API لإدارة قواعد الربحية |
| `ComingSoonPlaceholder.jsx` | `/coming-soon` (ومسارات الخدمة المستقلة) | مكون فاخر ناعم ذو خلفية زجاجية يعرض حجز الخدمات قريباً |
| `AboutPage.jsx` | `/about` | صفحة "عن الموقع" (تستخدم `ComingSoonPlaceholder`) |
| `ActivitiesPage.jsx` | `/activities` | صفحة الأنشطة (تستخدم `ComingSoonPlaceholder`) |
| `BeAmbassadorPage.jsx` | `/be-ambassador` | نموذج سفراء (تستخدم `ComingSoonPlaceholder`) |
| `BeOneOfUsPage.jsx` | `/be-one-of-us` | صفحة تجنيد (تستخدم `ComingSoonPlaceholder`) |
| `CollaborateWithUsPage.jsx` | `/collaborate-with-us` | نموذج تعاون (تستخدم `ComingSoonPlaceholder`) |
| `DestinationPage.jsx` | `/destinations` | صفحة الوجهات (تستخدم `ComingSoonPlaceholder`) |
| `SupportTeamPage.jsx` | `/support` | فريق الدعم (تستخدم `ComingSoonPlaceholder`) |
| `TicketFlightPage.jsx` | `/ticket-flight` | حجز تذاكر طيران (تستخدم `ComingSoonPlaceholder`) |
| `TransportationPage.jsx` | `/transportation` | خدمات النقل (تستخدم `ComingSoonPlaceholder`) |
| `VisaPage.jsx` | `/visa` | معلومات التأشيرة (تستخدم `ComingSoonPlaceholder`) |
| `WorkWithUsPage.jsx` | `/work-with-us` | نموذج "اشتغل معانا" (تستخدم `ComingSoonPlaceholder`) |

---

## `/src/components` — Reusable Components

### `/src/components/layout`
| File | Purpose |
|------|---------|
| `AppLayout.jsx` | Layout wrapper — Navbar + `<Outlet>` + Footer |
| `Navbar.jsx` | شريط التنقل العلوي — Shadcn Buttons + روابط نشطة |
| `Footer.jsx` | التذييل — روابط رسمية + حقوق النشر |

### `/src/components/shared`
| File | Purpose |
|------|---------|
| `TripCard.jsx` | كارت الرحلة — Shadcn Card + يستقبل props مع شارات الأسعار والوسوم |

### `/src/components/forms`
| File | Purpose |
|------|---------|
| `TripRequestForm.jsx` | نموذج طلب الرحلة — Shadcn Input/Label/Button |

### `/src/components/partners`
| File | Purpose |
|------|---------|
| `MultiSelectChips.jsx` | مكون اختيار متعدد بالبطاقات (Chips) للفنادق والغرف |

### `/src/components/properties`
| File | Purpose |
|------|---------|
| `PropertyCalendar.jsx` | شبكة التقويم التفاعلية لإتاحة وأسعار الغرف للموردين |

### `/src/components/ui` (Shadcn UI Primitives — Cleaned `.jsx`)
| File | Purpose |
|------|---------|
| `button.jsx` | Shadcn Button component (variants: default, outline, ghost) |
| `card.jsx` | Shadcn Card component |
| `input.jsx` | Shadcn Input component (مع `React.forwardRef`) |
| `badge.jsx` | Shadcn Badge component |
| `calendar.jsx` | Shadcn Calendar picker |
| `dialog.jsx` | Shadcn Modal Dialog |
| `popover.jsx` | Shadcn Popover component |
| `select.jsx` | Shadcn Select dropdown component |
| `switch.jsx` | Shadcn Switch toggle component |
| `tabs.jsx` | Shadcn Tabs navigation component |
| `tooltip.jsx` | Shadcn Tooltip component |

---

## `/src/services`
| File | Purpose |
|------|---------|
| `apiClient.js` | Axios instance + API bindings مع معالج الأخطاء العالمي وتراجع الشبكة |
| `authStorage.js` | مدير حفظ وقراءة رموز JWT للشركاء B2B |
| `crmAuth.js` | مدير مصادقة وحفظ رموز JWT لموظفي الـ CRM |

---

## `/src/middleware` — Route Isolation Guards
| File | Purpose |
|------|---------|
| `authGuard.jsx` | يحتوي على حراس المصادقة `CRMGuard` و `PartnerGuard` |

---

## `/src/hooks` — React Custom Hooks
| File | Purpose |
|------|---------|
| `useOtaServices.js` | Hooks pipeline wrapping OTA services (`usePropertyAvailability`, `useBulkInventoryUpdate`, `useOtaSearch`, `useWaitlistSubmit`) |

---

## `/src/utils` — Helper & Transformation Utilities

| File | Purpose |
|------|---------|
| `caseConverter.js` | التحويل التلقائي بين `camelCase` و `snake_case` للطلبات والاستجابات |
| `formUtils.js` | دوال مساعدة للتحقق وتجهيز النماذج |
| `markupHelpers.js` | حسابات ومعالجة قواعد الأرباح 4-Layer Markup |
| `orderCode.js` | مولد أكواد الطلبات |
| `tripRequestMapper.js` | تحويل بيانات نماذج الحجز إلى schema طلبات DRF |
| `voucherCodes.js` | حساب والتحقق من صحة القسائم والفواتير |
| `whatsapp.js` | بناء الروابط المباشرة لرسائل الواتساب |

---

## `/src/lib`
| File | Purpose |
|------|---------|
| `utils.js` | `cn()` utility — clsx + tailwind-merge |

---

## `/src/config`
| File | Purpose |
|------|---------|
| `config.js` | Application configuration |

---

## `/src/constants`
| File | Purpose |
|------|---------|
| `geoCodes.eg.js` | Egypt geo/city codes mapping |

---

## `/src/data`
| File | Purpose |
|------|---------|
| `trips.js` | Static trips data (legacy) |

---

## `/src/layouts`
| File | Purpose |
|------|---------|
| `MainLayout.jsx` | Shared Layout (تستدعي Navbar و Footer الموحدة من `/components/layout`) |

---

## Root Config Files
| File | Purpose |
|------|---------|
| `vite.config.js` | Vite config — `@` alias → `./src`, dev server port 5173, API proxy |
| `components.json` | Shadcn config |
| `jsconfig.json` | Path aliases for IDE |
