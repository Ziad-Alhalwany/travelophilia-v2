"""
Properties App – API Views
============================
Task ID  : TP-OTA-AGGREGATOR-002 (Sprint 2, Ticket 2)
Agent    : BE1 (API & Business Logic Specialist)
Purpose  : Multi-Source Aggregator Pricing & Search Engine
           implementing the 4-Layer Dynamic Markup Pipeline,
           White-Label Identity Masking, and Waitlist Intercept.

Architecture Notes
------------------
* **Zero N+1 Guarantee:**
  ``select_related`` on the full FK chain
  ``rate_plan → room_type → accommodation`` + ``supplier``
  collapses the inventory fetch into a single SQL JOIN query.

* **Markup Rules Pre-cache:**
  ``GranularMarkupRule`` rows are fetched once with
  ``prefetch_related`` on both M2M fields. Target-ID sets
  are computed into ``frozenset``s in a pre-pass, so the inner
  per-day loop performs only O(1) set-membership checks.

* **Complexity Profile:**
  Let I = inventory rows, G = groups, D = days/group, R = rules.
  - Inventory query:  O(1) SQL query via JOIN + WHERE IN
  - Grouping:         O(I) single pass with ``defaultdict``
  - Markup pipeline:  O(G × D × R) – R is small (admin-managed)
  - Final sort:       O(G log G) on total price
  Overall: O(I + G·D·R + G log G) ≈ O(I·R) worst-case.
"""

from collections import defaultdict
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import GranularMarkupRule, InventoryPricing
from .serializers import SearchQuerySerializer, SearchResultSerializer


class AccommodationSearchView(APIView):
    """
    GET /api/properties/search/

    Public multi-source aggregator endpoint. Returns available
    pricing options for a given accommodation and date range,
    after applying the 4-Layer Dynamic Markup Engine and
    White-Label Identity Masking.

    Query params:
        accommodation_id  (int)   – target property PK
        check_in          (date)  – YYYY-MM-DD
        check_out         (date)  – YYYY-MM-DD

    Responses:
        200  – list of pricing options (sorted cheapest-first)
        200  – {"status": "UNAVAILABLE_NOT_SET"} when no inventory
        400  – validation errors on malformed input
    """

    permission_classes = [AllowAny]

    # ── Business Constants ─────────────────────────────────────
    GLOBAL_MARKUP_MULTIPLIER = Decimal("1.10")   # Layer 2: 10%
    CENTS = Decimal("0.01")                      # Quantize target
    KIND_DIRECT = "DIRECT"

    # ──────────────────────────────────────────────────────────
    # GET  /api/properties/search/
    # ──────────────────────────────────────────────────────────
    def get(self, request):
        # ── Step 1: Validate Input ─────────────────────────────
        query_ser = SearchQuerySerializer(data=request.query_params)
        query_ser.is_valid(raise_exception=True)
        params = query_ser.validated_data

        accommodation_id = params["accommodation_id"]
        check_in = params["check_in"]
        check_out = params["check_out"]

        # ── Step 2: Date Array (day-by-day fragmentation) ──────
        total_nights = (check_out - check_in).days
        date_array = [
            check_in + timedelta(days=offset)
            for offset in range(total_nights)
        ]

        # ── Step 3: Inventory Query  (N+1 safe) ───────────────
        #    Single SQL with JOINs via select_related.
        #    Filters: correct accommodation, dates in range,
        #    rooms > 0, and active supplier only.
        inventory_qs = (
            InventoryPricing.objects
            .select_related(
                "rate_plan__room_type__accommodation",
                "supplier",
            )
            .filter(
                rate_plan__room_type__accommodation_id=accommodation_id,
                date__in=date_array,
                rooms_available__gt=0,
                supplier__is_active=True,
            )
        )

        # Materialize once to avoid double-query (exists + iterate)
        inventory_list = list(inventory_qs)

        # ── Step 4: Waitlist Intercept ─────────────────────────
        #    Zero records → hotel has no active pricing season.
        if not inventory_list:
            return Response(
                {"status": "UNAVAILABLE_NOT_SET"},
                status=200,
            )

        # ── Step 5: In-Memory Grouping  O(I) ──────────────────
        #    Key = (supplier_id, rate_plan_id)
        #    Value = list of InventoryPricing rows for that combo.
        groups = defaultdict(list)
        for inv in inventory_list:
            key = (inv.supplier_id, inv.rate_plan_id)
            groups[key].append(inv)

        # ── Step 6: Pre-fetch Markup Rules (single query) ──────
        today = timezone.now().date()
        markup_rules_qs = (
            GranularMarkupRule.objects
            .filter(
                is_active=True,
                start_date__lte=today,
                end_date__gte=today,
            )
            .prefetch_related(
                "target_accommodations",
                "target_room_types",
            )
        )

        # Pre-compute target ID frozensets for O(1) membership
        # checks inside the hot loop. This avoids repeated
        # queryset evaluation on prefetched M2M managers.
        rule_cache = []
        for rule in markup_rules_qs:
            accom_ids = frozenset(
                a.id for a in rule.target_accommodations.all()
            )
            rt_ids = frozenset(
                rt.id for rt in rule.target_room_types.all()
            )
            rule_cache.append((rule, accom_ids, rt_ids))

        # ── Step 7: Process Valid Groups ───────────────────────
        results = []

        for (supplier_id, rate_plan_id), day_rows in groups.items():
            # ── Strict Availability Rule ───────────────────────
            # Must have exactly one valid row per night.
            # InventoryPricing.unique_together guarantees no
            # duplicate (rate_plan, date, supplier) rows.
            if len(day_rows) != total_nights:
                continue

            # Sort chronologically for consistent output order
            day_rows.sort(key=lambda row: row.date)

            # Metadata from the first row (FK chain is identical
            # across all rows in the same group)
            sample = day_rows[0]
            supplier = sample.supplier
            rate_plan = sample.rate_plan
            room_type = rate_plan.room_type

            # ── 4-Layer Dynamic Markup Pipeline ────────────────
            daily_breakdown = []
            total_price = Decimal("0.00")

            for inv in day_rows:
                # Layer 1 — Net Supplier Price
                price = inv.price_per_night

                # Layer 2 — Global Platform Markup (+10%)
                price = price * self.GLOBAL_MARKUP_MULTIPLIER

                # Layer 3 & 4 — Dynamic Yield Rules
                for rule, accom_ids, rt_ids in rule_cache:
                    matched = False

                    # Check accommodation-level targeting
                    if accom_ids and accommodation_id in accom_ids:
                        matched = True

                    # Check room-type-level targeting
                    if rt_ids and room_type.id in rt_ids:
                        matched = True

                    if not matched:
                        continue

                    # Percentage adjustment (compounding multiplier)
                    if rule.percentage:
                        factor = rule.percentage / Decimal("100")
                        if rule.action == GranularMarkupRule.Action.INCREASE:
                            price = price * (Decimal("1") + factor)
                        else:  # DECREASE
                            price = price * (Decimal("1") - factor)

                    # Fixed amount adjustment (additive, in EGP)
                    if rule.fixed_amount:
                        if rule.action == GranularMarkupRule.Action.INCREASE:
                            price = price + rule.fixed_amount
                        else:  # DECREASE
                            price = price - rule.fixed_amount

                # Floor guard: price must never go negative
                if price < Decimal("0"):
                    price = Decimal("0.00")

                price = price.quantize(self.CENTS, rounding=ROUND_HALF_UP)
                total_price += price

                daily_breakdown.append({
                    "date": inv.date,
                    "pricePerNight": price,
                    "roomsAvailable": inv.rooms_available,
                })

            # ── White-Label Identity Masking ───────────────────
            if supplier.kind == self.KIND_DIRECT:
                display_tag = "Direct price from hotel"
            else:
                # PARTNER_AGENCY and WHOLESALER → masked
                display_tag = "Special Travelophilia Rate"

            avg_price = (total_price / total_nights).quantize(
                self.CENTS, rounding=ROUND_HALF_UP,
            )

            results.append({
                "roomTypeId": room_type.id,
                "roomTypeName": room_type.name,
                "ratePlanId": rate_plan.id,
                "boardType": rate_plan.board_type,
                "boardTypeDisplay": rate_plan.get_board_type_display(),
                "displayTag": display_tag,
                "totalStayPrice": total_price,
                "avgPricePerNight": avg_price,
                "currency": "EGP",
                "nights": total_nights,
                "dailyBreakdown": daily_breakdown,
            })

        # ── Step 8: Sort Ascending by Total Price ──────────────
        results.sort(key=lambda opt: opt["totalStayPrice"])

        # If every group was disqualified by the availability
        # rule, fall back to the unavailable signal.
        if not results:
            return Response(
                {"status": "UNAVAILABLE_NOT_SET"},
                status=200,
            )

        # ── Step 9: Serialize & Return ─────────────────────────
        output_ser = SearchResultSerializer(results, many=True)
        return Response(output_ser.data)


# ─────────────────────────────────────────────────────────────
# 2. B2B Property Metadata & OTP Views
# ─────────────────────────────────────────────────────────────
from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from .models import Accommodation, RoomType, RatePlan
from .serializers import OTPSendSerializer, OTPVerifySerializer, PasswordResetSerializer
from .otp_service import OTPService

User = get_user_model()


class B2BPropertyMetadataView(APIView):
    """
    GET /api/properties/metadata/
    Expose a live, protected route bound exclusively to the currently
    authenticated vendor's profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, "vendor_profile"):
            return Response(
                {"detail": "Authentication credentials are valid, but no vendor profile is linked to this account."},
                status=403,
            )

        vendor = request.user.vendor_profile

        # 1. Fetch properties (Accommodations) owned by this vendor
        accommodations = Accommodation.objects.filter(vendor=vendor, is_active=True)

        # 2. Get distinct room types linked to vendor's accommodations
        room_types = (
            RoomType.objects.filter(accommodation__in=accommodations)
            .values_list("name", flat=True)
            .distinct()
        )

        # 3. Get distinct board types linked to vendor's room types
        board_types = (
            RatePlan.objects.filter(room_type__accommodation__in=accommodations)
            .values_list("board_type", flat=True)
            .distinct()
        )

        # Map board type choices to B2B expected response codes/names
        def map_board_type(code):
            mapping = {
                "RO": "Room Only",
                "BB": "BB",
                "HB": "Half Board",
                "FB": "Full Board",
                "AI": "All-Inclusive",
            }
            return mapping.get(code, code)

        rate_plans = sorted(list(set(map_board_type(bt) for bt in board_types)))

        response_data = {
            "properties": [
                {"id": acc.id, "name": acc.name} for acc in accommodations
            ],
            "room_types": sorted(list(set(room_types))),
            "rate_plans": rate_plans,
        }

        return Response(response_data, status=200)


class OTPSendView(APIView):
    """
    POST /api/auth/otp/send/
    Sends OTP code and enforces rate limiting.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        portal_name = serializer.validated_data["portal_name"]
        email = serializer.validated_data["email"]

        # Check user existence
        if not User.objects.filter(email=email).exists():
            return Response({"detail": "User with this email does not exist."}, status=404)

        result = OTPService.send_otp(portal_name, email)
        if result["status"] == "rate_limited":
            return Response({"detail": result["message"]}, status=429)

        response_data = {"message": "OTP sent successfully."}
        
        # Include otp_code in response only during debug/tests for automation validation
        if settings.DEBUG or getattr(settings, "TESTING", False):
            response_data["otp_code"] = result["otp_code"]

        return Response(response_data, status=200)


class OTPVerifyView(APIView):
    """
    POST /api/auth/otp/verify/
    Verifies OTP code and handles attempts counting.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        portal_name = serializer.validated_data["portal_name"]
        email = serializer.validated_data["email"]
        otp_code = serializer.validated_data["otp_code"]

        result = OTPService.verify_otp(portal_name, email, otp_code)
        if result["status"] == "verified":
            return Response({"message": "OTP verified successfully."}, status=200)
        elif result["status"] == "blocked":
            return Response({"detail": result["message"]}, status=403)
        else:
            return Response({"detail": result["message"]}, status=400)


class PasswordResetView(APIView):
    """
    POST /api/auth/otp/password-reset/
    Resets the password if the OTP verification was successful or sends verification code directly.
    Invalidates all outstanding refresh tokens to harden security.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        portal_name = serializer.validated_data["portal_name"]
        email = serializer.validated_data["email"]
        otp_code = serializer.validated_data.get("otp_code")
        new_password = serializer.validated_data["new_password"]

        # 1. Verification phase
        # Check if the user has a transient verification token cached from OTPVerifyView
        has_verified_token = OTPService.consume_verification(portal_name, email)
        
        if not has_verified_token:
            # If no cached verification token, we require direct otp_code validation
            if not otp_code:
                return Response(
                    {"detail": "Verification code (otp_code) is required to reset password."},
                    status=400,
                )
            verify_result = OTPService.verify_otp(portal_name, email, otp_code)
            if verify_result["status"] != "verified":
                if verify_result["status"] == "blocked":
                    return Response({"detail": verify_result["message"]}, status=403)
                return Response({"detail": verify_result["message"]}, status=400)

        # 2. Get User and change password
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        user.set_password(new_password)
        user.save()

        # 3. Session Hardening: revoke and blacklist all outstanding tokens for this user
        outstanding_tokens = OutstandingToken.objects.filter(user=user)
        for token in outstanding_tokens:
            BlacklistedToken.objects.get_or_create(token=token)

        return Response(
            {"message": "Password reset successfully. All active sessions have been revoked."},
            status=200,
        )

