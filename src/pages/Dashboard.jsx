
import { memo, useMemo, useRef, useState } from "react";

import {
  formatMoney,
  formatNumber,
  formatNepaliDate,
  formatNepaliDateISO,
  getInitials,
  getNepaliDateKey,
  getNepaliMonthKey,
  today,
} from "../utils/format";

import {
  getCustomerPayments,
  getDeliveryTotal,
} from "../utils/data";

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
  /* =======================================================
     CURRENT DATE / MONTH
     ======================================================= */

  const todayDate = today();

  const todayBsKey = getNepaliDateKey(todayDate);
  const currentBsMonthKey =
    getNepaliMonthKey(todayDate);

  /* =======================================================
     DASHBOARD STATS
     ======================================================= */

  const stats = useMemo(() => {
    const todayDeliveries = deliveries.filter(
      (delivery) =>
        String(delivery.date || "").slice(0, 10) ===
        todayDate
    );

    const todayRevenue = todayDeliveries.reduce(
      (sum, delivery) =>
        sum + getDeliveryTotal(delivery),
      0
    );

    const currentMonthDeliveries = deliveries.filter(
      (delivery) =>
        getNepaliMonthKey(
          String(delivery.date || "").slice(0, 10)
        ) === currentBsMonthKey
    );

    const currentMonthRevenue =
      currentMonthDeliveries.reduce(
        (sum, delivery) =>
          sum + getDeliveryTotal(delivery),
        0
      );

    const totalBilled = deliveries.reduce(
      (sum, delivery) =>
        sum + getDeliveryTotal(delivery),
      0
    );

    const totalPaid = payments.reduce(
      (sum, payment) =>
        sum + (Number(payment.amount) || 0),
      0
    );

    const totalLiters = deliveries.reduce(
      (sum, delivery) =>
        sum + (Number(delivery.quantity) || 0),
      0
    );

    const pendingDeliveries = deliveries.filter(
      (delivery) =>
        delivery.status !== "delivered"
    ).length;

    return {
      customers: customers.length,
      deliveries: deliveries.length,
      totalLiters,
      totalBilled,
      totalPaid,
      outstanding: Math.max(
        0,
        totalBilled - totalPaid
      ),
      todayDeliveries: todayDeliveries.length,
      todayRevenue,
      currentMonthRevenue,
      currentMonthDeliveries:
        currentMonthDeliveries.length,
      todayBsKey,
      currentBsMonthKey,
      pendingDeliveries,
    };
  }, [
    customers,
    deliveries,
    payments,
    todayDate,
    todayBsKey,
    currentBsMonthKey,
  ]);

  /* =======================================================
     DAILY REVENUE HISTORY
     ======================================================= */

  const dailyRevenue = useMemo(() => {
    const grouped = new Map();

    deliveries.forEach((delivery) => {
      const date = String(
        delivery.date || delivery.createdAt || ""
      ).slice(0, 10);

      if (!date) {
        return;
      }

      const existing = grouped.get(date);

      if (existing) {
        existing.revenue += getDeliveryTotal(
          delivery
        );

        existing.deliveries += 1;
      } else {
        grouped.set(date, {
          date,
          revenue: getDeliveryTotal(delivery),
          deliveries: 1,
        });
      }
    });

    return [...grouped.values()].sort(
      (a, b) =>
        new Date(b.date) -
        new Date(a.date)
    );
  }, [deliveries]);

  /* =======================================================
     MONTHLY REVENUE HISTORY
     ======================================================= */

  const monthlyRevenue = useMemo(() => {
    const grouped = new Map();

    deliveries.forEach((delivery) => {
      const date = String(
        delivery.date || delivery.createdAt || ""
      ).slice(0, 10);

      if (!date) {
        return;
      }

      const monthKey =
        getNepaliMonthKey(date);

      if (!monthKey) {
        return;
      }

      const existing = grouped.get(monthKey);

      if (existing) {
        existing.revenue += getDeliveryTotal(
          delivery
        );

        existing.deliveries += 1;
      } else {
        grouped.set(monthKey, {
          monthKey,
          revenue: getDeliveryTotal(delivery),
          deliveries: 1,
          sampleDate: date,
        });
      }
    });

    return [...grouped.values()].sort(
      (a, b) =>
        String(b.monthKey).localeCompare(
          String(a.monthKey)
        )
    );
  }, [deliveries]);

  /* =======================================================
     CUSTOMER BALANCES
     ======================================================= */

  const [expandedCustomerId, setExpandedCustomerId] =
    useState(null);

  const customerBalances = useMemo(() => {
    return customers
      .map((customer) => {
        const customerDeliveries =
          deliveries.filter(
            (delivery) =>
              String(delivery.customerId) ===
              String(customer.id)
          );

        const billed =
          customerDeliveries.reduce(
            (sum, delivery) =>
              sum + getDeliveryTotal(delivery),
            0
          );

        const paid = getCustomerPayments(
          payments,
          customer.id
        );

        const liters =
          customerDeliveries.reduce(
            (sum, delivery) =>
              sum +
              (Number(delivery.quantity) || 0),
            0
          );

        return {
          customer,
          deliveryCount:
            customerDeliveries.length,
          liters,
          billed,
          paid,
          outstanding: Math.max(
            0,
            billed - paid
          ),
        };
      })
      .sort(
        (a, b) =>
          b.outstanding - a.outstanding
      );
  }, [customers, deliveries, payments]);

  const toggleCustomer = (id) => {
    setExpandedCustomerId((current) =>
      current === id ? null : id
    );
  };

  /* =======================================================
     SCROLL TO BALANCES
     ======================================================= */

  const balancesRef = useRef(null);

  const scrollToBalances = () => {
    balancesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      {/* ===================================================
          PAGE HEADER
          =================================================== */}

      <div className="page-header">
        <div>
          <h2>Dashboard</h2>

          <p className="welcome">
            Welcome to AquaFlow
          </p>

          <p className="welcome">
            {formatNepaliDate(todayDate)}
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onNewDelivery}
        >
          + New Delivery
        </button>
      </div>

      {/* ===================================================
          MAIN STAT CARDS
          =================================================== */}

      <div className="dashboard-cards">
        <DashboardCard
          icon="👥"
          title="Customers"
          value={stats.customers}
          onClick={() =>
            onNavigate("Customers")
          }
        />

        <DashboardCard
          icon="🚚"
          title="Total Deliveries"
          value={stats.deliveries}
          onClick={() =>
            onNavigate("Deliveries")
          }
        />

        <DashboardCard
          icon="⏳"
          title="Pending Deliveries"
          value={stats.pendingDeliveries}
          onClick={() =>
            onNavigate("Deliveries")
          }
        />

        <DashboardCard
          icon="💧"
          title="Total Liters"
          value={formatNumber(
            stats.totalLiters
          )}
          onClick={() =>
            onNavigate("Reports")
          }
        />

        <DashboardCard
          icon="💰"
          title="Total Billed"
          value={`Rs. ${formatMoney(
            stats.totalBilled
          )}`}
          onClick={() =>
            onNavigate("Reports")
          }
        />

        <DashboardCard
          icon="✅"
          title="Total Paid"
          value={`Rs. ${formatMoney(
            stats.totalPaid
          )}`}
          onClick={() =>
            onNavigate("Payments")
          }
        />

        <DashboardCard
          icon="⚠️"
          title="Outstanding"
          value={`Rs. ${formatMoney(
            stats.outstanding
          )}`}
          onClick={scrollToBalances}
        />

        <DashboardCard
          icon="📦"
          title="Today's Deliveries"
          value={stats.todayDeliveries}
          onClick={() =>
            onNavigate("Deliveries")
          }
        />

        <DashboardCard
          icon="💵"
          title="Today's Revenue"
          value={`Rs. ${formatMoney(
            stats.todayRevenue
          )}`}
          onClick={() =>
            onNavigate("Reports")
          }
        />

        <DashboardCard
          icon="📅"
          title="This Month"
          value={`Rs. ${formatMoney(
            stats.currentMonthRevenue
          )}`}
          onClick={() =>
            onNavigate("Reports")
          }
        />
      </div>

      {/* ===================================================
          CURRENT PERIOD
          =================================================== */}

      <div className="customer-form-card">
        <div className="form-header">
          <div>
            <h3>
              📅 Current Revenue Period
            </h3>

            <p>
              Revenue for the current
              Bikram Sambat month.
            </p>
          </div>
        </div>

        <div className="delivery-total-preview">
          <div>
            <span>Today</span>

            <strong>
              {formatNepaliDate(todayDate)}
            </strong>
          </div>

          <div>
            <span>Today Revenue</span>

            <strong>
              Rs.{" "}
              {formatMoney(
                stats.todayRevenue
              )}
            </strong>
          </div>

          <div>
            <span>Current Month</span>

            <strong>
              {monthlyRevenue.length
                ? formatNepaliDate(
                    monthlyRevenue[0]
                      .sampleDate
                  ).replace(
                    /\d+/u,
                    ""
                  )
                : "—"}
            </strong>
          </div>

          <div className="total-highlight">
            <span>Month Revenue</span>

            <strong>
              Rs.{" "}
              {formatMoney(
                stats.currentMonthRevenue
              )}
            </strong>
          </div>
        </div>
      </div>

      {/* ===================================================
          DAILY REVENUE HISTORY
          =================================================== */}

      <div className="customer-form-card">
        <div className="form-header">
          <div>
            <h3>
              📊 Daily Revenue
            </h3>

            <p>
              Revenue is kept separately for
              every day.
            </p>
          </div>
        </div>

        {dailyRevenue.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              📊
            </div>

            <h3>
              No revenue history
            </h3>

            <p>
              Delivery revenue will appear
              here as records are added.
            </p>
          </div>
        ) : (
          <div className="customers-list">
            {dailyRevenue.map((item) => (
              <div
                className="customer-card"
                key={item.date}
              >
                <div className="customer-avatar">
                  📅
                </div>

                <div className="customer-info">
                  <h3>
                    {formatNepaliDate(
                      item.date
                    )}
                  </h3>

                  <div className="customer-details">
                    <span>
                      🚚 {item.deliveries}{" "}
                      deliveries
                    </span>

                    <span>
                      📅{" "}
                      {formatNepaliDateISO(
                        item.date
                      )}
                    </span>
                  </div>
                </div>

                <div className="customer-actions">
                  <strong>
                    Rs.{" "}
                    {formatMoney(
                      item.revenue
                    )}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===================================================
          MONTHLY REVENUE HISTORY
          =================================================== */}

      <div className="customer-form-card">
        <div className="form-header">
          <div>
            <h3>
              📆 Monthly Revenue
            </h3>

            <p>
              Revenue grouped by Bikram Sambat
              month.
            </p>
          </div>
        </div>

        {monthlyRevenue.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              📆
            </div>

            <h3>
              No monthly revenue
            </h3>

            <p>
              Monthly totals will appear
              here automatically.
            </p>
          </div>
        ) : (
          <div className="customers-list">
            {monthlyRevenue.map((item) => (
              <div
                className="customer-card"
                key={item.monthKey}
              >
                <div className="customer-avatar">
                  📆
                </div>

                <div className="customer-info">
                  <h3>
                    {
                      formatNepaliDate(
                        item.sampleDate
                      )
                        .replace(
                          /\s+\d+\s*$/u,
                          ""
                        )
                    }
                  </h3>

                  <div className="customer-details">
                    <span>
                      🚚 {item.deliveries}{" "}
                      deliveries
                    </span>

                    <span>
                      BS{" "}
                      {item.monthKey}
                    </span>
                  </div>
                </div>

                <div className="customer-actions">
                  <strong>
                    Rs.{" "}
                    {formatMoney(
                      item.revenue
                    )}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===================================================
          CUSTOMER BALANCES
          =================================================== */}

      <div
        className="customer-form-card"
        ref={balancesRef}
      >
        <div className="form-header">
          <div>
            <h3>
              👥 Customer Balances
            </h3>

            <p>
              Tap a customer to see their
              deliveries, payments and
              outstanding balance.
            </p>
          </div>
        </div>

        {customerBalances.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              👥
            </div>

            <h3>
              No customers yet
            </h3>

            <p>
              Add a customer to start
              tracking balances here.
            </p>
          </div>
        ) : (
          <div className="customers-list">
            {customerBalances.map((item) => {
              const isExpanded =
                expandedCustomerId ===
                item.customer.id;

              return (
                <div
                  className="customer-card"
                  key={item.customer.id}
                  onClick={() =>
                    toggleCustomer(
                      item.customer.id
                    )
                  }
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <div className="customer-avatar">
                    {getInitials(
                      item.customer.name
                    )}
                  </div>

                  <div className="customer-info">
                    <h3>
                      {item.customer.name}
                    </h3>

                    <div className="customer-details">
                      {item.outstanding > 0 ? (
                        <span>
                          ⚠️ Due: Rs.{" "}
                          {formatMoney(
                            item.outstanding
                          )}
                        </span>
                      ) : (
                        <span>
                          ✅ Fully paid
                        </span>
                      )}

                      {!isExpanded && (
                        <span>
                          🚚{" "}
                          {item.deliveryCount}{" "}
                          deliveries
                        </span>
                      )}
                    </div>

                    {isExpanded && (
                      <div
                        className="customer-details"
                        style={{
                          marginTop: 8,
                        }}
                      >
                        <span>
                          🚚{" "}
                          {item.deliveryCount}{" "}
                          deliveries
                        </span>

                        <span>
                          💧{" "}
                          {formatNumber(
                            item.liters
                          )}{" "}
                          L
                        </span>

                        <span>
                          💰 Billed: Rs.{" "}
                          {formatMoney(
                            item.billed
                          )}
                        </span>

                        <span>
                          ✅ Paid: Rs.{" "}
                          {formatMoney(
                            item.paid
                          )}
                        </span>

                        {item.outstanding >
                          0 && (
                          <button
                            type="button"
                            className="secondary-button"
                            style={{
                              padding:
                                "6px 10px",
                              fontSize: 12,
                              marginTop: 6,
                            }}
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();
                              onQuickPayment(
                                item.customer.id
                              );
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
                    {isExpanded
                      ? "▲"
                      : "▾"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================================================
          QUICK ACTIONS
          =================================================== */}

      <div className="coming-soon">
        <div className="coming-soon-icon">
          ⚡
        </div>

        <h3>
          Quick Actions
        </h3>

        <p>
          Quickly access the main AquaFlow
          features.
        </p>

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
            onClick={() =>
              onNavigate("Customers")
            }
          >
            👥 Customers
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              onNavigate("Deliveries")
            }
          >
            🚚 Deliveries
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              onNavigate("Payments")
            }
          >
            💰 Payments
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              onNavigate("Reports")
            }
          >
            📈 Reports
          </button>
        </div>
      </div>
    </>
  );
});

export default Dashboard;
