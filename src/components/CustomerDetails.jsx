import { useMemo, useState } from "react";
import { formatMoney, formatNumber, getInitials } from "../utils/format";
import { getCustomerPayments, getDeliveryTotal } from "../utils/data";

function CustomerDetails({
  customer,
  deliveries,
  payments,
  onUpdate,
  onClose,
  onQuickPayment,
  onQuickDelivery,
}) {
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(
    String(Number(customer?.previousBalance) || 0)
  );

  const stats = useMemo(() => {
    if (!customer) {
      return {
        customerDeliveries: [],
        liters: 0,
        billed: 0,
        paid: 0,
        previousBalance: 0,
        outstanding: 0,
      };
    }

    const customerDeliveries = deliveries.filter(
      (delivery) =>
        String(delivery.customerId) === String(customer.id)
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

    const previousBalance =
      Number(customer.previousBalance) || 0;

    const outstanding = Math.max(
      0,
      previousBalance + billed - paid
    );

    return {
      customerDeliveries,
      liters,
      billed,
      paid,
      previousBalance,
      outstanding,
    };
  }, [customer, deliveries, payments]);

  if (!customer) {
    return null;
  }

 const handleSaveBalance = (event) => {
  event.preventDefault();
  event.stopPropagation();

  const value = Number(balanceInput);

  if (!Number.isFinite(value) || value < 0) {
    alert("Please enter a valid balance.");
    return;
  }

  onUpdate(customer.id, {
    previousBalance: value,
  });

  setBalanceInput(String(value));
  setEditingBalance(false);
};

  return (
    <div className="customer-form-card">
      <div className="form-header">
        <div>
          <h3>👤 Customer Details</h3>
          <p>Complete account and payment information.</p>
        </div>

        <button
          type="button"
          className="close-button"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 15,
          marginBottom: 20,
        }}
      >
        <div className="customer-avatar">
          {getInitials(customer.name)}
        </div>

        <div className="customer-info">
          <h3>{customer.name}</h3>

          <div className="customer-details">
            {customer.phone && (
              <span>📞 {customer.phone}</span>
            )}

            {customer.address && (
              <span>📍 {customer.address}</span>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="dashboard-card-title">
            🚚 Deliveries
          </div>
          <div className="dashboard-card-value">
            {stats.customerDeliveries.length}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">
            💧 Total Liters
          </div>
          <div className="dashboard-card-value">
            {formatNumber(stats.liters)}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">
            💰 Billed
          </div>
          <div className="dashboard-card-value">
            Rs. {formatMoney(stats.billed)}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">
            ✅ Paid
          </div>
          <div className="dashboard-card-value">
            Rs. {formatMoney(stats.paid)}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">
            📌 Previous Balance
          </div>

          {editingBalance ? (
            <div style={{ marginTop: 8 }}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={balanceInput}
                onChange={(event) =>
                  setBalanceInput(event.target.value)
                }
                style={{ width: "100%" }}
              />

              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginTop: 8,
                }}
              >
               <button
                type="button"
                className="primary-button"
                onClick={handleSaveBalance}
              >
                                Save
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setBalanceInput(
                      String(stats.previousBalance)
                    );
                    setEditingBalance(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="dashboard-card-value">
                Rs. {formatMoney(stats.previousBalance)}
              </div>

              <button
                type="button"
                className="secondary-button"
                style={{
                  marginTop: 8,
                  padding: "6px 10px",
                  fontSize: 12,
                }}
                onClick={() => {
                  setBalanceInput(
                    String(stats.previousBalance)
                  );
                  setEditingBalance(true);
                }}
              >
                ✏️ Edit
              </button>
            </>
          )}
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">
            ⚠️ Current Balance
          </div>

          <div className="dashboard-card-value">
            Rs. {formatMoney(stats.outstanding)}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onClose}
        >
          Close
        </button>

{onQuickDelivery && (
  <button
    type="button"
    className="secondary-button"
    onClick={() => onQuickDelivery(customer.id)}
  >
    🚚 Add Delivery
  </button>
)}

        {stats.outstanding > 0 && onQuickPayment && (
          <button
            type="button"
            className="primary-button"
            onClick={() => onQuickPayment(customer.id)}
          >
            💰 Record Payment
          </button>
        )}
      </div>
    </div>
  );
}

export default CustomerDetails;
