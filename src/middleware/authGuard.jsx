import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import authStorage from "../services/authStorage";
import { hasAccessToken } from "../services/crmAuth";

/**
 * CRMGuard: Protects CRM and staff-only routes.
 * Blocks any vendor/partner logic and checks strictly for CRM/staff token.
 */
export function CRMGuard() {
  const isCrmAuthenticated = hasAccessToken();

  if (!isCrmAuthenticated) {
    // Isolated staff redirect
    return <Navigate to="/crm/login" replace />;
  }

  return <Outlet />;
}

/**
 * PartnerGuard: Protects B2B Partner/Vendor and extranet routes.
 * Checks strictly for B2B/Partner token.
 */
export function PartnerGuard() {
  const token = authStorage.getAccessToken() || "";
  const isJwtFormatted = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(token.trim());

  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isJwtFormatted) {
    // Isolated B2B partner redirect
    return <Navigate to="/partners/login" replace />;
  }

  return (
    <>
      {!isOnline && (
        <div className="bg-amber-500/25 border-b border-amber-500/30 text-amber-300 text-center py-2 px-4 text-xs font-semibold animate-pulse z-50 sticky top-0 backdrop-blur-md">
          ⚠️ وضع العمل دون اتصال نشط (Offline Mode Active) - قد لا تنعكس التحديثات الحية بالخادم.
        </div>
      )}
      <Outlet />
    </>
  );
}
