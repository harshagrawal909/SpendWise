import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * This page is the deep link target for the mobile app's Google auth flow.
 * The website redirects here after successful login with the token,
 * and this page immediately forwards it to the mobile app via HTTPS App Link.
 * URL: /app-auth?token=JWT_TOKEN
 */
export default function AppAuth() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    // If token is present, this was a redirect from the login flow
    // — forward immediately to the mobile app via deep link
    if (token) {
      window.location.href = `mobile://login-success?token=${encodeURIComponent(token)}`;
      return;
    }
    // No token — something went wrong, go to login
    window.location.href = "/login";
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
        <p className="text-slate-600 text-sm">Redirecting to SpendWise app…</p>
      </div>
    </div>
  );
}
