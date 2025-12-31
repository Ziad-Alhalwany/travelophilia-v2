from django.db import models
from django.utils import timezone
from django.conf import settings
import uuid


def generate_trip_code():
    # مثال: TP251214-1A2B3C
    date_part = timezone.now().strftime("%y%m%d")
    rand_part = uuid.uuid4().hex[:6].upper()
    return f"TP{date_part}-{rand_part}"


class TripRequest(models.Model):
    # =========================
    # Trip Code
    # =========================
    trip_code = models.CharField(
        max_length=32,
        unique=True,
        editable=False,
        db_index=True,
        blank=True,  # مهم عشان Django model validation مايتخانقش قبل save()
    )

    # =========================
    # Leader (summary fields)
    # =========================
    leader_full_name = models.CharField(max_length=200)
    leader_phone = models.CharField(max_length=32)
    leader_whatsapp = models.CharField(max_length=32)
    leader_email = models.EmailField()
    leader_gender = models.CharField(max_length=16)
    leader_age = models.PositiveIntegerField()

    leader_nationality = models.CharField(max_length=80)
    leader_resident_country = models.CharField(max_length=80)

    # Identity: نخزن آخر 4 فقط (خصوصية)
    leader_identity_type = models.CharField(max_length=16)  # NATIONAL_ID | PASSPORT
    leader_identity_last4 = models.CharField(max_length=8)

    # Non-egyptians only (optional)
    entry_type_for_egypt = models.CharField(max_length=16, blank=True, default="")  # RESIDENCE | TOURIST | ""

    # =========================
    # Trip basics
    # =========================
    trip_slug = models.CharField(max_length=255, blank=True, default="")
    trip_title = models.CharField(max_length=255, blank=True, default="")
    origin_city = models.CharField(max_length=80)
    destination_city = models.CharField(max_length=80)
    depart_date = models.DateField()
    return_date = models.DateField()

    adults_count = models.PositiveIntegerField(default=1)
    children_count = models.PositiveIntegerField(default=0)
    pax_total = models.PositiveIntegerField(default=1)

    companions_mode = models.CharField(max_length=16, blank=True, default="")  # NOW | LATER | ""

    nationality = models.CharField(max_length=80, blank=True, default="")
    resident_country = models.CharField(max_length=80, blank=True, default="")

    note = models.TextField(blank=True, default="")

    couples_answer = models.CharField(max_length=8)  # YES | NO
    terms_accepted = models.BooleanField(default=False)
    docs_acknowledged = models.BooleanField(default=False)

    # Full payload (structured)
    travelers = models.JSONField(default=list, blank=True)         # adults list
    children_details = models.JSONField(default=list, blank=True)  # children list

    # =========================
    # CRM fields (Status / Priority / Assign / Follow-up)
    # =========================
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

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
        db_index=True,
    )
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        db_index=True,
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
    tags = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # =========================
    # Behaviors
    # =========================
    def save(self, *args, **kwargs):
        if not self.trip_code:
            # ضمان uniqueness
            for _ in range(10):
                code = generate_trip_code()
                if not TripRequest.objects.filter(trip_code=code).exists():
                    self.trip_code = code
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.trip_code} - {self.leader_full_name}"


class TripRequestNote(models.Model):
    # Notes / Interactions (WhatsApp / Call / Email / Notes)
    class Kind(models.TextChoices):
        NOTE = "NOTE", "Note"
        WHATSAPP = "WHATSAPP", "WhatsApp"
        CALL = "CALL", "Call"
        EMAIL = "EMAIL", "Email"

    trip_request = models.ForeignKey(
        "TripRequest",
        on_delete=models.CASCADE,
        related_name="crm_notes",
    )
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.NOTE)
    body = models.TextField()

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="trip_request_notes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.kind} - Trip {self.trip_request_id} - Note {self.pk}"
