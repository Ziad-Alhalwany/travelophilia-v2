// src/utils/whatsapp.js
export function buildWhatsAppLink({ phone, message }) {
  const digits = String(phone || "").replace(/[^\d]/g, ""); // رقم واتس بدون +
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${digits}?text=${text}`;
}
