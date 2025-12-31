from django.db import models
from django.utils.text import slugify


class Trip(models.Model):
    """
    Trip = رحلة (Stay أو Dayuse)

    ملاحظات تصميم:
    - legacy_id + slug: للحفاظ على الداتا/الشكل القديم (لو محتاجهم داخليًا)
    - public_code: ده المعرف اللي هنبعته للفرونت ويستخدمه في /reserve/<code> (Unique)
    - global_seq: رقم الرحلة العام للشركة (هنخليه = id تلقائيًا)
    - dest_code / from_code / to_code: أكواد الأماكن لتكوين public_code
    - internal_seq: عداد داخلي لكل وجهة/Route (للشركة فقط)
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
    type = models.CharField(max_length=32, blank=True, default="")  # DAYUSE / SEA_ESCAPE / CITY_ESCAPE ...

    description = models.TextField(blank=True, default="")

    priceFrom = models.PositiveIntegerField(null=True, blank=True)
    priceTo = models.PositiveIntegerField(null=True, blank=True)
    currency = models.CharField(max_length=8, default="EGP")

    durationNights = models.PositiveSmallIntegerField(null=True, blank=True)

    tags = models.JSONField(default=list, blank=True)
    highlights = models.JSONField(default=list, blank=True)

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
        help_text="Public unique code used by frontend as slug e.g. ST-0000007-SIWA or DU-0000008-CAI-ALEX",
    )
    global_seq = models.PositiveIntegerField(
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text="Global sequence number for the company (auto = id).",
    )

    # Codes used in public_code
    dest_code = models.CharField(max_length=12, blank=True, default="", help_text="For STAY: e.g. SIWA, DHB, SHM")
    from_code = models.CharField(max_length=12, blank=True, default="", help_text="For DAYUSE origin: e.g. CAI, MNS")
    to_code = models.CharField(max_length=12, blank=True, default="", help_text="For DAYUSE destination: e.g. ALEX, AIN")

    # Internal (company-only) sequence per destination/route
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
        help_text="Company-only sequence per internal_key (auto). Not shown to customers.",
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
        # ✅ 7 digits padding minimum (auto expands beyond that if seq > 9,999,999)
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
        # ✅ 1) legacy slug/id (لو حد نسي)
        if not (self.slug or "").strip() and (self.name or "").strip():
            self.slug = slugify(self.name)[:120]
        if not (self.legacy_id or "").strip() and (self.slug or "").strip():
            self.legacy_id = self.slug

        # ✅ 2) Save first to ensure pk exists
        creating = self.pk is None
        super().save(*args, **kwargs)

        changed = []

        # ✅ 3) global_seq = id (رقم الرحلة العام للشركة)
        if self.global_seq is None:
            self.global_seq = int(self.pk)
            changed.append("global_seq")

        # ✅ 4) internal_key/internal_seq (داخلي للشركة فقط)
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

        # ✅ 5) public_code: اتولد/اتحدّث تلقائيًا لو الأكواد اتغيرت
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
    Endpoint قديم كان موجود في Node:
    POST /api/custom-trip
    نخليه شغال للـ backward compatibility، بس نخزن payload في DB كـ log.
    """
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"LegacyCustomTrip #{self.id}"
