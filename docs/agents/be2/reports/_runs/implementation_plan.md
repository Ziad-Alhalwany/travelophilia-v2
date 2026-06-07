# Implementation Plan: Resolve Settings Conflicts & Enforce PII Security Constraints

This implementation plan outlines the steps to resolve merge conflicts in `settings.py`, enforce secure database settings, configure model-level PII protection constraints in the `Customer` model, and generate the corresponding migrations.

## User Review Required

> [!IMPORTANT]
> - **Environment Variable Strictness**: Enforcing strict environment variable lookups for `SECRET_KEY` and `DB_PASSWORD` will cause the application to raise `ImproperlyConfigured` exceptions immediately if they are missing from the environment (e.g. from `.env` or system env vars). This is necessary to avoid fallback to leaked/hardcoded production values.
> - **Model-Level Hashing**: Override of `Customer.save()` and initialization handles raw `identity_number` values seamlessly. Setting/passing a plain text ID number will trigger deterministic hashing automatically.

## Proposed Changes

### Settings & Configuration

#### [MODIFY] [settings.py](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/be2/backend/django_api/djconfig/settings.py)

- Remove the merge conflict markers.
- Import `ImproperlyConfigured` from `django.core.exceptions`.
- Remove hardcoded fallbacks for `SECRET_KEY` and `DB_PASSWORD`.
- Check and raise an exception if either is missing.
- Resolve database config defaults (database name: `travelophilia`, user: `travelophilia_owner`, port: `6666`).
- Remove redundant/duplicated `import os`, `dotenv` loading calls.

### Trip Requests Models

#### [MODIFY] [models.py](file:///d:/ZIAD%20Alhalwany/TRAVILOPHILIA/TRAVELOPHILIA%20WEBSITE/_worktrees/be2/backend/django_api/trip_requests/models.py)

- Modify `identity_hash` to be:
  ```python
  identity_hash = models.CharField(
      max_length=255,
      unique=True,
      null=True,
      blank=True,
      help_text="Hashed identity for data masking"
  )
  ```
- Implement `__init__` and a property descriptor for `identity_number` on the `Customer` model to capture raw identity numbers during initialization/assignment.
- Override `Customer.save()` to extract `identity_last4` and hash `identity_number` into `identity_hash` before saving, ensuring blank values default to `None` for database unique constraint compatibility.

### Migrations

#### [NEW] Django Migration File in `backend/django_api/trip_requests/migrations/`

- Create/generate a migration file using `makemigrations`.

---

## Verification Plan

### Automated Tests
- Since we have terminal control rules, we will request permission from the user to execute the command:
  ```powershell
  python backend/django_api/manage.py makemigrations trip_requests
  ```
  to verify that Django parses the updated settings correctly and generates the migrations successfully.
- We will also run a check:
  ```powershell
  python backend/django_api/manage.py check
  ```
  to verify there are no system check or configuration issues.

### Manual Verification
- Verify that Django settings are loaded properly.
- Verify migration file content is generated correctly.
