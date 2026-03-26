import { Link } from "react-router-dom";
import { MapPin, Calendar, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

/**
 * TripCard — reusable card for displaying a trip summary.
 *
 * @param {object}  props
 * @param {string}  props.slug            – URL-safe identifier
 * @param {string}  props.title           – trip headline
 * @param {string}  [props.description]   – short blurb
 * @param {string}  [props.destination]   – destination label (badge)
 * @param {number}  [props.durationDays]  – trip length
 * @param {number}  [props.maxCapacity]   – max group size
 * @param {number}  [props.pricePerPerson]
 * @param {string}  [props.coverImage]    – optional image URL
 */
export function TripCard({
  slug,
  title,
  description,
  destination,
  durationDays,
  maxCapacity,
  pricePerPerson,
  coverImage,
}) {
  return (
    <Link to={`/destinations/${slug}`} className="group block h-full">
      <Card className="bg-card text-card-foreground border-border overflow-hidden flex flex-col h-full rounded-2xl hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-all duration-300">
        {/* Image / Placeholder */}
        <div className="aspect-video w-full bg-secondary relative overflow-hidden group-hover:after:opacity-0 after:absolute after:inset-0 after:bg-black/20 after:transition-opacity">
          {coverImage ? (
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:scale-105 transition-transform duration-500">
              <span className="text-4xl">🌍</span>
            </div>
          )}

          <div className="absolute top-3 left-3 bg-background/80 backdrop-blur border border-border text-foreground text-[10px] font-bold px-2 py-1 rounded-full tracking-wide uppercase">
            {destination || "Global"}
          </div>
        </div>

        <CardContent className="p-5 flex flex-col flex-1">
          <h3 className="text-lg font-bold mb-2 leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground text-xs line-clamp-2 mb-4 leading-relaxed flex-1">
            {description || "An immersive journey into beautiful landscapes and cultures."}
          </p>
        </CardContent>

        <CardFooter className="px-5 pb-5 pt-0 mt-auto">
          <div className="grid grid-cols-2 gap-y-2 text-[11px] text-muted-foreground w-full pt-4 border-t border-border">
            {durationDays != null && (
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-primary/80" />
                <span>{durationDays} Days</span>
              </div>
            )}
            {maxCapacity != null && (
              <div className="flex items-center gap-1.5">
                <Users size={13} className="text-primary/80" />
                <span>Max {maxCapacity}</span>
              </div>
            )}
            {pricePerPerson != null && (
              <div className="flex items-center gap-1.5 col-span-2 mt-1">
                <MapPin size={13} className="text-primary/80" />
                <span className="text-foreground/90 font-medium">
                  Starts at ${pricePerPerson}
                </span>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
