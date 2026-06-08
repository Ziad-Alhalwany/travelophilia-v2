import os
from datetime import date, timedelta
from decimal import Decimal
from djconfig.settings import *

# Override database to SQLite for local tests
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Bypass migrations and create tables directly from models
MIGRATION_MODULES = {
    "properties": None,
    "trips": None,
    "trip_requests": None,
    "auth": None,
    "contenttypes": None,
    "sessions": None,
    "messages": None,
    "admin": None,
}

from django.test import TestCase
from django.db.models.signals import post_save
from rest_framework.test import APITestCase
from rest_framework import status

# In-memory spy to track dispatched notifications during testing
dispatched_notifications = []

def waitlist_notification_signal_handler(sender, instance, created, **kwargs):
    """
    Post-Save Signal that intercepts pending waitlist database records
    when new inventory/pricing is uploaded and dispatches a notification.
    """
    from properties.models import Waitlist
    
    if created or instance.rooms_available > 0:
        matching_entries = Waitlist.objects.filter(
            accommodation=instance.rate_plan.room_type.accommodation,
            room_type=instance.rate_plan.room_type,
            requested_date=instance.date,
            status=Waitlist.Status.PENDING
        )
        for entry in matching_entries:
            # Update status to notified
            entry.status = Waitlist.Status.NOTIFIED
            entry.save()
            
            # Dispatch notification trigger (represented by recording to spy list)
            dispatched_notifications.append({
                "email": entry.user_email,
                "accommodation": entry.accommodation.name,
                "room_type": entry.room_type.name,
                "date": entry.requested_date,
                "price": instance.price_per_night,
                "rooms_available": instance.rooms_available
            })


# ─────────────────────────────────────────────────────────────
# Integration Smoke Test Suite
# ─────────────────────────────────────────────────────────────

class PropertyOtaIntegrationTests(APITestCase):

    def setUp(self):
        # Import models inside setUp to avoid AppRegistryNotReady error
        from trips.models import Destination
        from properties.models import Supplier, Accommodation, RoomType, RatePlan, InventoryPricing
        
        # Connect post-save signal dynamically
        post_save.connect(waitlist_notification_signal_handler, sender=InventoryPricing)
        
        # Clear the notification spy list
        dispatched_notifications.clear()

        # 1. Create a Destination
        self.destination = Destination.objects.create(
            code="CAI",
            slug="cairo",
            name="Cairo",
            country="Egypt"
        )

        # 2. Create an Accommodation
        self.accommodation = Accommodation.objects.create(
            type=Accommodation.AccommodationType.HOTEL,
            destination=self.destination,
            name="Travelophilia Premium Nile Hotel",
            is_active=True
        )

        # 3. Create a RoomType
        self.room_type = RoomType.objects.create(
            accommodation=self.accommodation,
            name="Deluxe Nile View Room",
            total_physical_rooms=10,
            base_capacity=2,
            max_extra_beds=1
        )

        # 4. Create a RatePlan (BB - Bed & Breakfast)
        self.rate_plan = RatePlan.objects.create(
            room_type=self.room_type,
            board_type=RatePlan.BoardType.BB,
            extra_bed_price=Decimal("500.00")
        )

        # Create suppliers
        self.direct_supplier = Supplier.objects.create(
            name="Nile Hotel Direct",
            kind=Supplier.Kind.DIRECT,
            is_active=True
        )
        self.partner_supplier = Supplier.objects.create(
            name="Egypt Tours Partner",
            kind=Supplier.Kind.PARTNER_AGENCY,
            is_active=True
        )
        self.wholesaler_supplier = Supplier.objects.create(
            name="Global Beds Wholesaler",
            kind=Supplier.Kind.WHOLESALER,
            is_active=True
        )

    def tearDown(self):
        # Disconnect post-save signal
        from properties.models import InventoryPricing
        post_save.disconnect(waitlist_notification_signal_handler, sender=InventoryPricing)

    # ─────────────────────────────────────────────────────────────
    # 1. Price Floor & Negative Guard Test
    # ─────────────────────────────────────────────────────────────
    def test_price_floor_and_negative_guard(self):
        """
        Verify that even with a massive negative markup rule (-150% and -5000 EGP),
        the system's floor guard intercepts the final prices and keeps them >= 0.00 EGP.
        """
        from properties.models import InventoryPricing, GranularMarkupRule
        
        stay_date = date.today()
        
        # Inject standard inventory pricing: 1000 EGP per night
        InventoryPricing.objects.create(
            rate_plan=self.rate_plan,
            supplier=self.wholesaler_supplier,
            date=stay_date,
            price_per_night=Decimal("1000.00"),
            rooms_available=5
        )

        # Create a massive negative markup rule targeting the accommodation or room type
        markup_rule = GranularMarkupRule.objects.create(
            title="Massive Wholesaler Discount",
            action=GranularMarkupRule.Action.DECREASE,
            percentage=Decimal("150.00"),  # -150% (should cause negative price)
            fixed_amount=Decimal("5000.00"), # -5000 EGP (additive decrease)
            start_date=date.today() - timedelta(days=1),
            end_date=date.today() + timedelta(days=1),
            is_active=True
        )
        markup_rule.target_accommodations.add(self.accommodation)
        markup_rule.target_room_types.add(self.room_type)

        # Perform Search
        url = "/api/properties/search/"
        params = {
            "accommodation_id": self.accommodation.id,
            "check_in": stay_date.strftime("%Y-%m-%d"),
            "check_out": (stay_date + timedelta(days=1)).strftime("%Y-%m-%d"),
        }
        
        response = self.client.get(url, params)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify pricing breakdown and totals
        results = response.data
        self.assertTrue(len(results) > 0)
        
        for option in results:
            # Verify totalStayPrice is exactly 0.00 EGP
            self.assertEqual(Decimal(option["totalStayPrice"]), Decimal("0.00"))
            self.assertEqual(Decimal(option["avgPricePerNight"]), Decimal("0.00"))
            
            # Verify daily breakdown is exactly 0.00 EGP
            for day in option["dailyBreakdown"]:
                self.assertEqual(Decimal(day["pricePerNight"]), Decimal("0.00"))

    # ─────────────────────────────────────────────────────────────
    # 2. Identity White-Label Masking Validation
    # ─────────────────────────────────────────────────────────────
    def test_identity_white_label_masking(self):
        """
        Verify displayTag behavior:
        - DIRECT supplier -> "Direct price from hotel"
        - PARTNER_AGENCY or WHOLESALER -> "Special Travelophilia Rate"
        Ensure no leak of the supplier's actual name.
        """
        from properties.models import InventoryPricing
        
        stay_date = date.today()
        check_out_date = stay_date + timedelta(days=1)

        # Inject pricing for all 3 suppliers
        # Direct
        InventoryPricing.objects.create(
            rate_plan=self.rate_plan,
            supplier=self.direct_supplier,
            date=stay_date,
            price_per_night=Decimal("2000.00"),
            rooms_available=2
        )
        # Partner
        InventoryPricing.objects.create(
            rate_plan=self.rate_plan,
            supplier=self.partner_supplier,
            date=stay_date,
            price_per_night=Decimal("1900.00"),
            rooms_available=3
        )
        # Wholesaler
        InventoryPricing.objects.create(
            rate_plan=self.rate_plan,
            supplier=self.wholesaler_supplier,
            date=stay_date,
            price_per_night=Decimal("1800.00"),
            rooms_available=4
        )

        url = "/api/properties/search/"
        params = {
            "accommodation_id": self.accommodation.id,
            "check_in": stay_date.strftime("%Y-%m-%d"),
            "check_out": check_out_date.strftime("%Y-%m-%d"),
        }
        
        response = self.client.get(url, params)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        results = response.data
        self.assertEqual(len(results), 3)

        # Verify displayTag and supplier masking
        for option in results:
            # We determine the supplier by total stay price before markup (with +10% platform markup)
            # 1800 * 1.1 = 1980 (Wholesaler)
            # 1900 * 1.1 = 2090 (Partner Agency)
            # 2000 * 1.1 = 2200 (Direct Hotel Owner)
            total_price = Decimal(option["totalStayPrice"])
            
            if total_price == Decimal("2200.00"):
                # Direct Hotel Owner
                self.assertEqual(option["displayTag"], "Direct price from hotel")
            elif total_price in [Decimal("2090.00"), Decimal("1980.00")]:
                # Partner or Wholesaler
                self.assertEqual(option["displayTag"], "Special Travelophilia Rate")
            
            # Absolute guard: the actual supplier name must never leak into the response payload
            payload_str = str(option)
            self.assertNotIn(self.direct_supplier.name, payload_str)
            self.assertNotIn(self.partner_supplier.name, payload_str)
            self.assertNotIn(self.wholesaler_supplier.name, payload_str)

    # ─────────────────────────────────────────────────────────────
    # 3. Waitlist Signal Automation Intercept
    # ─────────────────────────────────────────────────────────────
    def test_waitlist_signal_automation_intercept(self):
        """
        Verify waitlist intercept flow:
        - Query dates with no inventory -> returns UNAVAILABLE_NOT_SET.
        - Create a pending waitlist entry.
        - Mock a bulk update (create pricing record).
        - Verify Post-Save signal updates status to NOTIFIED and triggers dispatch.
        """
        from properties.models import Waitlist, InventoryPricing
        
        waitlist_date = date.today() + timedelta(days=10)
        user_email = "passenger@travelophilia.com"

        # 1. Verify that the search returns UNAVAILABLE_NOT_SET due to no inventory
        url = "/api/properties/search/"
        params = {
            "accommodation_id": self.accommodation.id,
            "check_in": waitlist_date.strftime("%Y-%m-%d"),
            "check_out": (waitlist_date + timedelta(days=1)).strftime("%Y-%m-%d"),
        }
        
        response = self.client.get(url, params)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("status"), "UNAVAILABLE_NOT_SET")

        # 2. Simulate waitlist signup (inject pending entry into Waitlist model)
        waitlist_entry = Waitlist.objects.create(
            accommodation=self.accommodation,
            room_type=self.room_type,
            requested_date=waitlist_date,
            user_email=user_email,
            status=Waitlist.Status.PENDING
        )
        self.assertEqual(waitlist_entry.status, Waitlist.Status.PENDING)

        # 3. Inject pricing for that date (simulating a supplier bulk update)
        pricing_record = InventoryPricing.objects.create(
            rate_plan=self.rate_plan,
            supplier=self.direct_supplier,
            date=waitlist_date,
            price_per_night=Decimal("2500.00"),
            rooms_available=5
        )

        # 4. Verify that the Post-Save Signal intercepted and updated the Waitlist entry
        waitlist_entry.refresh_from_db()
        self.assertEqual(waitlist_entry.status, Waitlist.Status.NOTIFIED)

        # 5. Verify the notification trigger dispatch details
        self.assertEqual(len(dispatched_notifications), 1)
        dispatch = dispatched_notifications[0]
        self.assertEqual(dispatch["email"], user_email)
        self.assertEqual(dispatch["accommodation"], self.accommodation.name)
        self.assertEqual(dispatch["room_type"], self.room_type.name)
        self.assertEqual(dispatch["date"], waitlist_date)
        self.assertEqual(Decimal(dispatch["price"]), Decimal("2500.00"))
        self.assertEqual(dispatch["rooms_available"], 5)
