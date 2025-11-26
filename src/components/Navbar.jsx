// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <span className="brand">Travelophilia</span>
      </div>

      <nav className="navbar-center">
        <Link to="/">Home</Link>
        <Link to="/about">About Us</Link>
        <Link to="/support-team">Support Team</Link>
        <Link to="/work-with-us">Work With Us</Link>
        <Link to="/ticket-flight">Ticket Flight</Link>
        <Link to="/choose-your-trip">Choose Your Trip</Link>
        <Link to="/customize-your-trip">Customize Your Trip</Link>
        <Link to="/transportation">Transportation</Link>
        <Link to="/activities">Activities</Link>
        <Link to="/visa">Visa & Others</Link>
      </nav>

      <div className="navbar-right">
        {/* مكان زرار اللغة + العملة + Login/Signup بعدين */}
        <button className="nav-btn-outline">Sign in</button>
        <button className="nav-btn-primary">Join</button>
      </div>
    </header>
  );
};

export default Navbar;
