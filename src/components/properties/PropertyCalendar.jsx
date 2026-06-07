// src/components/properties/PropertyCalendar.jsx
// TP-OTA-FE-EXTRANET-003 — Calendar grid with inactive date interceptor + waitlist modal
// Consumes GET /api/properties/search/ response matrix

import { useState, useEffect, useMemo, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import toast from "react-hot-toast";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell, Mail, Loader2, AlertCircle } from "lucide-react";
import { useOtaSearch, useWaitlistSubmit } from "@/hooks/useOtaServices";
import { formatDateISO } from "@/utils/markupHelpers";

// Zod schema for waitlist email
const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

/**
 * PropertyCalendar — Displays availability on a calendar grid.
 * Grays out UNAVAILABLE_NOT_SET dates. Shows waitlist modal on click.
 *
 * Props:
 * @param {number} propertyId — Property ID for waitlist submissions
 * @param {string} propertyName — Display name
 * @param {Array} availability — Array of { date, status, roomsLeft, price } from search results
 * @param {string} [className]
 */
export default function PropertyCalendar({
  propertyId,
  propertyName = "",
  availability = [],
  roomTypeId,
  className,
}) {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Live custom hook bindings
  const {
    loading: searchLoading,
    error: searchError,
    data: searchData,
    execute: runSearch,
    abort: abortSearch,
  } = useOtaSearch();

  const {
    loading: submitting,
    error: waitlistError,
    execute: runWaitlistSubmit,
  } = useWaitlistSubmit();

  // Trigger search on mount or propertyId change
  useEffect(() => {
    if (propertyId) {
      runSearch({ accommodationId: Number(propertyId) });
    }
    return () => {
      abortSearch();
    };
  }, [propertyId, runSearch, abortSearch]);

  // Aggregate active availability from search results or prop fallback
  const activeAvailability = useMemo(() => {
    if (!searchData) {
      return availability || [];
    }
    if (searchData.status === "UNAVAILABLE_NOT_SET") {
      return [];
    }
    if (Array.isArray(searchData)) {
      const dateMap = {};
      searchData.forEach((roomType) => {
        if (Array.isArray(roomType.dailyBreakdown)) {
          roomType.dailyBreakdown.forEach((day) => {
            const dateStr = day.date;
            const rooms = day.roomsAvailable;
            const price = day.pricePerNight;

            if (!dateMap[dateStr]) {
              dateMap[dateStr] = {
                date: dateStr,
                roomsLeft: rooms,
                price: price,
                status: rooms === 0 ? "UNAVAILABLE_SOLD_OUT" : "AVAILABLE",
              };
            } else {
              dateMap[dateStr].roomsLeft = Math.max(dateMap[dateStr].roomsLeft, rooms);
              dateMap[dateStr].price = Math.min(dateMap[dateStr].price, price);
              if (dateMap[dateStr].roomsLeft > 0) {
                dateMap[dateStr].status = "AVAILABLE";
              } else {
                dateMap[dateStr].status = "UNAVAILABLE_SOLD_OUT";
              }
            }
          });
        }
      });
      return Object.values(dateMap);
    }
    return [];
  }, [searchData, availability]);

  // Build a map of date -> status for quick lookup
  const dateStatusMap = useMemo(() => {
    const map = new Map();
    activeAvailability.forEach((item) => {
      let status = item.status;
      const roomsLeft = item.roomsLeft ?? item.rooms_left ?? item.allocation;
      
      // Explicitly categorize state cells
      if (roomsLeft === 0 || status === "UNAVAILABLE_SOLD_OUT" || status === "SOLD_OUT") {
        status = "SOLD_OUT";
      } else if (roomsLeft != null && roomsLeft <= 2) {
        status = "Low Stock";
      } else if (status === "UNAVAILABLE_NOT_SET" || status === "NOT_SET") {
        status = "UNAVAILABLE_NOT_SET";
      } else {
        status = "AVAILABLE";
      }

      map.set(item.date, {
        status,
        roomsLeft,
        price: item.price ?? item.pricePerNight,
      });
    });
    return map;
  }, [activeAvailability]);

  // Dates that are UNAVAILABLE_NOT_SET — grayed out
  const unavailableNotSetDates = useMemo(() => {
    const dates = [];
    dateStatusMap.forEach((val, dateStr) => {
      if (val.status === "UNAVAILABLE_NOT_SET") {
        dates.push(new Date(dateStr + "T00:00:00"));
      }
    });
    return dates;
  }, [dateStatusMap]);

  // Dates that are SOLD_OUT — red
  const soldOutDates = useMemo(() => {
    const dates = [];
    dateStatusMap.forEach((val, dateStr) => {
      if (val.status === "SOLD_OUT") {
        dates.push(new Date(dateStr + "T00:00:00"));
      }
    });
    return dates;
  }, [dateStatusMap]);

  // Handle day click — intercept UNAVAILABLE_NOT_SET to show waitlist modal
  const handleDayClick = useCallback(
    (day) => {
      const dateStr = formatDateISO(day);
      const info = dateStatusMap.get(dateStr);
      const status = info?.status || "UNAVAILABLE_NOT_SET";

      if (status === "UNAVAILABLE_NOT_SET") {
        setSelectedDate(dateStr);
        setEmail("");
        setEmailError("");
        setWaitlistOpen(true);
      }
    },
    [dateStatusMap]
  );

  // Submit waitlist
  async function handleWaitlistSubmit(e) {
    e.preventDefault();
    setEmailError("");

    const result = waitlistSchema.safeParse({ email });
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message || "Invalid email");
      return;
    }

    try {
      const targetRoomTypeId = Number(roomTypeId || searchData?.[0]?.roomTypeId || 1);
      await runWaitlistSubmit({
        accommodationId: Number(propertyId),
        roomTypeId: targetRoomTypeId,
        requestedDate: selectedDate,
        userEmail: email,
      });

      toast.success("You'll be notified when availability opens!", {
        icon: "🔔",
        style: {
          background: "hsl(205 37% 10%)",
          color: "hsl(210 20% 92%)",
          border: "1px solid hsl(210 15% 18%)",
        },
      });
      setWaitlistOpen(false);
      setEmail("");
    } catch (err) {
      toast.error(err?.message || "Failed to submit. Please try again.", {
        style: {
          background: "hsl(205 37% 10%)",
          color: "hsl(210 20% 92%)",
          border: "1px solid hsl(351 100% 71% / 0.3)",
        },
      });
    }
  }

  // Custom day content renderer
  function renderDayContent(day) {
    const dateStr = formatDateISO(day.date);
    const info = dateStatusMap.get(dateStr);

    if (!info) {
      return (
        <div className="relative flex size-full flex-col items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground/40">
            {day.date.getDate()}
          </span>
        </div>
      );
    }

    const isNotSet = info.status === "UNAVAILABLE_NOT_SET";
    const isSoldOut = info.status === "SOLD_OUT";
    const isLowStock = info.status === "Low Stock";

    return (
      <div className="relative flex size-full flex-col items-center justify-center">
        <span
          className={cn(
            "text-sm font-medium",
            isNotSet && "text-muted-foreground/40",
            isSoldOut && "text-destructive/70 line-through",
            isLowStock && "text-amber-400"
          )}
        >
          {day.date.getDate()}
        </span>
        {info.price != null && !isNotSet && !isSoldOut && (
          <span className="text-[0.6rem] leading-none text-primary/70">
            {Math.round(info.price)}
          </span>
        )}
        {isLowStock && (
          <span className="text-[0.55rem] leading-none text-amber-400/80">
            {info.roomsLeft} left
          </span>
        )}
      </div>
    );
  }

  // Modifiers for day styling
  const modifiers = {
    unavailableNotSet: unavailableNotSetDates,
    soldOut: soldOutDates,
  };

  const modifiersClassNames = {
    unavailableNotSet: "opacity-30 cursor-pointer hover:opacity-50 transition-opacity",
    soldOut: "opacity-50 cursor-not-allowed",
  };

  return (
    <div className={cn("w-full", className)}>
      {searchError && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}
      
      {searchLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <DayPicker
          mode="single"
          showOutsideDays={false}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          onDayClick={handleDayClick}
          components={{
            DayContent: renderDayContent,
          }}
          classNames={{
            months: "flex flex-col sm:flex-row gap-4",
            month: "flex flex-col gap-2",
            caption: "flex justify-center relative items-center h-10",
            caption_label: "text-sm font-semibold text-foreground",
            nav: "flex items-center gap-1",
            nav_button: cn(
              "inline-flex size-8 items-center justify-center rounded-lg border border-input bg-transparent p-0 text-sm transition-colors",
              "hover:bg-muted hover:text-foreground"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "w-10 text-center text-xs font-medium text-muted-foreground",
            row: "flex w-full mt-1",
            cell: cn(
              "relative size-10 p-0 text-center text-sm",
              "focus-within:relative focus-within:z-20"
            ),
            day: cn(
              "flex size-10 items-center justify-center rounded-lg p-0 text-sm transition-colors",
              "hover:bg-muted/60 aria-selected:bg-primary aria-selected:text-primary-foreground"
            ),
            day_today: "ring-1 ring-primary/40",
            day_outside: "text-muted-foreground/30",
            day_disabled: "text-muted-foreground/20",
          }}
        />
      )}

      {/* Waitlist Modal */}
      <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Bell className="size-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-lg text-foreground">
              Notify me when it&apos;s available
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              {propertyName && (
                <span className="font-medium text-foreground">{propertyName}</span>
              )}
              {selectedDate && (
                <span className="block text-sm">
                  Date: {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
              <span className="mt-1 block">
                We&apos;ll send you an email as soon as rooms become available.
              </span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWaitlistSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  placeholder="your@email.com"
                  className={cn(
                    "h-11 pl-10",
                    emailError && "border-destructive ring-destructive/20"
                  )}
                  autoFocus
                />
              </div>
              {emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
              {waitlistError && (
                <p className="text-xs text-destructive">{waitlistError}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full gap-2 font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Bell className="size-4" />
                  Notify Me
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
