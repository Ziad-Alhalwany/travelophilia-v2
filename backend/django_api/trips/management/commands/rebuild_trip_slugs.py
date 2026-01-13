from django.core.management.base import BaseCommand
from django.utils.text import slugify
from trips.models import Trip, Destination


def infer_dest_part(trip: Trip) -> str:
    # STAY: use Destination slug by dest_code if possible
    if str(trip.type or "").upper() != "DAYUSE":
        code = (trip.dest_code or "").upper().strip()
        if code:
            d = Destination.objects.filter(code=code).first()
            if d and d.slug:
                return d.slug

        # fallback from location first token
        loc = (trip.location or "").strip()
        if loc:
            first = loc.split(",")[0].strip()
            return slugify(first)[:40]

        return "trip"

    # DAYUSE: from-to
    fc = (trip.from_code or "").upper().strip()
    tc = (trip.to_code or "").upper().strip()

    def code_to_slug(c: str) -> str:
        if not c:
            return "unk"
        d = Destination.objects.filter(code=c).first()
        return d.slug if d and d.slug else c.lower()

    return f"{code_to_slug(fc)}-to-{code_to_slug(tc)}"


def build_slug(trip: Trip) -> str:
    ttype = "dayuse" if str(trip.type or "").upper() == "DAYUSE" else "stay"
    dest_part = infer_dest_part(trip)

    # theme from name
    theme = slugify(trip.name or "")[:70] or "trip"

    # avoid duplication if theme already starts with dest_part
    if theme.startswith(dest_part + "-"):
        base = f"{theme}-{ttype}"
    else:
        base = f"{dest_part}-{ttype}-{theme}"

    base = base.replace("--", "-").strip("-")[:120]
    return base or "trip"


def ensure_unique_slug(base: str, trip_id: int) -> str:
    candidate = base[:120]
    if not Trip.objects.filter(slug=candidate).exclude(id=trip_id).exists():
        return candidate

    i = 2
    while True:
        suffix = f"-{i}"
        trimmed = candidate[: (120 - len(suffix))].rstrip("-")
        cand2 = f"{trimmed}{suffix}"
        if not Trip.objects.filter(slug=cand2).exclude(id=trip_id).exists():
            return cand2
        i += 1


class Command(BaseCommand):
    help = (
        "Rebuild SEO slugs for all trips using Destination + TripType + Theme (unique)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Apply changes to DB (otherwise dry-run).",
        )

    def handle(self, *args, **options):
        apply = options["apply"]

        qs = Trip.objects.all().order_by("id")
        changed = 0

        for trip in qs:
            base = build_slug(trip)
            final = ensure_unique_slug(base, trip.id)

            if (trip.slug or "").strip() != final:
                changed += 1
                if apply:
                    trip.slug = final
                    trip.save(update_fields=["slug"])
                self.stdout.write(f"[{trip.id}] {trip.name} -> {final}")

        self.stdout.write(
            self.style.SUCCESS(f"Done. Changed: {changed}. Apply={apply}")
        )
