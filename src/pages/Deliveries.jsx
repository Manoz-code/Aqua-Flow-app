import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatMoney, formatNumber, today } from "../utils/format";
import {
  getDefaultPrice,
  getDeliveryPayments,
  getDeliveryTotal,
} from "../utils/data";
import CustomerPicker from "../components/CustomerPicker";

/* =========================================================
   DELIVERIES
   ========================================================= */

function Deliveries({
  customers,
  deliveries,
  payments,
  onAdd,
  onUpdate,
  onDelete,
  onMarkDelivered,
  onNavigate,
  openFormSignal,
  prefillCustomerId,
  resetFormSignal,
  onFormStateChange,
}) {
  const getEmptyForm = () => ({
    customerId: "",
    quantity: "1000",
    finalPrice: "900",
    extraCharge: "0",
    date: today(),
    notes: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(getEmptyForm());

  const formRef = useRef(null);

  useEffect(() => {
  onFormStateChange?.(showForm);
}, [showForm, onFormStateChange]);
/*
 * Whenever the form opens (New or Edit), scroll it into view.
 * The user may already be scrolled down the deliveries list,
 * so without this the form pops open off-screen.
 */
useEffect(() => {
  if (showForm) {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}, [showForm, editingId]);
  const deliveryStats = useMemo(() => {
    const totalLiters = deliveries.reduce(
      (sum, delivery) => sum + (Number(delivery.quantity) || 0),
      0
    );

    const totalBilled = deliveries.reduce(
      (sum, delivery) => sum + getDeliveryTotal(delivery),
      0
    );

    const pending = deliveries.filter(
      (delivery) => delivery.status !== "delivered"
    ).length;

    return { totalLiters, totalBilled, pending };
  }, [deliveries]);

  const openAdd = () => {
  setEditingId(null);

  setForm({
    ...getEmptyForm(),
    customerId: prefillCustomerId
      ? String(prefillCustomerId)
      : "",
  });

  setShowForm(true);
};
  /*
   * Triggered by the Dashboard "+ New Delivery" shortcut.
   * Signal starts at 0, so we skip the initial mount and only
   * react when it's actually bumped (even if already on this page).
   */
  useEffect(() => {
  setShowForm(false);
  setEditingId(null);
  setForm(getEmptyForm());
}, [resetFormSignal]);

useEffect(() => {
  if (!openFormSignal) return;

  setEditingId(null);
  setForm({
    ...getEmptyForm(),
    customerId: prefillCustomerId
      ? String(prefillCustomerId)
      : "",
  });
  setShowForm(true);
}, [openFormSignal, prefillCustomerId]);

  const openEdit = (delivery) => {
    setEditingId(delivery.id);

    setForm({
      customerId: delivery.customerId || "",
      quantity: String(delivery.quantity ?? ""),
      finalPrice: String(
        delivery.finalPrice ?? delivery.totalPrice ?? getDeliveryTotal(delivery)
      ),
      extraCharge: String(delivery.extraCharge ?? 0),
      date: delivery.date ? String(delivery.date).slice(0, 10) : today(),
      notes: delivery.notes || "",
    });

    setShowForm(true);
  };

  const handleInput = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleQuantityPreset = (quantity) => {
    setForm((current) => ({
      ...current,
      quantity: String(quantity),
      finalPrice: String(getDefaultPrice(quantity)),
    }));
  };

  const handleQuantityChange = (event) => {
    setForm((current) => ({ ...current, quantity: event.target.value }));
  };

  const calculatedTotal = useMemo(() => {
    return (Number(form.finalPrice) || 0) + (Number(form.extraCharge) || 0);
  }, [form.finalPrice, form.extraCharge]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.customerId) {
      alert("Please select a customer.");
      return;
    }

    const quantity = Number(form.quantity);
    const finalPrice = Number(form.finalPrice);
    const extraCharge = Number(form.extraCharge) || 0;

    if (!Number.isFinite(quantity) || quantity <= 0) {
      alert("Please enter a valid water quantity.");
      return;
    }

    if (!Number.isFinite(finalPrice) || finalPrice < 0) {
      alert("Please enter a valid final price.");
      return;
    }

    const delivery = {
      customerId: form.customerId,
      quantity,
      finalPrice,
      extraCharge,
      date: form.date || today(),
      notes: form.notes.trim(),
    };

    if (editingId) {
      onUpdate(editingId, delivery);
    } else {
      onAdd(delivery);
    }

    setForm(getEmptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = (delivery) => {
    if (
      !window.confirm(
        "Delete this delivery record? Any payments attached to this delivery will also be removed."
      )
    ) {
      return;
    }

    onDelete(delivery.id);
  };

  const handleDelivered = (delivery) => {
    if (delivery.status === "delivered") {
      return;
    }

    if (!window.confirm("Mark this delivery as delivered?")) {
      return;
    }

    onMarkDelivered(delivery.id);
  };

  const sortedDeliveries = useMemo(() => {
    return [...deliveries].sort(
      (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );
  }, [deliveries]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Deliveries</h2>
          <p className="welcome">Create and manage water deliveries</p>
        </div>

        <button type="button" className="primary-button" onClick={openAdd}>
          + New Delivery
        </button>
      </div>

      <div className="delivery-summary">
        <div className="summary-card">
          <span>💧</span>

          <div>
            <small>Total Liters</small>
            <strong>{formatNumber(deliveryStats.totalLiters)} L</strong>
          </div>
        </div>

        <div className="summary-card">
          <span>💰</span>

          <div>
            <small>Total Billed</small>
            <strong>Rs. {formatMoney(deliveryStats.totalBilled)}</strong>
          </div>
        </div>

        <div className="summary-card">
          <span>⏳</span>

          <div>
            <small>Pending</small>
            <strong>{deliveryStats.pending}</strong>
          </div>
        </div>
      </div>

      {showForm && (
       <form className="customer-form-card" ref={formRef} onSubmit={handleSubmit}>
          <div className="form-header">
            <div>
              <h3>{editingId ? "Edit Delivery" : "New Delivery"}</h3>
              <p>Select a customer and enter delivery details.</p>
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
            <CustomerPicker
              customers={customers}
              value={form.customerId}
              onChange={(value) =>
                setForm((current) => ({ ...current, customerId: value }))
              }
            />

            <div className="form-group">
              <label>Quantity of Water (Liters) *</label>

              <div className="preset-buttons">
                <button
                  type="button"
                  className={`preset-button ${
                    Number(form.quantity) === 1000 ? "selected" : ""
                  }`}
                  onClick={() => handleQuantityPreset(1000)}
                >
                  1000 L
                </button>

                <button
                  type="button"
                  className={`preset-button ${
                    Number(form.quantity) === 2000 ? "selected" : ""
                  }`}
                  onClick={() => handleQuantityPreset(2000)}
                >
                  2000 L
                </button>
              </div>

              <input
                name="quantity"
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={handleQuantityChange}
                placeholder="Enter liters"
              />

              <small className="input-help">
                1000 L → Rs. 900. 2000 L → Rs. 1600. You can edit the quantity
                and price.
              </small>
            </div>

            <div className="form-group">
              <label>Final Price (Rs.) *</label>

              <input
                name="finalPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.finalPrice}
                onChange={handleInput}
                placeholder="Final price"
              />
            </div>

            <div className="form-group">
              <label>Extra Charge (Rs.)</label>

              <input
                name="extraCharge"
                type="number"
                min="0"
                step="0.01"
                value={form.extraCharge}
                onChange={handleInput}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label>Delivery Date</label>

              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleInput}
              />
            </div>

            <div className="form-group">
              <label>Status</label>

              <div className="selected-customer" style={{ minHeight: 48 }}>
                <span>⏳</span>

                <strong>
                  {editingId
                    ? deliveries.find(
                        (item) => String(item.id) === String(editingId)
                      )?.status === "delivered"
                      ? "Delivered"
                      : "Pending"
                    : "Pending"}
                </strong>
              </div>

              <small className="input-help">
                Delivery starts as Pending. Use the Delivered button after the
                water has been delivered.
              </small>
            </div>

            <div className="form-group form-group-full">
              <label>Notes</label>

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleInput}
                placeholder="Optional delivery notes..."
              />
            </div>
          </div>

          <div className="delivery-total-preview">
            <div>
              <span>Water</span>
              <strong>{formatNumber(form.quantity)} L</strong>
            </div>

            <div>
              <span>Final Price</span>
              <strong>Rs. {formatMoney(Number(form.finalPrice) || 0)}</strong>
            </div>

            <div>
              <span>Extra Charge</span>
              <strong>Rs. {formatMoney(Number(form.extraCharge) || 0)}</strong>
            </div>

            <div className="total-highlight">
              <span>Total</span>
              <strong>Rs. {formatMoney(calculatedTotal)}</strong>
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
              {editingId ? "Update Delivery" : "Save Delivery"}
            </button>
          </div>
        </form>
      )}

      {deliveries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚚</div>
          <h3>No deliveries yet</h3>
          <p>Create your first water delivery.</p>

          <button type="button" className="primary-button" onClick={openAdd}>
            + New Delivery
          </button>
        </div>
      ) : (
        <div className="deliveries-list">
          {sortedDeliveries.map((delivery) => {
            const customer = customers.find(
              (item) => String(item.id) === String(delivery.customerId)
            );

            const total = getDeliveryTotal(delivery);
            const paid = getDeliveryPayments(payments, delivery.id);
            const remaining = Math.max(0, total - paid);
            const isDelivered = delivery.status === "delivered";

            return (
              <div className="delivery-card" key={delivery.id}>
                <div className="delivery-main">
                  <div className="delivery-icon">💧</div>

                  <div className="delivery-info">
                    <div className="delivery-title-row">
                      <h3>{customer?.name || "Unknown Customer"}</h3>

                      <span
                        className={`status-badge status-${
                          isDelivered ? "delivered" : "pending"
                        }`}
                      >
                        {isDelivered ? "Delivered" : "Pending"}
                      </span>
                    </div>

                    <div className="delivery-details">
                      <span>💧 {formatNumber(delivery.quantity)} L</span>
                      <span>📅 {delivery.date || "No date"}</span>
                      <span>💵 Rs. {formatMoney(total)}</span>

                      {paid > 0 && <span>✅ Paid: Rs. {formatMoney(paid)}</span>}

                      {remaining > 0 && (
                        <span>⚠️ Due: Rs. {formatMoney(remaining)}</span>
                      )}
                    </div>

                    {delivery.notes && (
                      <p className="delivery-notes">{delivery.notes}</p>
                    )}
                  </div>
                </div>

                <div className="delivery-right">
                  <strong>Rs. {formatMoney(total)}</strong>
                  <small>Delivery total</small>

                  <div className="customer-actions" style={{ marginTop: 8 }}>
                    {!isDelivered && (
                      <button
                        type="button"
                        className="primary-button"
                        style={{ padding: "8px 12px", fontSize: 12 }}
                        onClick={() => handleDelivered(delivery)}
                      >
                        ✓ Delivered
                      </button>
                    )}

                    {remaining > 0 && (
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ padding: "8px 12px", fontSize: 12 }}
                        onClick={() => onNavigate("Payments")}
                      >
                        💰 Payment
                      </button>
                    )}

                    <button
                      type="button"
                      className="edit-button"
                      title="Edit delivery"
                      onClick={() => openEdit(delivery)}
                    >
                      ✏️
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      title="Delete delivery"
                      onClick={() => handleDelete(delivery)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default Deliveries;