
import { useMemo, useState } from "react";

import {
  formatMoney,
  formatNumber,
  formatNepaliDate,
  formatNepaliDateISO,
  getInitials,
  getNepaliDateParts,
  getNepaliMonthKey,
} from "../utils/format";

import { getDeliveryTotal } from "../utils/data";
import DashboardCard from "../components/DashboardCard";
import NepaliDateInput from "../components/NepaliDateInput";

/* =========================================================
   REPORTS
   ========================================================= */

function Reports({
  customers,
  deliveries,
  payments,
}) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [historyView, setHistoryView] =
    useState("daily");

  /* =======================================================
     FILTERED DELIVERIES
     ======================================================= */

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((delivery) => {
      const date = String(
        delivery.date || ""
      ).slice(0, 10);

      if (!date) {
        return false;
      }

      if (fromDate && date < fromDate) {
        return false;
      }

      if (toDate && date > toDate) {
        return false;
      }

      return true;
    });
  }, [deliveries, fromDate, toDate]);

  /* =======================================================
     FILTERED PAYMENTS
     ======================================================= */

  const filteredPayments = useMemo(() => {
    const deliveryIds = new Set(
      filteredDeliveries.map((delivery) =>
        String(delivery.id)
      )
    );

    return payments.filter((payment) => {
      /*
       * Delivery-linked payments follow the
       * selected delivery range.
       */
      if (
        payment.deliveryId &&
        deliveryIds.has(String(payment.deliveryId))
      ) {
        return true;
      }

      const date = String(
        payment.date || ""
      ).slice(0, 10);

      if (!date) {
        return false;
      }

      if (fromDate && date < fromDate) {
        return false;
      }

      if (toDate && date > toDate) {
        return false;
      }

      return true;
    });
  }, [
    filteredDeliveries,
    payments,
    fromDate,
    toDate,
  ]);

  /* =======================================================
     REPORT SUMMARY
     ======================================================= */

  const report = useMemo(() => {
    const totalLiters =
      filteredDeliveries.reduce(
        (sum, delivery) =>
          sum +
          (Number(delivery.quantity) || 0),
        0
      );

    const totalBilled =
      filteredDeliveries.reduce(
        (sum, delivery) =>
          sum + getDeliveryTotal(delivery),
        0
      );

    const totalPaid =
      filteredPayments.reduce(
        (sum, payment) =>
          sum +
          (Number(payment.amount) || 0),
        0
      );

    return {
      totalLiters,
      totalBilled,
      totalPaid,
      outstanding: Math.max(
        0,
        totalBilled - totalPaid
      ),
      deliveries:
        filteredDeliveries.length,
      payments:
        filteredPayments.length,
    };
  }, [
    filteredDeliveries,
    filteredPayments,
  ]);

  /* =======================================================
     DAILY HISTORY
     ======================================================= */

  const dailyHistory = useMemo(() => {
    const grouped = new Map();

    filteredDeliveries.forEach(
      (delivery) => {
        const date = String(
          delivery.date || ""
        ).slice(0, 10);

        if (!date) {
          return;
        }

        const current =
          grouped.get(date) || {
            key: date,
            sampleDate: date,
            revenue: 0,
            deliveries: 0,
            liters: 0,
            paid: 0,
          };

        current.revenue +=
          getDeliveryTotal(delivery);

        current.deliveries += 1;

        current.liters +=
          Number(delivery.quantity) || 0;

        grouped.set(date, current);
      }
    );

    /*
     * Add payments by their own payment date.
     */
    filteredPayments.forEach((payment) => {
      const date = String(
        payment.date || ""
      ).slice(0, 10);

      if (!date) {
        return;
      }

      const current =
        grouped.get(date) || {
          key: date,
          sampleDate: date,
          revenue: 0,
          deliveries: 0,
          liters: 0,
          paid: 0,
        };

      current.paid +=
        Number(payment.amount) || 0;

      grouped.set(date, current);
    });

    return [...grouped.values()].sort(
      (a, b) =>
        new Date(b.sampleDate) -
        new Date(a.sampleDate)
    );
  }, [
    filteredDeliveries,
    filteredPayments,
  ]);

  /* =======================================================
     MONTHLY HISTORY
     ======================================================= */

  const monthlyHistory = useMemo(() => {
    const grouped = new Map();

    filteredDeliveries.forEach(
      (delivery) => {
        const date = String(
          delivery.date || ""
        ).slice(0, 10);

        if (!date) {
          return;
        }

        const monthKey =
          getNepaliMonthKey(date);

        if (!monthKey) {
          return;
        }

        const current =
          grouped.get(monthKey) || {
            key: monthKey,
            sampleDate: date,
            revenue: 0,
            deliveries: 0,
            liters: 0,
            paid: 0,
          };

        current.revenue +=
          getDeliveryTotal(delivery);

        current.deliveries += 1;

        current.liters +=
          Number(delivery.quantity) || 0;

        grouped.set(
          monthKey,
          current
        );
      }
    );

    /*
     * Payments are grouped into their
     * own Nepali month.
     */
    filteredPayments.forEach((payment) => {
      const date = String(
        payment.date || ""
      ).slice(0, 10);

      if (!date) {
        return;
      }

      const monthKey =
        getNepaliMonthKey(date);

      if (!monthKey) {
        return;
      }

      const current =
        grouped.get(monthKey) || {
          key: monthKey,
          sampleDate: date,
          revenue: 0,
          deliveries: 0,
          liters: 0,
          paid: 0,
        };

      current.paid +=
        Number(payment.amount) || 0;

      grouped.set(
        monthKey,
        current
      );
    });

    return [...grouped.values()].sort(
      (a, b) =>
        String(b.key).localeCompare(
          String(a.key)
        )
    );
  }, [
    filteredDeliveries,
    filteredPayments,
  ]);

  /* =======================================================
     YEARLY HISTORY
     ======================================================= */

  const yearlyHistory = useMemo(() => {
    const grouped = new Map();

    const addYearRecord = (
      year,
      date
    ) => {
      const current =
        grouped.get(year) || {
          key: year,
          sampleDate: date,
          revenue: 0,
          deliveries: 0,
          liters: 0,
          paid: 0,
        };

      grouped.set(year, current);

      return current;
    };

    filteredDeliveries.forEach(
      (delivery) => {
        const date = String(
          delivery.date || ""
        ).slice(0, 10);

        if (!date) {
          return;
        }

        const parts =
          getNepaliDateParts(date);

        if (!parts) {
          return;
        }

        const current =
          addYearRecord(
            parts.year,
            date
          );

        current.revenue +=
          getDeliveryTotal(delivery);

        current.deliveries += 1;

        current.liters +=
          Number(delivery.quantity) || 0;
      }
    );

    filteredPayments.forEach((payment) => {
      const date = String(
        payment.date || ""
      ).slice(0, 10);

      if (!date) {
        return;
      }

      const parts =
        getNepaliDateParts(date);

      if (!parts) {
        return;
      }

      const current =
        addYearRecord(
          parts.year,
          date
        );

      current.paid +=
        Number(payment.amount) || 0;
    });

    return [...grouped.values()].sort(
      (a, b) => b.key - a.key
    );
  }, [
    filteredDeliveries,
    filteredPayments,
  ]);

  /* =======================================================
     CUSTOMER SUMMARY
     ======================================================= */

  const customerSummary = useMemo(() => {
    return customers
      .map((customer) => {
        const customerDeliveries =
          filteredDeliveries.filter(
            (delivery) =>
              String(
                delivery.customerId
              ) ===
              String(customer.id)
          );

        if (
          customerDeliveries.length === 0
        ) {
          return null;
        }

        const billed =
          customerDeliveries.reduce(
            (sum, delivery) =>
              sum +
              getDeliveryTotal(
                delivery
              ),
            0
          );

        const paid =
          filteredPayments
            .filter(
              (payment) =>
                String(
                  payment.customerId
                ) ===
                String(customer.id)
            )
            .reduce(
              (sum, payment) =>
                sum +
                (Number(
                  payment.amount
                ) || 0),
              0
            );

        const liters =
          customerDeliveries.reduce(
            (sum, delivery) =>
              sum +
              (Number(
                delivery.quantity
              ) || 0),
            0
          );

        return {
          customer,
          deliveries:
            customerDeliveries.length,
          liters,
          billed,
          paid,
          outstanding:
            Math.max(
              0,
              billed - paid
            ),
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          b.outstanding -
          a.outstanding
      );
  }, [
    customers,
    filteredDeliveries,
    filteredPayments,
  ]);

  /* =======================================================
     CLEAR FILTER
     ======================================================= */

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
  };

  /* =======================================================
     HISTORY DATA
     ======================================================= */

  const activeHistory =
    historyView === "daily"
      ? dailyHistory
      : historyView === "monthly"
      ? monthlyHistory
      : yearlyHistory;

  /* =======================================================
     HISTORY TITLE
     ======================================================= */

  const historyTitle =
    historyView === "daily"
      ? "Daily Revenue"
      : historyView === "monthly"
      ? "Monthly Revenue"
      : "Yearly Revenue";

  const historyDescription =
    historyView === "daily"
      ? "Revenue and payments grouped by each Nepali date."
      : historyView === "monthly"
      ? "Revenue and payments grouped by Bikram Sambat month."
      : "Revenue and payments grouped by Bikram Sambat year.";

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="page-header">
        <div>
          <h2>Reports</h2>

          <p className="welcome">
            View AquaFlow business summaries
            and historical revenue.
          </p>
        </div>
      </div>

      {/* ===================================================
          DATE FILTER
          =================================================== */}

      <div className="customer-form-card">
        <div className="form-header">
          <div>
            <h3>
              📅 Date Range
            </h3>

            <p>
              Filter reports using the Nepali
              calendar.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <NepaliDateInput
            value={fromDate}
            onChange={setFromDate}
            label="From Date"
          />

          <NepaliDateInput
            value={toDate}
            onChange={setToDate}
            label="To Date"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={clearFilters}
          >
            Clear Filter
          </button>
        </div>
      </div>

      {/* ===================================================
          SUMMARY CARDS
          =================================================== */}

      <div className="dashboard-cards">
        <DashboardCard
          icon="🚚"
          title="Deliveries"
          value={report.deliveries}
        />

        <DashboardCard
          icon="💧"
          title="Total Liters"
          value={`${formatNumber(
            report.totalLiters
          )} L`}
        />

        <DashboardCard
          icon="💰"
          title="Total Billed"
          value={`Rs. ${formatMoney(
            report.totalBilled
          )}`}
        />

        <DashboardCard
          icon="✅"
          title="Total Paid"
          value={`Rs. ${formatMoney(
            report.totalPaid
          )}`}
        />

        <DashboardCard
          icon="⚠️"
          title="Outstanding"
          value={`Rs. ${formatMoney(
            report.outstanding
          )}`}
        />

        <DashboardCard
          icon="💳"
          title="Payments"
          value={report.payments}
        />
      </div>

      {/* ===================================================
          REVENUE HISTORY
          =================================================== */}

      <div className="customer-form-card">
        <div className="form-header">
          <div>
            <h3>
              📊 Revenue History
            </h3>

            <p>
              {historyDescription}
            </p>
          </div>
        </div>

        <div className="preset-buttons">
          <button
            type="button"
            className={`preset-button ${
              historyView === "daily"
                ? "selected"
                : ""
            }`}
            onClick={() =>
              setHistoryView("daily")
            }
          >
            Daily
          </button>

          <button
            type="button"
            className={`preset-button ${
              historyView === "monthly"
                ? "selected"
                : ""
            }`}
            onClick={() =>
              setHistoryView(
                "monthly"
              )
            }
          >
            Monthly
          </button>

          <button
            type="button"
            className={`preset-button ${
              historyView === "yearly"
                ? "selected"
                : ""
            }`}
            onClick={() =>
              setHistoryView("yearly")
            }
          >
            Yearly
          </button>
        </div>

        {activeHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              📊
            </div>

            <h3>
              No revenue history
            </h3>

            <p>
              Revenue records will appear
              here as deliveries are added.
            </p>
          </div>
        ) : (
          <div className="customers-list">
            {activeHistory.map(
              (item) => {
                const displayDate =
                  formatNepaliDate(
                    item.sampleDate
                  );

                let title =
                  displayDate;

                if (
                  historyView ===
                  "monthly"
                ) {
                  title =
                    displayDate
                      .split(" ")
                      .slice(1)
                      .join(" ");
                }

                if (
                  historyView ===
                  "yearly"
                ) {
                  title =
                    formatNepaliDateISO(
                      item.sampleDate
                    ).slice(0, 4);
                }

                return (
                  <div
                    className="customer-card"
                    key={item.key}
                  >
                    <div className="customer-avatar">
                      {historyView ===
                      "daily"
                        ? "📅"
                        : historyView ===
                          "monthly"
                        ? "📆"
                        : "🗓️"}
                    </div>

                    <div className="customer-info">
                      <h3>
                        {title}
                      </h3>

                      <div className="customer-details">
                        <span>
                          💰 Revenue: Rs.{" "}
                          {formatMoney(
                            item.revenue
                          )}
                        </span>

                        <span>
                          ✅ Paid: Rs.{" "}
                          {formatMoney(
                            item.paid
                          )}
                        </span>

                        {historyView !==
                          "yearly" && (
                          <span>
                            🚚{" "}
                            {
                              item.deliveries
                            }{" "}
                            deliveries
                          </span>
                        )}

                        {historyView ===
                          "yearly" && (
                          <span>
                            🚚{" "}
                            {
                              item.deliveries
                            }{" "}
                            deliveries
                          </span>
                        )}

                        <span>
                          💧{" "}
                          {formatNumber(
                            item.liters
                          )}{" "}
                          L
                        </span>

                        {historyView ===
                          "daily" && (
                          <span>
                            📅{" "}
                            {formatNepaliDateISO(
                              item.sampleDate
                            )}
                          </span>
                        )}
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
                );
              }
            )}
          </div>
        )}
      </div>

      {/* ===================================================
          CUSTOMER SUMMARY
          =================================================== */}

      <div className="customer-form-card">
        <div className="form-header">
          <div>
            <h3>
              👥 Customer Summary
            </h3>

            <p>
              Customer-level report for the
              selected date range.
            </p>
          </div>
        </div>

        {customerSummary.length ===
        0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              👥
            </div>

            <h3>
              No customer records
            </h3>

            <p>
              No customer delivery records
              match the selected period.
            </p>
          </div>
        ) : (
          <div className="customers-list">
            {customerSummary.map(
              (item) => (
                <div
                  className="customer-card"
                  key={item.customer.id}
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
                      <span>
                        💧{" "}
                        {formatNumber(
                          item.liters
                        )}{" "}
                        L
                      </span>

                      <span>
                        🚚{" "}
                        {
                          item.deliveries
                        }{" "}
                        deliveries
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

                      <span>
                        ⚠️ Due: Rs.{" "}
                        {formatMoney(
                          item.outstanding
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* ===================================================
          FILTERED RANGE INFO
          =================================================== */}

      {(fromDate || toDate) && (
        <div className="coming-soon">
          <div className="coming-soon-icon">
            🔎
          </div>

          <h3>
            Current Filter
          </h3>

          <p>
            {fromDate
              ? `From ${formatNepaliDate(
                  fromDate
                )}`
              : "From beginning"}{" "}
            —{" "}
            {toDate
              ? `To ${formatNepaliDate(
                  toDate
                )}`
              : "To today"}
          </p>
        </div>
      )}
    </>
  );
}

export default Reports;
