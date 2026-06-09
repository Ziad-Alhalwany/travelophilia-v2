import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setTokens, hasAccessToken, clearTokens } from "../../services/crmAuth";
import { ShieldAlert, User, KeyRound, ArrowRight, ArrowLeft, LogIn, Chrome, Facebook, AlertTriangle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const TOKEN_URL = "/api/auth/token/";
const REFRESH_URL = "/api/auth/token/refresh/";

export default function CrmLoginPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [useOtp, setUseOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const alreadyIn = useMemo(() => hasAccessToken(), []);
  const [forceLogin, setForceLogin] = useState(false);

  const handleNext = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("يرجى إدخال اسم المستخدم الخاص بالموظف", {
        style: { background: "#0c0f12", color: "#f5f7fa" }
      });
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const goCRM = () => {
    navigate("/crm/leads", { replace: true });
  };

  const switchAccount = () => {
    clearTokens();
    setForceLogin(true);
    setUsername("");
    setPassword("");
    setErr("");
    setStep(1);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);

    try {
      // If mock OTP is used, simulate or validate
      if (useOtp && otp !== "123456") {
        throw new Error("رمز التحقق المؤقت (OTP) غير صالح. استخدم 123456 للتجربة.");
      }

      // Call authentic Django SimpleJWT login API
      const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: useOtp ? otp : password,
        }),
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
          `فشل تسجيل الدخول (${res.status})`;
        throw new Error(msg);
      }

      let access = data?.access || "";
      let refresh = data?.refresh || "";

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
          const msg = rData?.detail || rText || `فشل تحديث الجلسة (${rr.status})`;
          throw new Error(msg);
        }

        access = rData?.access || "";
      }

      if (!access) {
        throw new Error("استجابة التوكن لا تحتوي على access token.");
      }

      setTokens({ access, refresh });
      toast.success("تم التحقق بنجاح! جاري التوجيه...", {
        style: { background: "#0c0f12", color: "#f5f7fa", border: "1px solid rgba(239, 68, 68, 0.2)" }
      });
      setTimeout(() => {
        navigate("/crm/leads", { replace: true });
      }, 1000);
    } catch (e) {
      setErr(e?.message || "بيانات الدخول خاطئة أو الخادم غير متصل.");
      toast.error(e?.message || "فشل تسجيل الدخول", {
        style: { background: "#0c0f12", color: "#f5f7fa" }
      });
    } finally {
      setBusy(false);
    }
  };

  const showAlreadyIn = alreadyIn && !forceLogin;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Background Decorative Blobs - Dark Crimson and Steel Theme */}
      <div className="absolute top-1/4 right-1/4 translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-slate-800/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full space-y-8 bg-zinc-950/80 border border-red-500/20 p-8 rounded-[24px] shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-red-950/20 border border-red-900/30 mb-4 text-red-500">
            <ShieldAlert className="h-7 w-7 animate-pulse" />
          </div>
          <span className="block text-xs font-semibold uppercase tracking-widest text-red-500 mb-1">
            CRM Internal Security
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            بوابة دخول موظفي CRM
          </h2>
          <p className="text-xs text-slate-500 font-semibold px-2 leading-relaxed">
            منطقة أمنية محمية. دخول الموظفين المصرح لهم فقط. يتم تسجيل جميع محاولات الدخول.
          </p>
        </div>

        {showAlreadyIn ? (
          <div className="mt-8 bg-red-950/10 border border-red-900/20 rounded-xl p-4 text-center space-y-4">
            <div className="text-sm font-semibold text-white">أنت متصل بالفعل بجلسة عمل نشطة ✅</div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={goCRM}
                className="flex-1 py-2.5 px-4 border border-transparent rounded-xl text-xs font-bold text-slate-950 bg-red-500 hover:bg-red-600 transition-all"
              >
                الذهاب للوحة CRM
              </button>
              <button
                type="button"
                onClick={switchAccount}
                className="flex-1 py-2.5 px-4 border border-white/[0.08] rounded-xl text-xs font-bold text-white bg-white/[0.02] hover:bg-white/[0.05] transition-all"
              >
                تبديل الحساب
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <form onSubmit={step === 1 ? handleNext : onSubmit} className="space-y-6">
              
              {/* Step 1: Username Input */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-xs font-bold text-slate-400 mb-2">
                      اسم المستخدم (Username)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        id="username"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-zinc-900/80 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 text-sm transition-all"
                        placeholder="مثال: admin"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-700 to-red-900 hover:opacity-95 transition-all shadow-lg shadow-red-900/20"
                  >
                    التالي
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Step 2: Password Input */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <button
                      type="button"
                      onClick={() => setUseOtp(!useOtp)}
                      className="text-xs font-bold text-red-500 hover:underline"
                    >
                      {useOtp ? "استخدام كلمة المرور" : "تسجيل بالرمز المؤقت (OTP)"}
                    </button>
                    <span className="text-xs text-slate-500 font-semibold">خطوة 2 من 2</span>
                  </div>

                  {!useOtp ? (
                    <div>
                      <label htmlFor="password" className="block text-xs font-bold text-slate-400 mb-2">
                        كلمة المرور (Password)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <KeyRound className="h-5 w-5" />
                        </div>
                        <input
                          id="password"
                          type="password"
                          required={!useOtp}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full pl-10 pr-4 py-3 bg-zinc-900/80 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 text-sm transition-all"
                          placeholder="••••••••"
                          autoComplete="current-password"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="otp" className="block text-xs font-bold text-slate-400 mb-2">
                        رمز الأمان المؤقت (OTP)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                        <input
                          id="otp"
                          type="text"
                          required={useOtp}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="block w-full pl-10 pr-4 py-3 bg-zinc-900/80 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 text-sm transition-all text-center tracking-widest font-bold"
                          placeholder="123456"
                          maxLength={6}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 text-right">
                        أدخل 123456 للمصادقة التجريبية.
                      </p>
                    </div>
                  )}

                  {err && (
                    <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{err}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 border border-white/[0.08] rounded-xl text-sm font-semibold text-white bg-white/[0.02] hover:bg-white/[0.05] transition-all"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      السابق
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50"
                    >
                      {busy ? "جاري التحقق..." : "تسجيل الدخول"}
                      <LogIn className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-white/[0.08]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-950 px-2 text-slate-500 font-semibold">أو مصادقة الموظفين عبر</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              toast("مصادقة الموظفين الاجتماعية قيد التطوير", { icon: "ℹ️" });
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-4 border border-white/[0.06] rounded-xl text-xs font-bold text-white bg-white/[0.02] hover:bg-white/[0.05] transition-all"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.705 0 3.295.615 4.545 1.765l2.44-2.44C17.72 1.945 15.14 1 12.24 1c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 9.6-4.06 9.6-9.79 0-.66-.06-1.29-.19-1.925H12.24z" />
            </svg>
            Google Workspace
          </button>
          <button
            type="button"
            onClick={() => {
              toast("مصادقة الموظفين الاجتماعية قيد التطوير", { icon: "ℹ️" });
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-4 border border-white/[0.06] rounded-xl text-xs font-bold text-white bg-white/[0.02] hover:bg-white/[0.05] transition-all"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook Okta
          </button>
        </div>

        {/* Footer info for CRM */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
          <div className="text-[10px] text-slate-500 font-semibold space-y-1">
            <p>خاضع للمراقبة بموجب معايير حماية البيانات الجنائية للمؤسسة.</p>
            <p className="text-[#00d8c0]">Travelophilia Staff Portal Security v4.2</p>
          </div>
        </div>

      </div>
    </div>
  );
}
