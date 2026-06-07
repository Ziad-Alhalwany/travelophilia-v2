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
