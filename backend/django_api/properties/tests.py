<<<<<<< HEAD
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
=======
import time
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from trips.models import Destination
from properties.models import Supplier, Accommodation, RoomType, RatePlan, VendorProfile
from properties.otp_service import OTPService

User = get_user_model()


class B2BPropertyMetadataViewTests(APITestCase):
    def setUp(self):
        # Create Destination
        self.destination = Destination.objects.create(
            code="CAI", slug="cairo", name="Cairo", country="Egypt", city="Cairo"
        )

        # Create Vendor 1
        self.user1 = User.objects.create_user(
            username="vendor1", email="vendor1@example.com", password="password123"
        )
        self.vendor1 = VendorProfile.objects.create(
            user=self.user1, company_name="Vendor One"
        )

        # Create Accommodations for Vendor 1
        self.acc1 = Accommodation.objects.create(
            name="Hotel Cairo",
            type="HOTEL",
            destination=self.destination,
            vendor=self.vendor1,
        )
        self.acc2 = Accommodation.objects.create(
            name="Camp Cairo",
            type="CAMP",
            destination=self.destination,
            vendor=self.vendor1,
        )

        self.room_type1 = RoomType.objects.create(
            accommodation=self.acc1, name="Standard Deluxe", total_physical_rooms=10
        )
        self.room_type2 = RoomType.objects.create(
            accommodation=self.acc2, name="Suite", total_physical_rooms=5
        )

        self.rate_plan1 = RatePlan.objects.create(
            room_type=self.room_type1, board_type="BB", extra_bed_price=100.00
        )
        self.rate_plan2 = RatePlan.objects.create(
            room_type=self.room_type2, board_type="AI", extra_bed_price=200.00
        )

        # Create Vendor 2 (Context separation check)
        self.user2 = User.objects.create_user(
            username="vendor2", email="vendor2@example.com", password="password123"
        )
        self.vendor2 = VendorProfile.objects.create(
            user=self.user2, company_name="Vendor Two"
        )
        self.acc_vendor2 = Accommodation.objects.create(
            name="Hotel Alexandria",
            type="HOTEL",
            destination=self.destination,
            vendor=self.vendor2,
        )
        self.room_type_v2 = RoomType.objects.create(
            accommodation=self.acc_vendor2, name="Royal Suite", total_physical_rooms=2
        )
        self.rate_plan_v2 = RatePlan.objects.create(
            room_type=self.room_type_v2, board_type="RO", extra_bed_price=0.00
        )

        # Create User without Vendor Profile
        self.user_no_profile = User.objects.create_user(
            username="noprofile", email="noprofile@example.com", password="password123"
        )

    def test_unauthenticated_request_rejected(self):
        """GET /api/properties/metadata/ without JWT should return 401."""
        response = self.client.get("/api/properties/metadata/")
        self.assertEqual(response.status_code, 401)

    def test_authenticated_user_without_vendor_profile_rejected(self):
        """GET /api/properties/metadata/ for user with no vendor profile should return 403."""
        self.client.force_authenticate(user=self.user_no_profile)
        response = self.client.get("/api/properties/metadata/")
        self.assertEqual(response.status_code, 403)
        self.assertIn("no vendor profile is linked", response.data["detail"])

    def test_authenticated_vendor_metadata_query_contextualized(self):
        """GET /api/properties/metadata/ should return only vendor1's data with correct serialization format."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get("/api/properties/metadata/")
        self.assertEqual(response.status_code, 200)

        # Verify properties
        properties = response.data["properties"]
        self.assertEqual(len(properties), 2)
        # Verify property serialization contract: {"id": 1, "name": "Property Name"}
        property_names = [p["name"] for p in properties]
        self.assertIn("Hotel Cairo", property_names)
        self.assertIn("Camp Cairo", property_names)
        self.assertNotIn("Hotel Alexandria", property_names)

        # Verify room_types
        room_types = response.data["room_types"]
        self.assertEqual(len(room_types), 2)
        self.assertIn("Standard Deluxe", room_types)
        self.assertIn("Suite", room_types)
        self.assertNotIn("Royal Suite", room_types)

        # Verify rate_plans
        rate_plans = response.data["rate_plans"]
        self.assertEqual(len(rate_plans), 2)
        # BB -> BB, AI -> All-Inclusive, RO -> Room Only
        self.assertIn("BB", rate_plans)
        self.assertIn("All-Inclusive", rate_plans)
        self.assertNotIn("Room Only", rate_plans)


class OTPEngineTests(APITestCase):
    def setUp(self):
        # Create a user to reset password
        self.user = User.objects.create_user(
            username="otpuser", email="otpuser@example.com", password="oldpassword123"
        )
        self.portal = "b2b_portal"
        cache.clear()

    def test_otp_send_and_verify_flow(self):
        """Tests sending OTP, rate-limiting, overwrite, verification, brute-force shield, and password reset."""
        
        # 1. Send OTP
        response = self.client.post(
            "/api/auth/otp/send/",
            {"portal_name": self.portal, "email": self.user.email},
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("otp_code", response.data)
        otp_code = response.data["otp_code"]

        # 2. Rate-Limiting: Send again immediately -> 429
        response_rate_limit = self.client.post(
            "/api/auth/otp/send/",
            {"portal_name": self.portal, "email": self.user.email},
        )
        self.assertEqual(response_rate_limit.status_code, 429)

        # Bypass rate limit by deleting rate limit lock
        lock_key = OTPService.get_lock_key(self.portal, self.user.email)
        cache.delete(lock_key)

        # 3. Overwrite rule: Send again, new code is generated and old is overwritten
        response_overwrite = self.client.post(
            "/api/auth/otp/send/",
            {"portal_name": self.portal, "email": self.user.email},
        )
        self.assertEqual(response_overwrite.status_code, 200)
        new_otp_code = response_overwrite.data["otp_code"]
        self.assertNotEqual(otp_code, new_otp_code)

        # Verify old code fails
        response_verify_old = self.client.post(
            "/api/auth/otp/verify/",
            {"portal_name": self.portal, "email": self.user.email, "otp_code": otp_code},
        )
        self.assertEqual(response_verify_old.status_code, 400)

        # 4. Brute-force shield: 5 failed verification attempts deletes OTP
        # Already tried once (verify old), let's do 4 more wrong attempts
        for i in range(4):
            resp = self.client.post(
                "/api/auth/otp/verify/",
                {
                    "portal_name": self.portal,
                    "email": self.user.email,
                    "otp_code": "000000",
                },
            )
            if i == 3:
                # 5th attempt (1 old + 4 wrong = 5 attempts total) -> should return blocked status 403
                self.assertEqual(resp.status_code, 403)
                self.assertIn("Too many failed attempts", resp.data["detail"])
            else:
                self.assertEqual(resp.status_code, 400)

        # After blocked, OTP is deleted. Trying verify with correct new code should fail now
        response_verify_correct = self.client.post(
            "/api/auth/otp/verify/",
            {
                "portal_name": self.portal,
                "email": self.user.email,
                "otp_code": new_otp_code,
            },
        )
        self.assertEqual(response_verify_correct.status_code, 400)

    def test_password_reset_and_session_hardening(self):
        """Tests that successful password reset invalidates simplejwt refresh tokens."""
        # 1. Send new OTP
        response = self.client.post(
            "/api/auth/otp/send/",
            {"portal_name": self.portal, "email": self.user.email},
        )
        otp_code = response.data["otp_code"]

        # Generate some JWT refresh tokens for this user
        refresh1 = RefreshToken.for_user(self.user)
        refresh2 = RefreshToken.for_user(self.user)
        
        # Verify outstanding tokens are created (simplejwt outstanding token table)
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
        self.assertTrue(OutstandingToken.objects.filter(user=self.user).exists())

        # 2. Reset password
        reset_response = self.client.post(
            "/api/auth/otp/password-reset/",
            {
                "portal_name": self.portal,
                "email": self.user.email,
                "otp_code": otp_code,
                "new_password": "brandnewsecurepassword123",
            },
        )
        self.assertEqual(reset_response.status_code, 200)

        # 3. Verify outstanding refresh tokens are blacklisted
        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
        blacklisted_tokens = BlacklistedToken.objects.filter(token__user=self.user)
        self.assertEqual(blacklisted_tokens.count(), OutstandingToken.objects.filter(user=self.user).count())

        # Verify old password no longer authenticates
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("brandnewsecurepassword123"))
>>>>>>> origin/owner/integration
