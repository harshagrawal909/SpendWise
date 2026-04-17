const variants = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-indigo-100 text-indigo-800",
};

export default function Badge({ variant = "default", className = "", ...props }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variants[variant] ?? variants.default,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

