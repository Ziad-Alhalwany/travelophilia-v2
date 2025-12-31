// src/components/TripCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import Button from "./Button.jsx";
import Tag from "./Tag.jsx";
import "./TripCard.css";

const TripCard = ({ trip }) => {
  if (!trip) return null;

  const {
    id,
    slug,
    location,
    tags = [],
    shortDescription,
    description,
    heroImage,
    currency,
  } = trip;

  const title = trip.title || trip.name || "Untitled trip";

  const duration =
    trip.duration ||
    (trip.durationNights ? `${trip.durationNights} nights` : null);

  const currencyLabel = currency || trip.currency || "EGP";

  const formatNumber = (value) => {
    if (typeof value === "number" && value.toLocaleString) {
      return value.toLocaleString();
    }
    return value ?? "—";
  };

  let priceText = null;
  if (trip.priceFrom && trip.priceTo) {
    priceText = `${formatNumber(trip.priceFrom)} – ${formatNumber(
      trip.priceTo
    )} ${currencyLabel}`;
  } else if (trip.priceFrom) {
    priceText = `${formatNumber(trip.priceFrom)} ${currencyLabel}`;
  } else if (trip.price) {
    priceText = `${formatNumber(trip.price)} ${currencyLabel}`;
  }

  const descriptionText = shortDescription || description || "";
  const slugOrId = slug || id;

  return (
    <article className="trip-card">
      {heroImage && (
        <div className="trip-card__image-wrapper">
          <img
            src={heroImage}
            alt={title}
            className="trip-card__image"
            loading="lazy"
          />
        </div>
      )}

      <div className="trip-card__body">
        <div className="trip-card__header">
          <h3 className="trip-card__title">{title}</h3>
          {location && <p className="trip-card__location">{location}</p>}
        </div>

        {descriptionText && (
          <p className="trip-card__description">{descriptionText}</p>
        )}

        {Array.isArray(tags) && tags.length > 0 && (
          <div className="trip-card__tags">
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}

        <div className="trip-card__footer">
          <div className="trip-card__meta">
            {priceText && (
              <div className="trip-card__meta-item">
                <span className="trip-card__meta-label">Starting from</span>
                <span className="trip-card__meta-value">{priceText}</span>
              </div>
            )}

            {duration && (
              <div className="trip-card__meta-item">
                <span className="trip-card__meta-label">Duration</span>
                <span className="trip-card__meta-value">{duration}</span>
              </div>
            )}
          </div>

          <div className="trip-card__actions">
            <Button
              as={Link}
              to={`/destinations/${slugOrId}`}
              variant="primary"
              size="md"
            >
              View details
            </Button>
            <Button
              as={Link}
              to={`/customize-your-trip?from=${slugOrId}`}
              variant="secondary"
              size="sm"
            >
              Customize
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default TripCard;
