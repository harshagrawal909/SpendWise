import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAuthToken } from "../../utils/authToken";

export default function RequireAuth() {
  const location = useLocation();
  const token = getAuthToken();

  if (!token) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

