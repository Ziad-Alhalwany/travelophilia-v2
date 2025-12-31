// src/services/crmAuth.js

const ACCESS_KEY = "tp_crm_access";
const REFRESH_KEY = "tp_crm_refresh";

// Storage-safe: localStorage → sessionStorage → memory fallback
const memoryStore = new Map();

function getSafeStorage() {
  if (typeof window === "undefined") return null;

  // localStorage
  try {
    const ls = window.localStorage;
    const k = "__tp_test__";
    ls.setItem(k, "1");
    ls.removeItem(k);
    return ls;
  } catch {}

  // sessionStorage
  try {
    const ss = window.sessionStorage;
    const k = "__tp_test__";
    ss.setItem(k, "1");
    ss.removeItem(k);
    return ss;
  } catch {}

  return null;
}

const storage = getSafeStorage();

function safeGet(key) {
  try {
    if (storage) return storage.getItem(key) || "";
  } catch {}
  return memoryStore.get(key) || "";
}

function safeSet(key, val) {
  const v = String(val ?? "");
  try {
    if (storage) return storage.setItem(key, v);
  } catch {}
  memoryStore.set(key, v);
}

function safeRemove(key) {
  try {
    if (storage) return storage.removeItem(key);
  } catch {}
  memoryStore.delete(key);
}

function isValidJwt(token) {
  const t = String(token || "").trim();
  return /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(t);
}

export function setTokens({ access, refresh }) {
  if (access) safeSet(ACCESS_KEY, access);
  if (refresh) safeSet(REFRESH_KEY, refresh);
}

export function clearTokens() {
  safeRemove(ACCESS_KEY);
  safeRemove(REFRESH_KEY);
}

export function getAccessToken() {
  const raw = safeGet(ACCESS_KEY);
  return isValidJwt(raw) ? raw.trim() : "";
}

export function getRefreshToken() {
  const raw = safeGet(REFRESH_KEY);
  return isValidJwt(raw) ? raw.trim() : "";
}

export function hasAccessToken() {
  return Boolean(getAccessToken());
}

export function logout() {
  clearTokens();
  // Event عالمي يخلي App يودّي لصفحة اللوجين
  try {
    window.dispatchEvent(new CustomEvent("tp:crm:logout"));
  } catch {}
}

let refreshInFlight = null;

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No refresh token");

  // امنع أكتر من refresh في نفس الوقت
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const res = await fetch("/api/auth/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) throw new Error("Refresh failed");

    const data = await res.json(); // غالبًا {access} فقط
    const newAccess = data.access;
    const newRefresh = data.refresh; // ممكن موجود لو فعلنا rotation لاحقًا

    if (!newAccess) throw new Error("No access in refresh response");

    setTokens({ access: newAccess, refresh: newRefresh || refresh });
    return newAccess;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

// ✅ fetch بيضيف Authorization + يعمل refresh تلقائي على 401 ويعيد المحاولة مرة واحدة
export async function authFetch(url, options = {}, _retry = true) {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  if (options.body && !headers.get("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...options, headers });

  // لو Access انتهى → جرّب refresh مرة واحدة
  if (res.status === 401 && _retry) {
    try {
      const newAccess = await refreshAccessToken();

      const headers2 = new Headers(options.headers || {});
      headers2.set("Authorization", `Bearer ${newAccess}`);
      if (options.body && !headers2.get("Content-Type")) {
        headers2.set("Content-Type", "application/json");
      }

      return await fetch(url, { ...options, headers: headers2 });
    } catch {
      logout();
      return res; // هيبقى 401 غالبًا
    }
  }

  return res;
}
