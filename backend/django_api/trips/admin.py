from django.contrib import admin
from .models import Trip, LegacyCustomTrip


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "location", "type", "is_active", "updated_at")
    search_fields = ("name", "slug", "legacy_id", "location", "type")
    list_filter = ("is_active", "type")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(LegacyCustomTrip)
class LegacyCustomTripAdmin(admin.ModelAdmin):
    list_display = ("id", "created_at")
    readonly_fields = ("created_at",)
