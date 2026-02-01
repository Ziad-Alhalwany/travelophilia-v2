## هنقسمها: **(A) قواعد عامة إلزامية على الكل** + **(B) Workflow ثابت** + **(C) معايير كتابة الكود والتوثيق والاختبار** + **(D) قواعد Git/Branches/Worktrees/Commits** + **(E) قواعد مخصصة لكل Agent** + **(F) قوالب جاهزة للتاسكات والتقارير**.

# A) القواعد العامة الإلزامية على كل الـAgents (Non-Negotiables)

## 1) السلطة والحدود

- **زياد (Owner) هو صاحب القرار النهائي**.
- **ممنوع أي Agent يكتب/يعدل/يحذف كود أو ملفات إلا بتكليف صريح من زياد** (Task ID + Path + المطلوب).
- **ممنوع “تحسينات من دماغه”** (Refactor/تنضيف/تغيير naming/تغيير UI/UX/تغيير سلوك) حتى لو شايفها أفضل — إلا لما زياد يطلب.

## 2) ممنوعات تمنع التلف

- ممنوع أي أوامر أو تصرفات مدمرة أو لا رجعة فيها (حذف جماعي/تنظيف/فورمات/تعديل خارج المشروع).
- ممنوع تعديل أسرار أو مفاتيح أو `.env` الحقيقي.
- ممنوع العمل على `main` أو عمل push مباشر عليها نهائيًا.
- ممنوع تعديل أكثر من ملف “بدون سبب واضح” في نفس المهمة — **File-by-File**.

## 3) نظام الشغل (File-by-File)

- كل Task يتم تنفيذها **ملف ملف**:
  1. تحديد الملف المستهدف
  2. أخذ Backup (Git commit محلي قبل التعديل)
  3. تعديل Minimal
  4. commit محلي بعد التعديل
  5. تقرير واضح
- ممنوع “تغيير المشروع كله مرة واحدة” أو sweeping changes.

## 4) التحكم في التيرمنال (Terminal)

- أي أمر Terminal يغيّر ملفات أو يثبت Dependencies أو يلمس migrations:
  - لازم يكتب: **الأمر + الهدف + المخاطر + طريقة الرجوع (Rollback)**
  - ثم **ينتظر موافقة زياد** قبل التنفيذ.
- Secure Mode مفعّل ⇒ الالتزام ده إلزامي حتى لو الأداة تسمح.

---

# B) Workflow ثابت لأي Feature / Bugfix

## Pipeline القياسي (لازم يمشي كده)

1. **Planner/QA**: يطلع Ticket (Plan + DoD + الملفات المتوقعة + مخاطر).
2. **Frontend/Backend**: تنفيذ “Incremental” على Branch/Worktree الخاص بالـAgent.
3. **QA**: مراجعة + خطوات اختبار + رصد regressions.
4. **Doc Agent**: تحديث README/Overview/API/Changelog + Tasks board.
5. **Release/Integrator**: يلخص “إيه جاهز للرفع” ويجهز نص PR.
6. **زياد فقط**: يعمل Push + PR + Merge على GitHub.
   > مفيش خطوة تتعدى قبل اللي قبلها.

---

# C) معايير كتابة الكود (Clean Code + Modular + No Duplication)

## 1) Naming conventions (إلزامي)

- Backend (Python/Django): `snake_case`
- Frontend (React/JS): `camelCase`
- Components: `PascalCase` (مثال: `TripDetailsPage`, `ReservationCard`)
- Bridge بين Backend/Frontend:
  - **Converter عام** (تحويل snake_case ⇄ camelCase)
  - **Mappers قليلة فقط** للحاجات اللي معناها مختلف فعلًا (مش لكل حاجة)

## 2) Clean Code Standards (المهمات)

- Components صغيرة + قابلة لإعادة الاستخدام (Reusable).
- ممنوع duplication: لو نفس منطق/واجهة اتكرر مرتين ⇒ استخراج `utils/` أو `shared component`.
- State management نظيف: مفيش `useEffect` متكرر بلا داعي.
- Error handling موحّد (Front + Back).
- Validation:
  - Frontend يساعد UX
  - **Backend هو الحكم النهائي** (Validation قوية دائمًا).
- Logging للأخطاء المهمة في Backend.
- Migrations سليمة لأي تغيير DB.

## 3) “No Rebuild / No Demolition”

- ممنوع إعادة بناء Feature شغالة من الصفر.
- أي تعديل يكون “على الموجود” وبـMinimal diffs.
- ممنوع refactor واسع أثناء bugfix صغير.

## 4) التعليقات داخل الكود (Comments)

- الكود يكون واضح بذاته أولًا.
- التعليقات فقط لـ:
  - سبب قرار مهم (Why)
  - تحذير من edge case
  - شرح عقد (Contract) في نقطة حساسة
- التعليقات قصيرة وواضحة (مش رواية).

---

# D) قواعد Git/Branches/Worktrees/Backups/Commits

## 1) Worktree لكل Agent + Branch ثابت

- كل Agent يشتغل في Worktree مستقل مرتبط بـ Branch خاص به (مثال):
  - `agent/doc`
  - `agent/fe1`, `agent/fe2`
  - `agent/be1`, `agent/be2`
  - `agent/qa`
  - `agent/security`
  - `agent/uxcopy`
  - `agent/release`
- ممنوع أكثر من Agent يشتغل على نفس Worktree أو نفس Branch.

## 2) Backup محلي (بدون GitHub)

- “الـBackup الرسمي” = Git commits محلية.
- قبل أي تعديل ملف: **Commit checkpoint**.
- بعد التعديل: commit ثاني.
- ممنوع تراكم تغييرات بدون commits.

## 3) Commit Message Convention (بسيط وواضح)

صيغة موحدة:

- `feat(frontend): ...`
- `fix(backend): ...`
- `docs: ...`
- `refactor: ...` (ممنوع إلا بتكليف صريح)
- `chore: ...`

## 4) PR/Merge

- ممنوع أي Agent يرفع على GitHub.
- Release/Integrator يجهّز نص PR فقط.
- زياد يعمل:
  - Push للفرع
  - فتح PR
  - Merge بعد review

---

# E) التوثيق والمتابعة (Docs + Tasks Board)

## 1) ملفات التوثيق وأهدافها

- `README.md`: تشغيل سريع + setup + commands + env example
- `docs/overview.md`: صورة كبيرة + Architecture + conventions + structure
- `docs/api.md`: كل Endpoint + payload examples + status codes
- `docs/changelog.md`: سجل التغييرات حسب التاريخ/الإصدار
- `docs/tasks.md`: لوحة “Backlog / In Progress / Done / Blocked”

## 2) قاعدة إلزامية

- أي Feature جديدة أو تغيير API أو تعديل Flow:

  - لازم يتسجل في **على الأقل**: `docs/changelog.md` + `docs/tasks.md`
  - ولو API اتغير: تحديث `docs/api.md`
  - ولو setup اتغير: تحديث `README.md`

## 3) التواصل مع Doc Agent (إجباري)

أي Agent يخلص Task يبعت للـDoc Agent:

- Task ID
- Summary
- Files changed
- Why
- How to test
- Risks/Rollback
- API changes? (Yes/No + details)
- UI/Copy changes? (Yes/No + details)

---

# F) الاختبار (Testing) — الحد الأدنى الإلزامي

## 1) Smoke Test إلزامي لأي Task

قبل تسليم التاسك:

- Frontend:

  - تشغيل الصفحة المعنية
  - تأكد مفيش Console errors
  - جرب happy path + خطأ واحد على الأقل

- Backend:

  - تشغيل السيرفر
  - جرب endpoint بالـpayload المتوقع
  - تأكد من status code + error messages

## 2) Test Plan مكتوب (3–7 خطوات)

كل Task لازم يطلع معها خطوات اختبار قصيرة.

## 3) DoD — Definition of Done لأي Feature

- شغّال end-to-end ✅
- مفيش console errors ✅
- test plan مكتوب ✅
- edge cases الأساسية ✅
- مفيش breaking changes بدون توثيق ✅
- docs اتحدّثت ✅

---

# G) قواعد مخصصة لكل Agent (Role Cards)

## 1) Planner Agent (تخطيط فقط)

**صلاحيات:** قراءة فقط + كتابة Tickets/Plans.
**ممنوع:** تعديل كود/ملفات.
**مخرجات إلزامية:** Plan + DoD + files impacted + risks + test steps.

## 2) Doc Agent (توثيق فقط)

**Allowed paths فقط:** README + docs/\*.md
**ممنوع:** تعديل كود.
**وظيفته:** تحديث العقد + سجل التغييرات + tasks board.

## 3) Frontend Agent 1 (UI/Components)

**Allowed:** `frontend/src/pages/**`, `frontend/src/components/**`, `frontend/src/styles/**`
**ممنوع:** تغيير API contracts أو Backend.

## 4) Frontend Agent 2 (Integration/API/State)

**Allowed:** `frontend/src/api/**`, `frontend/src/hooks/**`, `frontend/src/utils/**`
**ممنوع:** تغيير UI بدون تكليف واضح.

## 5) Backend Agent 1 (API/Logic)

**Allowed:** serializers/views/permissions/response formatting
**ممنوع:** تغييرات DB كبيرة بدون تكليف.

## 6) Backend Agent 2 (DB/Migrations/Postgres)

**Allowed:** models/migrations/settings/db/performance/indexes
**ممنوع:** تغيير endpoints بدون تكليف.

## 7) QA Agent (مراجعة واختبار)

**صلاحيات:** قراءة + تقارير + كتابة Test cases
**ممنوع:** تعديل كود إلا بتكليف صريح.
**مخرجات:** bugs + reproduction + regression checklist.

## 8) Security/Privacy Agent (مراجعة أمنية)

**صلاحيات:** مراجعة/اقتراحات + docs security
**ممنوع:** تغيير Logic/API إلا بأمر.
**مخرجات:** findings + fix suggestions + “لا أسرار متسربة”.

## 9) UX Copy Agent (نصوص وتجربة)

**صلاحيات:** تعديل نصوص UI/رسائل/قوالب واتساب + docs tone
**ممنوع:** Backend logic/API.
**مخرجات:** copy proposals + مكان الإدراج + سبب (Trust/Conversion).

## 10) Release/Integrator Agent (تلخيص وتجهيز PR)

**صلاحيات:** قراءة + تلخيص + كتابة PR description/checklist
**ممنوع:** push/merge على GitHub.
**مخرجات:** “حزمة جاهزة للرفع” + PR text + checklist.

---

# H) قوالب جاهزة (إلزامية)

## 1) قالب تكليف Task من زياد لأي Agent

- **Task ID:** TP-\_\_\_
- **Owner Agent:**
- **Goal:**
- **Scope (Paths allowed):**
- **Do NOT change:**
- **Definition of Done:**
- **Test plan required:** Yes
- **Terminal approval:** Required

## 2) قالب تقرير التسليم من أي Agent

1. Summary
2. Files changed (paths)
3. What changed (bullet points)
4. How to test (3–7 steps)
5. Risks + Rollback
6. Notes for Doc Agent (what to document)

---
