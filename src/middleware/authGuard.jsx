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

  if (!isJwtFormatted) {
    // Isolated B2B partner redirect
    return <Navigate to="/partners/login" replace />;
  }

  return <Outlet />;
}
