
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  formatMoney,
  formatNumber,
  getInitials,
  today,
} from "../utils/format";

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
  /* =======================================================
     EMPTY FORM
     ======================================================= */

  const getEmptyForm = useCallback(
    () => ({
      customerId: "",
      deliveryId: "",
      amount: "",
      date: today(),
      notes: "",
    }),
    []
  );

  /* =======================================================
     STATE
     ======================================================= */

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(getEmptyForm);

  /* =======================================================
     REFS
     ======================================================= */

  const formRef = useRef(null);
  const amountInputRef = useRef(null);
  const customerPickerRef = useRef(null);

  /* =======================================================
     REPORT FORM STATE TO PARENT
     ======================================================= */

  useEffect(() => {
    onFormStateChange?.(showForm);
  }, [showForm, onFormStateChange]);

  /* =======================================================
     SCROLL + SMART FOCUS
     
     No customer:
       → open/focus customer search

     Customer already selected:
       → focus amount
     ======================================================= */

 useEffect(() => {
  if (!showForm) return;

  formRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  const focusTimer = setTimeout(() => {
    if (form.customerId) {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    } else {
      customerPickerRef.current?.focus();
    }
  }, 100);

  return () => clearTimeout(focusTimer);
}, [showForm, openFormSignal, form.customerId]);
  /* =======================================================
     RESET FORM
     
     Triggered by normal sidebar navigation.
     ======================================================= */

  useEffect(() => {
    setShowForm(false);
    setForm(getEmptyForm());
  }, [resetFormSignal, getEmptyForm]);

  /* =======================================================
     OPEN PAYMENT FORM FROM CUSTOMER CONTEXT

     Behavior:
       - no customer → fresh form
       - customer with 1 outstanding delivery
           → auto-select delivery
           → auto-fill remaining amount
       - customer with multiple outstanding deliveries
           → select customer only
       - customer with no outstanding delivery
           → select customer only
     ======================================================= */

  useEffect(() => {
    if (!openFormSignal) return;

    const customerId = prefillCustomerId
      ? String(prefillCustomerId)
      : "";

    let nextForm = getEmptyForm();

    if (customerId) {
      const outstanding = deliveries
        .filter(
          (delivery) =>
            String(delivery.customerId) === customerId &&
            getDeliveryRemaining(delivery, payments) > 0
        )
        .sort(
          (a, b) =>
            new Date(b.date || b.createdAt) -
            new Date(a.date || a.createdAt)
        );

      /* ---------------------------------------------------
         Exactly one outstanding delivery
         --------------------------------------------------- */

      if (outstanding.length === 1) {
        const delivery = outstanding[0];

        const remaining = getDeliveryRemaining(
          delivery,
          payments
        );

        nextForm = {
          ...nextForm,
          customerId,
          deliveryId: String(delivery.id),
          amount: String(remaining),
        };
      } else {
        /* -----------------------------------------------
           Zero or multiple outstanding deliveries
           ----------------------------------------------- */

        nextForm.customerId = customerId;
      }
    }

    setForm(nextForm);
    setShowForm(true);

    // We intentionally react only to the form-opening
    // signal/context here. Data changes should not
    // unexpectedly reopen the payment form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFormSignal, prefillCustomerId]);

  /* =======================================================
     OUTSTANDING DELIVERIES
     ======================================================= */

  const outstandingDeliveries = useMemo(() => {
    return deliveries
      .map((delivery) => {
        const customer = customers.find(
          (item) =>
            String(item.id) === String(delivery.customerId)
        );

        const total = getDeliveryTotal(delivery);
        const paid = getDeliveryPayments(
          payments,
          delivery.id
        );

        const remaining = Math.max(
          0,
          total - paid
        );

        return {
          delivery,
          customer,
          total,
          paid,
          remaining,
        };
      })
      .filter((item) => item.remaining > 0)
      .sort(
        (a, b) =>
          new Date(
            b.delivery.date || b.delivery.createdAt
          ) -
          new Date(
            a.delivery.date || a.delivery.createdAt
          )
      );
  }, [customers, deliveries, payments]);

  /* =======================================================
     DELIVERIES FOR SELECTED CUSTOMER
     ======================================================= */

  const selectedCustomerDeliveries = useMemo(() => {
    if (!form.customerId) {
      return [];
    }

    return deliveries.filter(
      (delivery) =>
        String(delivery.customerId) ===
        String(form.customerId)
    );
  }, [deliveries, form.customerId]);

  /* =======================================================
     CUSTOMER BALANCES
     ======================================================= */

  const customerBalances = useMemo(() => {
    return customers.map((customer) => {
      const billed = deliveries
        .filter(
          (delivery) =>
            String(delivery.customerId) ===
            String(customer.id)
        )
        .reduce(
          (sum, delivery) =>
            sum + getDeliveryTotal(delivery),
          0
        );

      const paid = getCustomerPayments(
        payments,
        customer.id
      );

      return {
        customer,
        billed,
        paid,
        outstanding: Math.max(
          0,
          billed - paid
        ),
      };
    });
  }, [customers, deliveries, payments]);

  /* =======================================================
     OPEN PAYMENT FOR SPECIFIC DELIVERY
     ======================================================= */

  const openPaymentForDelivery = useCallback(
    (item) => {
      setForm({
        customerId: item.customer?.id
          ? String(item.customer.id)
          : "",
        deliveryId: String(item.delivery.id),
        amount:
          item.remaining > 0
            ? String(item.remaining)
            : "",
        date: today(),
        notes: "",
      });

      setShowForm(true);
    },
    []
  );

  /* =======================================================
     OPEN FRESH PAYMENT FORM
     ======================================================= */

  const openFreshPaymentForm = useCallback(() => {
    setForm(getEmptyForm());
    setShowForm(true);
  }, [getEmptyForm]);

  /* =======================================================
     CHANGE CUSTOMER
     ======================================================= */

  const handleCustomerChange = useCallback((value) => {
    setForm((current) => ({
      ...current,
      customerId: value,
      deliveryId: "",
      amount: "",
    }));
  }, []);

  /* =======================================================
     SELECT DELIVERY
     ======================================================= */

  const handleDeliveryChange = useCallback(
    (event) => {
      const deliveryId = event.target.value;

      const delivery = deliveries.find(
        (item) =>
          String(item.id) ===
          String(deliveryId)
      );

      setForm((current) => ({
        ...current,
        deliveryId,
        amount: delivery
          ? String(
              getDeliveryRemaining(
                delivery,
                payments
              )
            )
          : "",
      }));
    },
    [deliveries, payments]
  );

  /* =======================================================
     HANDLE SUBMIT
     ======================================================= */

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

    /* -----------------------------------------------------
       Validate delivery-specific payment
       ----------------------------------------------------- */

    if (form.deliveryId) {
      const delivery = deliveries.find(
        (item) =>
          String(item.id) ===
          String(form.deliveryId)
      );

      if (delivery) {
        const remaining =
          getDeliveryRemaining(
            delivery,
            payments
          );

        if (amount > remaining) {
          alert(
            `This delivery has only Rs. ${formatMoney(
              remaining
            )} remaining.`
          );
          return;
        }
      }
    }

    /* -----------------------------------------------------
       Save payment
       ----------------------------------------------------- */

    onAdd({
      customerId: String(form.customerId),
      deliveryId: form.deliveryId
        ? String(form.deliveryId)
        : null,
      amount,
      date: form.date || today(),
      notes: form.notes.trim(),
    });

    setForm(getEmptyForm());
    setShowForm(false);
  };

  /* =======================================================
     DELETE PAYMENT
     ======================================================= */

  const handleDelete = useCallback(
    (paymentId) => {
      const confirmed = window.confirm(
        "Delete this payment?"
      );

      if (!confirmed) {
        return;
      }

      onDelete(paymentId);
    },
    [onDelete]
  );

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
          <h2>Payments</h2>

          <p className="welcome">
            Record and track customer payments
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openFreshPaymentForm}
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
            <h3>
              💰 Outstanding Deliveries
            </h3>

            <p>
              Click Record Payment beside a
              delivery to record money received.
            </p>
          </div>
        </div>

        {outstandingDeliveries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              ✅
            </div>

            <h3>
              No outstanding deliveries
            </h3>

            <p>
              All delivery balances are
              currently paid.
            </p>
          </div>
        ) : (
          <div className="customers-list">
            {outstandingDeliveries.map((item) => (
              <div
                className="customer-card"
                key={item.delivery.id}
              >
                <div className="customer-avatar">
                  {getInitials(
                    item.customer?.name
                  )}
                </div>

                <div className="customer-info">
                  <h3>
                    {item.customer?.name ||
                      "Unknown Customer"}
                  </h3>

                  <div className="customer-details">
                    <span>
                      📅{" "}
                      {item.delivery.date ||
                        "No date"}
                    </span>

                    <span>
                      💧{" "}
                      {formatNumber(
                        item.delivery.quantity
                      )}{" "}
                      L
                    </span>

                    <span>
                      💰 Total: Rs.{" "}
                      {formatMoney(item.total)}
                    </span>

                    <span>
                      ✅ Paid: Rs.{" "}
                      {formatMoney(item.paid)}
                    </span>

                    <span>
                      ⚠️ Due: Rs.{" "}
                      {formatMoney(
                        item.remaining
                      )}
                    </span>
                  </div>
                </div>

                <div className="customer-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                      openPaymentForDelivery(item)
                    }
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
        <form
          className="customer-form-card"
          ref={formRef}
          onSubmit={handleSubmit}
        >
          <div className="form-header">
            <div>
              <h3>Record Payment</h3>

              <p>
                Record money received from a
                customer.
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
            {/* =================================================
                CUSTOMER
                ================================================= */}

            <CustomerPicker
              ref={customerPickerRef}
              customers={customers}
              value={form.customerId}
              onChange={handleCustomerChange}
            />

            {/* =================================================
                DELIVERY
                ================================================= */}

            <div className="form-group">
              <label>
                Delivery
              </label>

              <select
                value={form.deliveryId}
                onChange={handleDeliveryChange}
                disabled={!form.customerId}
              >
                <option value="">
                  General payment
                </option>

                {selectedCustomerDeliveries.map(
                  (delivery) => {
                    const remaining =
                      getDeliveryRemaining(
                        delivery,
                        payments
                      );

                    return (
                      <option
                        key={delivery.id}
                        value={delivery.id}
                      >
                        {delivery.date} —{" "}
                        {formatNumber(
                          delivery.quantity
                        )}{" "}
                        L — Due Rs.{" "}
                        {formatMoney(
                          remaining
                        )}
                      </option>
                    );
                  }
                )}
              </select>

              <small className="input-help">
                Select a specific delivery
                or leave it as General
                payment.
              </small>
            </div>

            {/* =================================================
                AMOUNT
                ================================================= */}

            <div className="form-group">
              <label>
                Amount (Rs.) *
              </label>

              <input
                ref={amountInputRef}
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount:
                      event.target.value,
                  }))
                }
                placeholder="Payment amount"
              />
            </div>

            {/* =================================================
                DATE
                ================================================= */}

            <div className="form-group">
              <label>
                Date
              </label>

              <input
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    date:
                      event.target.value,
                  }))
                }
              />
            </div>

            {/* =================================================
                NOTES
                ================================================= */}

            <div className="form-group form-group-full">
              <label>
                Notes
              </label>

              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes:
                      event.target.value,
                  }))
                }
                placeholder="Optional notes..."
              />
            </div>
          </div>

          {/* =================================================
              FORM ACTIONS
              ================================================= */}

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
            <h3>
              Customer Balances
            </h3>

            <p>
              Overview of billed, paid and
              outstanding amounts.
            </p>
          </div>
        </div>

        <div className="customers-list">
          {customerBalances.map(
            ({
              customer,
              billed,
              paid,
              outstanding,
            }) => (
              <div
                className="customer-card"
                key={customer.id}
              >
                <div className="customer-avatar">
                  {getInitials(
                    customer.name
                  )}
                </div>

                <div className="customer-info">
                  <h3>
                    {customer.name}
                  </h3>

                  <div className="customer-details">
                    <span>
                      Billed: Rs.{" "}
                      {formatMoney(billed)}
                    </span>

                    <span>
                      Paid: Rs.{" "}
                      {formatMoney(paid)}
                    </span>

                    <span>
                      Due: Rs.{" "}
                      {formatMoney(
                        outstanding
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* ===================================================
          PAYMENT HISTORY
          =================================================== */}

      <div className="payment-history">
        <h3>Payment History</h3>

        {payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              💰
            </div>

            <h3>
              No payments yet
            </h3>

            <p>
              Recorded payments will
              appear here.
            </p>
          </div>
        ) : (
          <div className="customers-list">
            {[...payments]
              .sort(
                (a, b) =>
                  new Date(
                    b.date ||
                      b.createdAt
                  ) -
                  new Date(
                    a.date ||
                      a.createdAt
                  )
              )
              .map((payment) => {
                const customer =
                  customers.find(
                    (item) =>
                      String(item.id) ===
                      String(
                        payment.customerId
                      )
                  );

                const delivery =
                  deliveries.find(
                    (item) =>
                      String(item.id) ===
                      String(
                        payment.deliveryId
                      )
                  );

                return (
                  <div
                    className="customer-card"
                    key={payment.id}
                  >
                    <div className="customer-avatar">
                      💰
                    </div>

                    <div className="customer-info">
                      <h3>
                        {customer?.name ||
                          "Unknown Customer"}
                      </h3>

                      <div className="customer-details">
                        <span>
                          💵 Rs.{" "}
                          {formatMoney(
                            payment.amount
                          )}
                        </span>

                        <span>
                          📅{" "}
                          {payment.date ||
                            "No date"}
                        </span>

                        {delivery && (
                          <span>
                            🚚 Delivery:{" "}
                            {formatNumber(
                              delivery.quantity
                            )}{" "}
                            L
                          </span>
                        )}

                        {!delivery && (
                          <span>
                            General payment
                          </span>
                        )}

                        {payment.notes && (
                          <span>
                            📝{" "}
                            {payment.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="customer-actions">
                      <button
                        type="button"
                        className="delete-button"
                        title="Delete payment"
                        onClick={() =>
                          handleDelete(
                            payment.id
                          )
                        }
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
