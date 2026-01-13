# backend/django_api/trips/admin.py
from django.contrib import admin
from .models import Trip, Destination, Activity, LegacyCustomTrip


@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "slug", "is_active", "sort_order")
    search_fields = ("name", "code", "slug")
    list_filter = ("is_active", "country")
    ordering = ("sort_order", "name")


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("title", "destination", "price", "currency", "is_active", "sort_order")
    search_fields = ("title", "slug", "destination__name", "destination__code")
    list_filter = ("is_active", "currency", "destination")
    ordering = ("destination", "sort_order", "title")


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ("name", "public_code", "type", "dest_code", "from_code", "to_code", "is_active")
    search_fields = ("name", "public_code", "slug", "legacy_id")
    list_filter = ("is_active", "type")
    ordering = ("-id",)


@admin.register(LegacyCustomTrip)
class LegacyCustomTripAdmin(admin.ModelAdmin):
    list_display = ("id", "created_at")
    ordering = ("-id",)
