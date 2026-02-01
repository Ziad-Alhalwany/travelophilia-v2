# Active Locks Registry

> **Status Board**: This file tracks who is holding a lock on which file/path.
> **Protocol**: Check this file BEFORE starting work. If path is locked, do NOT touch.
> **Protected Files**: `docs/tasks.md`, `docs/locks.md`, `docs/identifiers.md`, `docs/PROJECT_CONTEXT.md` can ONLY be locked by/via **Release Agent**.

## Current Locks Table

| Lock ID | Path (File/Dir) | Owner Agent | Purpose | Created At | Expires At | Status |
| :------ | :-------------- | :---------- | :------ | :--------- | :--------- | :----- |
|         |                 |             |         |            |            |        |

---

## Lock Protocol Rules

### 1) Status Enums (Allowed Values)

- **ACTIVE**: Lock is currently valid. Do not touch.
- **RELEASED**: Work finished. Path is free.
- **STALE**: Time expired (>2h). Check with Release Agent before overriding.
- **WAITING**: Agent queued for this path.

### 2) Opening a Lock

- **Check**: Ensure path is not `ACTIVE`.
- **Request**: Ask Release Agent (or self-sign if authorized).
- **Entry**: Add row with `ACTIVE` status.

### 3) Closing a Lock

- **Unlock**: Change Status to `RELEASED`.
- **Constraint**: You CANNOT unlock unless you have pushed commits or created a Handoff.

### 4) Conflict Resolution

- Priority: **Hot Fix** / **Blocker** takes precedence.
- Release Agent has final say in disputes.
