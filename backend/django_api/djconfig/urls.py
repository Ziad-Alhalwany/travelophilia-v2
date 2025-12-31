# backend/django_api/djconfig/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),

    # ===== Auth (JWT) =====
    path("api/auth/token", TokenObtainPairView.as_view(), name="token_obtain_pair_no_slash"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh", TokenRefreshView.as_view(), name="token_refresh_no_slash"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # ===== APIs =====
    path("api/", include("trips.urls")),
    path("api/", include("trip_requests.urls")),
]
