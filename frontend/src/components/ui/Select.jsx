export default function Select({
  label,
  hint,
  error,
  className = "",
  selectClassName = "",
  children,
  ...props
}) {
  return (
    <label className={["block", className].filter(Boolean).join(" ")}>
      {label ? (
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-800">{label}</span>
          {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
        </div>
      ) : null}

      <select
        className={[
          "h-11 w-full rounded-xl border bg-[rgb(var(--surface))] px-3 text-sm text-slate-900 shadow-sm transition",
          error ? "border-red-300" : "border-slate-200",
          "focus:border-indigo-300",
          selectClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {children}
      </select>

      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
    </label>
  );
}

