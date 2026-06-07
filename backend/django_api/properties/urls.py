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

from .views import AccommodationSearchView

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
]
