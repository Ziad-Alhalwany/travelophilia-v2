# backend/django_api/trips/views.py
import re
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Trip, Destination, Activity
from .serializers import TripSerializer, DestinationSerializer, ActivitySerializer


def normalize_code_or_slug(s: str) -> str:
    s = (s or "").strip()
    s = re.sub(r"-\d{4}-\d{2}-\d{2}$", "", s)  # strip date suffix (legacy)
    return s.strip()


def find_destination(identifier: str):
    key = normalize_code_or_slug(identifier)
    if not key:
        return None

    upper = key.upper()
    dest = Destination.objects.filter(is_active=True, code=upper).first()
    if dest:
        return dest

    return Destination.objects.filter(is_active=True, slug=key).first()


class TripsListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Trip.objects.filter(is_active=True).order_by("id")
        data = TripSerializer(qs, many=True).data
        return Response(data, status=status.HTTP_200_OK)


class TripsDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, identifier):
        s = normalize_code_or_slug(identifier)

        if not s:
            return Response(
                {"success": False, "message": "Trip not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ✅ 1) public_code (تشغيلي)
        trip = Trip.objects.filter(is_active=True, public_code__iexact=s).first()

        # ✅ 2) slug (SEO)
        if not trip:
            trip = Trip.objects.filter(is_active=True, slug__iexact=s).first()

        if not trip:
            return Response(
                {"success": False, "message": "Trip not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = TripSerializer(trip).data
        return Response({"success": True, "data": data}, status=status.HTTP_200_OK)


class DestinationsListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Destination.objects.filter(is_active=True).order_by("sort_order", "name")
        data = DestinationSerializer(qs, many=True).data
        return Response({"success": True, "data": data}, status=status.HTTP_200_OK)


class DestinationDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug_or_code):
        dest = find_destination(slug_or_code)
        if not dest:
            return Response(
                {"success": False, "message": "Destination not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = DestinationSerializer(dest).data
        return Response({"success": True, "data": data}, status=status.HTTP_200_OK)


class DestinationActivitiesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug_or_code):
        dest = find_destination(slug_or_code)
        if not dest:
            return Response([], status=status.HTTP_200_OK)

        qs = Activity.objects.filter(destination=dest, is_active=True).order_by(
            "sort_order", "id"
        )
        data = ActivitySerializer(qs, many=True).data
        return Response(data, status=status.HTTP_200_OK)


class LegacyCustomTripView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        return Response(
            {"success": True, "message": "Custom trip request received."},
            status=status.HTTP_201_CREATED,
        )
