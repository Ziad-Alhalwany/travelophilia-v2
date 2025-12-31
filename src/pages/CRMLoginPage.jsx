// src/pages/CRMLoginPage.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setTokens, hasAccessToken, clearTokens } from "../services/crmAuth";

const TOKEN_URL = "/api/auth/token/";
const REFRESH_URL = "/api/auth/token/refresh/";

export default function CRMLoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // لو فيه توكن بالفعل… هنظهر “أنت داخل”
  const alreadyIn = useMemo(() => hasAccessToken(), []);
  const [forceLogin, setForceLogin] = useState(false);

  function goCRM() {
    navigate("/crm", { replace: true });
  }

  function switchAccount() {
    clearTokens();
    setForceLogin(true);
    setUsername("");
    setPassword("");
    setErr("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);

    try {
      // 1) Obtain pair
      const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const rawText = await res.text().catch(() => "");
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        const msg =
          data?.detail ||
          data?.non_field_errors?.[0] ||
          rawText ||
          `Login failed (${res.status})`;
        throw new Error(msg);
      }

      // 2) Normal case: access+refresh
      let access = data?.access || "";
      let refresh = data?.refresh || "";

      // 3) Fallback: لو رجع refresh بس
      if (!access && refresh) {
        const rr = await fetch(REFRESH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });

        const rText = await rr.text().catch(() => "");
        let rData = {};
        try {
          rData = rText ? JSON.parse(rText) : {};
        } catch {
          rData = {};
        }

        if (!rr.ok) {
          const msg = rData?.detail || rText || `Refresh failed (${rr.status})`;
          throw new Error(msg);
        }

        access = rData?.access || "";
      }

      if (!access) {
        throw new Error("Token response missing access token.");
      }

      setTokens({ access, refresh });
      navigate("/crm", { replace: true });
    } catch (e) {
      setErr(e?.message || "بيانات الدخول غلط أو السيرفر مش شغال.");
    } finally {
      setBusy(false);
    }
  }

  const showAlreadyIn = alreadyIn && !forceLogin;

  return (
    <div className="tp-crm-login">
      <div className="tp-crm-card">
        <div className="tp-crm-head">
          <div className="tp-crm-pill">
            <span className="dot" />
            Travelophilia CRM
          </div>

          <h1 className="tp-crm-title">Staff Login</h1>
          <p className="tp-crm-sub">ادخل بحساب الموظفين (Staff/Superuser).</p>
        </div>

        {showAlreadyIn ? (
          <div className="tp-crm-ready">
            <div className="tp-crm-ready-line">أنت بالفعل عامل تسجيل دخول ✅</div>

            <div className="tp-crm-ready-actions">
              <button className="tp-btn primary" type="button" onClick={goCRM}>
                Go to CRM
              </button>

              <button className="tp-btn ghost" type="button" onClick={switchAccount} title="Switch account">
                Switch account
              </button>
            </div>

            <div className="tp-crm-hint">
              لو عايز تشوف صفحة الـ Login تاني: دوس <b>Switch account</b>.
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="tp-crm-form">
            <div className="tp-field">
              <label>Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: admin"
                autoComplete="username"
                required
              />
            </div>

            <div className="tp-field">
              <label>Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {err ? <div className="tp-error">{err}</div> : null}

            <button className="tp-btn primary" type="submit" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </button>

            <div className="tp-crm-hint">
              تأكد إن Django شغال على 8000 وإن Vite Proxy شغال.
            </div>

            <div className="tp-crm-mini">
              <button className="tp-link" type="button" onClick={switchAccount}>
                Clear saved login
              </button>
            </div>
          </form>
        )}
      </div>

      {/* نفس ستايل الكارد عندك (متناسق مع الموقع) */}
      <style>{`
        .tp-crm-login{
          min-height: calc(100vh - 120px);
          display:flex; align-items:center; justify-content:center;
          padding: 2rem 1rem;
        }
        .tp-crm-card{
          width: min(560px, 100%);
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.10);
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
          box-shadow: 0 18px 55px rgba(0,0,0,0.38);
          padding: 1.25rem 1.25rem 1.35rem;
          backdrop-filter: blur(12px);
          position: relative;
          overflow: hidden;
        }
        .tp-crm-card::before{
          content:"";
          position:absolute;
          inset:-40% -10% auto -10%;
          height: 220px;
          background: radial-gradient(circle at 20% 40%, rgba(0,216,192,0.22), transparent 60%),
                      radial-gradient(circle at 75% 35%, rgba(0,165,255,0.14), transparent 55%),
                      radial-gradient(circle at 40% 90%, rgba(155,89,182,0.10), transparent 60%);
          filter: blur(2px);
          pointer-events:none;
        }
        .tp-crm-head{ position:relative; margin-bottom: .95rem; }
        .tp-crm-pill{
          display:inline-flex; align-items:center; gap: .55rem;
          padding: .34rem .7rem; border-radius: 999px;
          font-weight: 950;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.92);
        }
        .tp-crm-pill .dot{
          width:10px; height:10px; border-radius:999px;
          background: rgba(0,216,192,0.95);
          box-shadow: 0 0 0 4px rgba(0,216,192,0.12);
        }
        .tp-crm-title{ margin:.7rem 0 .25rem; font-size: 1.7rem; font-weight: 980; color: rgba(255,255,255,0.95); }
        .tp-crm-sub{ margin:0; color: rgba(255,255,255,0.72); line-height:1.5; font-size: .95rem; }
        .tp-crm-form{ position:relative; margin-top: 1.05rem; display:flex; flex-direction:column; gap: .9rem; }
        .tp-field label{ display:block; margin-bottom:.35rem; font-size:.82rem; color: rgba(255,255,255,0.70); font-weight: 800; }
        .tp-field input{
          width:100%;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(9, 13, 18, 0.35);
          color: rgba(255,255,255,0.92);
          padding: .85rem .95rem;
          outline: none;
        }
        .tp-field input:focus{
          border-color: rgba(0,216,192,0.40);
          box-shadow: 0 0 0 4px rgba(0,216,192,0.10);
        }
        .tp-error{
          border: 1px solid rgba(255, 80, 80, 0.35);
          background: rgba(255, 80, 80, 0.10);
          color: rgba(255,255,255,0.92);
          border-radius: 14px;
          padding: .7rem .85rem;
          font-size: .92rem;
        }
        .tp-btn{
          width:100%;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.12);
          padding: .9rem 1rem;
          font-weight: 980;
          cursor: pointer;
          color: rgba(255,255,255,0.92);
          background: rgba(255,255,255,0.08);
        }
        .tp-btn.primary{ border-color: rgba(0,216,192,0.40); background: rgba(0,216,192,0.18); }
        .tp-btn.ghost{ background: rgba(255,255,255,0.06); }
        .tp-btn:disabled{ opacity: .7; cursor: not-allowed; }
        .tp-crm-hint{ margin-top: .25rem; font-size: .82rem; color: rgba(255,255,255,0.60); }
        .tp-crm-mini{ margin-top: .1rem; display:flex; justify-content:center; }
        .tp-link{ background: transparent; border: 0; color: rgba(255,255,255,0.70); text-decoration: underline; cursor: pointer; font-weight: 800; }
        .tp-link:hover{ color: rgba(255,255,255,0.92); }
        .tp-crm-ready{
          position:relative; margin-top: 1rem;
          border-radius: 16px;
          border: 1px solid rgba(0,216,192,0.22);
          background: rgba(0,216,192,0.09);
          padding: .95rem;
        }
        .tp-crm-ready-line{ font-weight: 950; color: rgba(255,255,255,0.92); margin-bottom: .75rem; }
        .tp-crm-ready-actions{ display:flex; gap:.6rem; flex-wrap: wrap; }
        .tp-crm-ready-actions .tp-btn{ width: auto; flex: 1 1 200px; }
      `}</style>
    </div>
  );
}
