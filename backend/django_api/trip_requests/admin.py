from django.contrib import admin
from django.utils import timezone
from .models import TripRequest, TripRequestNote


class TripRequestNoteInline(admin.TabularInline):
    model = TripRequestNote
    extra = 0
    fields = ("kind", "body", "created_by", "created_at")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("created_by",)


@admin.register(TripRequest)
class TripRequestAdmin(admin.ModelAdmin):
    inlines = [TripRequestNoteInline]

    list_display = (
        "id",
        "trip_code",
        "created_at",
        "leader_full_name",
        "leader_phone",
        "origin_city",
        "destination_city",
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
        "companions_mode",
        "created_at",
    )

    search_fields = (
        "trip_code",
        "leader_full_name",
        "leader_phone",
        "leader_email",
        "destination_city",
        "origin_city",
    )

    ordering = ("-created_at",)

    readonly_fields = ("trip_code", "created_at", "updated_at")

    fieldsets = (
        ("Core", {"fields": ("trip_code", "created_at", "updated_at")}),
        ("Leader", {"fields": (
            "leader_full_name", "leader_phone", "leader_whatsapp", "leader_email",
            "leader_gender", "leader_age",
            "leader_nationality", "leader_resident_country",
            "leader_identity_type", "leader_identity_last4",
            "entry_type_for_egypt",
        )}),
        ("Trip", {"fields": (
            "origin_city", "destination_city", "depart_date", "return_date",
            "adults_count", "children_count", "pax_total",
            "companions_mode", "note",
        )}),
        ("Confirmations", {"fields": ("couples_answer", "terms_accepted", "docs_acknowledged")}),
        ("Payload (JSON)", {"fields": ("travelers", "children_details")}),
        ("CRM", {"fields": (
            "status", "priority", "assigned_to",
            "last_contacted_at", "next_followup_at",
            "source", "tags",
        )}),
    )

    actions = ["mark_contacted", "mark_qualified", "mark_booked", "mark_closed_won", "mark_closed_lost"]

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


@admin.register(TripRequestNote)
class TripRequestNoteAdmin(admin.ModelAdmin):
    list_display = ("id", "trip_request", "kind", "created_by", "created_at")
    list_filter = ("kind", "created_at")
    search_fields = ("trip_request__trip_code", "body")
    ordering = ("-created_at",)
