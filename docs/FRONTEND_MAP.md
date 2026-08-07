# 🗺️ FRONTEND PROJECT MAP (Source of Truth)

> **⚠️ قاعدة صارمة:** يجب على أي Agent قراءة هذا الملف والتأكد من وجود المسارات قبل كتابة أي Import.
> آخر تحديث: 2026-03-15 — Commit: (pending)

---

## `/src` — Root

| File | Purpose |
|------|---------|
| `App.jsx` | Router — يعرّف كل الـ Routes ويلف المكونات بـ `AppLayout` |
| `main.jsx` | Entry point — يعمل render لـ `<App>` داخل `<BrowserRouter>` و `<StrictMode>` |
| `styles.css` | Tailwind v4 directives + Shadcn CSS variables (`:root` theme) |

---

## `/src/pages` — Page Components

| File | Route | Purpose |
|------|-------|---------|
| `HomePage.jsx` | `/` | الصفحة الرئيسية — Hero section + trip cards grid (يستخدم `<TripCard>`) |
| `TripDetailsPage.jsx` | `/destinations/:slug`, `/trips/:slug` | تفاصيل الرحلة — FX rates, checkout, coupons, activities, media, reviews, mobile sheet |
| `ChooseYourTripPage.jsx` | `/choose-your-trip` | قائمة الرحلات مع tabs (DAYUSE/STAY) + filters + sorting |
| `CustomizeYourTripPage.jsx` | `/customize-your-trip` | نموذج طلب رحلة مخصصة |
| `TripReservationPage.jsx` | `/reserve/:slug` | نموذج حجز الرحلة |
| `AfterSubmitPage.jsx` | `/after-submit` | صفحة تأكيد بعد إرسال الطلب + رابط واتساب |
| `AboutPage.jsx` | (لا يوجد route حالياً) | صفحة "عن الموقع" |
| `ActivitiesPage.jsx` | (لا يوجد route حالياً) | أنشطة |
| `BeAmbassadorPage.jsx` | (لا يوجد route حالياً) | نموذج سفراء |
| `BeOneOfUsPage.jsx` | (لا يوجد route حالياً) | صفحة تجنيد |
| `CRMLeadsPage.jsx` | `/crm/leads` | لوحة CRM leads (ملاحظة: الدخول لـ `/crm` يحول تلقائياً إلى هنا - محمية بـ `CRMGuard`) |
| `CRMLoginPage.jsx` | `/crm/login` | صفحة تسجيل الدخول لموظفي الـ CRM (تتصل بـ Django Auth) |
| `partners/PartnerLoginPage.jsx` | `/partners/login` | صفحة تسجيل الدخول لشركاء وموردي B2B (Two-Step Login Wizard متصل بـ `/api/auth/partners/token/`) |
| `partners/InventoryDashboard.jsx` | `/partners/inventory` | لوحة تحكم مخزن وأسعار وإتاحة غرف الشركاء B2B (محمية بـ `PartnerGuard` وتستعلم من مسار metadata المعزول) |
| `CollaborateWithUsPage.jsx` | (لا يوجد route حالياً) | نموذج تعاون |
| `DestinationPage.jsx` | (لا يوجد route حالياً) | صفحة الوجهة |
| `SupportTeamPage.jsx` | (لا يوجد route حالياً) | فريق الدعم |
| `TicketFlightPage.jsx` | (لا يوجد route حالياً) | حجز تذاكر طيران |
| `TransportationPage.jsx` | (لا يوجد route حالياً) | خدمات النقل |
| `VisaPage.jsx` | (لا يوجد route حالياً) | معلومات التأشيرة |
| `WorkWithUsPage.jsx` | (لا يوجد route حالياً) | نموذج "اشتغل معانا" |

---

## `/src/components` — Reusable Components

### `/src/components/layout`
| File | Purpose |
|------|---------|
| `AppLayout.jsx` | Layout wrapper — Navbar + `<Outlet>` + Footer (يُستخدم كـ layout route في App.jsx) |
| `Navbar.jsx` | شريط التنقل العلوي — Shadcn Buttons (outline, ghost) |
| `Footer.jsx` | التذييل — روابط + حقوق النشر |

### `/src/components/shared`
| File | Purpose |
|------|---------|
| `TripCard.jsx` | كارت الرحلة — Shadcn Card + يستقبل props (slug, title, destination, price, etc.) |

### `/src/components/forms`
| File | Purpose |
|------|---------|
| `TripRequestForm.jsx` | نموذج طلب الرحلة — Shadcn Input/Label/Button |

### `/src/components/ui` (Shadcn)
| File | Purpose |
|------|---------|
| `button.tsx` | Shadcn Button component (variants: default, outline, ghost, etc.) |
| `card.tsx` | Shadcn Card + CardHeader/CardContent/CardFooter |
| `input.tsx` | Shadcn Input component |
| `label.tsx` | Shadcn Label component |
| `form.tsx` | Shadcn Form component (React Hook Form integration) |

### `/src/components` (Legacy — flat structure)
| File | Purpose |
|------|---------|
| `Button.jsx` + `Button.css` | Legacy button (pre-Shadcn) |
| `Navbar.jsx` | Legacy navbar (pre-Shadcn — NOT the one in `/layout/`) |
| `Footer.jsx` | Legacy footer |
| `TripCard.jsx` + `TripCard.css` | Legacy trip card (pre-Shadcn) |
| `Tag.jsx` + `Tag.css` | Tag badge component |
| `MaskedInput.jsx` | Phone number masked input |
| `SearchSelect.jsx` | Searchable select dropdown |
| `SectionHeader.jsx` | Reusable section header |

---

## `/src/services`
| File | Purpose |
|------|---------|
| `apiClient.js` | Axios instance + API/service bindings: `getTrips()`, `getTripBySlug()`, `getDestinationActivities()`, `submitCustomTrip()`, `generateTripRequestCode()`, `submitTripRequest()`, `fetchPropertyAvailability()`, `bulkUpdateInventory()`, `fetchSearchAggregator()`, `submitWaitlistQueue()`, `setGlobalErrorHandler()`, `createCancellableRequest()` |
| `authStorage.js` | مدير حفظ وقراءة رموز JWT للشركاء والموردين B2B في الـ `localStorage` تحت المفاتيح: `travelophilia_access_token` و `travelophilia_refresh_token` |
| `crmAuth.js` | مدير مصادقة وحفظ رموز JWT لموظفي الـ CRM والـ Staff في الـ `localStorage` تحت المفاتيح: `tp_crm_access` و `tp_crm_refresh` |

---

## `/src/middleware` — Route Isolation Guards

| File | Purpose |
|------|---------|
| `authGuard.jsx` | يحتوي على حراس مصادقة المسارات وعزل الموارد للواجهة الأمامية لمنع التخطي غير المصرح به:<br>• **`CRMGuard`**: يتحقق من توكن الموظفين JWT الصالح عبر `crmAuth` ويحمي مسار `/crm/*`.<br>• **`PartnerGuard`**: يتحقق من صلاحية شكل توكن الشركاء JWT (Well-formed JWT) ويحمي مسار `/partners/*`. |

---

## `/src/hooks` — React Custom Hooks

| File | Purpose |
|------|---------|
| `useOtaServices.js` | Custom hooks pipeline wrapping Sprint 2 OTA/Extranet services with AbortController query lifecycle management (prevents race conditions/memory leaks). |

### 🔗 Hooks inside `useOtaServices.js`:
- **`usePropertyAvailability`**: Fetches the availability calendar grid for a specific property. Wraps `fetchPropertyAvailability` (`GET /api/properties/{id}/availability/`).
- **`useBulkInventoryUpdate`**: Handles bulk inventory and pricing updates for the Extranet grid. Wraps `bulkUpdateInventory` (`POST /api/properties/{id}/availability/bulk-update/`).
- **`useOtaSearch`**: Wraps the aggregator search. Features race-condition cancel guards (via `createCancellableRequest`) to abort previous in-flight requests on successive calls. Wraps `fetchSearchAggregator` (`GET /api/properties/search/`).
- **`useWaitlistSubmit`**: Submits a request to join the waitlist queue for dates without active inventory. Wraps `submitWaitlistQueue` (`POST /api/waitlist/`).

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
| `trips.js` | Static trips data (legacy — NOT Source of Truth, DB is) |

---

## `/src/layouts`
| File | Purpose |
|------|---------|
| `MainLayout.jsx` | Legacy layout (pre-Shadcn — NOT used in current routing) |

---

## Root Config Files
| File | Purpose |
|------|---------|
| `vite.config.js` | Vite config — `@` alias → `./src`, dev server port 5173, API proxy to :8000 |
| `components.json` | Shadcn config — style `new-york`, CSS vars enabled, aliases |
| `jsconfig.json` | Path aliases for IDE |
