import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const LAST_SUBMIT_KEY = "tp_last_submit_v1";
const WHATSAPP_NUMBER = "201030624545";

function formatDMY(isoDate) {
  if (!isoDate || typeof isoDate !== "string" || !isoDate.includes("-")) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export default function AfterSubmitPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [payload, setPayload] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_SUBMIT_KEY);
      if (raw) {
        setPayload(JSON.parse(raw));
      } else {
        const codeParam = sp.get("code") || sp.get("tripCode");
        const modeParam = sp.get("companionsMode") || sp.get("mode");
        if (codeParam) {
          setPayload({
            tripCode: codeParam,
            fullName: sp.get("name") || "Valued Guest",
            companionsMode: modeParam || "LATER",
          });
        }
      }
    } catch {}
  }, [sp]);

  const companionsMode = useMemo(() => {
    return (
      payload?.companionsMode ||
      sp.get("companionsMode") ||
      sp.get("mode") ||
      "LATER"
    );
  }, [payload, sp]);

  const showCompanionLink = companionsMode === "LATER";

  const tripCode = useMemo(() => {
    return (
      payload?.tripCode ||
      sp.get("code") ||
      sp.get("tripCode") ||
      "ST-0000007-SIWA-R0003"
    );
  }, [payload, sp]);

  const magicCompanionLink = useMemo(() => {
    return `https://travelophilia.com/reserve/companion?code=${tripCode}`;
  }, [tripCode]);

  const companionWaLink = useMemo(() => {
    const msg =
      `Travelophilia – Companion Invitation 🌟\n` +
      `Trip Request Code: ${tripCode}\n` +
      `Please fill in your companion details for our upcoming trip using this link:\n` +
      `${magicCompanionLink}`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }, [tripCode, magicCompanionLink]);

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(magicCompanionLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const waLink = useMemo(() => {
    if (!payload && !tripCode) return "#";

    const msg =
      `Travelophilia – Trip Request\n` +
      `Trip code: ${tripCode}\n\n` +
      (payload?.fullName ? `Leader: ${payload.fullName}\n` : "") +
      (payload?.leaderPhone ? `Phone: ${payload.leaderPhone}\n` : "") +
      (payload?.email ? `Email: ${payload.email}\n` : "") +
      (payload?.originCity && payload?.destinationCity
        ? `Route: ${payload.originCity} → ${payload.destinationCity}\n`
        : "") +
      (payload?.departDate && payload?.returnDate
        ? `Dates: ${formatDMY(payload.departDate)} → ${formatDMY(payload.returnDate)}\n`
        : "") +
      (payload?.totalPax ? `Pax: ${payload.totalPax}\n\n` : "\n") +
      `I want priority response.`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }, [payload, tripCode]);

  return (
    <div className="page max-w-4xl mx-auto px-4 py-8">
      <header className="page-header page-header-center text-center mb-6">
        <p className="page-kicker text-xs uppercase tracking-widest text-cyan-400 font-bold mb-1">
          Request submitted
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          We received your request
        </h1>
      </header>

      <section className="form bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
        <div className="form-grid">
          <div className="field-group full-width">
            {payload || tripCode ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-white/50 uppercase">Trip code</span>
                    <span className="text-base font-mono font-bold text-cyan-300">{tripCode}</span>
                  </div>

                  {payload?.fullName ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-white/50 uppercase">Leader</span>
                      <span className="text-sm font-medium text-white">{payload.fullName}</span>
                    </div>
                  ) : null}

                  {payload?.originCity && payload?.destinationCity ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-white/50 uppercase">Route</span>
                      <span className="text-sm font-medium text-white">
                        {payload.originCity} → {payload.destinationCity}
                      </span>
                    </div>
                  ) : null}

                  {payload?.departDate && payload?.returnDate ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-white/50 uppercase">Dates</span>
                      <span className="text-sm font-medium text-white">
                        {formatDMY(payload.departDate)} → {formatDMY(payload.returnDate)}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Magic Companion Link generator block */}
                {showCompanionLink && (
                  <div className="mt-6 p-5 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-base mb-1">
                      <span>✨ Magic Companion Link</span>
                    </div>
                    <p className="text-xs text-white/70 mb-3">
                      Share this link with your trip companions so they can submit their details later.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-black/30 p-2.5 rounded-xl border border-white/10">
                      <input
                        type="text"
                        readOnly
                        value={magicCompanionLink}
                        className="flex-1 bg-transparent px-3 py-1.5 text-xs text-cyan-200 font-mono outline-none select-all"
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold border border-cyan-500/40 transition-colors cursor-pointer"
                        >
                          {copied ? "Copied! ✓" : "Copy Link"}
                        </button>
                        <a
                          href={companionWaLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold border border-emerald-500/40 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          Share on WhatsApp 💬
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-actions mt-6">
                  <div className="flex gap-3 flex-wrap items-center">
                    <a
                      className="px-5 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-sm font-bold border border-emerald-500/40 transition-colors shadow-lg shadow-emerald-500/10 inline-flex items-center gap-2"
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Send on WhatsApp (priority)
                    </a>

                    <button
                      className="px-5 py-2.5 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white text-sm font-medium border border-white/10 transition-colors cursor-pointer"
                      type="button"
                      onClick={() => nav("/")}
                    >
                      I have time
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="page-info text-center py-8 text-white/50 text-sm">
                Nothing to show.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
