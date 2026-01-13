# backend/django_api/trip_requests/views.py

from django.db.models import Q
from django.utils.dateparse import parse_date

from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response

from .permissions import IsCRMUser
from .models import generate_trip_code, TripRequest, TripRequestNote
from .serializers import (
    TripRequestCreateSerializer,
    TripRequestCRMListSerializer,
    TripRequestDetailSerializer,
    TripRequestCRMUpdateSerializer,
    TripRequestNoteSerializer,
)


# -------------------------
# helpers
# -------------------------
def _has_db_field(model, field_name: str) -> bool:
    try:
        return any(
            getattr(f, "name", None) == field_name for f in model._meta.get_fields()
        )
    except Exception:
        return False


# =========================
# Public endpoints (Website)
# =========================
class TripRequestCreateView(generics.CreateAPIView):
    """
    Public endpoint used by the website form (no login required).
    POST /api/trip-requests/
    """

    queryset = TripRequest.objects.all()
    serializer_class = TripRequestCreateSerializer
    permission_classes = [AllowAny]


class TripRequestGenerateCodeView(APIView):
    """
    Public endpoint to generate a unique trip code (legacy).
    GET /api/trip-requests/generate-code/
    """

    permission_classes = [AllowAny]

    def get(self, request):
        for _ in range(10):
            code = generate_trip_code()
            if not TripRequest.objects.filter(trip_code=code).exists():
                return Response({"trip_code": code})
        return Response({"trip_code": generate_trip_code()})


# =========================
# CRM endpoints (Protected)
# =========================
class TripRequestCRMListView(generics.ListAPIView):
    permission_classes = [IsCRMUser]
    serializer_class = TripRequestCRMListSerializer

    def get_queryset(self):
        qs = TripRequest.objects.all().select_related("assigned_to")

        status = self.request.query_params.get("status")
        priority = self.request.query_params.get("priority")
        destination_city = self.request.query_params.get("destination_city")
        origin_city = self.request.query_params.get("origin_city")
        assigned_to = self.request.query_params.get("assigned_to")

        if status:
            qs = qs.filter(status=status)
        if priority:
            qs = qs.filter(priority=priority)
        if destination_city:
            qs = qs.filter(destination_city__icontains=destination_city)
        if origin_city:
            qs = qs.filter(origin_city__icontains=origin_city)
        if assigned_to:
            qs = qs.filter(assigned_to_id=assigned_to)

        q = (self.request.query_params.get("q") or "").strip()
        if q:
            # ✅ search الأساسي (مضمون)
            search_q = (
                Q(trip_code__icontains=q)
                | Q(trip_public_code__icontains=q)
                | Q(leader_full_name__icontains=q)
                | Q(leader_phone__icontains=q)
                | Q(leader_email__icontains=q)
                | Q(destination_city__icontains=q)
                | Q(origin_city__icontains=q)
            )

            # ✅ keep these WITHOUT breaking DB
            # لو عندك في المستقبل حقول DB بنفس الأسماء، هتشتغل تلقائي
            if _has_db_field(TripRequest, "reservation_code_internal"):
                search_q |= Q(reservation_code_internal__icontains=q)
            if _has_db_field(TripRequest, "lead_code"):
                search_q |= Q(lead_code__icontains=q)

            qs = qs.filter(search_q)

        created_from = self.request.query_params.get("created_from")  # YYYY-MM-DD
        created_to = self.request.query_params.get("created_to")  # YYYY-MM-DD
        if created_from:
            d = parse_date(created_from)
            if d:
                qs = qs.filter(created_at__date__gte=d)
        if created_to:
            d = parse_date(created_to)
            if d:
                qs = qs.filter(created_at__date__lte=d)

        ordering = self.request.query_params.get("ordering") or "-created_at"
        allowed = {
            "created_at",
            "-created_at",
            "next_followup_at",
            "-next_followup_at",
            "priority",
            "-priority",
        }
        if ordering not in allowed:
            ordering = "-created_at"

        return qs.order_by(ordering)


class TripRequestCRMDetailUpdateView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsCRMUser]
    queryset = TripRequest.objects.all().select_related("assigned_to")
    http_method_names = ["get", "patch"]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return TripRequestCRMUpdateSerializer
        return TripRequestDetailSerializer


class TripRequestNoteListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsCRMUser]
    serializer_class = TripRequestNoteSerializer

    def get_queryset(self):
        return TripRequestNote.objects.filter(
            trip_request_id=self.kwargs["pk"]
        ).select_related("created_by")

    def perform_create(self, serializer):
        serializer.save(trip_request_id=self.kwargs["pk"], created_by=self.request.user)
