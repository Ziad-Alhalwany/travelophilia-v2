## Agent Operating Policy (One-time)

**Source of Truth**
- المرجع الرسمي للـ docs هو branch: `owner/integration`.
- قبل أي شغل: لازم تعمل `git fetch --all` وتقرأ آخر نسخة من docs على `owner/integration`.
- أي Report لازم يذكر: `branch` + `commit hash`.

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
