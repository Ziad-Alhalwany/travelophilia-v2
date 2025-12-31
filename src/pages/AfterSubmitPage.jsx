import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const LAST_SUBMIT_KEY = "tp_last_submit_v1";
const WHATSAPP_NUMBER = "201030624545";

function formatDMY(isoDate) {
  if (!isoDate || typeof isoDate !== "string" || !isoDate.includes("-")) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export default function AfterSubmitPage() {
  const nav = useNavigate();
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_SUBMIT_KEY);
      if (!raw) return;
      setPayload(JSON.parse(raw));
    } catch {}
  }, []);

  const waLink = useMemo(() => {
    if (!payload) return "#";

    const msg =
      `Travelophilia – Trip Request\n` +
      `Trip code: ${payload.tripCode}\n\n` +
      `Leader: ${payload.fullName}\n` +
      `Phone: ${payload.leaderPhone}\n` +
      `Email: ${payload.email}\n` +
      `Route: ${payload.originCity} → ${payload.destinationCity}\n` +
      `Dates: ${formatDMY(payload.departDate)} → ${formatDMY(payload.returnDate)}\n` +
      `Pax: ${payload.totalPax} (Adults ${payload.adults}, Children ${payload.children})\n\n` +
      `I want priority response.`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }, [payload]);

  return (
    <div className="page">
      <header className="page-header page-header-center">
        <p className="page-kicker">Request submitted</p>
        <h1>We received your request</h1>
      </header>

      <section className="form">
        <div className="form-grid">
          <div className="field-group full-width">
            {payload ? (
              <>
                <div className="tp-review-grid" style={{ marginTop: "1rem" }}>
                  <div className="tp-kv">
                    <div className="tp-k">Trip code</div>
                    <div className="tp-v">{payload.tripCode}</div>
                  </div>

                  <div className="tp-kv">
                    <div className="tp-k">Leader</div>
                    <div className="tp-v">{payload.fullName}</div>
                  </div>

                  <div className="tp-kv">
                    <div className="tp-k">Route</div>
                    <div className="tp-v">
                      {payload.originCity} → {payload.destinationCity}
                    </div>
                  </div>

                  <div className="tp-kv">
                    <div className="tp-k">Dates</div>
                    <div className="tp-v">
                      {formatDMY(payload.departDate)} → {formatDMY(payload.returnDate)}
                    </div>
                  </div>
                </div>

                <div className="form-actions" style={{ marginTop: "1.2rem" }}>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <a className="btn-primary" href={waLink} target="_blank" rel="noreferrer">
                      Send on WhatsApp (priority)
                    </a>

                    <button className="btn-ghost" type="button" onClick={() => nav("/")}>
                      I have time
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="page-info" style={{ marginTop: "1rem" }}>
                Nothing to show.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
