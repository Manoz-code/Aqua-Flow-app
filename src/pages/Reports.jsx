import { useMemo, useState } from "react";
import {
  formatMoney,
  formatNumber,
  getInitials,
} from "../utils/format";

import NepaliDateInput from "../components/NepaliDateInput";
import { getDeliveryTotal } from "../utils/data";
import DashboardCard from "../components/DashboardCard";

/* =========================================================
   REPORTS
   ========================================================= */

function Reports({ customers, deliveries, payments }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((delivery) => {
      const date = String(delivery.date || "").slice(0, 10);

      if (fromDate && date < fromDate) {
        return false;
      }

      if (toDate && date > toDate) {
        return false;
      }

      return true;
    });
  }, [deliveries, fromDate, toDate]);

  const report = useMemo(() => {
    const totalLiters = filteredDeliveries.reduce(
      (sum, delivery) => sum + (Number(delivery.quantity) || 0),
      0
    );

    const totalBilled = filteredDeliveries.reduce(
      (sum, delivery) => sum + getDeliveryTotal(delivery),
      0
    );

    const deliveryIds = new Set(
      filteredDeliveries.map((delivery) => String(delivery.id))
    );

    const filteredPayments = payments.filter((payment) => {
      if (payment.deliveryId && deliveryIds.has(String(payment.deliveryId))) {
        return true;
      }

      const date = String(payment.date || "").slice(0, 10);

      if (fromDate && date < fromDate) {
        return false;
      }

      if (toDate && date > toDate) {
        return false;
      }

      return true;
    });

    const totalPaid = filteredPayments.reduce(
      (sum, payment) => sum + (Number(payment.amount) || 0),
      0
    );

    return {
      totalLiters,
      totalBilled,
      totalPaid,
      outstanding: Math.max(0, totalBilled - totalPaid),
      deliveries: filteredDeliveries.length,
      payments: filteredPayments.length,
    };
  }, [filteredDeliveries, payments, fromDate, toDate]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p className="welcome">View AquaFlow business summaries</p>
        </div>
      </div>

      <div className="customer-form-card">
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
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
          >
            Clear Filter
          </button>
        </div>
      </div>

      <div className="dashboard-cards">
        <DashboardCard icon="🚚" title="Deliveries" value={report.deliveries} />
        <DashboardCard
          icon="💧"
          title="Total Liters"
          value={`${formatNumber(report.totalLiters)} L`}
        />
        <DashboardCard
          icon="💰"
          title="Total Billed"
          value={`Rs. ${formatMoney(report.totalBilled)}`}
        />
        <DashboardCard
          icon="✅"
          title="Total Paid"
          value={`Rs. ${formatMoney(report.totalPaid)}`}
        />
        <DashboardCard
          icon="⚠️"
          title="Outstanding"
          value={`Rs. ${formatMoney(report.outstanding)}`}
        />
        <DashboardCard icon="💳" title="Payments" value={report.payments} />
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">📊</div>
        <h3>Customer Summary</h3>
        <p>Customer-level report for the selected date range.</p>

        <div className="customers-list" style={{ marginTop: 20 }}>
          {customers
            .map((customer) => {
              const customerDeliveries = filteredDeliveries.filter(
                (delivery) => String(delivery.customerId) === String(customer.id)
              );

              if (customerDeliveries.length === 0) {
                return null;
              }

              const billed = customerDeliveries.reduce(
                (sum, delivery) => sum + getDeliveryTotal(delivery),
                0
              );

              const paid = payments
                .filter((payment) => {
                  const customerMatch =
                    String(payment.customerId) === String(customer.id);

                  if (!customerMatch) {
                    return false;
                  }

                  const date = String(payment.date || "").slice(0, 10);

                  if (fromDate && date < fromDate) {
                    return false;
                  }

                  if (toDate && date > toDate) {
                    return false;
                  }

                  return true;
                })
                .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

              const liters = customerDeliveries.reduce(
                (sum, delivery) => sum + (Number(delivery.quantity) || 0),
                0
              );

              return (
                <div className="customer-card" key={customer.id}>
                  <div className="customer-avatar">
                    {getInitials(customer.name)}
                  </div>

                  <div className="customer-info">
                    <h3>{customer.name}</h3>

                    <div className="customer-details">
                      <span>💧 {formatNumber(liters)} L</span>
                      <span>💰 Billed: Rs. {formatMoney(billed)}</span>
                      <span>✅ Paid: Rs. {formatMoney(paid)}</span>
                      <span>
                        ⚠️ Due: Rs. {formatMoney(Math.max(0, billed - paid))}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
            .filter(Boolean)}
        </div>
      </div>
    </>
  );
}

export default Reports;
