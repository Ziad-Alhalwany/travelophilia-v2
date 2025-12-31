# backend/django_api/trip_requests/serializers.py
from __future__ import annotations
from django.contrib.auth import get_user_model

User = get_user_model()

def only_digits(v: str) -> str:
    """Helper: keep digits only (for phone / national id)."""
    return "".join([c for c in str(v or "") if c.isdigit()])


# backend/django_api/trip_requests/serializers.py
from rest_framework import serializers
from .models import TripRequest, TripRequestNote

class FlexibleCountField(serializers.Field):
    """
    يقبل:
    - int / "3" -> 3
    - list -> len(list)
    ويرجع دايمًا integer
    """
    def to_internal_value(self, data):
        if isinstance(data, list):
            return len(data)

        try:
            n = int(data)
        except Exception:
            raise serializers.ValidationError("Must be an integer or a list.")

        if n < 0:
            raise serializers.ValidationError("Must be >= 0.")
        return n

    def to_representation(self, value):
        try:
            return int(value or 0)
        except Exception:
            return 0


class TripRequestCreateSerializer(serializers.ModelSerializer):
    """
    Website Trip Request (Public)
    - بياخد payload بصيغة camelCase من React
    - يحفظ في الموديل بصيغة snake_case
    - بيرجع tripCode في الـ response بعد الإنشاء
    """

    # ===== Response field =====
    tripCode = serializers.CharField(source="trip_code", read_only=True)

    # ===== Accept incoming trip code (optional) =====
    tripCode_in = serializers.CharField(write_only=True, required=False, allow_blank=True)

    tripSlug_in = serializers.CharField(write_only=True, required=False, allow_blank=True)
    tripTitle_in = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # ===== Incoming (camelCase) -> Model fields =====
    fullName = serializers.CharField(source="leader_full_name")
    email = serializers.EmailField(source="leader_email")

    originCity = serializers.CharField(source="origin_city")
    destinationCity = serializers.CharField(source="destination_city")

    leaderGender = serializers.CharField(source="leader_gender")
    leaderAge = serializers.IntegerField(source="leader_age")

    nationality = serializers.CharField(required=False, allow_blank=True)
    residentCountry = serializers.CharField(source="resident_country", required=False, allow_blank=True)

    departDate = serializers.DateField(
        source="depart_date",
        input_formats=["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"],
    )
    returnDate = serializers.DateField(
        source="return_date",
        input_formats=["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"],
    )

    couplesAnswer = serializers.CharField(source="couples_answer", required=False, allow_blank=True)
    termsAccepted = serializers.BooleanField(source="terms_accepted", required=False)
    docsAcknowledged = serializers.BooleanField(source="docs_acknowledged", required=False)

    note = serializers.CharField(required=False, allow_blank=True)

    # ===== Phone inputs (frontend) =====
    dialCode = serializers.CharField(write_only=True)
    phoneLocal = serializers.CharField(write_only=True)

    phoneHasWhatsapp = serializers.BooleanField(write_only=True, required=False, default=True)
    whatsappDialCode = serializers.CharField(write_only=True, required=False, allow_blank=True)
    whatsappLocal = serializers.CharField(write_only=True, required=False, allow_blank=True)

    # ✅ counts (مرنة: int أو list) -> model counts
    adults = FlexibleCountField(source="adults_count")
    children = FlexibleCountField(source="children_count")

    # ===== Structured payload (optional) =====
    travelers = serializers.JSONField(required=False)  # adults list
    childrenDetails = serializers.JSONField(source="children_details", required=False)  # children list

    # ===== Optional fields that frontend may send (accept + ignore if you want) =====
    companionsMode = serializers.CharField(source="companions_mode", required=False, allow_blank=True)

    # دي بتجيلك من customize page عندك، خليه يقبلهم حتى لو مش هتستخدمهم دلوقتي
    nationalId = serializers.CharField(write_only=True, required=False, allow_blank=True)
    passportNumber = serializers.CharField(write_only=True, required=False, allow_blank=True)
    entryStatusForEgypt = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = TripRequest
        fields = [
            # response
            "tripCode",

            # optional incoming code
            "tripCode_in",

            # ✅ trip info from frontend
            "tripSlug_in",
            "tripTitle_in",

            # contact
            "fullName",
            "dialCode",
            "phoneLocal",
            "phoneHasWhatsapp",
            "whatsappDialCode",
            "whatsappLocal",
            "email",

            # profile
            "leaderGender",
            "leaderAge",
            "nationality",
            "residentCountry",

            # optional IDs
            "nationalId",
            "passportNumber",
            "entryStatusForEgypt",

            # trip
            "originCity",
            "destinationCity",
            "departDate",
            "returnDate",
            "adults",
            "children",
            "companionsMode",

            # structured
            "travelers",
            "childrenDetails",

            # confirmations
            "couplesAnswer",
            "termsAccepted",
            "docsAcknowledged",

            # note
            "note",
        ]

    def create(self, validated_data):
        # tripCode_in -> trip_code (لو جالك)
        trip_code_in = (validated_data.pop("tripCode_in", "") or "").strip()
        if trip_code_in:
            validated_data["trip_code"] = trip_code_in

        # ✅ tripSlug_in / tripTitle_in -> model fields
        trip_slug_in = (validated_data.pop("tripSlug_in", "") or "").strip()
        trip_title_in = (validated_data.pop("tripTitle_in", "") or "").strip()
        if trip_slug_in:
            validated_data["trip_slug"] = trip_slug_in
        if trip_title_in:
            validated_data["trip_title"] = trip_title_in

        # phones
        dial = (validated_data.pop("dialCode", "") or "").strip()
        phone_local = (validated_data.pop("phoneLocal", "") or "").strip()

        phone_has_wa = bool(validated_data.pop("phoneHasWhatsapp", True))
        wa_dial = (validated_data.pop("whatsappDialCode", "") or "").strip() or dial
        wa_local = (validated_data.pop("whatsappLocal", "") or "").strip()

        # optional (we accept them, but not required to store now)
        validated_data.pop("nationalId", None)
        validated_data.pop("passportNumber", None)
        validated_data.pop("entryStatusForEgypt", None)

        def join_phone(d, local):
            s = f"{(d or '').strip()}{(local or '').strip()}".replace(" ", "")
            return s

        leader_phone = join_phone(dial, phone_local)
        validated_data["leader_phone"] = leader_phone

        if phone_has_wa:
            validated_data["leader_whatsapp"] = leader_phone
        else:
            if wa_local:
                validated_data["leader_whatsapp"] = join_phone(wa_dial, wa_local)

        # counts from structured lists لو موجودة
        travelers = validated_data.get("travelers")
        kids = validated_data.get("children_details")

        if isinstance(travelers, list) and len(travelers) > 0:
            validated_data["adults_count"] = len(travelers)

        if isinstance(kids, list) and len(kids) > 0:
            validated_data["children_count"] = len(kids)

        adults = int(validated_data.get("adults_count") or 0)
        children = int(validated_data.get("children_count") or 0)
        validated_data["pax_total"] = max(1, adults + children)

        return super().create(validated_data)


# =============================================================================
# CRM Serializers (Protected endpoints)
# =============================================================================

class TripRequestListSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.CharField(source="assigned_to.username", read_only=True)

    class Meta:
        model = TripRequest
        fields = [
            "id",
            "trip_code",
            "created_at",
            "updated_at",

            "leader_full_name",
            "leader_phone",
            "leader_email",

            "origin_city",
            "destination_city",
            "depart_date",
            "return_date",

            "pax_total",
            "companions_mode",

            "status",
            "priority",
            "assigned_to",
            "assigned_to_username",
            "last_contacted_at",
            "next_followup_at",

            "source",
            "tags",
        ]


class TripRequestDetailSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.CharField(source="assigned_to.username", read_only=True)

    class Meta:
        model = TripRequest
        fields = "__all__"


class TripRequestCRMUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripRequest
        fields = [
            "status",
            "priority",
            "assigned_to",
            "last_contacted_at",
            "next_followup_at",
            "source",
            "tags",
        ]


class TripRequestNoteSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = TripRequestNote
        fields = [
            "id",
            "trip_request",
            "kind",
            "body",
            "created_by",
            "created_by_username",
            "created_at",
        ]
        read_only_fields = ["id", "trip_request", "created_by", "created_at", "created_by_username"]
