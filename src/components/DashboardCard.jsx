import { memo } from "react";

const DashboardCard = memo(function DashboardCard({ icon, title, value, onClick }) {
  const isInteractive = typeof onClick === "function";

  return (
    <div
      className={`dashboard-card${isInteractive ? " dashboard-card-clickable" : ""}`}
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={isInteractive ? { cursor: "pointer" } : undefined}
    >
      <div className="card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
});

export default DashboardCard;