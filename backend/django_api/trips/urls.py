# backend/django_api/trips/urls.py

from django.urls import path
from .views import TripsListView, TripsDetailView, LegacyCustomTripView

urlpatterns = [
    path("trips", TripsListView.as_view(), name="trips-list-no-slash"),
    path("trips/", TripsListView.as_view(), name="trips-list"),

    path("trips/<slug:slug>", TripsDetailView.as_view(), name="trips-detail-no-slash"),
    path("trips/<slug:slug>/", TripsDetailView.as_view(), name="trips-detail"),

    path("custom-trip", LegacyCustomTripView.as_view(), name="custom-trip-no-slash"),
    path("custom-trip/", LegacyCustomTripView.as_view(), name="custom-trip"),
]
