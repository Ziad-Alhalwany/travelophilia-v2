import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Calendar, Users, CheckCircle, ArrowLeft } from "lucide-react";
import apiClient from "@/services/apiClient";
import { TripRequestForm } from "@/components/forms/TripRequestForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function TripDetails() {
  const { slug } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await apiClient.getTripBySlug(slug);
        setTrip(response.data);
      } catch (err) {
        setError("Failed to load trip details. It might have been removed or the link is incorrect.");
        console.error("Error fetching trip details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-6 sm:pt-10 max-w-[1040px] mx-auto animate-pulse">
        <div className="h-4 w-24 bg-white/10 rounded mb-8"></div>
        <div className="h-10 w-3/4 max-w-lg bg-white/10 rounded-lg mb-4"></div>
        <div className="h-6 w-1/2 bg-white/10 rounded mb-10"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
          <div className="h-[400px] bg-white/5 rounded-3xl"></div>
          <div className="h-[500px] bg-white/5 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="pt-20 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive-foreground flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">!</span>
        </div>
        <h2 className="text-2xl font-bold mb-4">Trip Not Found</h2>
        <p className="text-muted-foreground mb-8">{error || "The destination you are looking for does not exist."}</p>
        <Button asChild className="rounded-full bg-white/10 hover:bg-white/20 text-white">
          <Link to="/">Browse All Destinations</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-2 sm:pt-8 pb-10">
      <Link to="/" className="inline-flex items-center text-sm text-text-muted hover:text-white mb-8 transition-colors">
        <ArrowLeft size={16} className="mr-1.5" />
        Back to Destinations
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 xl:gap-16 items-start">
        
        {/* Left Col: Details */}
        <div>
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-secondary border border-border rounded-full text-[11px] font-bold uppercase tracking-wider text-accent-strong mb-4">
              {trip.destination || "Global"}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-[1.15]">{trip.title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {trip.description || trip.shortDescription || "Experience an unforgettable journey customized for the modern explorer."}
            </p>
          </div>

          <Card className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-2xl bg-secondary border-border mb-10">
            <CardContent className="p-5 col-span-full grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Duration</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar size={15} className="text-primary" />
                  <span>{trip.durationDays} Days</span>
                </div>
              </div>
              
              {trip.maxCapacity && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Group Size</span>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Users size={15} className="text-primary" />
                    <span>Max {trip.maxCapacity}</span>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
                <div className="flex items-center gap-1.5 font-medium text-foreground/90">
                  <span className={`w-2 h-2 rounded-full ${trip.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  <span className="capitalize">{trip.status || 'Active'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Starts From</span>
                <div className="flex items-center gap-1.5 font-medium text-primary text-lg">
                  ${trip.pricePerPerson}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="prose prose-invert max-w-none prose-p:text-text-muted prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-white">
            <h3 className="text-xl font-bold mb-4">The Experience</h3>
            <p className="mb-6">
              Dive deep into the heart of {trip.destination || "this destination"} with a curated itinerary that balances iconic sights with hidden gems. Every detail is handled by our expert team.
            </p>
            
            <h4 className="text-lg font-bold mb-3 mt-8">What's Included</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {[
                "Luxury Accommodations",
                "Private Expert Guides",
                "VIP Airport Transfers",
                "Curated Dining Experiences",
                "All Domestic Transportation",
                "24/7 Concierge Support"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-text-muted text-sm">
                  <CheckCircle size={16} className="text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Col: Request Form */}
        <div className="lg:sticky lg:top-24">
          <TripRequestForm tripSlug={trip.slug} tripTitle={trip.title} />
        </div>

      </div>
    </div>
  );
}
