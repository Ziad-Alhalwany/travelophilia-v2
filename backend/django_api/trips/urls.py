# backend/django_api/trips/urls.py
from django.urls import path
from .views import (
    TripsListView,
    TripsDetailView,
    LegacyCustomTripView,
    DestinationsListView,
    DestinationDetailView,
    DestinationActivitiesView,
)

urlpatterns = [
    path("trips", TripsListView.as_view(), name="trips-list-no-slash"),
    path("trips/", TripsListView.as_view(), name="trips-list"),
    # ✅ identifier ممكن يبقى slug أو public_code
    path(
        "trips/<slug:identifier>",
        TripsDetailView.as_view(),
        name="trips-detail-no-slash",
    ),
    path("trips/<slug:identifier>/", TripsDetailView.as_view(), name="trips-detail"),
    # ✅ Destinations
    path(
        "destinations",
        DestinationsListView.as_view(),
        name="destinations-list-no-slash",
    ),
    path("destinations/", DestinationsListView.as_view(), name="destinations-list"),
    path(
        "destinations/<slug:slug_or_code>",
        DestinationDetailView.as_view(),
        name="destination-detail-no-slash",
    ),
    path(
        "destinations/<slug:slug_or_code>/",
        DestinationDetailView.as_view(),
        name="destination-detail",
    ),
    path(
        "destinations/<slug:slug_or_code>/activities",
        DestinationActivitiesView.as_view(),
        name="destination-activities-no-slash",
    ),
    path(
        "destinations/<slug:slug_or_code>/activities/",
        DestinationActivitiesView.as_view(),
        name="destination-activities",
    ),
    path("custom-trip", LegacyCustomTripView.as_view(), name="custom-trip-no-slash"),
    path("custom-trip/", LegacyCustomTripView.as_view(), name="custom-trip"),
]
