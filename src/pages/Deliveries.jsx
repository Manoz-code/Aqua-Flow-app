import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  formatMoney,
  formatNumber,
  formatNepaliDate,
  today,
} from "../utils/format";

import {
  getDefaultPrice,
  getDeliveryPayments,
  getDeliveryTotal,
} from "../utils/data";

import CustomerPicker from "../components/CustomerPicker";
import NepaliDateInput from "../components/NepaliDateInput";

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
  recentDeliveryId,
}) {
  /* =======================================================
     EMPTY FORM
     ======================================================= */

  const getEmptyForm = () => ({
    customerId: "",
    quantity: "1000",
    finalPrice: "900",
    extraCharge: "0",
    date: today(),
    notes: "",
  });

  /* =======================================================
     STATE
     ======================================================= */

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(getEmptyForm());

  /*
   * Used when a delivery is created from a customer.
   * After the data updates, the newest delivery belonging
   * to that customer will be located and scrolled into view.
   */
  const [trackedCustomerId, setTrackedCustomerId] =
    useState(null);

  /* =======================================================
     REFS
     ======================================================= */

  const formRef = useRef(null);
  const recentDeliveryRef = useRef(null);
  const deliveryRefs = useRef(new Map());

  /* =======================================================
     REPORT FORM STATE TO APP
     ======================================================= */

  useEffect(() => {
    onFormStateChange?.(showForm);
  }, [showForm, onFormStateChange]);

  /* =======================================================
     SCROLL FORM INTO VIEW
     ======================================================= */

  useEffect(() => {
    if (!showForm) {
      return undefined;
    }

    const timer = setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [
    showForm,
    editingId,
    prefillCustomerId,
    openFormSignal,
  ]);

  /* =======================================================
     SCROLL TO RECENT DELIVERY
     ======================================================= */

  useEffect(() => {
    if (!recentDeliveryId) {
      return undefined;
    }

    const timer = setTimeout(() => {
      recentDeliveryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [recentDeliveryId, deliveries]);

  /* =======================================================
     TRACK CUSTOMER AFTER ADDING DELIVERY
     ======================================================= */

  useEffect(() => {
    if (!trackedCustomerId) {
      return undefined;
    }

    const timer = setTimeout(() => {
      /*
       * Find the newest delivery for this customer.
       */
      const matchingDelivery = [...deliveries]
        .sort((a, b) => {
          const aTime = new Date(
            a.createdAt || a.date || 0
          ).getTime();

          const bTime = new Date(
            b.createdAt || b.date || 0
          ).getTime();

          return bTime - aTime;
        })
        .find(
          (delivery) =>
            String(delivery.customerId) ===
            String(trackedCustomerId)
        );

      if (matchingDelivery) {
        const element =
          deliveryRefs.current.get(
            String(matchingDelivery.id)
          );

        element?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      setTrackedCustomerId(null);
    }, 200);

    return () => clearTimeout(timer);
  }, [deliveries, trackedCustomerId]);

  /* =======================================================
     RESET FORM
     ======================================================= */

  useEffect(() => {
    setShowForm(false);
    setEditingId(null);
    setForm(getEmptyForm());
    setTrackedCustomerId(null);
  }, [resetFormSignal]);

  /* =======================================================
     DELIVERY STATS
     ======================================================= */

  const deliveryStats = useMemo(() => {
    const totalLiters = deliveries.reduce(
      (sum, delivery) =>
        sum + (Number(delivery.quantity) || 0),
      0
    );

    const totalBilled = deliveries.reduce(
      (sum, delivery) =>
        sum + getDeliveryTotal(delivery),
      0
    );

    const pending = deliveries.filter(
      (delivery) =>
        delivery.status !== "delivered"
    ).length;

    return {
      totalLiters,
      totalBilled,
      pending,
    };
  }, [deliveries]);

  /* =======================================================
     OPEN ADD FORM
     ======================================================= */

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

  /* =======================================================
     QUICK OPEN FORM
     ======================================================= */

  useEffect(() => {
    if (!openFormSignal) {
      return;
    }

    openAdd();

    // The form should react only to the opening signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    openFormSignal,
    prefillCustomerId,
  ]);

  /* =======================================================
     OPEN EDIT FORM
     ======================================================= */

  const openEdit = (delivery) => {
    setEditingId(delivery.id);

    setForm({
      customerId: delivery.customerId || "",
      quantity: String(
        delivery.quantity ?? ""
      ),
      finalPrice: String(
        delivery.finalPrice ??
          delivery.totalPrice ??
          getDeliveryTotal(delivery)
      ),
      extraCharge: String(
        delivery.extraCharge ?? 0
      ),
      date: delivery.date
        ? String(delivery.date).slice(0, 10)
        : today(),
      notes: delivery.notes || "",
    });

    setShowForm(true);
  };

  /* =======================================================
     GENERIC INPUT
     ======================================================= */

  const handleInput = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /* =======================================================
     QUANTITY PRESET
     ======================================================= */

  const handleQuantityPreset = (
    quantity
  ) => {
    setForm((current) => ({
      ...current,
      quantity: String(quantity),
      finalPrice: String(
        getDefaultPrice(quantity)
      ),
    }));
  };

  /* =======================================================
     QUANTITY INPUT
     ======================================================= */

  const handleQuantityChange = (
    event
  ) => {
    setForm((current) => ({
      ...current,
      quantity: event.target.value,
    }));
  };

  /* =======================================================
     CALCULATED TOTAL
     ======================================================= */

  const calculatedTotal = useMemo(() => {
    return (
      (Number(form.finalPrice) || 0) +
      (Number(form.extraCharge) || 0)
    );
  }, [
    form.finalPrice,
    form.extraCharge,
  ]);

  /* =======================================================
     SUBMIT
     ======================================================= */

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.customerId) {
      alert(
        "Please select a customer."
      );
      return;
    }

    const quantity = Number(
      form.quantity
    );

    const finalPrice = Number(
      form.finalPrice
    );

    const extraCharge =
      Number(form.extraCharge) || 0;

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      alert(
        "Please enter a valid water quantity."
      );
      return;
    }

    if (
      !Number.isFinite(finalPrice) ||
      finalPrice < 0
    ) {
      alert(
        "Please enter a valid final price."
      );
      return;
    }

    const customerId =
      String(form.customerId);

    const delivery = {
      customerId,
      quantity,
      finalPrice,
      extraCharge,
      date:
        form.date || today(),
      notes:
        form.notes.trim(),
    };

    /* =====================================================
       UPDATE
       ===================================================== */

    if (editingId) {
      onUpdate(
        editingId,
        delivery
      );
    }

    /* =====================================================
       CREATE
       ===================================================== */

    else {
      onAdd(delivery);

      /*
       * Remember the customer.
       * After deliveries updates, the effect above
       * finds the customer's newest delivery.
       */
      setTrackedCustomerId(
        customerId
      );
    }

    /* =====================================================
       RESET FORM
       ===================================================== */

    setForm(getEmptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  /* =======================================================
     DELETE DELIVERY
     ======================================================= */

  const handleDelete = (
    delivery
  ) => {
    const confirmed =
      window.confirm(
        "Delete this delivery record? Any payments attached to this delivery will also be removed."
      );

    if (!confirmed) {
      return;
    }

    onDelete(delivery.id);
  };

  /* =======================================================
     MARK DELIVERED
     ======================================================= */

  const handleDelivered = (
    delivery
  ) => {
    if (
      delivery.status ===
      "delivered"
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Mark this delivery as delivered?"
      );

    if (!confirmed) {
      return;
    }

    onMarkDelivered(
      delivery.id
    );
  };

  /* =======================================================
     SORT DELIVERIES

     Newest created delivery first.
     ======================================================= */

  const sortedDeliveries = useMemo(() => {
    return [...deliveries].sort(
      (a, b) => {
        const aTime = new Date(
          a.createdAt ||
            a.date ||
            0
        ).getTime();

        const bTime = new Date(
          b.createdAt ||
            b.date ||
            0
        ).getTime();

        return bTime - aTime;
      }
    );
  }, [deliveries]);

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
          <h2>
            Deliveries
          </h2>

          <p className="welcome">
            Create and manage water
            deliveries
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAdd}
        >
          + New Delivery
        </button>
      </div>

      {/* ===================================================
          DELIVERY SUMMARY
          =================================================== */}

      <div className="delivery-summary">
        <div className="summary-card">
          <span>💧</span>

          <div>
            <small>
              Total Liters
            </small>

            <strong>
              {formatNumber(
                deliveryStats.totalLiters
              )}{" "}
              L
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <span>💰</span>

          <div>
            <small>
              Total Billed
            </small>

            <strong>
              Rs.{" "}
              {formatMoney(
                deliveryStats.totalBilled
              )}
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <span>⏳</span>

          <div>
            <small>
              Pending
            </small>

            <strong>
              {deliveryStats.pending}
            </strong>
          </div>
        </div>
      </div>

      {/* ===================================================
          DELIVERY FORM
          =================================================== */}

      {showForm && (
        <form
          className="customer-form-card"
          ref={formRef}
          onSubmit={handleSubmit}
        >
          <div className="form-header">
            <div>
              <h3>
                {editingId
                  ? "Edit Delivery"
                  : "New Delivery"}
              </h3>

              <p>
                Select a customer and
                enter delivery details.
              </p>
            </div>

            <button
              type="button"
              className="close-button"
              onClick={() =>
                setShowForm(false)
              }
            >
              ×
            </button>
          </div>

          <div className="form-grid">
            {/* CUSTOMER */}

            <CustomerPicker
              customers={customers}
              value={form.customerId}
              onChange={(value) =>
                setForm(
                  (current) => ({
                    ...current,
                    customerId:
                      value,
                  })
                )
              }
            />

            {/* QUANTITY */}

            <div className="form-group">
              <label>
                Quantity of Water
                (Liters) *
              </label>

              <div className="preset-buttons">
                <button
                  type="button"
                  className={`preset-button ${
                    Number(
                      form.quantity
                    ) === 1000
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleQuantityPreset(
                      1000
                    )
                  }
                >
                  1000 L
                </button>

                <button
                  type="button"
                  className={`preset-button ${
                    Number(
                      form.quantity
                    ) === 2000
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleQuantityPreset(
                      2000
                    )
                  }
                >
                  2000 L
                </button>
              </div>

              <input
                name="quantity"
                type="number"
                min="1"
                step="1"
                value={
                  form.quantity
                }
                onChange={
                  handleQuantityChange
                }
                placeholder="Enter liters"
              />

              <small className="input-help">
                1000 L → Rs. 900.
                2000 L → Rs. 1600.
                You can edit the
                quantity and price.
              </small>
            </div>

            {/* FINAL PRICE */}

            <div className="form-group">
              <label>
                Final Price (Rs.) *
              </label>

              <input
                name="finalPrice"
                type="number"
                min="0"
                step="0.01"
                value={
                  form.finalPrice
                }
                onChange={
                  handleInput
                }
                placeholder="Final price"
              />
            </div>

            {/* EXTRA CHARGE */}

            <div className="form-group">
              <label>
                Extra Charge (Rs.)
              </label>

              <input
                name="extraCharge"
                type="number"
                min="0"
                step="0.01"
                value={
                  form.extraCharge
                }
                onChange={
                  handleInput
                }
                placeholder="0"
              />
            </div>

            {/* DELIVERY DATE */}

            <NepaliDateInput
              value={form.date}
              onChange={(value) =>
                setForm(
                  (current) => ({
                    ...current,
                    date: value,
                  })
                )
              }
              label="Delivery Date"
            />

            {/* STATUS */}

            <div className="form-group">
              <label>
                Status
              </label>

              <div
                className="selected-customer"
                style={{
                  minHeight: 48,
                }}
              >
                <span>
                  ⏳
                </span>

                <strong>
                  {editingId
                    ? deliveries.find(
                        (item) =>
                          String(
                            item.id
                          ) ===
                          String(
                            editingId
                          )
                      )?.status ===
                      "delivered"
                      ? "Delivered"
                      : "Pending"
                    : "Pending"}
                </strong>
              </div>

              <small className="input-help">
                Delivery starts as
                Pending. Use the
                Delivered button after
                the water has been
                delivered.
              </small>
            </div>

            {/* NOTES */}

            <div className="form-group form-group-full">
              <label>
                Notes
              </label>

              <textarea
                name="notes"
                value={
                  form.notes
                }
                onChange={
                  handleInput
                }
                placeholder="Optional delivery notes..."
              />
            </div>
          </div>

          {/* DELIVERY TOTAL */}

          <div className="delivery-total-preview">
            <div>
              <span>
                Water
              </span>

              <strong>
                {formatNumber(
                  form.quantity
                )}{" "}
                L
              </strong>
            </div>

            <div>
              <span>
                Final Price
              </span>

              <strong>
                Rs.{" "}
                {formatMoney(
                  Number(
                    form.finalPrice
                  ) || 0
                )}
              </strong>
            </div>

            <div>
              <span>
                Extra Charge
              </span>

              <strong>
                Rs.{" "}
                {formatMoney(
                  Number(
                    form.extraCharge
                  ) || 0
                )}
              </strong>
            </div>

            <div className="total-highlight">
              <span>
                Total
              </span>

              <strong>
                Rs.{" "}
                {formatMoney(
                  calculatedTotal
                )}
              </strong>
            </div>
          </div>

          {/* FORM ACTIONS */}

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setShowForm(false)
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
            >
              {editingId
                ? "Update Delivery"
                : "Save Delivery"}
            </button>
          </div>
        </form>
      )}

      {/* ===================================================
          EMPTY STATE
          =================================================== */}

      {deliveries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            🚚
          </div>

          <h3>
            No deliveries yet
          </h3>

          <p>
            Create your first water
            delivery.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={openAdd}
          >
            + New Delivery
          </button>
        </div>
      ) : (
        /* =================================================
           DELIVERY LIST
           ================================================= */

        <div className="deliveries-list">
          {sortedDeliveries.map(
            (delivery) => {
              const customer =
                customers.find(
                  (item) =>
                    String(
                      item.id
                    ) ===
                    String(
                      delivery.customerId
                    )
                );

              const total =
                getDeliveryTotal(
                  delivery
                );

              const paid =
                getDeliveryPayments(
                  payments,
                  delivery.id
                );

              const remaining =
                Math.max(
                  0,
                  total - paid
                );

              const isDelivered =
                delivery.status ===
                "delivered";

              const isRecent =
                String(
                  delivery.id
                ) ===
                String(
                  recentDeliveryId
                );

              return (
              <div
  className={`delivery-card ${
    String(delivery.id) === String(recentDeliveryId)
      ? "recent-delivery"
      : ""
  }`}
  key={delivery.id}
  ref={(element) => {
    const id = String(delivery.id);

    if (element) {
      deliveryRefs.current.set(id, element);
    } else {
      deliveryRefs.current.delete(id);
    }

    if (
      String(delivery.id) ===
      String(recentDeliveryId)
    ) {
      recentDeliveryRef.current = element;
    }
  }}
>
                  <div className="delivery-main">
                    <div className="delivery-icon">
                      💧
                    </div>

                    <div className="delivery-info">
                      <div className="delivery-title-row">
                        <h3>
                          {customer?.name ||
                            "Unknown Customer"}
                        </h3>

                        <span
                          className={`status-badge status-${
                            isDelivered
                              ? "delivered"
                              : "pending"
                          }`}
                        >
                          {isDelivered
                            ? "Delivered"
                            : "Pending"}
                        </span>
                      </div>

                      <div className="delivery-details">
                        <span>
                          💧{" "}
                          {formatNumber(
                            delivery.quantity
                          )}{" "}
                          L
                        </span>

                        <span>
                          📅{" "}
                          {delivery.date
                            ? formatNepaliDate(
                                delivery.date
                              )
                            : "No date"}
                        </span>

                        <span>
                          💵 Rs.{" "}
                          {formatMoney(
                            total
                          )}
                        </span>

                        {paid > 0 && (
                          <span>
                            ✅ Paid: Rs.{" "}
                            {formatMoney(
                              paid
                            )}
                          </span>
                        )}

                        {remaining > 0 && (
                          <span>
                            ⚠️ Due: Rs.{" "}
                            {formatMoney(
                              remaining
                            )}
                          </span>
                        )}
                      </div>

                      {delivery.notes && (
                        <p className="delivery-notes">
                          {delivery.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="delivery-right">
                    <strong>
                      Rs.{" "}
                      {formatMoney(
                        total
                      )}
                    </strong>

                    <small>
                      Delivery total
                    </small>

                    <div
                      className="customer-actions"
                      style={{
                        marginTop: 8,
                      }}
                    >
                      {/* DELIVERED */}

                      {!isDelivered && (
                        <button
                          type="button"
                          className="primary-button"
                          style={{
                            padding:
                              "8px 12px",
                            fontSize: 12,
                          }}
                          onClick={() =>
                            handleDelivered(
                              delivery
                            )
                          }
                        >
                          ✓ Delivered
                        </button>
                      )}

                      {/* PAYMENT */}

                      {remaining > 0 && (
                        <button
                          type="button"
                          className="secondary-button"
                          style={{
                            padding:
                              "8px 12px",
                            fontSize: 12,
                          }}
                          onClick={() =>
                            onNavigate(
                              "Payments",
                              {
                                customerId:
                                  delivery.customerId,
                                deliveryId:
                                  delivery.id,
                              }
                            )
                          }
                        >
                          💰 Payment
                        </button>
                      )}

                      {/* EDIT */}

                      <button
                        type="button"
                        className="edit-button"
                        title="Edit delivery"
                        onClick={() =>
                          openEdit(
                            delivery
                          )
                        }
                      >
                        ✏️
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        className="delete-button"
                        title="Delete delivery"
                        onClick={() =>
                          handleDelete(
                            delivery
                          )
                        }
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </>
  );
}

export default Deliveries;