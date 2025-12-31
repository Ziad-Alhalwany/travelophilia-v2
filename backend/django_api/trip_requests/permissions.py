from rest_framework.permissions import BasePermission


class IsCRMUser(BasePermission):
    """
    CRM access = لازم يكون user عامل login + staff/superuser
    (بعدين نبدّلها RBAC groups بالتفصيل)
    """
    message = "CRM access requires a staff account."

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and (u.is_staff or u.is_superuser))
