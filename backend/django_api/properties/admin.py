"""
Properties App – Admin Registration
=====================================
Task ID : TP-OTA-PROPERTY-001
Agent   : BE2

All 7 models registered with ``@admin.register`` decorators.
Enhanced ``search_fields`` and ``list_filter`` on key CRM-facing
models (Accommodation, InventoryPricing, Waitlist) for operations
visibility.
"""

from django.contrib import admin

from .models import (
    Accommodation,
    GranularMarkupRule,
    InventoryPricing,
    RatePlan,
    RoomType,
    Supplier,
    Waitlist,
)


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("name", "kind", "is_active", "created_at")
    list_filter = ("kind", "is_active")
    search_fields = ("name",)


@admin.register(Accommodation)
class AccommodationAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "destination", "is_active", "created_at")
    list_filter = ("type", "is_active", "destination")
    search_fields = ("name", "destination__name")
    list_select_related = ("destination",)


@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "accommodation",
        "total_physical_rooms",
        "base_capacity",
        "max_extra_beds",
    )
    list_filter = ("accommodation",)
    search_fields = ("name", "accommodation__name")
    list_select_related = ("accommodation",)


@admin.register(RatePlan)
class RatePlanAdmin(admin.ModelAdmin):
    list_display = ("room_type", "board_type", "extra_bed_price")
    list_filter = ("board_type",)
    search_fields = ("room_type__name",)
    list_select_related = ("room_type",)


@admin.register(InventoryPricing)
class InventoryPricingAdmin(admin.ModelAdmin):
    list_display = (
        "rate_plan",
        "supplier",
        "date",
        "price_per_night",
        "rooms_available",
    )
    list_filter = ("date", "supplier", "rate_plan__board_type")
    search_fields = (
        "rate_plan__room_type__name",
        "supplier__name",
    )
    list_select_related = ("rate_plan", "supplier")
    date_hierarchy = "date"


@admin.register(Waitlist)
class WaitlistAdmin(admin.ModelAdmin):
    list_display = (
        "user_email",
        "accommodation",
        "room_type",
        "requested_date",
        "status",
        "created_at",
    )
    list_filter = ("status", "requested_date", "accommodation")
    search_fields = ("user_email", "accommodation__name", "room_type__name")
    list_select_related = ("accommodation", "room_type")
    date_hierarchy = "requested_date"


@admin.register(GranularMarkupRule)
class GranularMarkupRuleAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "action",
        "percentage",
        "fixed_amount",
        "start_date",
        "end_date",
        "is_active",
    )
    list_filter = ("action", "is_active")
    search_fields = ("title",)
    date_hierarchy = "start_date"
