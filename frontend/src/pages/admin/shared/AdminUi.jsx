export function EmptyState({ icon = "∅", title, message }) {
  return (
    <div className="admin-empty-state">
      <span className="admin-empty-state__icon">{icon}</span>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
    </div>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="admin-grid admin-grid--4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="admin-card admin-skeleton admin-skeleton-card" />
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 5 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="admin-skeleton admin-skeleton-row" />
      ))}
    </div>
  );
}
