# trips/management/commands/backfill_trip_public_codes.py
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from trips.models import Trip


def city_to_code(name: str) -> str:
    s = (name or "").strip()
    if not s:
        return "UNK"
    # mapping سريع للأسماء الشائعة (زوّد براحتك)
    mapping = {
        "cairo": "CAI",
        "mansoura": "MNS",
        "alexandria": "ALX",
        "ain sokhna": "AIN",
        "dahab": "DAH",
        "siwa": "SIW",
        "hurghada": "HUR",
        "istanbul": "IST",
    }
    k = slugify(s).replace("-", " ").strip().lower()
    if k in mapping:
        return mapping[k]
    # fallback: أول 3 حروف
    letters = "".join([ch for ch in slugify(s).upper() if ch.isalpha()])
    return (letters[:3] or "UNK").ljust(3, "X")


class Command(BaseCommand):
    help = "Backfill Trip.dest_code/from_code/to_code + Trip.public_code (without changing slug)."

    def handle(self, *args, **options):
        updated = 0

        with transaction.atomic():
            qs = Trip.objects.all().order_by("id")

            for t in qs:
                changed = []

                trip_type = (getattr(t, "trip_type", "") or "").upper()
                seq = int(getattr(t, "global_seq", 0) or 0)
                if not seq:
                    # لو global_seq فاضي — سيبه (حسب تصميمك)
                    continue

                # STAY
                if trip_type == "STAY":
                    if not getattr(t, "dest_code", ""):
                        t.dest_code = city_to_code(
                            getattr(t, "destination_city", "") or getattr(t, "name", "")
                        )
                        changed.append("dest_code")

                    dest = (t.dest_code or "UNK").upper()
                    new_public = f"ST-{seq:07d}-{dest}"
                    if getattr(t, "public_code", "") != new_public:
                        t.public_code = new_public
                        changed.append("public_code")

                # DAYUSE
                elif trip_type == "DAYUSE":
                    # حاول نستنتج من slug لو فيه DU-0000005-CAI-ALX
                    slug = (getattr(t, "slug", "") or "").upper()
                    parts = slug.split("-")
                    if slug.startswith("DU-") and len(parts) >= 4:
                        fc, tc = parts[2], parts[3]
                        if not getattr(t, "from_code", ""):
                            t.from_code = fc
                            changed.append("from_code")
                        if not getattr(t, "to_code", ""):
                            t.to_code = tc
                            changed.append("to_code")

                    fc = (getattr(t, "from_code", "") or "UNK").upper()
                    tc = (getattr(t, "to_code", "") or "UNK").upper()
                    new_public = f"DU-{seq:07d}-{fc}-{tc}"
                    if getattr(t, "public_code", "") != new_public:
                        t.public_code = new_public
                        changed.append("public_code")

                # CUSTOM (لو عندك)
                elif trip_type == "CUSTOM":
                    new_public = f"CT-{seq:07d}-UNK"
                    if getattr(t, "public_code", "") != new_public:
                        t.public_code = new_public
                        changed.append("public_code")

                if changed:
                    t.save(update_fields=changed)
                    updated += 1

        self.stdout.write(self.style.SUCCESS(f"DONE ✅ updated={updated}"))
