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
      <footer className="border-t border-slate-200 bg-slate-100 mt-4 min-h-[140px] flex flex-col justify-center">
        <div className="mx-auto w-full max-w-5xl px-8 py-8">

          {/* Main row — centered, not justify-between */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-12">

            {/* Brand + Download side by side */}
            <div className="flex items-center gap-5 flex-shrink-0">
              <div>
                <div className="text-base font-extrabold text-slate-900">SpendWise</div>
                <div className="text-xs text-slate-500 mt-0.5">Track smarter, spend wiser.</div>
              </div>
              <a
                href="/SpendWise.apk"
                download
                className="inline-flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-2.5 text-white shadow transition hover:bg-slate-800 active:scale-95 flex-shrink-0"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white flex-shrink-0">
                  <path d="M3 18.5v-13A1.5 1.5 0 0 1 5.2 4.1l11 6.5a1.5 1.5 0 0 1 0 2.6l-11 6.5A1.5 1.5 0 0 1 3 18.5z"/>
                </svg>
                <div className="text-left leading-none">
                  <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Download for</div>
                  <div className="text-sm font-bold">Android</div>
                </div>
              </a>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-12 bg-slate-200 flex-shrink-0" />

            {/* Links — centered, with breathing room */}
            <div className="flex gap-12 text-sm">
              <div>
                <div className="font-bold text-slate-700 mb-2.5 text-xs uppercase tracking-wider">Product</div>
                <ul className="space-y-2 text-slate-500">
                  <li><a href="/dashboard" className="hover:text-slate-900 transition">Dashboard</a></li>
                  <li><a href="/expenses" className="hover:text-slate-900 transition">Expenses</a></li>
                  <li><a href="/analytics" className="hover:text-slate-900 transition">Analytics</a></li>
                </ul>
              </div>
              <div>
                <div className="font-bold text-slate-700 mb-2.5 text-xs uppercase tracking-wider">Legal</div>
                <ul className="space-y-2 text-slate-500">
                  <li><a href="/privacy" className="hover:text-slate-900 transition">Privacy Policy</a></li>
                  <li><a href="/terms" className="hover:text-slate-900 transition">Terms of Service</a></li>
                </ul>
              </div>
              <div>
                <div className="font-bold text-slate-700 mb-2.5 text-xs uppercase tracking-wider">Company</div>
                <ul className="space-y-2 text-slate-500">
                  <li><a href="/contact" className="hover:text-slate-900 transition">Contact</a></li>
                  <li>
                    <a href="https://github.com/harshagrawal909" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition">GitHub</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-400">
            <span>© {new Date().getFullYear()} SpendWise. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-300">·</span>
            <div className="flex gap-5">
              <a href="/privacy" className="hover:text-slate-600 transition">Privacy</a>
              <a href="/terms" className="hover:text-slate-600 transition">Terms</a>
              <a href="/contact" className="hover:text-slate-600 transition">Contact</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
