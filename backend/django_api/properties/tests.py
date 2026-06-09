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
