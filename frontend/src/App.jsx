import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard";
import RequireAuth from "./components/auth/RequireAuth.jsx";
import RedirectIfAuth from "./components/auth/RedirectIfAuth.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import ExpensesPage from "./pages/ExpensesPage.jsx";
import Analytics from "./pages/Analytics.jsx";
import Profile from "./pages/Profile.jsx";
import AppAuth from "./pages/AppAuth.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import TermsOfService from "./pages/TermsOfService.jsx";
import Contact from "./pages/Contact.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import CsvExport from "./pages/CsvExport.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Always accessible — mobile app auth callback */}
        <Route path="/app-auth" element={<AppAuth />} />
        {/* Public legal & contact pages */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/contact" element={<Contact />} />
        {/* /login always accessible (mobile may open it with redirect_uri) */}
        <Route path="/login" element={<Login />} />
        <Route element={<RedirectIfAuth />}>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/csv" element={<CsvExport />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;