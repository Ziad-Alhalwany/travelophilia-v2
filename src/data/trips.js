// src/data/trips.js
export const trips = [
  {
    slug: "ain-sokhna-dayuse-2026-01-10",
    type: "DAYUSE",
    title: "Day-use escape — Ain Sokhna",
    destinationCity: "Ain Sokhna",
    availableDate: "2026-01-10",
    departureOptions: ["Cairo", "Mansoura"],
    durationLabel: "Day-use",
    priceEGP: 1499,
    seatsLeft: 18,
    tags: ["beach", "pool", "friends"],
    shortDescription:
      "Transport options, beach & pool access, and optional add-ons.",
  },
  {
    slug: "alex-dayuse-2026-01-18",
    type: "DAYUSE",
    title: "Day-use — Alexandria",
    destinationCity: "Alexandria",
    availableDate: "2026-01-18",
    departureOptions: ["Cairo", "Mansoura"],
    durationLabel: "Day-use",
    priceEGP: 1090,
    seatsLeft: 22,
    tags: ["sea", "city-walk"],
    shortDescription: "A relaxed day plan with flexible departure options.",
  },
  {
    slug: "dahab-5n-2026-02-14",
    type: "ACCOMMODATION",
    title: "Dahab — 5 nights package",
    destinationCity: "Dahab",
    startDate: "2026-02-14",
    nights: 5,
    durationLabel: "5 nights",
    priceEGP: 8990,
    seatsLeft: 12,
    tags: ["snorkeling", "budget", "chill"],
    shortDescription:
      "Curated stay + suggested activities. Great for friends & couples.",
  },
  {
    slug: "siwa-3n-2026-02-20",
    type: "ACCOMMODATION",
    title: "Siwa — 3 nights experience",
    destinationCity: "Siwa",
    startDate: "2026-02-20",
    nights: 3,
    durationLabel: "3 nights",
    priceEGP: 7450,
    seatsLeft: 9,
    tags: ["desert", "adventure", "nature"],
    shortDescription:
      "A compact escape with highlights and flexible room options.",
  },
];

export const TRIP_TYPES = {
  DAYUSE: "DAYUSE",
  ACCOMMODATION: "ACCOMMODATION",
};

export function findTripBySlug(slug) {
  return trips.find((t) => t.slug === slug);
}
