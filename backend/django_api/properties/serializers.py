"""
Properties App – API Serializers
=================================
Task ID  : TP-OTA-AGGREGATOR-002 (Sprint 2, Ticket 2)
Agent    : BE1 (API & Business Logic Specialist)
Purpose  : Input validation and output serialization for the
           Multi-Source Aggregator Pricing & Search Engine.

Design Decisions
----------------
* ``SearchQuerySerializer`` validates incoming query params with
  strict business rules (check_out > check_in, max 30 nights).
* Output serializers use **camelCase** field names natively so DRF
  serializes them directly without a camelCase middleware/renderer.
  This avoids adding external dependencies (djangorestframework-camel-case).
* ``DecimalField`` uses ``coerce_to_string=True`` (DRF default) for
  lossless JSON transport of financial figures (EGP).
"""

from rest_framework import serializers


# ─────────────────────────────────────────────────────────────
# 1. Input Validation Serializer
# ─────────────────────────────────────────────────────────────
class SearchQuerySerializer(serializers.Serializer):
    """
    Validates GET ``/api/properties/search/`` query parameters.

    Expected params:
        accommodation_id  – int  (required, min 1)
        check_in          – date (required, YYYY-MM-DD)
        check_out         – date (required, YYYY-MM-DD)
    """

    accommodation_id = serializers.IntegerField(
        required=True,
        min_value=1,
        help_text="Primary key of the target accommodation.",
    )
    check_in = serializers.DateField(
        required=True,
        input_formats=["%Y-%m-%d"],
        help_text="Stay start date in YYYY-MM-DD format.",
    )
    check_out = serializers.DateField(
        required=True,
        input_formats=["%Y-%m-%d"],
        help_text="Stay end date (exclusive) in YYYY-MM-DD format.",
    )

    def validate(self, attrs):
        """
        Cross-field validation:
        1. check_out must be strictly after check_in.
        2. Total duration cannot exceed 30 nights.
        """
        check_in = attrs["check_in"]
        check_out = attrs["check_out"]

        if check_out <= check_in:
            raise serializers.ValidationError(
                {"check_out": "check_out must be strictly after check_in."}
            )

        total_nights = (check_out - check_in).days
        if total_nights > 30:
            raise serializers.ValidationError(
                {"check_out": "Maximum stay duration is 30 nights."}
            )

        return attrs


# ─────────────────────────────────────────────────────────────
# 2. Output Serializer – Daily Price Breakdown
# ─────────────────────────────────────────────────────────────
class DayPriceSerializer(serializers.Serializer):
    """
    Per-day pricing entry after the 4-Layer Markup Pipeline.

    camelCase field names map directly to the React Frontend
    consumption layer without any middleware transformation.
    """

    date = serializers.DateField(
        help_text="Calendar date for this night (YYYY-MM-DD).",
    )
    pricePerNight = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Final unit price after all markup layers (EGP).",
    )
    roomsAvailable = serializers.IntegerField(
        help_text="Remaining rooms for this date.",
    )


# ─────────────────────────────────────────────────────────────
# 3. Output Serializer – Aggregated Search Result Option
# ─────────────────────────────────────────────────────────────
class SearchResultSerializer(serializers.Serializer):
    """
    A single pricing option in the aggregator search response.

    Each option represents a unique (Supplier × RatePlan) combination
    that has passed the Strict Availability rule (full coverage of
    every night in the requested date range).

    All supplier metadata is masked via the White-Label ``displayTag``.
    """

    roomTypeId = serializers.IntegerField(
        help_text="PK of the room type.",
    )
    roomTypeName = serializers.CharField(
        help_text="Human-readable room type name (e.g. 'Deluxe Suite').",
    )
    ratePlanId = serializers.IntegerField(
        help_text="PK of the rate plan.",
    )
    boardType = serializers.CharField(
        help_text="Board type code (RO, BB, HB, FB, AI).",
    )
    boardTypeDisplay = serializers.CharField(
        help_text="Human-readable board type (e.g. 'Bed & Breakfast').",
    )
    displayTag = serializers.CharField(
        help_text="White-label source tag for brand protection.",
    )
    totalStayPrice = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Accumulated total for the full stay (EGP).",
    )
    avgPricePerNight = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Average nightly rate = totalStayPrice / nights (EGP).",
    )
    currency = serializers.CharField(
        help_text="Currency code (always 'EGP').",
    )
    nights = serializers.IntegerField(
        help_text="Total number of nights in the stay.",
    )
    dailyBreakdown = DayPriceSerializer(
        many=True,
        help_text="Day-by-day pricing array after markup pipeline.",
    )
