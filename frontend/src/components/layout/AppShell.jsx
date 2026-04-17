import Button from "../ui/Button";

export default function AppShell({ title, subtitle, right, onLogout, children }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-[rgb(var(--surface))]/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="min-w-0">
            <div className="truncate text-lg font-extrabold text-slate-900">
              {title}
            </div>
            {subtitle ? (
              <div className="truncate text-sm text-slate-500">{subtitle}</div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {right}
            {onLogout ? (
              <Button variant="outline" onClick={onLogout}>
                Logout
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

