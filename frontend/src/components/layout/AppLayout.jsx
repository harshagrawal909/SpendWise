import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import API from "../../services/api";
import { clearAuthToken } from "../../utils/authToken";
import Button from "../ui/Button";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/expenses", label: "Expenses" },
  { to: "/analytics", label: "Analytics" },
  { to: "/profile", label: "Profile" },
];

function NavItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold transition",
          isActive
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-700 hover:bg-slate-100",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      clearAuthToken();
      navigate("/", { replace: true });
    }
  };

  const title =
    navItems.find((n) => location.pathname.startsWith(n.to))?.label ??
    "SpendWise";

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 py-5">
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-5 rounded-[var(--radius)] border border-slate-200 bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow)]">
              <div className="text-lg font-extrabold text-slate-900">
                SpendWise
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Expense & income tracker
              </div>

              <nav className="mt-4 grid gap-2">
                {navItems.map((n) => (
                  <NavItem key={n.to} to={n.to} label={n.label} />
                ))}
              </nav>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </div>
          </aside>

          {/* Main */}
          <section>
            {/* Mobile header */}
            <header className="mb-4 rounded-[var(--radius)] border border-slate-200 bg-[rgb(var(--surface))]/80 p-4 shadow-[var(--shadow)] backdrop-blur lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-extrabold text-slate-900">
                    {title}
                  </div>
                  <div className="truncate text-xs text-slate-500">SpendWise</div>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {navItems.map((n) => (
                  <NavItem key={n.to} to={n.to} label={n.label} />
                ))}
              </div>
            </header>

            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}

