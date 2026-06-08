// src/pages/partners/InventoryDashboard.jsx
// TP-OTA-FE-EXTRANET-003 — Vendor Calendar Inventory Dashboard + Smart Bulk Update Form
// Premium dark-themed B2B extranet interface with Zod validation

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import toast, { Toaster } from "react-hot-toast";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calendar as CalendarIcon,
  Hotel,
  DollarSign,
  Layers,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  BedDouble,
  TrendingUp,
} from "lucide-react";
import authStorage from "@/services/authStorage";
import { api } from "@/services/apiClient";
import { usePropertyAvailability, useBulkInventoryUpdate } from "@/hooks/useOtaServices";
import {
  buildBulkUpdatePayload,
  formatCurrency,
  validateDateRange,
  validatePositiveNumber,
  getAvailabilityColor,
  formatDateISO,
} from "@/utils/markupHelpers";

// ────────────────────────────────────────────────────────────
// Zod schema for the Bulk Update Form
// ────────────────────────────────────────────────────────────
const bulkUpdateSchema = z
  .object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    roomTypeId: z.string().min(1, "Room type is required"),
    ratePlan: z.string().min(1, "Rate plan is required"),
    price: z.coerce
      .number({ invalid_type_error: "Price must be a number" })
      .nonnegative("Price cannot be negative"),
    allocation: z.coerce
      .number({ invalid_type_error: "Allocation must be a number" })
      .int("Allocation must be a whole number")
      .nonnegative("Allocation cannot be negative"),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

// Rate plan options
const RATE_PLANS = [
  { code: "RO", name: "Room Only", icon: "🛏️" },
  { code: "BB", name: "Bed & Breakfast", icon: "🥐" },
  { code: "HB", name: "Half Board", icon: "🍽️" },
  { code: "FB", name: "Full Board", icon: "🍱" },
  { code: "AI", name: "All Inclusive", icon: "⭐" },
];

// ────────────────────────────────────────────────────────────
// Calendar cell color map
// ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  green: {
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  amber: {
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  red: {
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    text: "text-red-400",
    dot: "bg-red-400",
  },
  gray: {
    bg: "bg-muted/30",
    border: "border-muted/20",
    text: "text-muted-foreground/50",
    dot: "bg-muted-foreground/30",
  },
};

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────
export default function InventoryDashboard() {
  const navigate = useNavigate();
  const { id } = useParams();
  const propertyId = Number(id || 1);

  // Auth guard — redirect if no token
  useEffect(() => {
    const token = authStorage.getAccessToken();
    if (!token) {
      navigate("/partners/login", { replace: true });
    }
  }, [navigate]);

  // ── State ──
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const [metadata, setMetadata] = useState({ room_types: [], rate_plans: [] });

  // Live custom hook bindings
  const {
    loading: calendarLoading,
    error: calendarError,
    data: availabilityData,
    execute: fetchAvailability,
    abort: abortAvailability,
  } = usePropertyAvailability();

  const {
    loading: submitting,
    error: bulkUpdateError,
    execute: runBulkUpdate,
  } = useBulkInventoryUpdate();

  // Extract calendar data from hook response
  const calendarData = useMemo(() => {
    return availabilityData?.calendar || availabilityData || [];
  }, [availabilityData]);

  // Form state
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    roomTypeId: "",
    ratePlan: "",
    price: "",
    allocation: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // ── Data Fetching ──
  useEffect(() => {
    fetchAvailability(propertyId, currentMonth.month, currentMonth.year);
    return () => {
      abortAvailability();
    };
  }, [propertyId, currentMonth, fetchAvailability, abortAvailability]);

  const loadMetadata = useCallback(async () => {
    try {
      const res = await api.get("/properties/metadata/");
      const data = res.data?.data || res.data;
      setMetadata({
        room_types: data?.roomTypes || data?.room_types || [],
        rate_plans: data?.ratePlans || data?.rate_plans || RATE_PLANS,
      });
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  // ── Calendar data map ──
  const calendarMap = useMemo(() => {
    const map = new Map();
    calendarData.forEach((entry) => {
      const key = entry.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(entry);
    });
    return map;
  }, [calendarData]);

  // ── Navigation ──
  function prevMonth() {
    setCurrentMonth((prev) => {
      if (prev.month === 1) return { month: 12, year: prev.year - 1 };
      return { month: prev.month - 1, year: prev.year };
    });
  }

  function nextMonth() {
    setCurrentMonth((prev) => {
      if (prev.month === 12) return { month: 1, year: prev.year + 1 };
      return { month: prev.month + 1, year: prev.year };
    });
  }

  const monthLabel = new Date(
    currentMonth.year,
    currentMonth.month - 1
  ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // ── Form Handling ──
  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormErrors({});

    // Validate via Zod
    const result = bulkUpdateSchema.safeParse(formData);
    if (!result.success) {
      const errors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (!errors[key]) errors[key] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        roomTypeId: Number(formData.roomTypeId),
        ratePlan: formData.ratePlan,
        startDate: formData.startDate,
        endDate: formData.endDate,
        price: Number(formData.price),
        allocation: Number(formData.allocation),
      };

      const response = await runBulkUpdate(propertyId, payload);
      
      if (response) {
        toast.success(
          response?.message || "Availability updated successfully!",
          {
            icon: "✅",
            duration: 4000,
            style: {
              background: "hsl(205 37% 10%)",
              color: "hsl(210 20% 92%)",
              border: "1px solid hsl(172 100% 42% / 0.3)",
            },
          }
        );
        // Refresh calendar
        fetchAvailability(propertyId, currentMonth.month, currentMonth.year);
        // Reset form
        setFormData({
          startDate: "",
          endDate: "",
          roomTypeId: "",
          ratePlan: "",
          price: "",
          allocation: "",
        });
      }
    } catch (err) {
      toast.error(err?.message || "Bulk update failed. Please try again.", {
        style: {
          background: "hsl(205 37% 10%)",
          color: "hsl(210 20% 92%)",
          border: "1px solid hsl(351 100% 71% / 0.3)",
        },
      });
    }
  }

  // ── Days of the month for grid ──
  const daysInMonth = useMemo(() => {
    const days = [];
    const year = currentMonth.year;
    const month = currentMonth.month - 1;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Pad start with empty slots for alignment
    const startDow = firstDay.getDay(); // 0=Sun
    for (let i = 0; i < startDow; i++) {
      days.push(null);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = formatDateISO(date);
      const entries = calendarMap.get(dateStr) || [];
      days.push({ date, dateStr, entries });
    }
    return days;
  }, [currentMonth, calendarMap]);

  // ────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={200}>
      <Toaster position="top-right" />
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Hotel className="size-4" />
            Partner Extranet
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Inventory Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage room availability, rates, and allocation across your property
          </p>
        </div>

        {/* Main Grid: Calendar + Form */}
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* ── Calendar Grid ── */}
          <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/30 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarIcon className="size-4 text-primary" />
                    Availability Calendar
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Day-by-day view of room rates and stock levels
                  </CardDescription>
                </div>
                {/* Month Navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={prevMonth}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="min-w-[140px] text-center text-sm font-semibold text-foreground">
                    {monthLabel}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={nextMonth}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {calendarError && (
                <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{calendarError}</span>
                </div>
              )}
              {calendarLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Legend */}
                  <div className="mb-4 flex flex-wrap gap-3 text-xs">
                    {[
                      { color: "green", label: "Available" },
                      { color: "amber", label: "Low Stock (≤2)" },
                      { color: "red", label: "Sold Out" },
                      { color: "gray", label: "Not Set" },
                    ].map(({ color, label }) => (
                      <div key={color} className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            "size-2.5 rounded-full",
                            STATUS_COLORS[color].dot
                          )}
                        />
                        <span className="text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (d) => (
                        <div
                          key={d}
                          className="py-2 text-center text-xs font-medium text-muted-foreground"
                        >
                          {d}
                        </div>
                      )
                    )}

                    {/* Day Cells */}
                    {daysInMonth.map((day, idx) => {
                      if (!day) {
                        return <div key={`empty-${idx}`} className="h-20" />;
                      }

                      const { date, dateStr, entries } = day;
                      const mainEntry = entries[0];
                      const status = mainEntry?.status || "UNAVAILABLE_NOT_SET";
                      const roomsLeft = mainEntry?.allocation;
                      const price = mainEntry?.price;
                      const color = getAvailabilityColor(status, roomsLeft);
                      const styles = STATUS_COLORS[color];
                      const isToday =
                        formatDateISO(new Date()) === dateStr;

                      return (
                        <Tooltip key={dateStr}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "group relative flex h-20 flex-col items-center justify-center rounded-lg border p-1 transition-all",
                                styles.bg,
                                styles.border,
                                isToday && "ring-1 ring-primary/40",
                                "hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/5"
                              )}
                            >
                              {/* Day number */}
                              <span
                                className={cn(
                                  "text-sm font-semibold",
                                  styles.text,
                                  isToday && "text-primary"
                                )}
                              >
                                {date.getDate()}
                              </span>

                              {/* Price */}
                              {price != null && color !== "gray" && (
                                <span className="mt-0.5 text-[0.65rem] font-medium text-primary/70">
                                  {Math.round(price)}
                                </span>
                              )}

                              {/* Stock */}
                              {roomsLeft != null && color !== "gray" && color !== "red" && (
                                <span
                                  className={cn(
                                    "text-[0.6rem]",
                                    color === "amber"
                                      ? "font-semibold text-amber-400"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {roomsLeft}r
                                </span>
                              )}

                              {/* Status dot */}
                              <div
                                className={cn(
                                  "absolute right-1.5 top-1.5 size-1.5 rounded-full",
                                  styles.dot
                                )}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="border-border bg-popover text-xs"
                          >
                            <p className="font-semibold">{dateStr}</p>
                            {mainEntry ? (
                              <>
                                <p>Status: {status.replace(/_/g, " ")}</p>
                                {price != null && (
                                  <p>Rate: {formatCurrency(price)}</p>
                                )}
                                {roomsLeft != null && (
                                  <p>Rooms: {roomsLeft}</p>
                                )}
                              </>
                            ) : (
                              <p className="text-muted-foreground">
                                No data configured
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Smart Bulk Update Form ── */}
          <Card className="h-fit border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4 text-primary" />
                Smart Bulk Update
              </CardTitle>
              <CardDescription className="text-xs">
                Set rates and allocation for a date range in one action
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Date Range */}
                <div className="space-y-3">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CalendarIcon className="size-3.5" />
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          updateField("startDate", e.target.value)
                        }
                        min={formatDateISO(new Date())}
                        className={cn(
                          "h-9",
                          formErrors.startDate &&
                            "border-destructive ring-destructive/20"
                        )}
                      />
                      {formErrors.startDate && (
                        <p className="text-[0.7rem] text-destructive">
                          {formErrors.startDate}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          updateField("endDate", e.target.value)
                        }
                        min={formData.startDate || formatDateISO(new Date())}
                        className={cn(
                          "h-9",
                          formErrors.endDate &&
                            "border-destructive ring-destructive/20"
                        )}
                      />
                      {formErrors.endDate && (
                        <p className="text-[0.7rem] text-destructive">
                          {formErrors.endDate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Room Type */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <BedDouble className="size-3.5" />
                    Room Type
                  </label>
                  <Select
                    value={formData.roomTypeId}
                    onValueChange={(v) => updateField("roomTypeId", v)}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-9",
                        formErrors.roomTypeId &&
                          "border-destructive ring-destructive/20"
                      )}
                    >
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {metadata.room_types.map((rt) => (
                        <SelectItem key={rt.id} value={String(rt.id)}>
                          {rt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.roomTypeId && (
                    <p className="text-[0.7rem] text-destructive">
                      {formErrors.roomTypeId}
                    </p>
                  )}
                </div>

                {/* Rate Plan Toggles */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Layers className="size-3.5" />
                    Rate Plan
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {RATE_PLANS.map((plan) => (
                      <button
                        key={plan.code}
                        type="button"
                        onClick={() => updateField("ratePlan", plan.code)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                          formData.ratePlan === plan.code
                            ? "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/10"
                            : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                        )}
                      >
                        <span>{plan.icon}</span>
                        {plan.code}
                      </button>
                    ))}
                  </div>
                  {formErrors.ratePlan && (
                    <p className="text-[0.7rem] text-destructive">
                      {formErrors.ratePlan}
                    </p>
                  )}
                </div>

                {/* Price & Allocation */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <DollarSign className="size-3.5" />
                      Price / Night
                      <span className="text-primary">(EGP)</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => updateField("price", e.target.value)}
                      placeholder="0.00"
                      className={cn(
                        "h-9",
                        formErrors.price &&
                          "border-destructive ring-destructive/20"
                      )}
                    />
                    {formErrors.price && (
                      <p className="text-[0.7rem] text-destructive">
                        {formErrors.price}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Hotel className="size-3.5" />
                      Allocation
                      <span className="text-primary">(Rooms)</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.allocation}
                      onChange={(e) =>
                        updateField("allocation", e.target.value)
                      }
                      placeholder="0"
                      className={cn(
                        "h-9",
                        formErrors.allocation &&
                          "border-destructive ring-destructive/20"
                      )}
                    />
                    {formErrors.allocation && (
                      <p className="text-[0.7rem] text-destructive">
                        {formErrors.allocation}
                      </p>
                    )}
                  </div>
                </div>

                {bulkUpdateError && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{bulkUpdateError}</span>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-10 w-full gap-2 font-semibold"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      Apply Bulk Update
                    </>
                  )}
                </Button>

                {/* Quick Info */}
                <div className="rounded-lg border border-border/30 bg-muted/20 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-primary/60" />
                    <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
                      This will update rates and room allocation for every day in
                      the selected range. Existing entries for the same room type
                      and rate plan will be overwritten.
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
