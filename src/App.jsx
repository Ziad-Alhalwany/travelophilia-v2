// src/App.jsx
import { useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";

import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import ChooseYourTripPage from "./pages/ChooseYourTripPage";
import CustomizeYourTripPage from "./pages/CustomizeYourTripPage";
import DestinationPage from "./pages/DestinationPage";
import TripDetailsPage from "./pages/TripDetailsPage";
import TripReservationPage from "./pages/TripReservationPage";
import AfterSubmitPage from "./pages/AfterSubmitPage";

import CRMLoginPage from "./pages/CRMLoginPage";
import CRMLeadsPage from "./pages/CRMLeadsPage";
import { hasAccessToken } from "./services/crmAuth";

function RequireCRMAuth() {
  if (!hasAccessToken()) return <Navigate to="/crm/login" replace />;
  return <Outlet />;
}

function CRMAuthEvents() {
  const navigate = useNavigate();

  useEffect(() => {
    function onLogout() {
      navigate("/crm/login", { replace: true });
    }
    window.addEventListener("tp:crm:logout", onLogout);
    return () => window.removeEventListener("tp:crm:logout", onLogout);
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />

      <main className="site-main">
        <CRMAuthEvents />

        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/choose-your-trip" element={<ChooseYourTripPage />} />
          <Route
            path="/trips"
            element={<Navigate to="/choose-your-trip" replace />}
          />

          {/* ✅ Trip Details */}
          <Route path="/trips/:slug" element={<TripDetailsPage />} />

          <Route
            path="/customize-your-trip"
            element={<CustomizeYourTripPage />}
          />
          <Route path="/destinations/:slug" element={<DestinationPage />} />

          {/* ✅ Reservation */}
          <Route
            path="/reserve/:identifier"
            element={<TripReservationPage />}
          />
          <Route path="/after-submit" element={<AfterSubmitPage />} />

          {/* CRM */}
          <Route path="/crm/login" element={<CRMLoginPage />} />
          <Route element={<RequireCRMAuth />}>
            <Route path="/crm" element={<CRMLeadsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-col">
            <div className="footer-brand">
              <span className="footer-logo-mark">✈️</span>
              <span className="footer-logo-text">Travelophilia</span>
            </div>
            <p className="footer-text">
              Trips crafted by humans, powered by smart tools — starting from
              Egypt and expanding beyond.
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-title">Explore</h4>
            <ul className="footer-links">
              <li>
                <a href="/choose-your-trip" className="footer-link">
                  <span className="footer-link-text">Choose your trip</span>
                </a>
              </li>
              <li>
                <a href="/customize-your-trip" className="footer-link">
                  <span className="footer-link-text">Customize a trip</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-title">Contact</h4>
            <p className="footer-text">
              WhatsApp: +20 10 000 000 000
              <br />
              Instagram: @travelophilia
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-bottom-text">
            © {new Date().getFullYear()} Travelophilia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
