// src/pages/HomePage.jsx
import React from "react";

/**
 * Home Page
 * - Hero section (brand positioning)
 * - Quick view of main service categories
 */

const HomePage = () => {
  return (
    <div>
      {/* HERO SECTION */}
      <section className="hero">
        <div>
          <h1 className="hero-title">
            Travel like a{" "}
            <span className="hero-gradient">local</span>,  
            plan like a <span className="hero-gradient">pro</span>.
          </h1>

          <p className="hero-subtitle">
            Travelophilia helps you design, book, and manage trips across Egypt and beyond —
            curated stays, authentic activities, and smart transportation in one place.
          </p>

          <div className="hero-badges">
            <span className="hero-badge">Egypt · Middle East · Coming Worldwide</span>
            <span className="hero-badge">Solo · Family · Groups · Corporate</span>
          </div>

          <div className="hero-actions">
            <button className="hero-cta-primary">
              Choose your trip
            </button>
            <button className="hero-cta-secondary">
              Customize your trip
            </button>
          </div>

          <div className="hero-meta">
            Real humans behind every trip · Multi-language · Multi-currency
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-right-title">Start from what matters to you:</div>
          <div className="hero-right-grid">
            <div className="hero-pill">Weekends from Cairo</div>
            <div className="hero-pill">Red Sea escapes</div>
            <div className="hero-pill">Budget-friendly hostels</div>
            <div className="hero-pill">Premium family stays</div>
            <div className="hero-pill">Transportation only</div>
            <div className="hero-pill">Activities & experiences</div>
          </div>
        </div>
      </section>

      {/* QUICK SECTIONS */}
      <section className="section">
        <h2 className="section-title">Main Services</h2>
        <div className="card-grid">
          <div className="card">
            <div className="card-title">Trips & Packages</div>
            <div className="card-sub">Curated itineraries for Solo, Families, Couples, and Groups.</div>
          </div>
          <div className="card">
            <div className="card-title">Stays & Properties</div>
            <div className="card-sub">Hotels, camps, hostels, chalets, and apartments.</div>
          </div>
          <div className="card">
            <div className="card-title">Transportation</div>
            <div className="card-sub">Private cars, shuttles, Nile cruise, city-to-city transfers.</div>
          </div>
          <div className="card">
            <div className="card-title">Activities</div>
            <div className="card-sub">Diving, safari, cultural tours, experiences & more.</div>
          </div>
          <div className="card">
            <div className="card-title">Flight tickets</div>
            <div className="card-sub">Ticket support and flight coordination for your trips.</div>
          </div>
          <div className="card">
            <div className="card-title">Visa & Others</div>
            <div className="card-sub">Visa guidance, documents, and extra services.</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
