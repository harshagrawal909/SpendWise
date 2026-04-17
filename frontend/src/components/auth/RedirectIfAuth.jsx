import { Navigate, Outlet } from "react-router-dom";
import { getAuthToken } from "../../utils/authToken";

export default function RedirectIfAuth() {
  const token = getAuthToken();
  if (token) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

