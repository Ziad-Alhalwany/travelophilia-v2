from rest_framework import serializers
from .models import Trip


class TripSerializer(serializers.ModelSerializer):
    # ✅ frontend بيقرأ title — نخليه alias من name
    title = serializers.CharField(source="name", read_only=True)

    # ✅ نخلي "slug" اللي بيروح للفرونت = public_code (ده اللي الفرونت بينادي بيه)
    slug = serializers.CharField(source="public_code", read_only=True)

    # ✅ نحتفظ بالـ slug القديم داخلي/للتتبع
    legacySlug = serializers.CharField(source="slug", read_only=True)

    publicCode = serializers.CharField(source="public_code", read_only=True)
    globalSeq = serializers.IntegerField(source="global_seq", read_only=True)

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

            # ✅ frontend identifier
            "slug",        # = public_code
            "publicCode",
            "globalSeq",

            # internal tracking
            "legacySlug",

            # display
            "name",
            "title",
            "location",
            "type",
            "description",

            # pricing/meta
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

            # codes (مفيدة للـ admin/dashboard)
            "dest_code",
            "from_code",
            "to_code",

            # internal (company only)
            "internal_key",
            "internal_seq",
        ]
