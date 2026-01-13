from django.db import transaction
from django.apps import apps

TripRequest = apps.get_model("trip_requests", "TripRequest")
ReservationSequence = apps.get_model("trip_requests", "ReservationSequence")
Trip = apps.get_model("trips", "Trip")

def lead_code(pk: int) -> str:
    return f"L-{int(pk):06d}"

def as_upper(v):
    return (v or "").strip().upper()

def needs_trip_code(code: str) -> bool:
    c = (code or "").strip()
    if not c:
        return True
    u = c.upper()
    if u.startswith("TP-"):
        return True
    if u.startswith("P") and "-L-" in u and ("-R" not in u) and ("ST-" not in u) and ("DU-" not in u) and ("CT-" not in u):
        return True
    if not (u.startswith("ST-") or u.startswith("DU-") or u.startswith("CT-")):
        return True
    return False

def infer_trip_public_code(tr) -> str:
    tpc = as_upper(getattr(tr, "trip_public_code", ""))
    if tpc:
        return tpc

    ts = (getattr(tr, "trip_slug", "") or "").strip()
    if ts:
        if ts.upper().startswith(("ST-", "DU-", "CT-")):
            return ts.upper()
        t = Trip.objects.filter(public_code=ts).first() or Trip.objects.filter(slug=ts).first()
        if t and getattr(t, "public_code", ""):
            return as_upper(getattr(t, "public_code", ""))

    tt = (getattr(tr, "trip_title", "") or "").strip()
    if tt:
        t = Trip.objects.filter(name__iexact=tt).first()
        if t and getattr(t, "public_code", ""):
            return as_upper(getattr(t, "public_code", ""))

    return f"CT-{int(tr.id):07d}-UNK"

updated = 0
touched_seq = 0

with transaction.atomic():
    qs = TripRequest.objects.all().order_by("id")

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

        rr = getattr(tr, "reservation_r", None)
        if not rr:
            seq, created = ReservationSequence.objects.get_or_create(
                trip_public_code=tpc,
                defaults={"last_r": 0},
            )
            seq.last_r = int(getattr(seq, "last_r", 0) or 0) + 1
            rr = seq.last_r
            seq.save(update_fields=["last_r"])
            tr.reservation_r = rr
            changed.append("reservation_r")
            touched_seq += 1

        override = (getattr(tr, "internal_code_override", "") or "").strip()
        internal = override or f"{tpc}-R{int(tr.reservation_r):04d}-P{int(tr.traveler_p):02d}-{lead_code(tr.id)}"

        if needs_trip_code(getattr(tr, "trip_code", "")) and (getattr(tr, "trip_code", "") != internal):
            tr.trip_code = internal
            changed.append("trip_code")

        if changed:
            tr.save(update_fields=changed)
            updated += 1

print("DONE ✅ updated:", updated, " | sequences touched:", touched_seq)
