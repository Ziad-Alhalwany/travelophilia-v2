// src/components/Navbar.jsx
import React from "react";
import { Link, NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="site-header">
      <div className="nav-container">
        {/* Logo / Brand */}
        <Link to="/" className="nav-logo">
          <span className="nav-logo-mark">✈️</span>
          <span className="nav-logo-text">
            <span className="nav-logo-main">Travelophilia</span>
            <span className="nav-logo-sub">Trips for humans, not tourists</span>
          </span>
        </Link>

        {/* Main navigation */}
        <nav className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/choose-your-trip"
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            🧳 Trips
          </NavLink>

          <NavLink
            to="/customize-your-trip"
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            🛠 Customize
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            ℹ️ About
          </NavLink>
        </nav>

        {/* Right side actions */}
        <div className="nav-actions">
          <a
            href="https://wa.me/201000000000"
            target="_blank"
            rel="noreferrer"
            className="nav-icon-btn"
          >
            💬 <span className="nav-icon-label">WhatsApp</span>
          </a>

          <Link to="/customize-your-trip" className="btn-nav-primary">
            Start a trip
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
