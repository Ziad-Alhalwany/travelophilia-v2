from django.core.management.base import BaseCommand
from django.db import transaction

from trips.models import Trip
from trip_requests.models import TripRequest, ReservationSequence


def as_upper(v: str) -> str:
    return (v or "").strip().upper()


def lead_code(pk: int) -> str:
    return f"L-{int(pk):06d}"


def is_legacy_or_missing(code: str) -> bool:
    c = (code or "").strip()
    if not c:
        return True
    u = c.upper()
    if u.startswith("TP-"):
        return True
    if not (u.startswith("ST-") or u.startswith("DU-") or u.startswith("CT-")):
        return True
    return False


def infer_trip_public_code(tr: TripRequest) -> str:
    # 1) لو موجود
    tpc = as_upper(getattr(tr, "trip_public_code", ""))
    if tpc:
        return tpc

    # 2) من trip_slug
    ts = (getattr(tr, "trip_slug", "") or "").strip()
    if ts:
        if ts.upper().startswith(("ST-", "DU-", "CT-")):
            return ts.upper()

        # لو slug قديم
        t = (
            Trip.objects.filter(public_code=ts).first()
            or Trip.objects.filter(slug=ts).first()
        )
        if t and getattr(t, "public_code", ""):
            return as_upper(getattr(t, "public_code", ""))

    # 3) من trip_title
    tt = (getattr(tr, "trip_title", "") or "").strip()
    if tt:
        t = Trip.objects.filter(name__iexact=tt).first()
        if t and getattr(t, "public_code", ""):
            return as_upper(getattr(t, "public_code", ""))

    # 4) fallback
    return f"CT-{int(tr.id):07d}-UNK"


class Command(BaseCommand):
    help = "Backfill trip_public_code/reservation_r/trip_code for TripRequest rows."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force", action="store_true", help="Rebuild even if trip_code exists"
        )
        parser.add_argument("--limit", type=int, default=0, help="Limit number of rows")
        parser.add_argument(
            "--ids", type=str, default="", help="Comma-separated TripRequest IDs"
        )

    def handle(self, *args, **opts):
        force = bool(opts["force"])
        limit = int(opts["limit"] or 0)
        ids = (opts["ids"] or "").strip()

        qs = TripRequest.objects.all().order_by("id")

        if ids:
            id_list = [int(x) for x in ids.split(",") if x.strip().isdigit()]
            qs = qs.filter(id__in=id_list)

        if limit:
            qs = qs[:limit]

        updated = 0
        seq_touched = 0

        with transaction.atomic():
            for tr in qs:
                changed = []

                tpc = infer_trip_public_code(tr)
                if as_upper(getattr(tr, "trip_public_code", "")) != tpc:
                    tr.trip_public_code = tpc
                    changed.append("trip_public_code")

                if getattr(tr, "is_leader", None) is None:
                    tr.is_leader = True
                    changed.append("is_leader")

                if not getattr(tr, "traveler_p", None):
                    tr.traveler_p = 1
                    changed.append("traveler_p")

                if not getattr(tr, "reservation_r", None):
                    seq, _ = ReservationSequence.objects.get_or_create(
                        trip_public_code=tpc,
                        defaults={"last_r": 0},
                    )
                    seq.last_r = int(getattr(seq, "last_r", 0) or 0) + 1
                    seq.save(update_fields=["last_r"])
                    tr.reservation_r = seq.last_r
                    changed.append("reservation_r")
                    seq_touched += 1

                override = (getattr(tr, "internal_code_override", "") or "").strip()
                internal = (
                    override
                    or f"{tpc}-R{int(tr.reservation_r):04d}-P{int(tr.traveler_p):02d}-{lead_code(tr.id)}"
                )

                if force or is_legacy_or_missing(getattr(tr, "trip_code", "")):
                    if getattr(tr, "trip_code", "") != internal:
                        tr.trip_code = internal
                        changed.append("trip_code")

                if changed:
                    tr.save(update_fields=changed)
                    updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"DONE ✅ updated={updated} | sequences_touched={seq_touched}"
            )
        )
