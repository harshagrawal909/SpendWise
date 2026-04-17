export default function Spinner({ className = "" }) {
  return (
    <span
      className={[
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Loading"
      role="status"
    />
  );
}

