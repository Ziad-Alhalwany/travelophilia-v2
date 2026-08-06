from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from properties.urls import partner_urlpatterns

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
    # ===== B2B Partner Auth =====
    # اعتماد مسار الشركاء المعزول كلياً بمساحة اسم مستقلة لمنع التداخل
    path(
        "api/auth/partners/",
        include((partner_urlpatterns, "properties"), namespace="partners_auth"),
    ),
    # ===== Core APIs =====
    path("api/", include("trips.urls")),
    path("api/", include("trip_requests.urls")),
    path("api/", include("properties.urls")),
]
