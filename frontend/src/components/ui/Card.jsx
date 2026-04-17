export function Card({ className = "", ...props }) {
  return (
    <div
      className={[
        "rounded-[var(--radius)] border border-slate-200 bg-[rgb(var(--surface))] shadow-[var(--shadow)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return (
    <div
      className={["px-5 pt-5", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export function CardTitle({ className = "", ...props }) {
  return (
    <div
      className={["text-base font-bold text-slate-900", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function CardSubtitle({ className = "", ...props }) {
  return (
    <div
      className={["mt-1 text-sm text-slate-500", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function CardBody({ className = "", ...props }) {
  return (
    <div
      className={["px-5 pb-5 pt-4", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

