# backend/django_api/trips/models.py
from django.db import models
from django.utils.text import slugify


class Destination(models.Model):
    """
    Destination = وجهة (Siwa / Dahab / Alexandria...)
    - جدول مرجعي للأكواد (SIWA, DHB, ALEX, ...)
    """

    code = models.CharField(
        max_length=12,
        unique=True,
        db_index=True,
        help_text="Unique destination code e.g. SIWA, DHB, ALEX, AIN",
    )
    slug = models.SlugField(
        max_length=120,
        unique=True,
        db_index=True,
        help_text="SEO slug e.g. siwa, dahab, alexandria",
    )
    name = models.CharField(max_length=120, help_text="Display name e.g. Siwa")
    country = models.CharField(max_length=80, blank=True, default="Egypt")
    city = models.CharField(max_length=120, blank=True, default="")
    description = models.TextField(blank=True, default="")

    cover_image_url = models.URLField(blank=True, default="")
    gallery_urls = models.JSONField(default=list, blank=True)  # list[str]
    video_urls = models.JSONField(default=list, blank=True)  # list[str]

    is_active = models.BooleanField(default=True, db_index=True)
    sort_order = models.IntegerField(default=0, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # ✅ slug auto
        if not (self.slug or "").strip() and (self.name or "").strip():
            self.slug = slugify(self.name)[:120]

        # ✅ code normalize
        if self.code:
            self.code = str(self.code).upper().strip()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Activity(models.Model):
    """
    Activity = Add-on مربوط بوجهة
    """

    destination = models.ForeignKey(
        Destination, on_delete=models.CASCADE, related_name="activities"
    )

    title = models.CharField(max_length=160)
    slug = models.SlugField(max_length=160, blank=True, default="")
    description = models.TextField(blank=True, default="")

    price = models.PositiveIntegerField(default=0)
    currency = models.CharField(max_length=8, default="EGP")
    duration_label = models.CharField(
        max_length=64, blank=True, default=""
    )  # "Half-day", "2 hours", etc.

    options = models.JSONField(default=list, blank=True)  # list[dict] or list[str]
    tags = models.JSONField(default=list, blank=True)

    is_active = models.BooleanField(default=True, db_index=True)
    sort_order = models.IntegerField(default=0, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["destination", "is_active", "sort_order"]),
        ]
        unique_together = [("destination", "slug")]

    def save(self, *args, **kwargs):
        if not (self.slug or "").strip() and (self.title or "").strip():
            self.slug = slugify(self.title)[:160]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} — {self.destination.code}"


class Trip(models.Model):
    """
    Trip = رحلة (Stay أو Dayuse)

    public_code:
      ST-0000007-SIWA
      DU-0000004-MNS-AIN
    """

    # =========================
    # Legacy (Old React shape)
    # =========================
    legacy_id = models.CharField(max_length=120, unique=True, null=True, blank=True)
    slug = models.SlugField(max_length=120, unique=True, null=True, blank=True)

    # =========================
    # Main fields
    # =========================
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=200, blank=True, default="")
    type = models.CharField(
        max_length=32, blank=True, default=""
    )  # DAYUSE / STAY / ...

    description = models.TextField(blank=True, default="")

    priceFrom = models.PositiveIntegerField(null=True, blank=True)
    priceTo = models.PositiveIntegerField(null=True, blank=True)
    currency = models.CharField(max_length=8, default="EGP")

    durationNights = models.PositiveSmallIntegerField(null=True, blank=True)

    tags = models.JSONField(default=list, blank=True)
    highlights = models.JSONField(default=list, blank=True)

    media = models.JSONField(default=dict, blank=True)
    social_proof = models.JSONField(default=dict, blank=True)

    is_active = models.BooleanField(default=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # =========================
    # Public Code System (New)
    # =========================
    public_code = models.CharField(
        max_length=32,
        unique=True,
        blank=True,
        null=True,
        db_index=True,
        help_text="Public code e.g. ST-0000007-SIWA or DU-0000008-CAI-ALEX",
    )
    global_seq = models.PositiveIntegerField(
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text="Global sequence number (auto = id).",
    )

    # Codes used in public_code
    dest_code = models.CharField(
        max_length=12, blank=True, default="", help_text="For STAY: e.g. SIWA, DHB, SHM"
    )
    from_code = models.CharField(
        max_length=12,
        blank=True,
        default="",
        help_text="For DAYUSE origin: e.g. CAI, MNS",
    )
    to_code = models.CharField(
        max_length=12,
        blank=True,
        default="",
        help_text="For DAYUSE destination: e.g. ALEX, AIN",
    )

    # Internal (company-only)
    internal_key = models.CharField(
        max_length=32,
        blank=True,
        default="",
        db_index=True,
        help_text="Company-only key: STAY uses dest_code, DAYUSE uses FROM-TO",
    )
    internal_seq = models.PositiveIntegerField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Company-only sequence per internal_key (auto).",
    )

    # =========================
    # Helpers
    # =========================
    def _is_dayuse(self) -> bool:
        return str(self.type or "").upper() == "DAYUSE"

    def _compute_internal_key(self) -> str:
        if self._is_dayuse():
            fc = (self.from_code or "").upper()
            tc = (self.to_code or "").upper()
            return f"{fc}-{tc}".strip("-")
        return (self.dest_code or "").upper()

    def _build_public_code(self) -> str:
        seq7 = f"{int(self.global_seq):07d}"

        if self._is_dayuse():
            fc = (self.from_code or "UNK").upper()
            tc = (self.to_code or "UNK").upper()
            return f"DU-{seq7}-{fc}-{tc}"

        dc = (self.dest_code or "UNK").upper()
        return f"ST-{seq7}-{dc}"

    # =========================
    # Save override (Auto-generate codes)
    # =========================
    def save(self, *args, **kwargs):
        # 1) legacy slug/id (لو حد نسي)
        if not (self.slug or "").strip() and (self.name or "").strip():
            self.slug = slugify(self.name)[:120]
        if not (self.legacy_id or "").strip() and (self.slug or "").strip():
            self.legacy_id = self.slug

        # 2) Save first to ensure pk exists
        super().save(*args, **kwargs)

        changed = []

        # 3) global_seq = id
        if self.global_seq is None:
            self.global_seq = int(self.pk)
            changed.append("global_seq")

        # ✅ Normalize codes
        self.dest_code = (self.dest_code or "").upper().strip()
        self.from_code = (self.from_code or "").upper().strip()
        self.to_code = (self.to_code or "").upper().strip()

        # ✅ Infer STAY dest_code from Destination table (prevents ST-...-UNK)
        if not self._is_dayuse():
            if not self.dest_code or self.dest_code == "UNK":
                candidate = None

                n = (self.name or "").strip()
                if n:
                    candidate = Destination.objects.filter(name__iexact=n).first()

                if not candidate:
                    loc = (self.location or "").strip()
                    if loc:
                        first = loc.split(",")[0].strip()
                        candidate = (
                            Destination.objects.filter(name__iexact=first).first()
                            or Destination.objects.filter(slug=slugify(first)).first()
                        )

                if not candidate and (self.slug or "").strip():
                    candidate = Destination.objects.filter(slug=self.slug).first()

                if candidate and (candidate.code or "").strip():
                    inferred = str(candidate.code).upper().strip()
                    if inferred and inferred != self.dest_code:
                        self.dest_code = inferred
                        changed.append("dest_code")

        # 4) internal_key/internal_seq
        ik = self._compute_internal_key()
        if ik and (self.internal_key or "") != ik:
            self.internal_key = ik
            changed.append("internal_key")

        if self.internal_key and self.internal_seq is None:
            last = (
                Trip.objects.filter(internal_key=self.internal_key)
                .exclude(pk=self.pk)
                .order_by("-internal_seq")
                .values_list("internal_seq", flat=True)
                .first()
            )
            self.internal_seq = (int(last) + 1) if last else 1
            changed.append("internal_seq")

        # 5) public_code
        desired = self._build_public_code()
        if desired and (self.public_code or "").strip() != desired:
            self.public_code = desired
            changed.append("public_code")

        if changed:
            super().save(update_fields=changed)

    def __str__(self):
        return f"{self.name} ({self.public_code or self.slug})"


class LegacyCustomTrip(models.Model):
    """
    POST /api/custom-trip/
    نخزن payload كـ log (للتتبع)
    """

    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"LegacyCustomTrip #{self.id}"
