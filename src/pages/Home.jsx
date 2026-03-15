import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import apiClient from "@/services/apiClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { TripCard } from "@/components/shared/TripCard";

export default function Home() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await apiClient.getTrips();
        const tripsData = Array.isArray(response.data) ? response.data : response.data.results || [];
        setTrips(tripsData);
      } catch (err) {
        setError("Failed to load destinations. Please try again later.");
        console.error("Error fetching trips:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  return (
    <div className="pt-2 sm:pt-6">
      {/* Hero Section */}
      <section className="mb-16 sm:mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
          <div className="max-w-[560px]">
            <span className="inline-block text-xs tracking-[0.16em] uppercase text-accent-strong mb-3 font-medium">
              Curated Experiences
            </span>
            <h1 className="text-4xl sm:text-[2.6rem] leading-[1.1] mb-5 font-bold tracking-tight">
              Discover the World's Best Kept Secrets.
            </h1>
            <p className="text-text-muted mb-8 text-base sm:text-lg leading-relaxed max-w-[90%]">
              We design premium, hand-crafted journeys for the modern explorer. Experience authentic cultures without compromising on luxury.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <Button size="lg" className="rounded-full bg-gradient-to-br from-primary to-[#00d8c0] text-primary-foreground font-bold border-none shadow-[0_14px_32px_hsl(var(--primary)/0.4)] hover:-translate-y-[1px] hover:shadow-[0_16px_36px_hsl(var(--primary)/0.55)] transition-all">
                Explore Destinations
              </Button>
              <Button size="lg" variant="outline" className="rounded-full border-white/15 bg-transparent text-foreground hover:bg-white/5 hover:border-white/30 transition-all">
                View Travel Styles
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-3">
               <span className="px-3 py-1.5 rounded-full bg-secondary border border-border text-xs text-muted-foreground">High-End Stays</span>
               <span className="px-3 py-1.5 rounded-full bg-secondary border border-border text-xs text-muted-foreground">Local Experts</span>
               <span className="px-3 py-1.5 rounded-full bg-secondary border border-border text-xs text-muted-foreground">Small Groups</span>
            </div>
          </div>
          
          <div className="flex justify-end lg:justify-end justify-center w-full">
            <Card className="w-full max-w-[340px] p-6 rounded-3xl bg-[radial-gradient(circle_at_top,#193447_0,#0a1218_55%)] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] xl:translate-x-4 relative before:absolute before:inset-0 before:w-full before:h-full before:rounded-3xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none">
              <CardHeader className="p-0 mb-3">
                <span className="text-xs uppercase tracking-[0.14em] text-accent-strong mb-1.5 block font-semibold">Featured</span>
                <h3 className="text-xl font-bold">Egyptian Wonders</h3>
              </CardHeader>
              <CardContent className="p-0 mb-6">
                <ul className="space-y-2 text-sm text-muted-foreground list-none">
                   <li className="flex gap-2 items-center"><span className="w-1.5 h-1.5 rounded-full bg-accent-strong"></span> Private Nile Cruise</li>
                   <li className="flex gap-2 items-center"><span className="w-1.5 h-1.5 rounded-full bg-accent-strong"></span> VIP Pyramids Access</li>
                   <li className="flex gap-2 items-center"><span className="w-1.5 h-1.5 rounded-full bg-accent-strong"></span> 5-Star Accommodations</li>
                </ul>
              </CardContent>
              <CardFooter className="p-0 pt-4 border-t border-white/10 flex justify-between items-center">
                 <span className="text-xs text-muted-foreground">Starts at <strong className="text-foreground text-sm inline-block ml-1">$1,899</strong></span>
                 <ArrowRight size={16} className="text-accent-strong" />
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Trips Section */}
      <section>
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Upcoming Journeys</h2>
          <p className="text-muted-foreground text-sm">Hand-picked experiences across the globe.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((skeleton) => (
              <div key={skeleton} className="h-[380px] rounded-2xl bg-secondary animate-pulse border border-border" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-center">
            {error}
          </div>
        ) : trips.length === 0 ? (
          <div className="p-10 rounded-2xl bg-secondary border border-border text-center text-muted-foreground">
            No trips available currently.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <TripCard
                key={trip.id || trip.slug}
                slug={trip.slug}
                title={trip.title}
                description={trip.shortDescription || trip.description}
                destination={trip.destination}
                durationDays={trip.durationDays}
                maxCapacity={trip.maxCapacity}
                pricePerPerson={trip.pricePerPerson}
                coverImage={trip.coverImage}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
