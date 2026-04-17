const COOKIE_NAME = "spendwise_token";

export function setAuthToken(token, { days = 7 } = {}) {
  if (!token) return;
  const maxAge = Math.max(1, Math.floor(days * 24 * 60 * 60));
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    token
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function getAuthToken() {
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const c of cookies) {
    const [name, ...rest] = c.split("=");
    if (name === COOKIE_NAME) return decodeURIComponent(rest.join("=") || "");
  }
  return "";
}

export function clearAuthToken() {
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

