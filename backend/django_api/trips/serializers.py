# backend/django_api/trips/serializers.py
from rest_framework import serializers
from .models import Trip, Destination, Activity


class TripSerializer(serializers.ModelSerializer):
    # ✅ frontend بيقرأ title — نخليه alias من name
    title = serializers.CharField(source="name", read_only=True)

    # ✅ حقول تساعد الكروت
    destinationCity = serializers.SerializerMethodField()
    durationLabel = serializers.SerializerMethodField()

    # optional (لو هتستخدمهم قدام)
    startDate = serializers.SerializerMethodField()
    availableDate = serializers.SerializerMethodField()

    def get_destinationCity(self, obj):
        loc = (obj.location or "").strip()
        return loc.split(",")[0].strip() if loc else ""

    def get_durationLabel(self, obj):
        n = getattr(obj, "durationNights", None)
        if n is None:
            return ""
        return f"{int(n)}N"

    def get_startDate(self, obj):
        return getattr(obj, "startDate", "") or ""

    def get_availableDate(self, obj):
        return getattr(obj, "availableDate", "") or ""

    class Meta:
        model = Trip
        fields = [
            "id",
            # ✅ Identifiers (clean)
            "slug",  # SEO slug
            "public_code",  # Operational code (موجود في الموديل)
            "global_seq",  # موجود في الموديل
            # display
            "name",
            "title",
            "location",
            "type",
            "description",
            "media",
            "social_proof",
            # pricing/meta (كما هو حاليًا)
            "priceFrom",
            "priceTo",
            "currency",
            "durationNights",
            "durationLabel",
            "tags",
            "highlights",
            "destinationCity",
            "startDate",
            "availableDate",
            "is_active",
            # codes
            "dest_code",
            "from_code",
            "to_code",
            # internal
            "internal_key",
            "internal_seq",
        ]


class DestinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destination
        fields = [
            "id",
            "code",
            "slug",
            "name",
            "country",
            "city",
            "description",
            "cover_image_url",
            "gallery_urls",
            "video_urls",
            "is_active",
            "sort_order",
        ]


class ActivitySerializer(serializers.ModelSerializer):
    duration = serializers.CharField(source="duration_label", read_only=True)

    destinationCode = serializers.CharField(source="destination.code", read_only=True)
    destinationSlug = serializers.CharField(source="destination.slug", read_only=True)

    class Meta:
        model = Activity
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "price",
            "currency",
            "duration",
            "options",
            "tags",
            "is_active",
            "sort_order",
            "destinationCode",
            "destinationSlug",
        ]
