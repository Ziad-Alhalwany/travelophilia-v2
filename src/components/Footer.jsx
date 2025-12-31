// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Column 1 – Brand */}
        <div className="footer-col">
          <div className="footer-brand">
            <span className="footer-logo-mark">✈️</span>
            <span className="footer-logo-text">Travelophilia</span>
          </div>
          <p className="footer-text">
            Day-use escapes, custom trips, and curated experiences crafted for
            students, young professionals, and couples.
          </p>
        </div>

        {/* Column 2 – Links */}
        <div className="footer-col">
          <h4 className="footer-title">Explore</h4>
          <ul className="footer-links">
            <li>
              <Link to="/" className="footer-link">
                🏠 Home
              </Link>
            </li>
            <li>
              <Link to="/choose-your-trip" className="footer-link">
                🧳 Choose your trip
              </Link>
            </li>
            <li>
              <Link to="/customize-your-trip" className="footer-link">
                🛠 Customize your trip
              </Link>
            </li>
            <li>
              <Link to="/work-with-us" className="footer-link">
                🤝 Work with us
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3 – Contact / Social */}
        <div className="footer-col">
          <h4 className="footer-title">Contact</h4>
          <ul className="footer-links">
            <li className="footer-link-text">
              📍 Cairo / Egypt (online-first)
            </li>
            <li className="footer-link-text">Support in Arabic & English</li>
            <li>
              <a
                href="mailto:hello@travelophilia.com"
                className="footer-link"
              >
                📧 hello@travelophilia.com
              </a>
            </li>
          </ul>

          <div className="footer-social">
            <a
              href="#"
              className="footer-social-link"
              aria-label="Instagram"
            >
              📸
            </a>
            <a href="#" className="footer-social-link" aria-label="TikTok">
              🎬
            </a>
            <a href="#" className="footer-social-link" aria-label="WhatsApp">
              💬
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-bottom-text">
          © {year} Travelophilia. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
