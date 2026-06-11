import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import API from "../../services/api";
import { clearAuthToken } from "../../utils/authToken";
import Button from "../ui/Button";
import { DownloadAppCard, DownloadAppBadge } from "../ui/DownloadApp";

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
    clearAuthToken();
    navigate("/", { replace: true });
  };

  const title =
    navItems.find((n) => location.pathname.startsWith(n.to))?.label ??
    "SpendWise";

  return (
    <div className="min-h-screen flex flex-col">
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-5">
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-5 flex flex-col gap-3 rounded-[var(--radius)] border border-slate-200 bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow)]">
              <div>
                <div className="text-lg font-extrabold text-slate-900">
                  SpendWise
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Expense &amp; income tracker
                </div>
              </div>

              <nav className="grid gap-1">
                {navItems.map((n) => (
                  <NavItem key={n.to} to={n.to} label={n.label} />
                ))}
              </nav>

              <div className="border-t border-slate-200 pt-3">
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>

              {/* Download App card at the bottom of sidebar */}
              <div className="border-t border-slate-200 pt-3">
                <DownloadAppCard />
              </div>
            </div>
          </aside>

          {/* Main */}
          <section className="flex flex-col gap-4">
            {/* Mobile header */}
            <header className="rounded-[var(--radius)] border border-slate-200 bg-[rgb(var(--surface))]/80 p-4 shadow-[var(--shadow)] backdrop-blur lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-extrabold text-slate-900">
                    {title}
                  </div>
                  <div className="truncate text-xs text-slate-500">SpendWise</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Download badge in mobile nav */}
                  <DownloadAppBadge />
                  <Button variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
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

      {/* Footer — every page */}
      <footer className="border-t border-slate-200 bg-white mt-4">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Left: brand */}
            <div>
              <div className="text-base font-extrabold text-slate-900">SpendWise</div>
              <div className="text-xs text-slate-500 mt-0.5">Track smarter, spend wiser.</div>
            </div>

            {/* Center: features */}
            <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500">
              <span>📊 Real-time analytics</span>
              <span>☁️ Auto cloud sync</span>
              <span>📴 Works offline</span>
              <span>🔒 Secure &amp; private</span>
            </div>

            {/* Right: download */}
            <a
              href="/SpendWise.apk"
              download
              className="inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-white shadow-lg transition hover:bg-slate-800 active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white flex-shrink-0">
                <path d="M3 18.5v-13A1.5 1.5 0 0 1 5.2 4.1l11 6.5a1.5 1.5 0 0 1 0 2.6l-11 6.5A1.5 1.5 0 0 1 3 18.5z"/>
              </svg>
              <div className="text-left leading-none">
                <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Download for</div>
                <div className="text-sm font-bold">Android</div>
              </div>
            </a>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} SpendWise · Built with ❤️
          </div>
        </div>
      </footer>
    </div>
  );
}
