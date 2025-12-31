import re
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Trip
from .serializers import TripSerializer


def normalize_code_or_slug(s: str) -> str:
    """
    تطبيع أي قيمة داخلة:
    - لو حد عنده suffix تاريخ في الآخر (قديم) نشيله
    - ملحوظة: public_code شكل ثابت (ST-/DU-) غالبًا مش هيتأثر
    """
    s = (s or "").strip()
    s = re.sub(r"-\d{4}-\d{2}-\d{2}$", "", s)  # strip date suffix
    return s.strip()


class TripsListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Trip.objects.filter(is_active=True).order_by("id")
        data = TripSerializer(qs, many=True).data
        return Response(data, status=status.HTTP_200_OK)

class TripsDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        s = (slug or "").strip()

        # ✅ 1) الأساس الجديد: public_code
        trip = Trip.objects.filter(is_active=True, public_code=s).first()

        # ✅ 2) fallback للقديم (لو في لينكات قديمة)
        if not trip:
            trip = Trip.objects.filter(is_active=True, slug=s).first()

        if not trip:
            return Response(
                {"success": False, "message": "Trip not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = TripSerializer(trip).data
        return Response({"success": True, "data": data}, status=status.HTTP_200_OK)


class LegacyCustomTripView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        return Response(
            {"success": True, "message": "Custom trip request received."},
            status=status.HTTP_201_CREATED,
        )
