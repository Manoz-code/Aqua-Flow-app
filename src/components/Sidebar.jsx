import { memo } from "react";

const Sidebar = memo(function Sidebar({
  activePage,
  onNavigate,
  isOpen,
  onClose,
}) {
  const items = [
    ["Dashboard", "📊"],
    ["Customers", "👥"],
    ["Deliveries", "🚚"],
    ["Payments", "💰"],
    ["Reports", "📈"],
    ["Settings", "⚙️"],
  ];

  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-header">
        <strong>Menu</strong>

        <button
          type="button"
          className="sidebar-close-button"
          aria-label="Close navigation"
          onClick={onClose}
        >
          ×
        </button>
      </div>

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