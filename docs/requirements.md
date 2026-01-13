# مواصفات مشروع موقع Travelophilia

فيما يلي تجميع شامل لكل الطلبات والميزات والمتطلبات الخاصة بمشروع موقع **Travelophilia**، منظم في هيكل واضح يسهل الرجوع إليه.

---

## 1. البنية الكاملة للمشروع (Project Structure)

- **Root / travelophilia-web (Travelophilia v2)**  
  - `public/`: صور، فيديوهات، شعارات، ملفات ثابتة.
  - `src/`:
    - `assets/`: أيقونات، خطوط، عناصر تصميم.
    - `components/`: مكونات واجهة قابلة لإعادة الاستخدام (Navbar، Cards، Footer...).
    - `pages/`: الصفحات الرئيسية والفرعية (Home، Services، About Us، Customize Your Trip...).
    - `layouts/`: هياكل عامة مشتركة للصفحات.
    - `hooks/`: React Hooks مخصّصة.
    - `context/`: مشاركة بيانات وصلاحيات عبر Context API.
    - `utils/`: دوال عامة (تحديد العملة، اللغة، التحقق من VPN...).
    - `services/`: تكاملات API (حجوزات، عمليات دفع، تكاملات خارجية، Firebase...).
    - `config/`: إعدادات البيئة، المسارات، مفاتيح API، إدارة العملات واللغات.
    - `App.jsx`: نقطة تشغيل الواجهة الأمامية.
  - `backend/` (Node.js + Express):
    - `controllers/`: منطق العمل لجميع الخدمات.
    - `routes/`: نقاط نهاية API لكل وظائف الموقع.
    - `models/`: مخططات البيانات (Users، Hotels، Bookings، Transportation، Feedback...).
    - `middleware/`: الحماية، التوثيق الثنائي، إدارة الجلسات، مكافحة VPN.
    - `utils/`: JWT، OTP، توليد تقارير PDF، رفع ملفات، أدوات المزامنة مع Airtable/Zoho.
    - `server.js`: نقطة تشغيل الخادم.
  - `ai-agents/`:
    - `assistant-core.js`: إعداد وكيل الذكاء الاصطناعي لخدمة العملاء.
    - `call-center-bot.js`: سكربت مركز الاتصالات الآلي (Chatbot).
    - `prompts/`: تعليمات وسيناريوهات الردود.
  - `integrations/`:
    - `payments/`: ربط Paymob، Stripe، Instapay، PayPal (وتوسعات مستقبلية Apple Pay / Google Pay).
    - `whatsapp-api/`: التكامل مع WhatsApp Business الرسمي.
    - `elevenlabs-ai/`: توليد الصوتيات المتعددة اللغات للمحتوى التسويقي.
  - `analytics-dashboard/`:
    - لوحات تحكم (admin، financial، destination-report، partner-dashboard، user-dashboard).
    - عرض الإحصائيات، عدد الزوار، المعاملات، التحويلات، تقييم الأداء.
  - `data-seed/`: بيانات أولية للفنادق، الرحلات، الأنشطة، المزودين.
  - `docs/`: توثيق (requirements، API docs، diagrams).
  - `README.md`: توثيق شامل للتشغيل والبناء.
  - `.env`: مفاتيح حساسة (Zoho، Airtable، مزوّدي الدفع، البريد...).
  - `package.json`: حزم المشروع (React، Node، Integrations، أدوات الأمن).

- **قابلية التوسع**: دعم تطبيق Android/iOS لاحقًا بنفس الـ APIs.
- **التوثيق الداخلي**: تعليقات في الكود، استخدام TODO/FIXME، ووثائق داخل `docs/`.

---

## 2. الواجهة الأمامية (Frontend)

### 2.1 الصفحة الرئيسية (Home Page)

- **دعم اللغات واللهجات**:
  - تحديد اللغة تلقائيًا بناءً على بلد المستخدم أو IP (مع دعم لغات ولهجات متعددة).
  - إمكانية تغيير اللغة يدويًا من واجهة المستخدم.
  - محاولة كشف التحايل عن طريق VPN قدر الإمكان.

- **دعم العملات**:
  - تحديد العملة تلقائيًا حسب الموقع الجغرافي للمستخدم.
  - أسعار مخصصة لكل جنسية (سعوديين، مصريين، أجانب...).
  - تقليل فرص التحايل عبر VPN.

- **Hero / Header**:
  - عرض تقديمي للموقع وخدماته.
  - قوائم تنقل رئيسية:
    - `Home | About Us | Support Team | Work With Us | Collaborate With Us | Be One Of Us | Be an Ambassador | Ticket Flight | Choose Your Trip | Customize Your Trip | Transportation | Activities | Prepare Your Visa and Others | Destinations`
  - أزرار تسجيل الدخول وإنشاء حساب.
  - حقل بحث شامل (خدمات، وجهات، أنشطة…).

- **أيقونات السوشيال ميديا**:
  - Facebook، Instagram، TikTok، LinkedIn، Snapchat، X، YouTube، Threads، Telegram، WhatsApp.

- **عروض الصفحة الرئيسية**:
  - عرض الرحلات Packages المروَّجة.
  - عرض فنادق عشوائية من مدن مختلفة.
  - عرض معسكرات (Camps) عشوائيًا.
  - عرض Hostels، شاليهات، شقق، أنشطة (Activities)، خدمات النقل، تذاكر الطيران، خدمات التأشيرات.
  - ترتيب منطقي: Trips → Hotels → Camps → Hostels → Chalets/Apartments → Activities → Transportation → Flights → Visas.
  - كل قسم له صفحة مخصصة عند الضغط على العنوان (عرض + فلترة).

- **Feedback & Rating**:
  - خانة تقييم وتعليق عام على الشركة في الصفحة الرئيسية.
  - تقييمات وتعليقات لكل مزود خدمة تظهر في صفحته الخاصة.
  - شرط عرض التقييم:
    - إما المستخدم اشترى خدمة بالفعل.
    - أو تعليق عام بعد مراجعته من الإدارة.

### 2.2 Landing Page

- صفحة مخصصة للعروض الموسمية والحملات الإعلانية.
- تسهل ربط الإعلانات (Meta / TikTok / Google) بصفحة هبوط واضحة.

### 2.3 صفحات الفئات (Segments)

- صفحات/أقسام لفئات مختلفة:
  - Solo Traveler
  - Family Traveler
  - Couples
  - Groups
- كل واحدة لها محتوى وعروض وخدمات تناسبها.

### 2.4 Customize Your Trip

- نموذجين رئيسيين:
  1. **DAY USE TRIP**
  2. **ACCOMMODATION TRIP**
- حقول أساسية:
  - الاسم، السن، رقم الهاتف، الجنسية، البريد (اختياري)، نوع الرحلة، التواريخ، عدد المسافرين، ملاحظات.
- لاحقًا:
  - حقول متقدمة (الوظيفة، الديانة، رقم البطاقة/جواز السفر، نوع الغرفة، الميزانية).
  - رفع مستندات (هوية، جواز سفر، إقامة…).
- البيانات تُرسل إلى:
  - Backend (Database)
  - Airtable / Zoho عبر Webhooks/Integrations.

### 2.5 Choose Your Trip

- استعراض الباقات الجاهزة.
- فلترة حسب:
  - التاريخ، الميزانية، عدد المسافرين، نوع الرحلة، الوجهة.

### 2.6 Ticket Flight

- صفحة لعرض ودعم حجز تذاكر الطيران:
  - نموذج طلب تذكرة.
  - فلترة حسب الوجهة، التاريخ، الميزانية.
  - ربط مع Backend لإدارة الطلب.

### 2.7 Transportation

- عرض خدمات النقل:
  - Private Cars، Shuttles، Nile Cruise، City-to-City، إلخ.
- تجربة قريبة من Booking / Uber / Indrive:
  - عرض السيارة، السائق، عدد الركاب، الخدمات، المدن التي يغطيها.
- دمج Google Maps (في مرحلة متقدمة):
  - عرض نقطة الانطلاق والوصول.
  - routes محتملة.

### 2.8 Activities

- عرض الأنشطة الترفيهية:
  - سفاري، غطس، رحلات بحرية، جولات ثقافية…
- فلترة حسب:
  - الوجهة، نوع النشاط، السعر، المدة.
- تقييمات وصور وفيديوهات.

### 2.9 Prepare Your Visa and Others

- معلومات عن:
  - إجراءات التأشيرة لكل جنسية.
  - المستندات المطلوبة، خطوات التقديم، المدة، الأسعار.
- إمكانية إضافة:
  - خدمات تأمين سفر، استشارات، تجهيز أوراق.

### 2.10 About Us

- أقسام:
  - Our Story
  - Our Vision
  - Our Target
- Timeline:
  - مراحل تطور الشركة على مستوى الشهور/السنين.
- صور وفيديوهات:
  - من الرحلات، الأحداث، التوسعات.

### 2.11 Support Team

- معلومات التواصل:
  - Email، WhatsApp، نموذج دعم.
- نظام تذاكر (Ticketing):
  - لكل طلب دعم رقم وتاريخ وحالة.

### 2.12 Work With Us

- أقسام رئيسية:
  - Add Your Property:
    - فنادق، كامبات، شاليهات، هوستلز، شقق.
    - نموذج + رفع مستندات وصور + مراجعة من الإدارة.
  - Add Your Transportation:
    - سيارات، سائقين، مستندات، نطاق العمل.
  - Be Guide With Us:
    - مرشدين سياحيين: بيانات شخصية، خبرات، مناطق تغطية.

### 2.13 Collaborate With Us

- موجه إلى:
  - مطاعم، كافيهات، براندات، معدات سفر، متاجر.
- نموذج تعاون:
  - بيانات النشاط، العروض، طرق التواصل.
- Influencers & Content Creators:
  - بيانات شخصية، روابط حسابات، إحصائيات، مناطق التغطية.

### 2.14 Be One of Us

- بوابة وظائف:
  - نموذج تقديم (مجال، خبرة، CV).
  - إدارة داخلية للطلبات (قبول/رفض/قيد المراجعة).

### 2.15 Be an Ambassador

- برنامج سفراء:
  - للمسافرين المتكررين، المرشدين، أصحاب التأثير.
  - مزايا وحوافز (رحلات، خصومات، نقاط).

### 2.16 Destinations

- صفحة لكل دولة/مدينة تحتوي على:
  - نظرة عامة، تاريخ، سبب التسمية.
  - جغرافيا وتقسيمات (أحياء، مناطق).
  - أفضل أوقات الزيارة.
  - مدة الإقامة المثالية.
  - المطاعم المشهورة، أفضل مقدمي الخدمات.
  - وسائل النقل المحلية (مترو، حافلات، تاكسي…).
  - الأنشطة المميزة.
  - محتوى مخصص للمصريين والأجانب.

---

## 3. نظام الحجز والدفع (Booking & Payment Flow)

1. **اختيار الخدمة**:
   - المستخدم يضيف الخدمات (Trip، Hotel، Activity، Transport، Ticket) إلى سلة الحجز.

2. **ملخص قبل الدفع (Basket Summary)**:
   - عرض العناصر، الأسعار، العملة، عدد الأفراد، التواريخ.

3. **إدخال بيانات المسافرين**:
   - اسم، عمر، جنسية، مستندات (لو مطلوبة).

4. **اختيار وسيلة الدفع**:
   - Paymob، Stripe، PayPal، Instapay (مع إمكانية إضافة Apple Pay / Google Pay مستقبلًا).

5. **تأكيد الطلب (Order Confirmation)**:
   - صفحة + Email + WhatsApp (تدريجيًا حسب التكاملات).

6. **التقارير**:
   - توليد تقرير PDF أو مستند تفصيلي لكل حجز.
   - نسخة للعميل + نسخة داخلية.

---

## 4. التكاملات (Integrations)

- **Airtable**:
  - استقبال بيانات النماذج (Trips، Partners، Feedback).
- **Zoho (CRM + Books/Inventory + Mail)**:
  - إدارة العملاء، الفواتير، الحسابات.
  - البريد الرسمي (support@، partners@، careers@…).
- **WhatsApp Business API**:
  - إرسال تأكيدات، تذكيرات، روابط حجز.
- **Google Maps API**:
  - عرض خرائط، مواقع، routes.
- **Payment Gateways**:
  - Stripe، Paymob، PayPal، Instapay، (Apple Pay / Google Pay مستقبلًا).
- **ElevenLabs**:
  - توليد صوتيات للمحتوى التسويقي / فيديوهات.

---

## 5. الأمان (Security & Compliance)

- **2FA**:
  - للمستخدمين والإداريين حسب الحساسية.
- **RBAC (Roles & Permissions)**:
  - أدوار: Owner, Admin, Finance, Support, Content, Tech, Providers, Ambassadors, Influencers.
- **تشفير بيانات**:
  - بيانات حساسة + مستندات + طرق الدفع.
- **التزام بالخصوصية**:
  - معايير مثل GDPR (إن لزم الأمر) والقوانين المحلية.
- **حماية المحتوى**:
  - مراجعة التقييمات والتعليقات قبل نشرها.
  - نظام لمنع السبام.

---

## 6. التحليلات ولوحات التحكم (Analytics & Dashboards)

- **Admin Dashboard**:
  - عدد الحجوزات، الإيرادات، الزوار، التوزيع حسب الوجهة.
- **Financial Dashboard**:
  - أرباح، مصروفات، صافي الربح، مستحقات المزودين.
- **Destination Report**:
  - أداء الوجهات (عدد الزوار، تقييمات، مبيعات).
- **Partner Dashboard**:
  - لكل شريك لوحة تعرض حجوزاته وأدائه.
- **User Dashboard**:
  - عرض الحجوزات السابقة، النقاط، الأنشطة.

---

## 7. نظام النقاط والمكافآت (Engagement & Rewards)

- نقاط مقابل:
  - التفاعل على السوشيال (Likes, Comments, Shares) عبر روابط مرتبطة.
  - مشاركة محتوى (Reels، صور، فيديوهات).
- استبدال النقاط:
  - خصومات، رحلات مجانية، ترقية غرف، مزايا.

---

## 8. المحتوى و SEO

- خطة SEO:
  - كلمات مفتاحية، محتوى منظم، عناوين ووصف، Schema.
- مدونة/محتوى:
  - مقالات سفر، نصائح، قصص رحلات، أدلة وجهات.
- محتوى متعدد اللغات:
  - عربي / إنجليزي / لغات أخرى حسب التوسّع.

---

## 9. النماذج (Forms) وأتمتة العمليات

- **Customize Your Trip** (Day Use / Accommodation).
- **Providers / Partners**:
  - فنادق، كامبات، شاليهات، هوستلز، شقق، مزودو نشاطات.
- **Transportation Providers**:
  - سيارات، سائقين، مستندات، نطاق العمل.
- **Guides**:
  - مرشدين سياحيين.
- **Influencers & Content Creators**:
  - تعاون تسويقي.
- **Jobs** (Be One of Us):
  - تقديم على الوظائف.
- **Ambassadors**:
  - برنامج السفراء.
- **Feedback & Rating**:
  - لكل خدمة + Feedback عام عن الشركة.

كل النماذج ترتبط بـ Airtable/Zoho في مراحل التطبيق الفعلي.

---

## 10. إدارة المحتوى والمراجعات

- **مراجعة الشركاء**:
  - حالات: Pending / Approved / Rejected.
- **مراجعة التقييمات**:
  - عدم النشر إلا بعد الموافقة.
- **التقارير**:
  - إرسال تقارير للمديرين (بريد/WhatsApp).

---

## 11. المراسلات والتواصل الرسمي

- **Zoho Mail**:
  - بريد رسمي للفرق المختلفة.
- **WhatsApp**:
  - قناة دعم ورسائل تأكيد.
- لاحقًا:
  - Slack / MS Teams للتواصل الداخلي.

---

## 12. مستقبل المشروع

- رحلات حج وعمرة.
- تغطية وجهات عالمية (أوروبا، آسيا، أفريقيا).
- تطبيقات موبايل (iOS / Android).
- ذكاء اصطناعي لتوصية الرحلات وتوقّع الطلب.
- تحسين مستمر لـ UI/UX بناءً على Feedback المستخدمين.

---

# Travelophilia — Requirements (Product)

## 1) Scope (MVP → Production)
### MVP must support
- Browse trips (list)
- View trip details
- Submit a reservation (Trip Request)
- View requests in CRM (internal)
- Support STAY + DAYUSE types

### Out of Scope (later)
- Online payments
- Full booking engine for hotels/transfers
- Automated itinerary builder
- Advanced CRM workflows (assignments, SLA, etc.)

---

## 2) Pages & UX (Customer)
### Home
- Brand promise: “Trips for humans, not tourists”
- CTA: Start a trip / Choose your trip / Customize

### Trips List (/choose-your-trip)
- Show trip cards: title, location, type, base price, tags, rating (if exists)
- Filter (later) by type/destination/price

### Trip Details (/trips/:slug)
- Show media (images/videos)
- Show highlights + description
- Show add-ons (activities) when available
- Show checkout summary
- CTA to reservation

### Reservation (/reserve/:identifier)
- Form validates required fields
- Handles Egyptian vs non-Egyptian identity rules
- Must submit successfully and create TripRequest
- Must show success message + reference code

### Customize trip (/customize)
- Collect requirements and submit custom trip request
- Must not break existing flows

---

## 3) Internal (CRM)
### CRM Leads (/crm/leads or similar)
- Show trip requests list
- Show status/priority labels (not numeric)
- Show internal code + lead code (for team)
- Requires authentication

---

## 4) Backend Requirements
### Trips
- Must support lookup by slug OR public_code.
- Must return stable fields; avoid breaking FE.

### Trip Requests
- Endpoint `POST /api/trip-requests/` expects snake_case.
- Must validate:
  - origin_city, destination_city, terms_accepted, depart_date, return_date, pax_total, adults_count, children_count
  - identity rules:
    - Egyptians: national id last4 required
    - Non-Egyptians: passport last4 + entry_type_for_egypt required
  - docs_acknowledged required when couples YES or children > 0

### CRM
- Protected endpoints.
- Refresh token flow works.

---

## 5) Non-Functional Requirements
- Reliability: no 500s in normal flows
- Performance: trips list loads under 2 seconds locally
- Security: auth protected CRM endpoints, no secrets in repo
- Maintainability: hybrid naming policy enforced

---

## 6) Acceptance Criteria (Key Flows)
1) Trips list loads and renders cards
2) Trip details loads by slug
3) Reservation page loads by public_code identifier
4) Submitting reservation creates a TripRequest and shows success
5) CRM shows the created request


_هذا الملف يعمل كمرجع رسمي لمتطلبات مشروع Travelophilia، ويتم تحديثه عند أي تعديل جديد في الرؤية أو الخصائص._
