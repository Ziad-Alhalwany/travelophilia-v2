from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    # ===== Auth (JWT) =====
    path(
        "api/auth/token",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair_no_slash",
    ),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path(
        "api/auth/token/refresh",
        TokenRefreshView.as_view(),
        name="token_refresh_no_slash",
    ),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # ===== Partner / Vendor Auth Gateways =====
    # توجيه صريح لطلبات دخول الشركاء والموردين لتطابق نداءات الفرونت إند الحالية
    path("api/auth/partners/", include("properties.urls")),
    # ===== Core APIs =====
    path("api/", include("trips.urls")),
    path("api/", include("trip_requests.urls")),
    path("api/", include("properties.urls")),
]
