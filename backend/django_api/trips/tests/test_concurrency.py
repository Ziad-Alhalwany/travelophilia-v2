from django.test import TransactionTestCase
from trip_requests.models import TripRequest, ReservationSequence
import threading


class ConcurrencyTests(TransactionTestCase):
    # Use TransactionTestCase to test real DB transactions if possible,
    # though SQLite might be limited. Postgres is better.

    def test_reservation_sequence_concurrency(self):
        """
        Simulate multiple threads creating requests for the same trip to ensure
        unique, gap-free sequences (R0001, R0002, ...).
        """
        trip_public_code = "ST-9999999-TEST"

        # Create ReservationSequence explicitly or let logic do it
        # We'll rely on logic.

        def create_req():
            TripRequest.objects.create(
                trip_public_code=trip_public_code, leader_full_name="Concurrent User"
            )

        threads = []
        num_threads = 10

        for _ in range(num_threads):
            t = threading.Thread(target=create_req)
            threads.append(t)
            t.start()

        for t in threads:
            t.join()

        # Check results
        reqs = TripRequest.objects.filter(trip_public_code=trip_public_code).order_by(
            "reservation_r"
        )
        self.assertEqual(reqs.count(), num_threads)

        rs = [r.reservation_r for r in reqs]
        expected = list(range(1, num_threads + 1))
        self.assertEqual(
            rs, expected, f"Sequences should be contiguous 1..{num_threads}, got {rs}"
        )

        # Check Sequence Table
        seq = ReservationSequence.objects.get(trip_public_code=trip_public_code)
        self.assertEqual(seq.last_r, num_threads)
