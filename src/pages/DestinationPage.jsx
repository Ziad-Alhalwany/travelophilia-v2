// src/pages/DestinationPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getTrips } from "../services/apiClient";

function DestinationPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState({
    loading: true,
    error: "",
    trip: null,
  });

  useEffect(() => {
    async function loadTrip() {
      setState({ loading: true, error: "", trip: null });

      try {
        const data = await getTrips();

        const tripsArray = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        // ندوّر على التريب حسب الـ slug أو الـ id
        const found = tripsArray.find((t) => {
          if (!t) return false;

          const tSlug = t.slug?.toString().toLowerCase();
          const tId = t.id?.toString().toLowerCase();
          const param = slug?.toString().toLowerCase();

          return tSlug === param || tId === param;
        });

        if (!found) {
          setState({
            loading: false,
            error: "We couldn't find this trip. It might be removed or not added yet.",
            trip: null,
          });
          return;
        }

        setState({
          loading: false,
          error: "",
          trip: found,
        });
      } catch (err) {
        console.error("Error loading trip:", err);
        setState({
          loading: false,
          error: "Could not load trip details.",
          trip: null,
        });
      }
    }

    loadTrip();
  }, [slug]);

  const { loading, error, trip } = state;

  // لو لسه بيحمّل
  if (loading) {
    return (
      <div className="page trip-page">
        <p className="page-info">Loading trip details...</p>
      </div>
    );
  }

  // لو حصل خطأ أو مفيش تريب
  if (error || !trip) {
    return (
      <div className="page trip-page">
        <p className="page-error">{error || "Trip not found."}</p>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => navigate("/choose-your-trip")}
        >
          ← Back to trips
        </button>
      </div>
    );
  }

  // شوية قيم مشتقة بشكل لطيف
  const nights = trip.durationNights;
  const location = trip.location || "Egypt";
  const priceFrom = trip.priceFrom;
  const priceTo = trip.priceTo;
  const currency = trip.currency || "EGP";
  const tags = Array.isArray(trip.tags) ? trip.tags : [];

  // sections لو موجودة في الداتا
  const sections = trip.sections || {};
  const overviewText =
    sections.overview || trip.overview || trip.description || "";

  const includedList =
    Array.isArray(sections.included) ? sections.included : [];

  const customizeText =
    sections.customize ||
    "Tell us your dates, budget, and preferences — we’ll adjust this trip to match your Travelophilia vibes.";

  return (
    <div className="page trip-page">
      {/* ===== HERO CARD ===== */}
      <section className="trip-hero-card">
        <div className="trip-hero-main">
          <p className="trip-hero-label">Travelophilia · Trip detail</p>
          <h1 className="trip-hero-title">{trip.name}</h1>
          <p className="trip-hero-location">{location}</p>

          <div className="trip-hero-meta">
            {nights && (
              <div className="trip-hero-meta-item">
                <span className="trip-hero-meta-label">Duration</span>
                <span className="trip-hero-meta-value">
                  {nights} night{nights > 1 ? "s" : ""} /{" "}
                  {nights + 1} day{nights + 1 > 1 ? "s" : ""}
                </span>
              </div>
            )}

            {(priceFrom || priceTo) && (
              <div className="trip-hero-meta-item">
                <span className="trip-hero-meta-label">Typical budget</span>
                <span className="trip-hero-meta-value">
                  {priceFrom
                    ? `${priceFrom.toLocaleString?.() ?? priceFrom} ${currency}`
                    : "Ask for a quote"}
                  {priceTo
                    ? ` – ${priceTo.toLocaleString?.() ?? priceTo} ${currency}`
                    : ""}
                </span>
              </div>
            )}

            {tags.length > 0 && (
              <div className="trip-hero-meta-item">
                <span className="trip-hero-meta-label">Perfect for</span>
                <div className="trip-hero-tags">
                  {tags.map((tag) => (
                    <span key={tag} className="trip-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {overviewText && (
            <p className="trip-section-text">{overviewText}</p>
          )}
        </div>

        {/* أزرار الأكشن */}
        <div className="trip-hero-actions">
  <button
    type="button"
    className="btn-ghost"
    onClick={() => navigate("/choose-your-trip")}
  >
    ← Back to all trips
  </button>

  <Link
    to={`/customize-your-trip?from=${encodeURIComponent(
      trip.slug || trip.id
    )}`}
    className="btn-primary"
  >
    Customize this trip
  </Link>

  {/* زرار واتساب سريع */}
  <a
    href={`https://wa.me/01030624545?text=${encodeURIComponent(
      `Hi Travelophilia! I'm interested in the trip: ${
        trip.name
      } (${location}).\nLink: ${window.location.href}\nCan you help me customize it?`
    )}`}
    target="_blank"
    rel="noreferrer"
    className="btn-ghost"
  >
    Chat on WhatsApp
  </a>
</div>
      </section>

      {/* ===== DETAILS SECTIONS ===== */}

      {/* What’s included */}
      {includedList.length > 0 && (
        <section className="trip-section-card">
          <h2 className="trip-section-title">What&apos;s included</h2>
          <ul className="trip-section-list">
            {includedList.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
          {sections.includedNote && (
            <p className="trip-section-note">{sections.includedNote}</p>
          )}
        </section>
      )}

      {/* Customize section */}
      {customizeText && (
        <section className="trip-section-card">
          <h2 className="trip-section-title">
            Ready to plan it your way?
          </h2>
          <p className="trip-section-text">{customizeText}</p>
          <div className="trip-hero-actions" style={{ marginTop: "0.9rem" }}>
            <Link
              to={`/customize-your-trip?from=${encodeURIComponent(
                trip.slug || trip.id
              )}`}
              className="btn-primary"
            >
              Customize this trip
            </Link>
            <Link
              to="/customize-your-trip"
              className="btn-ghost"
            >
              Or start from scratch
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

export default DestinationPage;