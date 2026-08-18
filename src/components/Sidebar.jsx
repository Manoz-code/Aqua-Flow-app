import { memo } from "react";

/* =========================================================
   SIDEBAR
   ========================================================= */

const Sidebar = memo(function Sidebar({ activePage, onNavigate }) {
  const items = [
    ["Dashboard", "📊"],
    ["Customers", "👥"],
    ["Deliveries", "🚚"],
    ["Payments", "💰"],
    ["Reports", "📈"],
    ["Settings", "⚙️"],
  ];

  return (
    <aside className="sidebar">
      <nav>
        {items.map(([name, icon]) => (
          <button
            key={name}
            type="button"
            className={activePage === name ? "active" : ""}
            onClick={() => onNavigate(name)}
          >
            <span>{icon}</span>
            {name}
          </button>
        ))}
      </nav>
    </aside>
  );
});

export default Sidebar;
