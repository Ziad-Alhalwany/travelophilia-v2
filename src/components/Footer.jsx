// src/components/Footer.jsx
import React from "react";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <h3>Travelophilia</h3>
          <p>Curated trips, real experiences, and local insights.</p>
        </div>
        <div>
          <h4>Contact</h4>
          <p>Email: support@travelophilia.com</p>
          <p>WhatsApp: +20 000 000 0000</p>
        </div>
        <div>
          <h4>Social</h4>
          <p>Instagram · TikTok · Facebook · YouTube</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Travelophilia. All rights reserved.</span>
      </div>
    </footer>
  );
};

export default Footer;
