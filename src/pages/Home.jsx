import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, AlertTriangle } from "lucide-react";
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
        const data = await apiClient.getTrips();
        const tripsData = Array.isArray(data) ? data : data?.results || [];
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
      <section className="mb-16 sm:mb-24 min-h-[80vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="max-w-[560px]">
            <span className="inline-block text-xs tracking-[0.16em] uppercase text-accent-strong mb-3 font-medium">
              Curated Experiences
            </span>
            <h1 className="text-4xl sm:text-[2.6rem] leading-[1.1] mb-5 font-bold tracking-tight bg-gradient-to-r from-foreground via-primary to-[#00d8c0] bg-clip-text text-transparent">
              Discover the World's Best Kept Secrets.
            </h1>
            <p className="text-muted-foreground mb-8 text-base sm:text-lg leading-relaxed max-w-[90%]">
              We design premium, hand-crafted journeys for the modern explorer. Experience authentic cultures without compromising on luxury.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <Button asChild size="lg" className="rounded-full bg-gradient-to-br from-primary to-[#00d8c0] text-primary-foreground font-bold border-none shadow-[0_14px_32px_hsl(var(--primary)/0.4)] hover:-translate-y-[1px] hover:shadow-[0_16px_36px_hsl(var(--primary)/0.55)] transition-all">
                <Link to="/choose-your-trip">Explore Destinations</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-white/15 bg-transparent text-foreground hover:bg-white/5 hover:border-white/30 transition-all">
                <Link to="/customize-your-trip">Customize Your Trip</Link>
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2.5">
               <Button variant="outline" size="sm" className="rounded-full border-border bg-secondary/60 text-muted-foreground text-xs cursor-default hover:bg-secondary/80 h-auto py-1.5 px-3">High-End Stays</Button>
               <Button variant="outline" size="sm" className="rounded-full border-border bg-secondary/60 text-muted-foreground text-xs cursor-default hover:bg-secondary/80 h-auto py-1.5 px-3">Local Experts</Button>
               <Button variant="outline" size="sm" className="rounded-full border-border bg-secondary/60 text-muted-foreground text-xs cursor-default hover:bg-secondary/80 h-auto py-1.5 px-3">Small Groups</Button>
            </div>
          </div>
          
          <div className="flex justify-end lg:justify-end justify-center w-full">
            <Card className="w-full max-w-[340px] p-6 rounded-3xl bg-card text-card-foreground border-border shadow-2xl xl:translate-x-4 relative">
              <CardHeader className="p-0 mb-3">
                <span className="text-xs uppercase tracking-[0.14em] text-primary mb-1.5 block font-semibold">Featured</span>
                <h3 className="text-xl font-bold">Egyptian Wonders</h3>
              </CardHeader>
              <CardContent className="p-0 mb-6">
                <ul className="space-y-2 text-sm text-muted-foreground list-none">
                   <li className="flex gap-2 items-center"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Private Nile Cruise</li>
                   <li className="flex gap-2 items-center"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> VIP Pyramids Access</li>
                   <li className="flex gap-2 items-center"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> 5-Star Accommodations</li>
                </ul>
              </CardContent>
              <CardFooter className="p-0 pt-4 border-t border-border flex justify-between items-center">
                 <span className="text-xs text-muted-foreground">Starts at <strong className="text-foreground text-sm inline-block ml-1">$1,899</strong></span>
                 <ArrowRight size={16} className="text-primary" />
              </CardFooter>
            </Card>
          </div>
        </div>
        </div>
      </section>

      {/* Trips Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
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
          <div role="alert" className="flex items-start gap-4 p-5 rounded-2xl bg-destructive/5 border border-destructive/20 text-sm">
            <AlertTriangle size={20} className="text-destructive shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-destructive mb-1">Unable to load destinations</h4>
              <p className="text-muted-foreground text-xs leading-relaxed">{error}</p>
            </div>
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
