import random
import string

from django.conf import settings
from django.db import models, transaction
from django.db.models import Max


def generate_trip_code(prefix="TP"):
    """
    Generator قديم (لو لسه endpoint generate-code بيستخدمه).
    مش هو الكود النهائي بتاع الـ CRM.
    """
    a = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    b = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}-{a}-{b}"


class ReservationSequence(models.Model):
    """
    بنمسك آخر رقم R لكل Trip public code.
    مثال: ST-0000007-SIWA => last_r = 3
    """

    trip_public_code = models.CharField(max_length=64, unique=True, db_index=True)
    last_r = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.trip_public_code} (last_r={self.last_r})"


class TripRequest(models.Model):
    class Status(models.TextChoices):
        NEW = "NEW", "New"
        CONTACTED = "CONTACTED", "Contacted"
        QUALIFIED = "QUALIFIED", "Qualified"
        QUOTED = "QUOTED", "Quoted"
        BOOKED = "BOOKED", "Booked"
        CLOSED_WON = "CLOSED_WON", "Closed (Won)"
        CLOSED_LOST = "CLOSED_LOST", "Closed (Lost)"

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"

    # =========================
    # Codes (CRM)
    # =========================

    trip_code = models.CharField(
        max_length=96,
        unique=True,
        editable=False,
        db_index=True,
        null=True,
        blank=True,
    )

    trip_public_code = models.CharField(
        max_length=64, blank=True, default="", db_index=True
    )

    reservation_r = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    traveler_p = models.PositiveIntegerField(null=True, blank=True, db_index=True)

    is_leader = models.BooleanField(default=True, db_index=True)

    internal_code_override = models.CharField(max_length=96, blank=True, default="")

    # =========================
    # Leader / Traveler
    # =========================
    leader_full_name = models.CharField(max_length=200, blank=True, default="")
    leader_phone = models.CharField(max_length=32, blank=True, default="")
    leader_whatsapp = models.CharField(max_length=32, blank=True, default="")
    leader_email = models.EmailField(blank=True, default="")
    leader_gender = models.CharField(max_length=16, blank=True, default="")
    leader_age = models.PositiveIntegerField(null=True, blank=True)

    leader_nationality = models.CharField(max_length=80, blank=True, default="")
    leader_resident_country = models.CharField(max_length=80, blank=True, default="")

    leader_identity_type = models.CharField(max_length=16, blank=True, default="")
    leader_identity_last4 = models.CharField(max_length=8, blank=True, default="")
    entry_type_for_egypt = models.CharField(max_length=16, blank=True, default="")

    nationality = models.CharField(max_length=80, blank=True, default="")
    resident_country = models.CharField(max_length=80, blank=True, default="")

    # =========================
    # Trip info
    # =========================
    origin_city = models.CharField(max_length=80, blank=True, default="")
    destination_city = models.CharField(max_length=80, blank=True, default="")
    depart_date = models.DateField(null=True, blank=True)
    return_date = models.DateField(null=True, blank=True)

    adults_count = models.PositiveIntegerField(default=1)
    children_count = models.PositiveIntegerField(default=0)
    pax_total = models.PositiveIntegerField(default=1)

    companions_mode = models.CharField(max_length=16, blank=True, default="")
    note = models.TextField(blank=True, default="")

    couples_answer = models.CharField(max_length=8, blank=True, default="")
    terms_accepted = models.BooleanField(default=False)
    docs_acknowledged = models.BooleanField(default=False)

    travelers = models.JSONField(blank=True, default=list)
    children_details = models.JSONField(blank=True, default=list)

    # =========================
    # CRM fields
    # =========================
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NEW, db_index=True
    )
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.MEDIUM, db_index=True
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_trip_requests",
    )
    last_contacted_at = models.DateTimeField(null=True, blank=True)
    next_followup_at = models.DateTimeField(null=True, blank=True)
    source = models.CharField(max_length=50, blank=True, default="WEB")
    tags = models.JSONField(blank=True, default=list)

    trip_slug = models.CharField(max_length=255, blank=True, default="")
    trip_title = models.CharField(max_length=255, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.trip_code or f"TripRequest #{self.pk}"

    # =========================
    # Computed codes
    # =========================

    @property
    def reservation_code(self) -> str:
        if not self.trip_public_code or not self.reservation_r:
            return ""
        return f"{self.trip_public_code}-R{int(self.reservation_r):04d}"

    @property
    def traveler_code(self) -> str:
        if not self.reservation_code or not self.traveler_p:
            return ""
        return f"{self.reservation_code}-P{int(self.traveler_p):02d}"

    @property
    def lead_code(self) -> str:
        if not self.pk:
            return ""
        return f"L-{int(self.pk):07d}"

    def _build_internal_code(self) -> str:
        """
        Internal code shown in CRM:
        ST-...-R0003-P01-L-0000123
        """
        if not self.traveler_code or not self.pk:
            return ""
        return f"{self.traveler_code}-{self.lead_code}"

    def _next_traveler_p(self) -> int:
        last = (
            TripRequest.objects.filter(
                trip_public_code=self.trip_public_code, reservation_r=self.reservation_r
            )
            .aggregate(m=Max("traveler_p"))
            .get("m")
        )
        return int(last or 0) + 1

    def save(self, *args, **kwargs):
        creating = self.pk is None

        if creating and self.trip_public_code and not self.reservation_r:
            with transaction.atomic():
                seq, _ = ReservationSequence.objects.select_for_update().get_or_create(
                    trip_public_code=self.trip_public_code,
                    defaults={"last_r": 0},
                )
                seq.last_r = int(seq.last_r or 0) + 1
                seq.save(update_fields=["last_r"])
                self.reservation_r = seq.last_r

            if not self.traveler_p:
                self.traveler_p = 1
            if self.is_leader is None:
                self.is_leader = True

        if (
            creating
            and self.trip_public_code
            and self.reservation_r
            and not self.traveler_p
        ):
            self.traveler_p = self._next_traveler_p()

        super().save(*args, **kwargs)

        want = (
            self.internal_code_override or ""
        ).strip() or self._build_internal_code()
        if want and self.trip_code != want:
            TripRequest.objects.filter(pk=self.pk).update(trip_code=want)
            self.trip_code = want


class TripRequestNote(models.Model):
    class Kind(models.TextChoices):
        NOTE = "NOTE", "Note"
        WHATSAPP = "WHATSAPP", "WhatsApp"
        CALL = "CALL", "Call"
        EMAIL = "EMAIL", "Email"

    trip_request = models.ForeignKey(
        TripRequest, on_delete=models.CASCADE, related_name="crm_notes"
    )
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.NOTE)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="trip_request_notes",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.kind} ({self.created_at:%Y-%m-%d})"
