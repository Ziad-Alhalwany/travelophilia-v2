# backend\django_api\trip_requests\models_BACKUP.py
from __future__ import annotations

from django.db import models, transaction, IntegrityError
from django.utils import timezone
from django.conf import settings
import uuid
from django.db.models import Max
from .city_codes import guess_city_code


def generate_cart_code() -> str:
    # مثال: CART260102-8F3A
    date_part = timezone.now().strftime("%y%m%d")
    rand_part = uuid.uuid4().hex[:4].upper()
    return f"CART{date_part}-{rand_part}"


def parse_trip_public_code(code: str) -> dict:
    """
    يدعم:
    ST-0000007-SIWA
    DU-0000005-CAI-ALX
    CT-0000123
    """
    c = (code or "").strip().upper()
    parts = [p for p in c.split("-") if p]

    out = {"kind": "", "dest": "", "from": "", "to": ""}
    if not parts:
        return out

    kind = parts[0]
    out["kind"] = kind

    if kind == "ST" and len(parts) >= 3:
        out["dest"] = parts[2]
    elif kind == "DU" and len(parts) >= 4:
        out["from"] = parts[2]
        out["to"] = parts[3]
    return out


class TripRequest(models.Model):
    """
    TripRequest = Reservation/Lead (حجز واحد) حتى لو مجموعة.
    - Trip Public Code: بييجي من Trip.public_code (أو CT-* للـ customize)
    - Lead Code: داخلي للتيم (L-XXXXXXX-optionalOrigin)
    - Reservation Code (CRM): TripPublic + Lead + Rxxxx
    - Customer Code: TripPublic + Rxxxx
    """

    # =========================
    # Trip identifiers
    # =========================
    # بنحتفظ بالقديم زي ما هو (لو الفرونت بيبعت هنا public_code)
    trip_slug = models.CharField(max_length=255, blank=True, default="")
    trip_title = models.CharField(max_length=255, blank=True, default="")

    # الجديد الواضح
    trip_public_code = models.CharField(max_length=64, blank=True, default="", db_index=True)

    # =========================
    # Codes system
    # =========================
    # Lead global sequence (داخلي للتيم)
    lead_seq = models.PositiveIntegerField(unique=True, null=True, blank=True, db_index=True)

    # Reservation sequence داخل نفس الرحلة (R0001, R0002, ...)
    trip_seq = models.PositiveIntegerField(null=True, blank=True, db_index=True)

    # الكود النهائي داخل CRM (Unique)
    trip_code = models.CharField(
        max_length=96,
        unique=True,
        null=True,
        blank=True,
        editable=False,
        db_index=True,
    )

    # Link to Trip (optional, safe)
    trip = models.ForeignKey(
        "trips.Trip",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="requests",
    )

    # Normalized codes (auto)
    trip_public_code = models.CharField(max_length=32, blank=True, default="", db_index=True)
    origin_code = models.CharField(max_length=8, blank=True, default="", db_index=True)
    destination_code = models.CharField(max_length=12, blank=True, default="", db_index=True)

    # Sequences + lead
    reservation_seq = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    lead_global_seq = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    lead_code = models.CharField(max_length=16, blank=True, default="", db_index=True)

    # Codes
    reservation_code_internal = models.CharField(max_length=64, blank=True, default="", db_index=True)
    reservation_code_override = models.CharField(max_length=64, blank=True, default="")

    # Optional grouping future-proof
    package_code = models.CharField(max_length=32, blank=True, default="", db_index=True)


    # لو احتجت تعديله يدويًا للعرض (من غير ما نكسر النظام)
    reservation_code_override = models.CharField(max_length=120, blank=True, default="")

    # كود العميل (أقصر)
    customer_code_override = models.CharField(max_length=120, blank=True, default="")

    # Cart/Package code (للتجميع لاحقًا)
    cart_code = models.CharField(max_length=40, blank=True, default="", db_index=True)

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

    leader_identity_type = models.CharField(max_length=16)  # NATIONAL_ID | PASSPORT
    leader_identity_last4 = models.CharField(max_length=8)

    entry_type_for_egypt = models.CharField(max_length=16, blank=True, default="")  # RESIDENCE | TOURIST | ""

    # =========================
    # Trip basics
    # =========================
    origin_city = models.CharField(max_length=80)
    destination_city = models.CharField(max_length=80)

    # Codes (اختياري لكن مفيد جدًا)
    origin_code = models.CharField(max_length=12, blank=True, default="", db_index=True)
    destination_code = models.CharField(max_length=12, blank=True, default="", db_index=True)

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

    travelers = models.JSONField(default=list, blank=True)         # adults list
    children_details = models.JSONField(default=list, blank=True)  # children list

    # =========================
    # CRM fields
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

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW, db_index=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM, db_index=True)

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

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["trip_public_code", "trip_seq"], name="uq_trip_public_code_trip_seq"),
        ]
        indexes = [
            models.Index(fields=["trip_public_code", "created_at"]),
            models.Index(fields=["origin_code"]),
            models.Index(fields=["destination_code"]),
        ]

    # =========================
    # Helpers / Display
    # =========================
    @property
    def lead_code(self) -> str:
        if not self.lead_seq:
            return ""
        seq7 = f"{int(self.lead_seq):07d}"
        oc = (self.origin_code or "").strip().upper()
        return f"L-{seq7}-{oc}" if oc else f"L-{seq7}"

    @property
    def reservation_code(self) -> str:
        # اللي يظهر للتيم في CRM
        if (self.reservation_code_override or "").strip():
            return self.reservation_code_override.strip()

        tp = (self.trip_public_code or self.trip_slug or "").strip()
        if not tp or not self.trip_seq or not self.lead_seq:
            return self.trip_code or ""

        r = f"R{int(self.trip_seq):04d}"
        return f"{tp}-{self.lead_code}-{r}"

    @property
    def customer_code(self) -> str:
        # اللي ممكن يتبعت للعميل (أقصر)
        if (self.customer_code_override or "").strip():
            return self.customer_code_override.strip()

        tp = (self.trip_public_code or self.trip_slug or "").strip()
        if not tp or not self.trip_seq:
            return ""
        r = f"R{int(self.trip_seq):04d}"
        return f"{tp}-{r}"

    # =========================
    # Behaviors
    # =========================
    def save(self, *args, **kwargs):
        creating = self.pk is None

        # 1) أول save عشان ناخد pk (اللي هنستخدمه كـ lead_seq)
        if creating:
            super().save(*args, **kwargs)

        changed = []

        # 2) trip_public_code: نخليه دايمًا موجود (من trip_slug لو الفرونت بيحطها هناك)
        if not (self.trip_public_code or "").strip():
            ts = (self.trip_slug or "").strip()
            if ts:
                self.trip_public_code = ts
                changed.append("trip_public_code")

        # 3) cart_code: يتولد مرة
        if not (self.cart_code or "").strip():
            self.cart_code = generate_cart_code()
            changed.append("cart_code")

        # 4) lead_seq = pk (ترقيم عالمي للشركة)
        if self.lead_seq is None and self.pk:
            self.lead_seq = int(self.pk)
            changed.append("lead_seq")

        # 5) لو codes فاضية… نحاول نملأها من trip_public_code (خصوصًا DAYUSE)
        info = parse_trip_public_code(self.trip_public_code)
        if not (self.destination_code or "").strip() and info.get("dest"):
            self.destination_code = info["dest"]
            changed.append("destination_code")

        if info.get("kind") == "DU":
            if not (self.origin_code or "").strip() and info.get("from"):
                self.origin_code = info["from"]
                changed.append("origin_code")
            if not (self.destination_code or "").strip() and info.get("to"):
                self.destination_code = info["to"]
                changed.append("destination_code")

        # 6) trip_seq داخل نفس الرحلة + trip_code النهائي (مع retry بسيط)
        if not self.trip_seq or not self.trip_code:
            tp = (self.trip_public_code or "").strip()
            if tp:
                for _ in range(10):
                    try:
                        with transaction.atomic():
                            if not self.trip_seq:
                                last = (
                                    TripRequest.objects
                                    .filter(trip_public_code=tp)
                                    .exclude(pk=self.pk)
                                    .order_by("-trip_seq")
                                    .values_list("trip_seq", flat=True)
                                    .first()
                                )
                                self.trip_seq = (int(last) + 1) if last else 1
                                changed.append("trip_seq")

                            if not self.trip_code:
                                # نخزن “internal reservation code” في trip_code (Unique)
                                # (اللي يظهر للتيم = reservation_code property)
                                self.trip_code = self.reservation_code or ""
                                changed.append("trip_code")

                            super().save(update_fields=list(set(changed)))
                            changed = []
                            break
                    except IntegrityError:
                        # حصل تصادم في uq_trip_public_code_trip_seq أو trip_code unique
                        # نجرب تاني بقيمة trip_seq مختلفة
                        self.trip_seq = None
                        if "trip_seq" in changed:
                            changed.remove("trip_seq")
                        continue

        # 7) لو فيه تغييرات بسيطة لسه
        if changed:
            super().save(update_fields=list(set(changed)))

    def __str__(self):
        return f"{self.trip_code or 'NO-CODE'} - {self.leader_full_name}"


class TripRequestNote(models.Model):
    class Kind(models.TextChoices):
        NOTE = "NOTE", "Note"
        WHATSAPP = "WHATSAPP", "WhatsApp"
        CALL = "CALL", "Call"
        EMAIL = "EMAIL", "Email"

    trip_request = models.ForeignKey("TripRequest", on_delete=models.CASCADE, related_name="crm_notes")
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

def _is_dayuse(self) -> bool:
    t = (getattr(self.trip, "type", "") or "").upper()
    if t == "DAYUSE":
        return True
    # fallback لو trip مش موجود
    return (self.trip_public_code or "").upper().startswith("DU-")

def _parse_trip_code_parts(self, trip_public_code: str):
    # ST-0000007-SIWA
    # DU-0000005-CAI-ALX
    parts = (trip_public_code or "").strip().upper().split("-")
    return parts

def _compute_trip_public_code(self) -> str:
    if self.trip and getattr(self.trip, "public_code", ""):
        return self.trip.public_code.strip().upper()
    return (self.trip_public_code or "").strip().upper()

def _compute_destination_code(self, trip_public_code: str) -> str:
    # from trip fields first
    if self.trip:
        if self._is_dayuse():
            return (getattr(self.trip, "to_code", "") or "").strip().upper()
        return (getattr(self.trip, "dest_code", "") or "").strip().upper()

    # fallback parse from code
    parts = self._parse_trip_code_parts(trip_public_code)
    if len(parts) >= 4 and parts[0] == "DU":
        return parts[-1]
    if len(parts) >= 3 and parts[0] == "ST":
        return parts[-1]
    return ""

def _compute_origin_code(self, trip_public_code: str) -> str:
    if self.trip and self._is_dayuse():
        return (getattr(self.trip, "from_code", "") or "").strip().upper()

    # stay: infer from origin_city (client input)
    return guess_city_code(getattr(self, "origin_city", ""))

def _next_reservation_seq(self, trip_public_code: str) -> int:
    # reservation_seq is per Trip Public Code
    last = (
        TripRequest.objects.filter(trip_public_code=trip_public_code)
        .exclude(pk=self.pk)
        .aggregate(m=Max("reservation_seq"))
        .get("m")
        or 0
    )
    return int(last) + 1

def _build_public_reservation_code(self, trip_public_code: str, reservation_seq: int) -> str:
    return f"{trip_public_code}-R{int(reservation_seq):04d}"

def _build_internal_reservation_code(self, public_res_code: str, lead_code: str) -> str:
    # CRM internal code (includes lead)
    return f"{public_res_code}-{lead_code}".strip("-")

def _ensure_travelers_payload(self, public_res_code: str):
    # Optional: generate traveler placeholders based on pax_total if travelers empty
    try:
        pax = int(getattr(self, "pax_total", 0) or 0)
    except Exception:
        pax = 0

    travelers = getattr(self, "travelers", None)
    if travelers:
        return  # already provided

    if pax <= 0:
        return

    self.travelers = [
        {"seq": i + 1, "code": f"{public_res_code}-P{(i+1):02d}"}
        for i in range(pax)
    ]

def save(self, *args, **kwargs):
    creating = self.pk is None
    super().save(*args, **kwargs)

    update_fields = []

    # Global lead sequence
    if self.lead_global_seq is None:
        self.lead_global_seq = self.pk
        update_fields.append("lead_global_seq")

    if not self.lead_code:
        self.lead_code = f"L-{int(self.lead_global_seq):07d}"
        update_fields.append("lead_code")

    # Trip public code
    tpc = self._compute_trip_public_code()
    if tpc and tpc != (self.trip_public_code or "").strip().upper():
        self.trip_public_code = tpc
        update_fields.append("trip_public_code")

    # Codes
    if not self.destination_code:
        dc = self._compute_destination_code(self.trip_public_code)
        if dc:
            self.destination_code = dc
            update_fields.append("destination_code")

    if not self.origin_code:
        oc = self._compute_origin_code(self.trip_public_code)
        if oc:
            self.origin_code = oc
            update_fields.append("origin_code")

    # Reservation seq per trip
    if self.trip_public_code and self.reservation_seq is None:
        self.reservation_seq = self._next_reservation_seq(self.trip_public_code)
        update_fields.append("reservation_seq")

    # Public reservation code (this is your TripRequest.trip_code)
    if self.trip_public_code and self.reservation_seq:
        if self.reservation_code_override:
            public_code = self.reservation_code_override.strip()
        else:
            public_code = self._build_public_reservation_code(self.trip_public_code, self.reservation_seq)

        if public_code and public_code != (self.trip_code or ""):
            self.trip_code = public_code
            update_fields.append("trip_code")

        internal_code = self._build_internal_reservation_code(public_code, self.lead_code)
        if internal_code and internal_code != (self.reservation_code_internal or ""):
            self.reservation_code_internal = internal_code
            update_fields.append("reservation_code_internal")

        # Package code (optional, future-proof)
        if not self.package_code:
            self.package_code = f"PKG-{int(self.pk):07d}"
            update_fields.append("package_code")

        # Travelers placeholders (optional)
        if "travelers" not in update_fields:
            before = getattr(self, "travelers", None)
            self._ensure_travelers_payload(public_code)
            after = getattr(self, "travelers", None)
            if after != before:
                update_fields.append("travelers")

    if update_fields:
        super().save(update_fields=update_fields)
