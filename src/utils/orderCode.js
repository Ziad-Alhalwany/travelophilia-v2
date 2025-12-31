// src/utils/orderCode.js
function pad(n) {
  return String(n).padStart(2, "0");
}

export function generateOrderCode({ serviceCode = "REQ", date = new Date() } = {}) {
  // مؤقت V1 — هنبدّله لاحقًا بمولّدك أنت
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TP-${serviceCode}-${yyyy}${mm}${dd}-${rand}`;
}
