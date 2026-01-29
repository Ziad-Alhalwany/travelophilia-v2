from django.test import TestCase
from trips.models import Trip


class TripLookupTests(TestCase):
    def setUp(self):
        # Create a trip with a specific public_code
        self.trip_code = Trip.objects.create(
            name="Trip With Code",
            public_code="ST-001",
            slug="trip-with-code",
            is_active=True,
        )

        # Create a trip with a standard slug
        self.trip_slug = Trip.objects.create(
            name="Trip With Slug",
            public_code="ST-002",
            slug="my-trip-slug",
            is_active=True,
        )

        # Create a trip with a date-like slug to verify strictly NO stripping
        self.trip_date = Trip.objects.create(
            name="Trip Date Slug",
            public_code="ST-003",
            slug="trip-2024-01-01",
            is_active=True,
        )

        # Create collision scenario: Code A matches Slug B
        # Trip A: code=ABC, slug=something-else
        self.trip_a = Trip.objects.create(
            name="Trip A (Code ABC)", public_code="ABC", slug="trip-a", is_active=True
        )
        # Trip B: code=XYZ, slug=ABC
        self.trip_b = Trip.objects.create(
            name="Trip B (Slug ABC)", public_code="XYZ", slug="abc", is_active=True
        )

    def test_lookup_by_public_code(self):
        """GET /api/trips/ST-001/ should return Trip With Code"""
        response = self.client.get("/api/trips/ST-001/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["public_code"], "ST-001")

    def test_lookup_by_slug(self):
        """GET /api/trips/my-trip-slug/ should return Trip With Slug"""
        response = self.client.get("/api/trips/my-trip-slug/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["slug"], "my-trip-slug")

    def test_slug_with_date_preservation(self):
        """GET /api/trips/trip-2024-01-01/ should work. Stripped version 'trip' should 404."""
        # Exact match matches
        resp_exact = self.client.get("/api/trips/trip-2024-01-01/")
        self.assertEqual(resp_exact.status_code, 200, "Should find exact slug match")

        # Stripped version fails (proving regex is gone)
        resp_stripped = self.client.get("/api/trips/trip/")
        self.assertEqual(
            resp_stripped.status_code, 404, "Should NOT find stripped version (strict)"
        )

    def test_public_code_priority(self):
        """GET /api/trips/ABC/ should return Trip A (Code=ABC), not Trip B (Slug=ABC)"""
        response = self.client.get("/api/trips/ABC/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["public_code"], "ABC")
        self.assertNotEqual(response.data["data"]["slug"], "abc")

    def test_case_insensitive_lookup(self):
        """GET /api/trips/st-001/ (lowercase) should find ST-001"""
        response = self.client.get("/api/trips/st-001/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"]["public_code"], "ST-001")
