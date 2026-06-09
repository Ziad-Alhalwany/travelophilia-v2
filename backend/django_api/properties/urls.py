"""
Properties App – URL Configuration
=====================================
Task ID  : TP-OTA-AGGREGATOR-002 (Sprint 2, Ticket 2)
Agent    : BE1 (API & Business Logic Specialist)
Purpose  : Route definitions for the Multi-Source Aggregator
           Pricing & Search Engine public endpoint.

Routing Convention
------------------
Both slash and non-slash variants are registered to match the
project-wide pattern established in ``djconfig/urls.py`` (see
token endpoints) and ``trips/urls.py`` for consistency.

This file is included from ``djconfig/urls.py`` under the
``api/`` prefix, so the final resolved paths are:
    GET /api/properties/search
    GET /api/properties/search/
"""

from django.urls import path

from .views import (
    AccommodationSearchView,
    B2BPropertyMetadataView,
    OTPSendView,
    OTPVerifyView,
    PasswordResetView,
    PartnerTokenObtainView,
)

urlpatterns = [
    # ── Public Aggregator Search ──────────────────────────────
    path(
        "properties/search",
        AccommodationSearchView.as_view(),
        name="properties_search_no_slash",
    ),
    path(
        "properties/search/",
        AccommodationSearchView.as_view(),
        name="properties_search",
    ),

    # ── B2B Property Metadata ─────────────────────────────────
    path(
        "properties/metadata",
        B2BPropertyMetadataView.as_view(),
        name="properties_metadata_no_slash",
    ),
    path(
        "properties/metadata/",
        B2BPropertyMetadataView.as_view(),
        name="properties_metadata",
    ),

    # ── Stateful OTP Engine ───────────────────────────────────
    path(
        "auth/otp/send",
        OTPSendView.as_view(),
        name="otp_send_no_slash",
    ),
    path(
        "auth/otp/send/",
        OTPSendView.as_view(),
        name="otp_send",
    ),
    path(
        "auth/otp/verify",
        OTPVerifyView.as_view(),
        name="otp_verify_no_slash",
    ),
    path(
        "auth/otp/verify/",
        OTPVerifyView.as_view(),
        name="otp_verify",
    ),
    path(
        "auth/otp/password-reset",
        PasswordResetView.as_view(),
        name="otp_password_reset_no_slash",
    ),
    path(
        "auth/otp/password-reset/",
        PasswordResetView.as_view(),
        name="otp_password_reset",
    ),
]

# Separate clean routing namespaces for B2B partner auth to prevent collisions
partner_urlpatterns = [
    path(
        "token",
        PartnerTokenObtainView.as_view(),
        name="partner_token_no_slash",
    ),
    path(
        "token/",
        PartnerTokenObtainView.as_view(),
        name="partner_token",
    ),
]

