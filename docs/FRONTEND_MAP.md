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
| `Home.jsx` | `/` | الصفحة الرئيسية — Hero section + trip cards grid (يستخدم `<TripCard>`) |
| `TripDetails.jsx` | `/destinations/:slug`, `/trips/:slug` | تفاصيل الرحلة — FX rates, checkout, coupons, activities, media, reviews, mobile sheet |
| `ChooseYourTripPage.jsx` | `/choose-your-trip` | قائمة الرحلات مع tabs (DAYUSE/STAY) + filters + sorting |
| `CustomizeYourTripPage.jsx` | `/customize-your-trip` | نموذج طلب رحلة مخصصة |
| `TripReservationPage.jsx` | `/reserve/:slug` | نموذج حجز الرحلة |
| `AfterSubmitPage.jsx` | `/after-submit` | صفحة تأكيد بعد إرسال الطلب + رابط واتساب |
| `AboutPage.jsx` | (لا يوجد route حالياً) | صفحة "عن الموقع" |
| `ActivitiesPage.jsx` | (لا يوجد route حالياً) | أنشطة |
| `BeAmbassadorPage.jsx` | (لا يوجد route حالياً) | نموذج سفراء |
| `BeOneOfUsPage.jsx` | (لا يوجد route حالياً) | صفحة تجنيد |
| `CRMLeadsPage.jsx` | (لا يوجد route حالياً) | لوحة CRM leads |
| `CRMLoginPage.jsx` | (لا يوجد route حالياً) | تسجيل دخول CRM |
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
| `apiClient.js` | Axios instance + API functions: `getTrips()`, `getTripBySlug()`, `getDestinationActivities()`, `submitTripRequest()`, `submitCustomTrip()`, `generateTripRequestCode()` |
| `authStorage.js` | JWT token storage (localStorage) |
| `crmAuth.js` | CRM authentication service |

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
| `postcss.config.js` | PostCSS config |
| `tailwind.config.js` | Tailwind v4 config (mostly handled via CSS) |
