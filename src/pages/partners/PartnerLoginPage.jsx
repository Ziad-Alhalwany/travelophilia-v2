import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authStorage from "../../services/authStorage";
import { api } from "../../services/apiClient";
import { KeyRound, Mail, Phone, ArrowRight, ArrowLeft, LogIn, Sparkles, ShieldCheck } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function PartnerLoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [useOtp, setUseOtp] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleNext = (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني أو رقم الهاتف", {
        style: { background: "#101b23", color: "#f5f7fa" }
      });
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);

    try {
      const res = await api.post("/auth/partners/token/", {
        username: identifier.trim(),
        password: useOtp ? otp : password,
      });

      const access = res.data?.access || res.data?.data?.access;
      const refresh = res.data?.refresh || res.data?.data?.refresh;

      if (!access) {
        throw new Error("استجابة الخادم لم تتضمن رمز الدخول (access token).");
      }

      authStorage.setAccessToken(access);
      if (refresh) {
        authStorage.setRefreshToken(refresh);
      }

      toast.success("تم تسجيل الدخول بنجاح! جاري التوجيه...", {
        style: { background: "#101b23", color: "#f5f7fa", border: "1px solid rgba(0, 216, 192, 0.2)" }
      });

      setTimeout(() => {
        navigate("/partners/inventory", { replace: true });
      }, 1000);
    } catch (err) {
      toast.error(err?.message || "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.", {
        style: { background: "#101b23", color: "#f5f7fa" }
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#00d8c0]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-[#00a5ff]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full space-y-8 bg-card/45 backdrop-blur-xl border border-white/[0.08] p-8 rounded-[24px] shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4 text-[#00d8c0]">
            <Sparkles className="h-7 w-7" />
          </div>
          <span className="block text-xs font-semibold uppercase tracking-widest text-[#00d8c0] mb-1">
            B2B Partner Portal
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            بوابة تسجيل دخول الموردين
          </h2>
          <p className="text-sm text-slate-400 font-medium px-2 leading-relaxed">
            شريك النجاح، أهلاً بك في منصة تصميم وإدارة الرحلات الاستثنائية الأكثر نمواً
          </p>
        </div>

        {/* Form Container */}
        <div className="mt-8">
          <form onSubmit={step === 1 ? handleNext : handleSubmit} className="space-y-6">
            
            {/* Step 1: Identifier Input */}
            {step === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label htmlFor="identifier" className="block text-xs font-bold text-slate-400 mb-2">
                    البريد الإلكتروني أو رقم الهاتف
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      id="identifier"
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-[#090d12]/60 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00d8c0] focus:ring-1 focus:ring-[#00d8c0]/20 text-sm transition-all"
                      placeholder="partner@travelophilia.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-slate-950 bg-gradient-to-r from-[#00d8c0] to-[#1abc9c] hover:opacity-95 transition-all shadow-lg shadow-[#00d8c0]/10"
                >
                  التالي
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Step 2: Password or OTP Input */}
            {step === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between mb-1">
                  <button
                    type="button"
                    onClick={() => setUseOtp(!useOtp)}
                    className="text-xs font-bold text-[#00d8c0] hover:underline"
                  >
                    {useOtp ? "استخدام كلمة المرور" : "تسجيل بالرمز المؤقت (OTP)"}
                  </button>
                  <span className="text-xs text-slate-400 font-semibold">خطوة 2 من 2</span>
                </div>

                {!useOtp ? (
                  <div>
                    <label htmlFor="password" className="block text-xs font-bold text-slate-400 mb-2">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-[#090d12]/60 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00d8c0] focus:ring-1 focus:ring-[#00d8c0]/20 text-sm transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="otp" className="block text-xs font-bold text-slate-400 mb-2">
                      رمز التحقق المؤقت (OTP)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <input
                        id="otp"
                        type="text"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-[#090d12]/60 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00d8c0] focus:ring-1 focus:ring-[#00d8c0]/20 text-sm transition-all text-center tracking-widest font-bold"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 text-right">
                      تم إرسال رمز تحقق مؤقت إلى {identifier} (افتراضي)
                    </p>
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
                    className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-slate-950 bg-gradient-to-r from-[#00d8c0] to-[#1abc9c] hover:opacity-95 transition-all disabled:opacity-50"
                  >
                    {busy ? "جاري الدخول..." : "دخول الشريك"}
                    <LogIn className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-white/[0.08]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#101b23] px-2 text-slate-500 font-semibold">أو تسجيل الدخول عبر</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              toast("تسجيل الدخول الاجتماعي قيد التطوير", { icon: "ℹ️" });
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-4 border border-white/[0.06] rounded-xl text-xs font-bold text-white bg-white/[0.02] hover:bg-white/[0.05] transition-all"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.705 0 3.295.615 4.545 1.765l2.44-2.44C17.72 1.945 15.14 1 12.24 1c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 9.6-4.06 9.6-9.79 0-.66-.06-1.29-.19-1.925H12.24z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => {
              toast("تسجيل الدخول الاجتماعي قيد التطوير", { icon: "ℹ️" });
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-4 border border-white/[0.06] rounded-xl text-xs font-bold text-white bg-white/[0.02] hover:bg-white/[0.05] transition-all"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </button>
        </div>

        {/* Partner Sign-up Placeholder & Compliance Links */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] text-center space-y-3">
          <div className="text-xs">
            <span className="text-slate-400">ليس لديك حساب شريك؟ </span>
            <button
              type="button"
              onClick={() => toast("نموذج تسجيل الموردين قيد التحضير", { icon: "📝" })}
              className="text-[#00d8c0] font-bold hover:underline"
            >
              سجل كمورد جديد
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-semibold">
            <a href="#compliance-terms" onClick={(e) => { e.preventDefault(); toast("تحميل الشروط والأحكام المالية للموردين..."); }} className="hover:text-slate-400 hover:underline">
              الشروط والأحكام المالية للموردين
            </a>
            <span className="text-slate-700">•</span>
            <a href="#compliance-commissions" onClick={(e) => { e.preventDefault(); toast("تحميل سياسات العمولات..."); }} className="hover:text-slate-400 hover:underline">
              سياسات العمولات
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
