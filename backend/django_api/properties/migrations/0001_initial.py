"""
Initial migration for the ``properties`` app.
Auto-generated equivalent for Task TP-OTA-PROPERTY-001.

Creates:
    - Supplier
    - Accommodation
    - RoomType
    - RatePlan
    - InventoryPricing  (unique_together on rate_plan+date+supplier)
    - Waitlist
    - GranularMarkupRule (M2M to Accommodation & RoomType)
"""

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("trips", "0005_alter_trip_global_seq_alter_trip_internal_seq_and_more"),
    ]

    operations = [
        # ──────────────── 1. Supplier ────────────────
        migrations.CreateModel(
            name="Supplier",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=150, unique=True)),
                (
                    "kind",
                    models.CharField(
                        choices=[
                            ("DIRECT", "Direct Hotel Owner"),
                            ("PARTNER_AGENCY", "Partner Travel Agency"),
                            ("WHOLESALER", "Global Wholesaler"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(db_index=True, default=True),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Supplier",
                "verbose_name_plural": "Suppliers",
                "ordering": ["name"],
            },
        ),
        # ──────────────── 2. Accommodation ────────────────
        migrations.CreateModel(
            name="Accommodation",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("HOTEL", "Hotel"),
                            ("CAMP", "Camp"),
                            ("CHALET", "Chalet"),
                            ("HOSTEL", "Hostel"),
                        ],
                        db_index=True,
                        max_length=10,
                    ),
                ),
                (
                    "destination",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="accommodations",
                        to="trips.destination",
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                (
                    "is_active",
                    models.BooleanField(db_index=True, default=True),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Accommodation",
                "verbose_name_plural": "Accommodations",
                "ordering": ["name"],
            },
        ),
        # ──────────────── 3. RoomType ────────────────
        migrations.CreateModel(
            name="RoomType",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "accommodation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="room_types",
                        to="properties.accommodation",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("total_physical_rooms", models.PositiveIntegerField()),
                (
                    "base_capacity",
                    models.PositiveIntegerField(default=2),
                ),
                (
                    "max_extra_beds",
                    models.PositiveIntegerField(default=0),
                ),
            ],
            options={
                "verbose_name": "Room Type",
                "verbose_name_plural": "Room Types",
                "ordering": ["accommodation", "name"],
            },
        ),
        # ──────────────── 4. RatePlan ────────────────
        migrations.CreateModel(
            name="RatePlan",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "room_type",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="rate_plans",
                        to="properties.roomtype",
                    ),
                ),
                (
                    "board_type",
                    models.CharField(
                        choices=[
                            ("RO", "Room Only"),
                            ("BB", "Bed & Breakfast"),
                            ("HB", "Half Board"),
                            ("FB", "Full Board"),
                            ("AI", "All Inclusive"),
                        ],
                        db_index=True,
                        max_length=5,
                    ),
                ),
                (
                    "extra_bed_price",
                    models.DecimalField(
                        decimal_places=2, default=0.00, max_digits=10
                    ),
                ),
            ],
            options={
                "verbose_name": "Rate Plan",
                "verbose_name_plural": "Rate Plans",
                "ordering": ["room_type", "board_type"],
            },
        ),
        # ──────────────── 5. InventoryPricing ────────────────
        migrations.CreateModel(
            name="InventoryPricing",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "rate_plan",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="inventory",
                        to="properties.rateplan",
                    ),
                ),
                (
                    "supplier",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="supplied_rates",
                        to="properties.supplier",
                    ),
                ),
                ("date", models.DateField(db_index=True)),
                (
                    "price_per_night",
                    models.DecimalField(decimal_places=2, max_digits=10),
                ),
                ("rooms_available", models.PositiveIntegerField()),
            ],
            options={
                "verbose_name": "Inventory Pricing",
                "verbose_name_plural": "Inventory Pricing",
                "ordering": ["date"],
                "unique_together": {("rate_plan", "date", "supplier")},
            },
        ),
        # ──────────────── 6. Waitlist ────────────────
        migrations.CreateModel(
            name="Waitlist",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "accommodation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="waitlist_entries",
                        to="properties.accommodation",
                    ),
                ),
                (
                    "room_type",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="waitlist_entries",
                        to="properties.roomtype",
                    ),
                ),
                ("requested_date", models.DateField(db_index=True)),
                ("user_email", models.EmailField(max_length=254)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PENDING", "Pending Price"),
                            ("NOTIFIED", "User Notified"),
                            ("CONVERTED", "Converted"),
                        ],
                        db_index=True,
                        default="PENDING",
                        max_length=10,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Waitlist Entry",
                "verbose_name_plural": "Waitlist Entries",
                "ordering": ["-created_at"],
            },
        ),
        # ──────────────── 7. GranularMarkupRule ────────────────
        migrations.CreateModel(
            name="GranularMarkupRule",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=255)),
                (
                    "target_accommodations",
                    models.ManyToManyField(
                        blank=True,
                        related_name="markup_rules",
                        to="properties.accommodation",
                    ),
                ),
                (
                    "target_room_types",
                    models.ManyToManyField(
                        blank=True,
                        related_name="markup_rules",
                        to="properties.roomtype",
                    ),
                ),
                (
                    "action",
                    models.CharField(
                        choices=[
                            ("INCREASE", "Increase Price"),
                            ("DECREASE", "Decrease Price"),
                        ],
                        max_length=10,
                    ),
                ),
                (
                    "percentage",
                    models.DecimalField(
                        decimal_places=2, default=0.00, max_digits=5
                    ),
                ),
                (
                    "fixed_amount",
                    models.DecimalField(
                        decimal_places=2, default=0.00, max_digits=10
                    ),
                ),
                ("start_date", models.DateField()),
                ("end_date", models.DateField()),
                (
                    "is_active",
                    models.BooleanField(db_index=True, default=True),
                ),
            ],
            options={
                "verbose_name": "Granular Markup Rule",
                "verbose_name_plural": "Granular Markup Rules",
                "ordering": ["-start_date"],
            },
        ),
    ]
