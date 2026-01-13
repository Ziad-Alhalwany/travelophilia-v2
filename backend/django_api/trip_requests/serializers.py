# backend/django_api/trip_requests/serializers.py
from django.apps import apps
from django.db import transaction
from rest_framework import serializers

from .models import TripRequest, TripRequestNote, ReservationSequence


# ==================================
# Notes
# ==================================
class TripRequestNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripRequestNote
        fields = ("id", "kind", "body", "created_by", "created_at")


# ==================================
# CRM List
# ==================================
class TripRequestCRMListSerializer(serializers.ModelSerializer):
    # ✅ ده اللي CRM محتاجه يشوفه كـ Internal Reservation Code
    reservation_code_internal = serializers.CharField(
        source="trip_code", read_only=True
    )

    # ✅ lead_code property في الموديل → لازم نعرّفه صراحة
    lead_code = serializers.CharField(read_only=True)

    class Meta:
        model = TripRequest
        fields = (
            "id",
            "created_at",
            "updated_at",
            "trip_code",
            "trip_public_code",
            "trip_slug",
            "trip_title",
            "reservation_r",
            "traveler_p",
            "is_leader",
            "leader_full_name",
            "leader_phone",
            "origin_city",
            "destination_city",
            "status",
            "priority",
            "reservation_code_internal",
            "lead_code",
        )


# ==================================
# CRM Update (PATCH)
# ==================================
class TripRequestCRMUpdateSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=TripRequest.Status.choices, required=False)
    priority = serializers.ChoiceField(
        choices=TripRequest.Priority.choices, required=False
    )

    class Meta:
        model = TripRequest
        fields = (
            "status",
            "priority",
            "assigned_to",
            "next_followup_at",
            "tags",
            "source",
        )


# ==================================
# CRM Detail (GET)
# ==================================
class TripRequestDetailSerializer(serializers.ModelSerializer):
    # ✅ نفس الفكرة: لازم نعرّفهم
    reservation_code_internal = serializers.CharField(
        source="trip_code", read_only=True
    )
    lead_code = serializers.CharField(read_only=True)

    # ✅ related_name في الموديل = "crm_notes" (مش notes_set)
    notes = TripRequestNoteSerializer(many=True, read_only=True, source="crm_notes")

    class Meta:
        model = TripRequest
        fields = (
            "id",
            "created_at",
            "updated_at",
            "trip_code",
            "trip_public_code",
            "trip_slug",
            "trip_title",
            "origin_city",
            "destination_city",
            "depart_date",
            "return_date",
            "adults_count",
            "children_count",
            "pax_total",
            "companions_mode",
            "note",
            "couples_answer",
            "terms_accepted",
            "docs_acknowledged",
            "leader_full_name",
            "leader_phone",
            "leader_whatsapp",
            "leader_email",
            "leader_gender",
            "leader_age",
            "leader_nationality",
            "leader_resident_country",
            "leader_identity_type",
            "leader_identity_last4",
            "entry_type_for_egypt",
            "travelers",
            "children_details",
            "status",
            "priority",
            "assigned_to",
            "next_followup_at",
            "tags",
            "source",
            "reservation_code_internal",
            "lead_code",
            "notes",
        )


# ==================================
# Public Create (Website)
# ==================================
class TripRequestCreateSerializer(serializers.ModelSerializer):
    """
    ✅ Canonical = snake_case
    ✅ بنقبل legacy camelCase مؤقتًا (عشان أي صفحات قديمة ما تتكسرش)
    ✅ docs_acknowledged مش Required دايمًا (بيتطلب فقط لما الرحلة تحتاج Docs)
    """

    # ------- legacy aliases (write_only) -------
    originCity = serializers.CharField(
        required=False, write_only=True, allow_blank=True
    )
    destinationCity = serializers.CharField(
        required=False, write_only=True, allow_blank=True
    )

    fullName = serializers.CharField(required=False, write_only=True, allow_blank=True)
    phone = serializers.CharField(required=False, write_only=True, allow_blank=True)

    termsAccepted = serializers.BooleanField(required=False, write_only=True)
    docsAcknowledged = serializers.BooleanField(required=False, write_only=True)

    tripSlug_in = serializers.CharField(
        required=False, write_only=True, allow_blank=True
    )
    tripTitle_in = serializers.CharField(
        required=False, write_only=True, allow_blank=True
    )

    # ------- canonical (snake_case) -------
    trip_slug = serializers.CharField(required=False, allow_blank=True)
    trip_title = serializers.CharField(required=False, allow_blank=True)

    origin_city = serializers.CharField(required=True, allow_blank=False)
    destination_city = serializers.CharField(required=True, allow_blank=False)

    terms_accepted = serializers.BooleanField(required=True)
    docs_acknowledged = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = TripRequest
        fields = (
            # canonical
            "trip_slug",
            "trip_title",
            "origin_city",
            "destination_city",
            "depart_date",
            "return_date",
            "adults_count",
            "children_count",
            "pax_total",
            "companions_mode",
            "note",
            "couples_answer",
            "terms_accepted",
            "docs_acknowledged",
            "leader_full_name",
            "leader_phone",
            "leader_whatsapp",
            "leader_email",
            "leader_gender",
            "leader_age",
            "leader_nationality",
            "leader_resident_country",
            "leader_identity_type",
            "leader_identity_last4",
            "entry_type_for_egypt",
            "travelers",
            "children_details",
            # aliases
            "originCity",
            "destinationCity",
            "fullName",
            "phone",
            "termsAccepted",
            "docsAcknowledged",
            "tripSlug_in",
            "tripTitle_in",
        )

    def validate(self, attrs):
        # 1) Fill canonical from legacy aliases
        if not attrs.get("trip_slug") and "tripSlug_in" in attrs:
            attrs["trip_slug"] = (attrs.get("tripSlug_in") or "").strip()

        if not attrs.get("trip_title") and "tripTitle_in" in attrs:
            attrs["trip_title"] = (attrs.get("tripTitle_in") or "").strip()

        if not attrs.get("origin_city") and "originCity" in attrs:
            attrs["origin_city"] = (attrs.get("originCity") or "").strip()

        if not attrs.get("destination_city") and "destinationCity" in attrs:
            attrs["destination_city"] = (attrs.get("destinationCity") or "").strip()

        if not attrs.get("leader_full_name") and "fullName" in attrs:
            attrs["leader_full_name"] = (attrs.get("fullName") or "").strip()

        if not attrs.get("leader_phone") and "phone" in attrs:
            attrs["leader_phone"] = (attrs.get("phone") or "").strip()

        if "terms_accepted" not in attrs and "termsAccepted" in attrs:
            attrs["terms_accepted"] = bool(attrs.get("termsAccepted"))

        if "docs_acknowledged" not in attrs and "docsAcknowledged" in attrs:
            attrs["docs_acknowledged"] = bool(attrs.get("docsAcknowledged"))

        # 2) Business rules
        if attrs.get("terms_accepted") is not True:
            raise serializers.ValidationError(
                {"terms_accepted": ["You must accept terms."]}
            )

        children_count = int(attrs.get("children_count") or 0)
        couples_answer = str(attrs.get("couples_answer") or "").strip().upper()
        children_details = attrs.get("children_details") or []
        needs_docs = (
            (children_count > 0)
            or (couples_answer == "YES")
            or (len(children_details) > 0)
        )

        if needs_docs and attrs.get("docs_acknowledged") is not True:
            raise serializers.ValidationError(
                {"docs_acknowledged": ["This field is required."]}
            )

        return attrs

    def _resolve_trip_public_code(
        self, trip_slug: str, trip_title: str, fallback_pk: int
    ) -> str:
        Trip = apps.get_model("trips", "Trip")

        slug = (trip_slug or "").strip()
        title = (trip_title or "").strip()

        # 1) slug -> Trip.public_code
        if slug:
            t = (
                Trip.objects.filter(slug=slug).first()
                or Trip.objects.filter(public_code=slug).first()
            )
            if t and getattr(t, "public_code", ""):
                return str(getattr(t, "public_code")).strip().upper()
            return slug.strip().upper()

        # 2) title -> Trip.public_code
        if title:
            t = Trip.objects.filter(name__iexact=title).first()
            if t and getattr(t, "public_code", ""):
                return str(getattr(t, "public_code")).strip().upper()

        # 3) fallback
        return f"CT-{int(fallback_pk):07d}-UNK"

    def create(self, validated_data):
        # تنظيف aliases
        for k in (
            "originCity",
            "destinationCity",
            "fullName",
            "phone",
            "termsAccepted",
            "docsAcknowledged",
            "tripSlug_in",
            "tripTitle_in",
        ):
            validated_data.pop(k, None)

        # pax_total
        if not validated_data.get("pax_total"):
            a = int(validated_data.get("adults_count") or 1)
            c = int(validated_data.get("children_count") or 0)
            validated_data["pax_total"] = max(1, a + c)

        # defaults
        if not validated_data.get("status"):
            validated_data["status"] = TripRequest.Status.NEW
        if not validated_data.get("priority"):
            validated_data["priority"] = TripRequest.Priority.MEDIUM

        trip_slug = validated_data.get("trip_slug", "")
        trip_title = validated_data.get("trip_title", "")

        with transaction.atomic():
            # create أولًا عشان ناخد pk
            tr = TripRequest.objects.create(**validated_data)

            # resolve trip_public_code
            tpc = self._resolve_trip_public_code(trip_slug, trip_title, tr.pk)
            tr.trip_public_code = tpc

            # defaults
            if tr.is_leader is None:
                tr.is_leader = True
            if not tr.traveler_p:
                tr.traveler_p = 1

            # reservation_r
            if not tr.reservation_r:
                seq, _ = ReservationSequence.objects.select_for_update().get_or_create(
                    trip_public_code=tpc, defaults={"last_r": 0}
                )
                seq.last_r = int(seq.last_r or 0) + 1
                seq.save(update_fields=["last_r"])
                tr.reservation_r = seq.last_r

            # حفظ التحديثات
            tr.save(
                update_fields=[
                    "trip_public_code",
                    "is_leader",
                    "traveler_p",
                    "reservation_r",
                ]
            )
            # trip_code بيتبني تلقائيًا من models.py (بعد ما بقى عندنا pk و R و P)
            return tr


# --- Backwards-compatible aliases (لو في views قديمة بتستوردهم) ---
TripRequestListSerializer = TripRequestCRMListSerializer
