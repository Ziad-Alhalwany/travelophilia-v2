## Agent Operating Policy (One-time)

## Branch Policy (Source of Truth)

- Daily working base branch: `owner/integration`
- Stable release branch: `main`

Agents must sync from `owner/integration` unless explicitly instructed otherwise.
Only the owner merges `owner/integration` → `main` when ready.

**How to check latest**

- افتح: `docs/agents/_index.md` لمعرفة أحدث Run لكل Agent.
- اعتمد على “Contracts” وليس Runs للتنفيذ:
  - Backend Contract: في `docs/api.md` (قسم Backend Contract)
  - Identifiers: `docs/identifiers.md`
  - Locks: `docs/locks.md`
  - Tasks: `docs/tasks.md`

**Runs vs Contracts**

- Runs = تقارير تفصيلية (مرجع/سجل).
- Contracts = قرارات تنفيذية مختصرة (Source of Truth للتنفيذ).
- ممنوع التنفيذ مباشرة من Run بدون تحديث الـ Contract لو فيه قرار جديد.

**Change discipline**

- أي تغيير قرار (slug rules / endpoints / codes) لازم يتسجل في الـ Contract + tasks item.
- ممنوع Refactor واسع أثناء Bugfix صغير.

## Policy: Local-only Logs (STRICT)

- ممنوع إنشاء أو استخدام أي مسار داخل الريبو باسم:
  `docs/agents/**`
  لأنه ignored وبيتعرض للحذف عند التنضيف (`git clean`) ومش بيتشارك عبر Git.

- أي Logs / Chats / Reports خاصة بالـ Agents تكون **محليًا فقط** في:
  `_shared/agents/<agent>/{chats,reports}/_runs/`

- أي “قرارات/ملخصات” يجب أن تُكتب في ملفات متتبعة داخل Git:
  - `docs/agents-index.md` (ملخص الحالة العامة + آخر القرارات + القادم)
  - و/أو `docs/tasks.md` (لو مهام)
  - و/أو `docs/api.md` / `docs/product/*` حسب نوع القرار

## 5) Handoff to Next Agent (MANDATORY)

- What I completed:
- What changed (contracts/decisions/files):
- Next step for you:
- Risks/Blockers:
- References (paths + commit hashes):
