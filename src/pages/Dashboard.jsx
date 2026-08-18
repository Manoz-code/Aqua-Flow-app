import { memo, useMemo, useRef, useState } from "react";
import { formatMoney, formatNumber, getInitials, today } from "../utils/format";
import { getCustomerPayments, getDeliveryTotal } from "../utils/data";
import DashboardCard from "../components/DashboardCard";

/* =========================================================
   DASHBOARD
   ========================================================= */

const Dashboard = memo(function Dashboard({
  customers,
  deliveries,
  payments,
  onNavigate,
  onNewDelivery,
  onQuickPayment,
}) {
  const stats = useMemo(() => {
    const todayDate = today();

    const todayDeliveries = deliveries.filter(
      (delivery) => String(delivery.date || "").slice(0, 10) === todayDate
    );

    const todayRevenue = todayDeliveries.reduce(
      (sum, delivery) => sum + getDeliveryTotal(delivery),
      0
    );

    const totalBilled = deliveries.reduce(
      (sum, delivery) => sum + getDeliveryTotal(delivery),
      0
    );

    const totalPaid = payments.reduce(
      (sum, payment) => sum + (Number(payment.amount) || 0),
      0
    );

    const totalLiters = deliveries.reduce(
      (sum, delivery) => sum + (Number(delivery.quantity) || 0),
      0
    );

    const pendingDeliveries = deliveries.filter(
      (delivery) => delivery.status !== "delivered"
    ).length;

    return {
      customers: customers.length,
      deliveries: deliveries.length,
      totalLiters,
      totalBilled,
      totalPaid,
      outstanding: Math.max(0, totalBilled - totalPaid),
      todayDeliveries: todayDeliveries.length,
      todayRevenue,
      pendingDeliveries,
    };
  }, [customers, deliveries, payments]);

  const [expandedCustomerId, setExpandedCustomerId] = useState(null);

  const customerBalances = useMemo(() => {
    return customers
      .map((customer) => {
        const customerDeliveries = deliveries.filter(
          (delivery) => String(delivery.customerId) === String(customer.id)
        );

        const billed = customerDeliveries.reduce(
          (sum, delivery) => sum + getDeliveryTotal(delivery),
          0
        );

        const paid = getCustomerPayments(payments, customer.id);
        const liters = customerDeliveries.reduce(
          (sum, delivery) => sum + (Number(delivery.quantity) || 0),
          0
        );

        return {
          customer,
          deliveryCount: customerDeliveries.length,
          liters,
          billed,
          paid,
          outstanding: Math.max(0, billed - paid),
        };
      })
      /*
       * Customers who owe the most float to the top, so the
       * user can immediately see who to follow up with.
       */
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [customers, deliveries, payments]);

  const toggleCustomer = (id) => {
    setExpandedCustomerId((current) => (current === id ? null : id));
  };

  const balancesRef = useRef(null);

  const scrollToBalances = () => {
    balancesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="welcome">Welcome to AquaFlow</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onNewDelivery}
        >
          + New Delivery
        </button>
      </div>

      <div className="dashboard-cards">
        <DashboardCard
          icon="👥"
          title="Customers"
          value={stats.customers}
          onClick={() => onNavigate("Customers")}
        />
        <DashboardCard
          icon="🚚"
          title="Total Deliveries"
          value={stats.deliveries}
          onClick={() => onNavigate("Deliveries")}
        />
        <DashboardCard
          icon="⏳"
          title="Pending Deliveries"
          value={stats.pendingDeliveries}
          onClick={() => onNavigate("Deliveries")}
        />
        <DashboardCard
          icon="💧"
          title="Total Liters"
          value={formatNumber(stats.totalLiters)}
          onClick={() => onNavigate("Reports")}
        />
        <DashboardCard
          icon="💰"
          title="Total Billed"
          value={`Rs. ${formatMoney(stats.totalBilled)}`}
          onClick={() => onNavigate("Reports")}
        />
        <DashboardCard
          icon="✅"
          title="Total Paid"
          value={`Rs. ${formatMoney(stats.totalPaid)}`}
          onClick={() => onNavigate("Payments")}
        />
        <DashboardCard
          icon="⚠️"
          title="Outstanding"
          value={`Rs. ${formatMoney(stats.outstanding)}`}
          onClick={scrollToBalances}
        />
        <DashboardCard
          icon="📦"
          title="Today's Deliveries"
          value={stats.todayDeliveries}
          onClick={() => onNavigate("Deliveries")}
        />
        <DashboardCard
          icon="💵"
          title="Today's Revenue"
          value={`Rs. ${formatMoney(stats.todayRevenue)}`}
          onClick={() => onNavigate("Reports")}
        />
      </div>

      <div className="customer-form-card" ref={balancesRef}>
        <div className="form-header">
          <div>
            <h3>👥 Customer Balances</h3>
            <p>
              Tap a customer to see their deliveries, payments and
              outstanding balance.
            </p>
          </div>
        </div>

        {customerBalances.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No customers yet</h3>
            <p>Add a customer to start tracking balances here.</p>
          </div>
        ) : (
          <div className="customers-list">
            {customerBalances.map((item) => {
              const isExpanded = expandedCustomerId === item.customer.id;

              return (
                <div
                  className="customer-card"
                  key={item.customer.id}
                  onClick={() => toggleCustomer(item.customer.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="customer-avatar">
                    {getInitials(item.customer.name)}
                  </div>

                  <div className="customer-info">
                    <h3>{item.customer.name}</h3>

                    <div className="customer-details">
                      {item.outstanding > 0 ? (
                        <span>
                          ⚠️ Due: Rs. {formatMoney(item.outstanding)}
                        </span>
                      ) : (
                        <span>✅ Fully paid</span>
                      )}

                      {!isExpanded && (
                        <span>🚚 {item.deliveryCount} deliveries</span>
                      )}
                    </div>

                    {isExpanded && (
                      <div
                        className="customer-details"
                        style={{ marginTop: 8 }}
                      >
                        <span>🚚 {item.deliveryCount} deliveries</span>
                        <span>💧 {formatNumber(item.liters)} L</span>
                        <span>💰 Billed: Rs. {formatMoney(item.billed)}</span>
                        <span>✅ Paid: Rs. {formatMoney(item.paid)}</span>

                        {item.outstanding > 0 && (
                          <button
                            type="button"
                            className="secondary-button"
                            style={{
                              padding: "6px 10px",
                              fontSize: 12,
                              marginTop: 6,
                            }}
                            onClick={(event) => {
                                event.stopPropagation();
                                onQuickPayment(item.customer.id);
                              }}
                              >
                            💰 Record Payment
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: 18,
                      color: "#94a3b8",
                      alignSelf: "center",
                    }}
                  >
                    {isExpanded ? "▲" : "▾"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">⚡</div>
        <h3>Quick Actions</h3>
        <p>Quickly access the main AquaFlow features.</p>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 20,
          }}
        >
          <button
            type="button"
            className="secondary-button"
            onClick={() => onNavigate("Customers")}
          >
            👥 Customers
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => onNavigate("Deliveries")}
          >
            🚚 Deliveries
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => onNavigate("Payments")}
          >
            💰 Payments
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => onNavigate("Reports")}
          >
            📈 Reports
          </button>
        </div>
      </div>
    </>
  );
});

export default Dashboard;