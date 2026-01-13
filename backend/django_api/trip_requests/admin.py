from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html

from .models import TripRequest, TripRequestNote


def _zfill(n, width):
    try:
        return str(int(n)).zfill(width)
    except Exception:
        return ""


def build_reservation_code_internal(obj: TripRequest) -> str:
    """
    كود داخلي يظهر في الـ CRM/Admin:
    {trip_public_code}-R0003-P01-L-000050
    """
    tpc = (getattr(obj, "trip_public_code", "") or "").strip()
    r = getattr(obj, "reservation_r", None)
    p = getattr(obj, "traveler_p", None)
    lead_seq = getattr(obj, "id", None)

    parts = []
    if tpc:
        parts.append(tpc)
    if r:
        parts.append(f"R{_zfill(r, 4)}")
    if p:
        parts.append(f"P{_zfill(p, 2)}")
    if lead_seq:
        parts.append(f"L-{_zfill(lead_seq, 6)}")

    return "-".join(parts)


class TripRequestNoteInline(admin.TabularInline):
    model = TripRequestNote
    extra = 0
    fields = ("kind", "body", "created_by", "created_at")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("created_by",)


@admin.register(TripRequest)
class TripRequestAdmin(admin.ModelAdmin):

    inlines = [TripRequestNoteInline]

    # ✅ ترتيب الأعمدة (ده اللي بتقدر تغيّره بسهولة)
    list_display = (
        "id",
        "created_at",
        "reservation_code_internal_col",
        "trip_title_col",
        "leader_full_name",
        "leader_phone",
        "origin_city",
        "destination_city",
        "reservation_r",
        "traveler_p",
        "is_leader",
        "status",
        "priority",
        "assigned_to",
        "next_followup_at",
    )

    list_filter = (
        "status",
        "priority",
        "destination_city",
        "origin_city",
        "is_leader",
        "created_at",
    )

    search_fields = (
        "trip_code",
        "trip_public_code",
        "trip_title",
        "trip_slug",
        "leader_full_name",
        "leader_phone",
        "leader_email",
        "destination_city",
        "origin_city",
    )

    ordering = ("-created_at",)

    readonly_fields = (
        "created_at",
        "updated_at",
        "reservation_code_internal_col",
    )

    fieldsets = (
        (
            "Core",
            {"fields": ("created_at", "updated_at", "reservation_code_internal_col")},
        ),
        (
            "Trip Linkage",
            {"fields": ("trip_code", "trip_public_code", "trip_slug", "trip_title")},
        ),
        (
            "Sequence",
            {
                "fields": (
                    "reservation_r",
                    "traveler_p",
                    "is_leader",
                    "internal_code_override",
                )
            },
        ),
        (
            "Leader",
            {
                "fields": (
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
                )
            },
        ),
        (
            "Trip",
            {
                "fields": (
                    "origin_city",
                    "destination_city",
                    "depart_date",
                    "return_date",
                    "adults_count",
                    "children_count",
                    "pax_total",
                    "companions_mode",
                    "note",
                )
            },
        ),
        (
            "Confirmations",
            {"fields": ("couples_answer", "terms_accepted", "docs_acknowledged")},
        ),
        ("Payload (JSON)", {"fields": ("travelers", "children_details")}),
        (
            "CRM",
            {
                "fields": (
                    "status",
                    "priority",
                    "assigned_to",
                    "last_contacted_at",
                    "next_followup_at",
                    "source",
                    "tags",
                )
            },
        ),
    )

    actions = [
        "mark_contacted",
        "mark_qualified",
        "mark_booked",
        "mark_closed_won",
        "mark_closed_lost",
    ]

    def _bulk_set_status(self, request, queryset, new_status):
        queryset.update(status=new_status, last_contacted_at=timezone.now())

    @admin.action(description="Mark as CONTACTED")
    def mark_contacted(self, request, queryset):
        self._bulk_set_status(request, queryset, TripRequest.Status.CONTACTED)

    @admin.action(description="Mark as QUALIFIED")
    def mark_qualified(self, request, queryset):
        self._bulk_set_status(request, queryset, TripRequest.Status.QUALIFIED)

    @admin.action(description="Mark as BOOKED")
    def mark_booked(self, request, queryset):
        self._bulk_set_status(request, queryset, TripRequest.Status.BOOKED)

    @admin.action(description="Mark as CLOSED (WON)")
    def mark_closed_won(self, request, queryset):
        self._bulk_set_status(request, queryset, TripRequest.Status.CLOSED_WON)

    @admin.action(description="Mark as CLOSED (LOST)")
    def mark_closed_lost(self, request, queryset):
        self._bulk_set_status(request, queryset, TripRequest.Status.CLOSED_LOST)

    @admin.display(description="Reservation code")
    def reservation_code_internal_col(self, obj):
        code = build_reservation_code_internal(obj) or "-"
        # ✅ title = hover shows full
        return format_html('<span class="tp-mono" title="{}">{}</span>', code, code)

    @admin.display(description="Trip title")
    def trip_title_col(self, obj):
        t = (getattr(obj, "trip_title", "") or "").strip() or "-"
        return format_html('<span title="{}">{}</span>', t, t)

    class Media:
        css = {"all": ("trip_requests/admin.css",)}


@admin.register(TripRequestNote)
class TripRequestNoteAdmin(admin.ModelAdmin):
    list_display = ("id", "trip_request", "kind", "created_by", "created_at")
    list_filter = ("kind", "created_at")
    search_fields = ("trip_request__trip_code", "body")
    ordering = ("-created_at",)
