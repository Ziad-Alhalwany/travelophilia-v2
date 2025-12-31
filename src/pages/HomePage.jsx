// src/pages/HomePage.jsx
import React from "react";
import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-left">
            <p className="hero-kicker">Travelophilia · Egypt & beyond</p>
            <h1 className="hero-title">
              Trips crafted by humans,
              <br />
              powered by smart tools.
            </h1>
            <p className="hero-subtitle">
              Day-use escapes, custom trips, and curated experiences for
              students, young professionals, and couples who want something
              more than a generic package.
            </p>

            <div className="hero-cta-row">
              <Link to="/customize-your-trip" className="btn-primary">
                Customize your trip
              </Link>
              <Link to="/choose-your-trip" className="btn-ghost">
                Browse ready-made trips
              </Link>
            </div>

            <div className="hero-badges">
              <span className="badge-soft">
                Egypt-based team · Arabic & English support
              </span>
              <span className="badge-soft">
                Perfect for students, couples & small groups
              </span>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-card">
              <p className="hero-card-tag">Sample idea</p>
              <h3 className="hero-card-title">
                Day-use escape — Ain Sokhna
              </h3>
              <ul className="hero-card-list">
                <li>Private or shared transport from Cairo</li>
                <li>Pool & beach access in a selected resort</li>
                <li>Optional add-ons: activities, photoshoot, cake</li>
              </ul>
              <p className="hero-card-meta">
                This is just a demo card. Real trips will be loaded from the
                trips database later.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <header className="home-section-header">
          <h2>Where do you want to start?</h2>
          <p>
            Different paths depending on whether you already know your
            destination or just your budget and vibe.
          </p>
        </header>

        <div className="home-grid">
          <Link to="/choose-your-trip" className="home-card">
            <h3>Choose your trip</h3>
            <p>
              Browse a curated list of trips and day-use options. Later this
              will connect to the real /api/trips endpoint.
            </p>
          </Link>

          <Link to="/customize-your-trip" className="home-card">
            <h3>Customize from scratch</h3>
            <p>
              You tell us your dates, budget, and preferences. We come back
              with a tailored plan.
            </p>
          </Link>

          <Link to="/work-with-us" className="home-card">
            <h3>Work with Travelophilia</h3>
            <p>
              For partners, vendors, and local guides who want to collaborate
              on future experiences.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
