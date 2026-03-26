## Agent Operating Policy (One-time)

### Branch Policy

- **Daily working base branch (Source of Truth أثناء الشغل):** `owner/integration`
- **Stable release branch:** `main`
- كل Agents لازم تعمل sync من `owner/integration` إلا لو اتقال غير كده صراحة.
- فقط الـ Owner يعمل merge من `owner/integration` → `main` لما تبقى الأمور جاهزة.

### Worktree Rule (IMPORTANT)

Git worktrees تمنع تثبيت نفس الفرع في مكانين في نفس الوقت.

- أي تعديل/commit/push على `owner/integration` يتم من مجلد المشروع الرئيسي:
  `D:\ZIAD Alhalwany\TRAVILOPHILIA\TRAVELOPHILIA WEBSITE\Travelophilia v2`
- أي شغل خاص بـ `agent/<name>` يتم من worktree الخاص به:
  `D:\ZIAD Alhalwany\TRAVILOPHILIA\TRAVELOPHILIA WEBSITE\_worktrees\<name>`

### What to Read (Tracked in Git)

- **Agents Index:** `docs/agents-index.md` (آخر وضع سريع + قرارات + القادم)
- **Tasks:** `docs/tasks.md`
- **Backend/Frontend Contract:** `docs/api.md`
- **Identifiers:** `docs/identifiers.md`
- **Locks:** `docs/locks.md`
- **Product Context:** `docs/product/PROJECT_CONTEXT.md`

### Runs vs Contracts

- **Runs (Reports):** تقارير تفصيلية (مرجع/سجل) — مكانها Local فقط في `_shared`.
- **Contracts:** قرارات تنفيذية مختصرة (Source of Truth للتنفيذ) — لازم تكون داخل `docs/*` ومرفوعة على `owner/integration`.
- ممنوع التنفيذ مباشرة من Report بدون تحديث الـ Contract لو فيه قرار جديد.

### Local-only Logs (STRICT)

❌ ممنوع تمامًا إنشاء أو استخدام أي Logs/Reports داخل repo في:

- `docs/agents/**`

✅ مكان التقارير والشاتات الوحيد (Local ثابت على جهاز الـ Owner):

- `D:\ZIAD Alhalwany\TRAVILOPHILIA\TRAVELOPHILIA WEBSITE\_shared\agents\<agent>\{reports,chats}\_runs\`

✅ أي “قرارات/ملخصات” يجب كتابتها في ملفات متتبعة داخل Git:

- `docs/agents-index.md` و/أو `docs/tasks.md` و/أو `docs/api.md` و/أو `docs/product/*`

### TP-STATE-SYNC-001 (MANDATORY)

كل Agent يسلّم تقرير State Sync في:
`_shared/agents/<agent>/reports/_runs/TP-STATE-SYNC-001.md`

**Header إلزامي داخل التقرير:**

- Branch: `agent/<name>`
- Last synced base commit: `<hash>` (من `owner/integration`)
- git status: `clean/dirty`

وفي آخر التقرير لازم:

## Handoff to Next Agent (MANDATORY)

- What I completed
- What changed (contracts/decisions/files)
- Next step for you
- Risks/Blockers
- References (paths + commit hashes)
