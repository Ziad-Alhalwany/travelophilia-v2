"""
Properties App – Database Models
=================================
Task ID  : TP-OTA-PROPERTY-001 (Sprint 2, Ticket 1)
Agent    : BE2 (Database & Migrations Specialist)
Purpose  : Multi-Source OTA Meta-Search Aggregator schema for
           accommodations, room inventory, day-level pricing,
           supplier mapping, waitlist queues, and granular markup rules.

Design Decisions
----------------
* Lazy string FK ``'trips.Destination'`` avoids circular imports.
* ``settings.AUTH_USER_MODEL`` used for any future user/vendor refs.
* ``unique_together`` on InventoryPricing prevents duplicate
  rate_plan+date+supplier rows (overbooking guard).
* All boolean/choice/date fields that appear in filter queries carry
  ``db_index=True`` for O(log n) B-Tree lookups on PostgreSQL.
"""

from django.conf import settings  # noqa: F401 – kept for future vendor FK
from django.db import models


# ─────────────────────────────────────────────────────────────
# 1. Supplier  –  مورّد الأسعار (Direct / Agency / Wholesaler)
# ─────────────────────────────────────────────────────────────
class Supplier(models.Model):
    """Source channel that feeds pricing into the aggregator."""

    class Kind(models.TextChoices):
        DIRECT = "DIRECT", "Direct Hotel Owner"
        PARTNER_AGENCY = "PARTNER_AGENCY", "Partner Travel Agency"
        WHOLESALER = "WHOLESALER", "Global Wholesaler"

    name = models.CharField(max_length=150, unique=True)
    kind = models.CharField(max_length=20, choices=Kind.choices)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Supplier"
        verbose_name_plural = "Suppliers"

    def __str__(self):
        return f"{self.name} ({self.get_kind_display()})"


# ─────────────────────────────────────────────────────────────
# 1.5. VendorProfile  –  ملف تعريف المورد/التاجر (B2B Portal)
# ─────────────────────────────────────────────────────────────
class VendorProfile(models.Model):
    """B2B Vendor profile linked to a system User."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vendor_profile",
    )
    company_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["company_name"]
        verbose_name = "Vendor Profile"
        verbose_name_plural = "Vendor Profiles"

    def __str__(self):
        return f"{self.company_name} ({self.user.username})"


# ─────────────────────────────────────────────────────────────
# 2. Accommodation  –  وحدة الإقامة (Hotel / Camp / Chalet …)
# ─────────────────────────────────────────────────────────────
class Accommodation(models.Model):
    """Physical property linked to a destination."""

    class AccommodationType(models.TextChoices):
        HOTEL = "HOTEL", "Hotel"
        CAMP = "CAMP", "Camp"
        CHALET = "CHALET", "Chalet"
        HOSTEL = "HOSTEL", "Hostel"

    vendor = models.ForeignKey(
        VendorProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="accommodations",
        db_index=True,
    )
    type = models.CharField(
        max_length=10,
        choices=AccommodationType.choices,
        db_index=True,
    )
    destination = models.ForeignKey(
        "trips.Destination",
        on_delete=models.CASCADE,
        related_name="accommodations",
    )
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Accommodation"
        verbose_name_plural = "Accommodations"

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


# ─────────────────────────────────────────────────────────────
# 3. RoomType  –  نوع الغرفة داخل الفندق
# ─────────────────────────────────────────────────────────────
class RoomType(models.Model):
    """Category of room inside an accommodation (e.g. Standard, Suite)."""

    accommodation = models.ForeignKey(
        Accommodation,
        on_delete=models.CASCADE,
        related_name="room_types",
    )
    name = models.CharField(max_length=100)
    total_physical_rooms = models.PositiveIntegerField()
    base_capacity = models.PositiveIntegerField(default=2)
    max_extra_beds = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["accommodation", "name"]
        verbose_name = "Room Type"
        verbose_name_plural = "Room Types"

    def __str__(self):
        return f"{self.accommodation.name} – {self.name}"


# ─────────────────────────────────────────────────────────────
# 4. RatePlan  –  خطة السعر (Board Type + Extra Bed Pricing)
# ─────────────────────────────────────────────────────────────
class RatePlan(models.Model):
    """Pricing plan combining a room type with a board type."""

    class BoardType(models.TextChoices):
        RO = "RO", "Room Only"
        BB = "BB", "Bed & Breakfast"
        HB = "HB", "Half Board"
        FB = "FB", "Full Board"
        AI = "AI", "All Inclusive"

    room_type = models.ForeignKey(
        RoomType,
        on_delete=models.CASCADE,
        related_name="rate_plans",
    )
    board_type = models.CharField(
        max_length=5,
        choices=BoardType.choices,
        db_index=True,
    )
    extra_bed_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
    )

    class Meta:
        ordering = ["room_type", "board_type"]
        verbose_name = "Rate Plan"
        verbose_name_plural = "Rate Plans"

    def __str__(self):
        return f"{self.room_type} / {self.get_board_type_display()}"


# ─────────────────────────────────────────────────────────────
# 5. InventoryPricing  –  محرك التسعير اليومي (Day-by-Day)
# ─────────────────────────────────────────────────────────────
class InventoryPricing(models.Model):
    """
    Day-level price & availability per rate-plan per supplier.

    The ``unique_together`` constraint on (rate_plan, date, supplier)
    is the mathematical safety-net that prevents overbooking and
    multi-source collision across the aggregator.
    """

    rate_plan = models.ForeignKey(
        RatePlan,
        on_delete=models.CASCADE,
        related_name="inventory",
    )
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.CASCADE,
        related_name="supplied_rates",
    )
    date = models.DateField(db_index=True)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    rooms_available = models.PositiveIntegerField()

    class Meta:
        unique_together = ("rate_plan", "date", "supplier")
        ordering = ["date"]
        verbose_name = "Inventory Pricing"
        verbose_name_plural = "Inventory Pricing"

    def __str__(self):
        return (
            f"{self.rate_plan} | {self.date} | "
            f"{self.supplier.name} | {self.price_per_night}"
        )


# ─────────────────────────────────────────────────────────────
# 6. Waitlist  –  قائمة الانتظار للتواريخ غير النشطة
# ─────────────────────────────────────────────────────────────
class Waitlist(models.Model):
    """Queue entry for dates without active inventory."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending Price"
        NOTIFIED = "NOTIFIED", "User Notified"
        CONVERTED = "CONVERTED", "Converted"

    accommodation = models.ForeignKey(
        Accommodation,
        on_delete=models.CASCADE,
        related_name="waitlist_entries",
    )
    room_type = models.ForeignKey(
        RoomType,
        on_delete=models.CASCADE,
        related_name="waitlist_entries",
    )
    requested_date = models.DateField(db_index=True)
    user_email = models.EmailField()
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Waitlist Entry"
        verbose_name_plural = "Waitlist Entries"

    def __str__(self):
        return (
            f"{self.user_email} → {self.accommodation.name} "
            f"({self.requested_date})"
        )


# ─────────────────────────────────────────────────────────────
# 7. GranularMarkupRule  –  محرك الربح ذو الأربع طبقات
# ─────────────────────────────────────────────────────────────
class GranularMarkupRule(models.Model):
    """
    Flexible profit-engine rule that can target specific
    accommodations and/or room types over a date range.

    Supports both percentage and fixed-amount adjustments,
    applied as INCREASE or DECREASE actions.
    """

    class Action(models.TextChoices):
        INCREASE = "INCREASE", "Increase Price"
        DECREASE = "DECREASE", "Decrease Price"

    title = models.CharField(max_length=255)
    target_accommodations = models.ManyToManyField(
        Accommodation,
        blank=True,
        related_name="markup_rules",
    )
    target_room_types = models.ManyToManyField(
        RoomType,
        blank=True,
        related_name="markup_rules",
    )
    action = models.CharField(max_length=10, choices=Action.choices)
    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
    )
    fixed_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
    )
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["-start_date"]
        verbose_name = "Granular Markup Rule"
        verbose_name_plural = "Granular Markup Rules"

    def __str__(self):
        return f"{self.title} ({self.get_action_display()} {self.percentage}%)"
