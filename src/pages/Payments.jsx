import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatMoney, formatNumber, getInitials, today } from "../utils/format";
import {
  getCustomerPayments,
  getDeliveryPayments,
  getDeliveryRemaining,
  getDeliveryTotal,
} from "../utils/data";
import CustomerPicker from "../components/CustomerPicker";

/* =========================================================
   PAYMENTS
   ========================================================= */

function Payments({
  customers,
  deliveries,
  payments,
  onAdd,
  onDelete,
  openFormSignal,
  prefillCustomerId,
  resetFormSignal,
  onFormStateChange,
}) {
  const getEmptyForm = () => ({
    customerId: "",
    deliveryId: "",
    amount: "",
    date: today(),
    notes: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(getEmptyForm());

  const formRef = useRef(null);

  useEffect(() => {
  onFormStateChange?.(showForm);
}, [showForm, onFormStateChange]);

useEffect(() => {
  if (!showForm) return;

  formRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}, [showForm, openFormSignal]);

useEffect(() => {
  setShowForm(false);
  setForm(getEmptyForm());
}, [resetFormSignal]);

useEffect(() => {
  if (!openFormSignal) return;

  setForm({
    ...getEmptyForm(),
    customerId: prefillCustomerId ? String(prefillCustomerId) : "",
  });

  setShowForm(true);
}, [openFormSignal, prefillCustomerId]);
  /*
   * Outstanding deliveries.
   *
   * These are displayed directly on the
   * Payments page so the user does not
   * have to search through all deliveries.
   */

  const outstandingDeliveries = useMemo(() => {
    return deliveries
      .map((delivery) => {
        const customer = customers.find(
          (item) => String(item.id) === String(delivery.customerId)
        );

        const total = getDeliveryTotal(delivery);
        const paid = getDeliveryPayments(payments, delivery.id);
        const remaining = Math.max(0, total - paid);

        return { delivery, customer, total, paid, remaining };
      })
      .filter((item) => item.remaining > 0)
      .sort(
        (a, b) =>
          new Date(b.delivery.date || b.delivery.createdAt) -
          new Date(a.delivery.date || a.delivery.createdAt)
      );
  }, [customers, deliveries, payments]);

  const selectedCustomerDeliveries = useMemo(() => {
    if (!form.customerId) {
      return [];
    }

    return deliveries.filter(
      (delivery) => String(delivery.customerId) === String(form.customerId)
    );
  }, [deliveries, form.customerId]);

  const customerBalances = useMemo(() => {
    return customers.map((customer) => {
      const billed = deliveries
        .filter((delivery) => String(delivery.customerId) === String(customer.id))
        .reduce((sum, delivery) => sum + getDeliveryTotal(delivery), 0);

      const paid = getCustomerPayments(payments, customer.id);

      return {
        customer,
        billed,
        paid,
        outstanding: Math.max(0, billed - paid),
      };
    });
  }, [customers, deliveries, payments]);

  const openPaymentForDelivery = useCallback((item) => {
    setForm({
      customerId: item.customer?.id || "",
      deliveryId: item.delivery.id,
      amount: item.remaining > 0 ? String(item.remaining) : "",
      date: today(),
      notes: "",
    });

    setShowForm(true);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.customerId) {
      alert("Please select a customer.");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }

    /*
     * If a specific delivery was selected,
     * prevent paying more than its remaining
     * balance.
     */

    if (form.deliveryId) {
      const delivery = deliveries.find(
        (item) => String(item.id) === String(form.deliveryId)
      );

      if (delivery) {
        const remaining = getDeliveryRemaining(delivery, payments);

        if (amount > remaining) {
          alert(`This delivery has only Rs. ${formatMoney(remaining)} remaining.`);
          return;
        }
      }
    }

    onAdd({
      customerId: form.customerId,
      deliveryId: form.deliveryId || null,
      amount,
      date: form.date || today(),
      notes: form.notes.trim(),
    });

    setForm(getEmptyForm());
    setShowForm(false);
  };

  const handleCustomerChange = useCallback((value) => {
    setForm((current) => ({
      ...current,
      customerId: value,
      deliveryId: "",
      amount: "",
    }));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Payments</h2>
          <p className="welcome">Record and track customer payments</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setForm(getEmptyForm());
            setShowForm(true);
          }}
        >
          + Record Payment
        </button>
      </div>

      {/* ===================================================
          OUTSTANDING DELIVERIES
          =================================================== */}

      <div className="customer-form-card">
        <div className="form-header">
          <div>
            <h3>💰 Outstanding Deliveries</h3>
            <p>Click Record Payment beside a delivery to record money received.</p>
          </div>
        </div>

        {outstandingDeliveries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>No outstanding deliveries</h3>
            <p>All delivery balances are currently paid.</p>
          </div>
        ) : (
          <div className="customers-list">
            {outstandingDeliveries.map((item) => (
              <div className="customer-card" key={item.delivery.id}>
                <div className="customer-avatar">
                  {getInitials(item.customer?.name)}
                </div>

                <div className="customer-info">
                  <h3>{item.customer?.name || "Unknown Customer"}</h3>

                  <div className="customer-details">
                    <span>📅 {item.delivery.date || "No date"}</span>
                    <span>💧 {formatNumber(item.delivery.quantity)} L</span>
                    <span>💰 Total: Rs. {formatMoney(item.total)}</span>
                    <span>✅ Paid: Rs. {formatMoney(item.paid)}</span>
                    <span>⚠️ Due: Rs. {formatMoney(item.remaining)}</span>
                  </div>
                </div>

                <div className="customer-actions">
                  <button
                    type="button"
                    className="primary-button"
                    style={{ padding: "9px 14px", fontSize: 13 }}
                    onClick={() => openPaymentForDelivery(item)}
                  >
                    💰 Record Payment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===================================================
          PAYMENT FORM
          =================================================== */}

      {showForm && (
        <form className="customer-form-card" ref={formRef} onSubmit={handleSubmit}>
          <div className="form-header">
            <div>
              <h3>Record Payment</h3>
              <p>Record money received from a customer.</p>
            </div>

            <button
              type="button"
              className="close-button"
              onClick={() => setShowForm(false)}
            >
              ×
            </button>
          </div>

          <div className="form-grid">
            {/* SAME CUSTOMER PICKER AS DELIVERY */}

            <CustomerPicker
              customers={customers}
              value={form.customerId}
              onChange={handleCustomerChange}
            />

            {/* DELIVERY */}

            <div className="form-group">
              <label>Delivery</label>

              <select
                value={form.deliveryId}
                onChange={(event) => {
                  const deliveryId = event.target.value;

                  const delivery = deliveries.find(
                    (item) => String(item.id) === String(deliveryId)
                  );

                  setForm((current) => ({
                    ...current,
                    deliveryId,
                    amount: delivery
                      ? String(getDeliveryRemaining(delivery, payments))
                      : "",
                  }));
                }}
                disabled={!form.customerId}
              >
                <option value="">General payment</option>

                {selectedCustomerDeliveries.map((delivery) => {
                  const remaining = getDeliveryRemaining(delivery, payments);

                  return (
                    <option key={delivery.id} value={delivery.id}>
                      {delivery.date} — {formatNumber(delivery.quantity)} L — Due
                      Rs. {formatMoney(remaining)}
                    </option>
                  );
                })}
              </select>

              <small className="input-help">
                Select a specific delivery or leave it as General payment.
              </small>
            </div>

            <div className="form-group">
              <label>Amount (Rs.) *</label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                placeholder="Payment amount"
              />
            </div>

            <div className="form-group">
              <label>Date</label>

              <input
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, date: event.target.value }))
                }
              />
            </div>

            <div className="form-group form-group-full">
              <label>Notes</label>

              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder="Optional notes..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>

            <button type="submit" className="primary-button">
              Save Payment
            </button>
          </div>
        </form>
      )}

      {/* ===================================================
          CUSTOMER BALANCES
          =================================================== */}

      <div className="customer-form-card">
        <div className="form-header">
          <div>
            <h3>Customer Balances</h3>
            <p>Overview of billed, paid and outstanding amounts.</p>
          </div>
        </div>

        <div className="customers-list">
          {customerBalances.map(({ customer, billed, paid, outstanding }) => (
            <div className="customer-card" key={customer.id}>
              <div className="customer-avatar">{getInitials(customer.name)}</div>

              <div className="customer-info">
                <h3>{customer.name}</h3>

                <div className="customer-details">
                  <span>Billed: Rs. {formatMoney(billed)}</span>
                  <span>Paid: Rs. {formatMoney(paid)}</span>
                  <span>Due: Rs. {formatMoney(outstanding)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===================================================
          PAYMENT HISTORY
          =================================================== */}

      <div style={{ marginTop: 25 }}>
        <h3>Payment History</h3>

        {payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h3>No payments yet</h3>
            <p>Recorded payments will appear here.</p>
          </div>
        ) : (
          <div className="customers-list">
            {[...payments]
              .sort(
                (a, b) =>
                  new Date(b.date || b.createdAt) -
                  new Date(a.date || a.createdAt)
              )
              .map((payment) => {
                const customer = customers.find(
                  (item) => String(item.id) === String(payment.customerId)
                );

                const delivery = deliveries.find(
                  (item) => String(item.id) === String(payment.deliveryId)
                );

                return (
                  <div className="customer-card" key={payment.id}>
                    <div className="customer-avatar">💰</div>

                    <div className="customer-info">
                      <h3>{customer?.name || "Unknown Customer"}</h3>

                      <div className="customer-details">
                        <span>💵 Rs. {formatMoney(payment.amount)}</span>
                        <span>📅 {payment.date || "No date"}</span>

                        {delivery && (
                          <span>
                            🚚 Delivery: {formatNumber(delivery.quantity)} L
                          </span>
                        )}

                        {!delivery && <span>General payment</span>}

                        {payment.notes && <span>📝 {payment.notes}</span>}
                      </div>
                    </div>

                    <div className="customer-actions">
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => {
                          if (window.confirm("Delete this payment?")) {
                            onDelete(payment.id);
                          }
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </>
  );
}

export default Payments;
