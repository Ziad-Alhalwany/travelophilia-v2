# backend/django_api/trip_requests/urls.py
from django.urls import path
from .views import (
    TripRequestCreateView,
    TripRequestGenerateCodeView,
    TripRequestCRMListView,
    TripRequestCRMDetailUpdateView,
    TripRequestNoteListCreateView,
)

urlpatterns = [
    # =========================
    # Website (public)
    # =========================

    # Accept both /trip-requests and /trip-requests/
    path("trip-requests", TripRequestCreateView.as_view(), name="trip-request-create-no-slash"),
    path("trip-requests/", TripRequestCreateView.as_view(), name="trip-request-create"),

    # Accept both /generate-code and /generate-code/
    path("trip-requests/generate-code", TripRequestGenerateCodeView.as_view(), name="trip-request-generate-code-no-slash"),
    path("trip-requests/generate-code/", TripRequestGenerateCodeView.as_view(), name="trip-request-generate-code"),

    # =========================
    # CRM (protected)
    # =========================
    path("crm/trip-requests", TripRequestCRMListView.as_view(), name="crm-trip-requests-list-no-slash"),
    path("crm/trip-requests/", TripRequestCRMListView.as_view(), name="crm-trip-requests-list"),

    path("crm/trip-requests/<int:pk>", TripRequestCRMDetailUpdateView.as_view(), name="crm-trip-requests-detail-no-slash"),
    path("crm/trip-requests/<int:pk>/", TripRequestCRMDetailUpdateView.as_view(), name="crm-trip-requests-detail"),

    path("crm/trip-requests/<int:pk>/notes", TripRequestNoteListCreateView.as_view(), name="crm-trip-requests-notes-no-slash"),
    path("crm/trip-requests/<int:pk>/notes/", TripRequestNoteListCreateView.as_view(), name="crm-trip-requests-notes"),
]
