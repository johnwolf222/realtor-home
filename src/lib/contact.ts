export function phoneToTelHref(phone?: string | null) {
  const raw = (phone || "").trim();
  if (!raw) return "";

  const hasLeadingPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  return `tel:${hasLeadingPlus ? "+" : ""}${digits}`;
}

export function emailToMailtoHref(email?: string | null) {
  const clean = (email || "").trim();
  if (!clean) return "";
  return `mailto:${encodeURIComponent(clean)}`;
}

export function isCallablePhone(phone?: string | null) {
  return Boolean(phoneToTelHref(phone));
}
