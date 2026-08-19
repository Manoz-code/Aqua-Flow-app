
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
  formatNepaliDate,
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
import NepaliDateInput from "../components/NepaliDateInput";

/* =========================================================
   PAYMENT METHODS
   ========================================================= */

const PAYMENT_METHODS = [
  {
    value: "cash",
    label: "Cash",
    icon: "💵",
  },
  {
    value: "esewa",
    label: "eSewa",
    icon: "📱",
  },
  {
    value: "khalti",
    label: "Khalti",
    icon: "🟣",
  },
  {
    value: "mobile_banking",
    label: "Mobile Banking",
    icon: "🏦",
  },
];

/* =========================================================
   PAYMENT METHOD HELPERS
   ========================================================= */

const getPaymentMethodInfo = (method) => {
  const normalized = String(
    method || "cash"
  ).toLowerCase();

  return (
    PAYMENT_METHODS.find(
      (item) =>
        item.value === normalized
    ) || PAYMENT_METHODS[0]
  );
};

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
  deliveryId,
  resetFormSignal,
  onFormStateChange,
  recentPaymentId,
}) {
  /* =======================================================
     EMPTY FORM
     ======================================================= */

  const getEmptyForm = useCallback(
    () => ({
      customerId: "",
      deliveryId: "",
      amount: "",
      paymentMethod: "cash",
      transactionReference: "",
      date: today(),
      notes: "",
    }),
    []
  );

  /* =======================================================
     STATE
     ======================================================= */

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] = useState(
    getEmptyForm
  );

  /* =======================================================
     REFS
     ======================================================= */

  const formRef = useRef(null);

  const amountInputRef =
    useRef(null);

  const customerPickerRef =
    useRef(null);

  const recentPaymentRef =
    useRef(null);

  /* =======================================================
     REPORT FORM STATE TO PARENT
     ======================================================= */

  useEffect(() => {
    onFormStateChange?.(showForm);
  }, [
    showForm,
    onFormStateChange,
  ]);

  /* =======================================================
     SCROLL TO RECENT PAYMENT
     ======================================================= */

  useEffect(() => {
    if (!recentPaymentId) {
      return undefined;
    }

    const timer = setTimeout(() => {
      recentPaymentRef.current?.scrollIntoView(
        {
          behavior: "smooth",
          block: "center",
        }
      );
    }, 200);

    return () =>
      clearTimeout(timer);
  }, [recentPaymentId]);

  /* =======================================================
     SCROLL + SMART FOCUS
     ======================================================= */

  useEffect(() => {
    if (!showForm) {
      return undefined;
    }

    const scrollTimer =
      setTimeout(() => {
        formRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

    const focusTimer =
      setTimeout(() => {
        if (form.customerId) {
          amountInputRef.current?.focus();
          amountInputRef.current?.select();
        } else {
          customerPickerRef.current?.focus?.();
        }
      }, 250);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(focusTimer);
    };
  }, [
    showForm,
    openFormSignal,
    form.customerId,
  ]);

  /* =======================================================
     RESET FORM
     ======================================================= */

  useEffect(() => {
    setShowForm(false);
    setForm(getEmptyForm());
  }, [
    resetFormSignal,
    getEmptyForm,
  ]);

  /* =======================================================
     OPEN PAYMENT FORM FROM CUSTOMER CONTEXT
     =======================================================

     If a customer is supplied:

       1 outstanding delivery
         → automatically select it
         → automatically fill remaining amount

       Multiple outstanding deliveries
         → select customer only

       No outstanding deliveries
         → select customer only
     ======================================================= */

  useEffect(() => {
    if (!openFormSignal) {
      return;
    }

    const customerId =
      prefillCustomerId
        ? String(prefillCustomerId)
        : "";

    const selectedDeliveryId =
      deliveryId
        ? String(deliveryId)
        : "";

    let nextForm =
      getEmptyForm();

    /* -------------------------------------------------------
       DELIVERY WAS SELECTED
       ------------------------------------------------------- */

    if (
      customerId &&
      selectedDeliveryId
    ) {
      const delivery =
        deliveries.find(
          (item) =>
            String(item.id) ===
            selectedDeliveryId
        );

      if (delivery) {
        const remaining =
          getDeliveryRemaining(
            delivery,
            payments
          );

        nextForm = {
          ...nextForm,
          customerId,
          deliveryId:
            selectedDeliveryId,
          amount:
            remaining > 0
              ? String(remaining)
              : "",
        };
      } else {
        nextForm.customerId =
          customerId;
      }
    }

    /* -------------------------------------------------------
       CUSTOMER ONLY
       ------------------------------------------------------- */

    else if (customerId) {
      const outstanding =
        deliveries
          .filter(
            (delivery) =>
              String(
                delivery.customerId
              ) === customerId &&
              getDeliveryRemaining(
                delivery,
                payments
              ) > 0
          )
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
          );

      if (
        outstanding.length ===
        1
      ) {
        const delivery =
          outstanding[0];

        const remaining =
          getDeliveryRemaining(
            delivery,
            payments
          );

        nextForm = {
          ...nextForm,
          customerId,
          deliveryId:
            String(delivery.id),
          amount:
            remaining > 0
              ? String(remaining)
              : "",
        };
      } else {
        nextForm.customerId =
          customerId;
      }
    }

    setForm(nextForm);
    setShowForm(true);

    // The opening signal controls this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    openFormSignal,
    prefillCustomerId,
    deliveryId,
  ]);

  /* =======================================================
     OUTSTANDING DELIVERIES
     ======================================================= */

  const outstandingDeliveries =
    useMemo(() => {
      return deliveries
        .map((delivery) => {
          const customer =
            customers.find(
              (item) =>
                String(item.id) ===
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

          return {
            delivery,
            customer,
            total,
            paid,
            remaining,
          };
        })
        .filter(
          (item) =>
            item.remaining > 0
        )
        .sort(
          (a, b) =>
            new Date(
              b.delivery.date ||
                b.delivery.createdAt ||
                0
            ).getTime() -
            new Date(
              a.delivery.date ||
                a.delivery.createdAt ||
                0
            ).getTime()
        );
    }, [
      customers,
      deliveries,
      payments,
    ]);

  /* =======================================================
     DELIVERIES FOR SELECTED CUSTOMER
     ======================================================= */

  const selectedCustomerDeliveries =
    useMemo(() => {
      if (!form.customerId) {
        return [];
      }

      return deliveries
        .filter(
          (delivery) =>
            String(
              delivery.customerId
            ) ===
            String(
              form.customerId
            )
        )
        .sort(
          (a, b) =>
            new Date(
              b.date ||
                b.createdAt ||
                0
            ).getTime() -
            new Date(
              a.date ||
                a.createdAt ||
                0
            ).getTime()
        );
    }, [
      deliveries,
      form.customerId,
    ]);

  /* =======================================================
     CUSTOMER BALANCES
     ======================================================= */

  const customerBalances =
    useMemo(() => {
      return customers.map(
        (customer) => {
          const billed =
            deliveries
              .filter(
                (delivery) =>
                  String(
                    delivery.customerId
                  ) ===
                  String(
                    customer.id
                  )
              )
              .reduce(
                (
                  sum,
                  delivery
                ) =>
                  sum +
                  getDeliveryTotal(
                    delivery
                  ),
                0
              );

          const paid =
            getCustomerPayments(
              payments,
              customer.id
            );

          return {
            customer,
            billed,
            paid,
            outstanding:
              Math.max(
                0,
                billed - paid
              ),
          };
        }
      );
    }, [
      customers,
      deliveries,
      payments,
    ]);

  /* =======================================================
     OPEN PAYMENT FOR SPECIFIC DELIVERY
     ======================================================= */

  const openPaymentForDelivery =
    useCallback(
      (item) => {
        const customerId =
          item.customer?.id
            ? String(
                item.customer.id
              )
            : "";

        const selectedDeliveryId =
          String(
            item.delivery.id
          );

        setForm({
          customerId,
          deliveryId:
            selectedDeliveryId,
          amount:
            item.remaining > 0
              ? String(
                  item.remaining
                )
              : "",
          paymentMethod: "cash",
          transactionReference:
            "",
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

  const openFreshPaymentForm =
    useCallback(() => {
      setForm(
        getEmptyForm()
      );

      setShowForm(true);
    }, [
      getEmptyForm,
    ]);

  /* =======================================================
     CHANGE CUSTOMER
     ======================================================= */

  const handleCustomerChange =
    useCallback((value) => {
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

  const handleDeliveryChange =
    useCallback(
      (event) => {
        const selectedDeliveryId =
          event.target.value;

        const delivery =
          deliveries.find(
            (item) =>
              String(item.id) ===
              String(
                selectedDeliveryId
              )
          );

        setForm((current) => ({
          ...current,
          deliveryId:
            selectedDeliveryId,
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
      [
        deliveries,
        payments,
      ]
    );

  /* =======================================================
     PAYMENT METHOD
     ======================================================= */

  const handlePaymentMethodChange =
    useCallback((event) => {
      setForm((current) => ({
        ...current,
        paymentMethod:
          event.target.value,
        transactionReference:
          event.target.value ===
          "cash"
            ? ""
            : current.transactionReference,
      }));
    }, []);

  /* =======================================================
     HANDLE SUBMIT
     ======================================================= */

  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    if (!form.customerId) {
      alert(
        "Please select a customer."
      );
      return;
    }

    const amount =
      Number(form.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert(
        "Enter a valid payment amount."
      );
      return;
    }

    /* -----------------------------------------------------
       DELIVERY-SPECIFIC VALIDATION
       ----------------------------------------------------- */

    if (form.deliveryId) {
      const delivery =
        deliveries.find(
          (item) =>
            String(item.id) ===
            String(
              form.deliveryId
            )
        );

      if (delivery) {
        const remaining =
          getDeliveryRemaining(
            delivery,
            payments
          );

        if (
          amount > remaining
        ) {
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
       PAYMENT METHOD
       ----------------------------------------------------- */

    const paymentMethod =
      form.paymentMethod ||
      "cash";

    const transactionReference =
      form.transactionReference.trim();

    /* -----------------------------------------------------
       SAVE PAYMENT
       ----------------------------------------------------- */

    onAdd({
      customerId:
        String(
          form.customerId
        ),

      deliveryId:
        form.deliveryId
          ? String(
              form.deliveryId
            )
          : null,

      amount,

      paymentMethod,

      transactionReference:
        transactionReference ||
        "",

      date:
        form.date || today(),

      notes:
        form.notes.trim(),
    });

    setForm(
      getEmptyForm()
    );

    setShowForm(false);
  };

  /* =======================================================
     DELETE PAYMENT
     ======================================================= */

  const handleDelete =
    useCallback(
      (paymentId) => {
        const confirmed =
          window.confirm(
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
     PAYMENT HISTORY

     createdAt contains the exact time
     the payment was recorded.

     Therefore the newest payment
     appears at the top.
     ======================================================= */

  const sortedPaymentHistory =
    useMemo(() => {
      return [...payments].sort(
        (a, b) => {
          const aTime =
            new Date(
              a.createdAt ||
                a.date ||
                0
            ).getTime();

          const bTime =
            new Date(
              b.createdAt ||
                b.date ||
                0
            ).getTime();

          return (
            bTime - aTime
          );
        }
      );
    }, [payments]);

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
            Record and track customer
            payments
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={
            openFreshPaymentForm
          }
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
              💰 Outstanding
              Deliveries
            </h3>

            <p>
              Select a delivery to
              record its payment.
            </p>
          </div>
        </div>

        {outstandingDeliveries.length ===
        0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              ✅
            </div>

            <h3>
              No outstanding
              deliveries
            </h3>

            <p>
              All delivery balances
              are currently paid.
            </p>
          </div>
        ) : (
          <div className="customers-list">
            {outstandingDeliveries.map(
              (item) => (
                <div
                  className="customer-card"
                  key={
                    item.delivery.id
                  }
                >
                  <div className="customer-avatar">
                    {getInitials(
                      item.customer
                        ?.name
                    )}
                  </div>

                  <div className="customer-info">
                    <h3>
                      {item.customer
                        ?.name ||
                        "Unknown Customer"}
                    </h3>

                    <div className="customer-details">
                      <span>
                        📅{" "}
                        {item.delivery
                          .date
                          ? formatNepaliDate(
                              item
                                .delivery
                                .date
                            )
                          : "No date"}
                      </span>

                      <span>
                        💧{" "}
                        {formatNumber(
                          item
                            .delivery
                            .quantity
                        )}{" "}
                        L
                      </span>

                      <span>
                        💰 Total: Rs.{" "}
                        {formatMoney(
                          item.total
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
                        openPaymentForDelivery(
                          item
                        )
                      }
                    >
                      💰 Record Payment
                    </button>
                  </div>
                </div>
              )
            )}
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
          onSubmit={
            handleSubmit
          }
        >
          <div className="form-header">
            <div>
              <h3>
                Record Payment
              </h3>

              <p>
                Record money received
                from a customer.
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
            {/* =============================================
                CUSTOMER
                ============================================= */}

            <CustomerPicker
              ref={
                customerPickerRef
              }
              customers={
                customers
              }
              value={
                form.customerId
              }
              onChange={
                handleCustomerChange
              }
            />

            {/* =============================================
                DELIVERY
                ============================================= */}

            <div className="form-group">
              <label>
                Delivery
              </label>

              <select
                value={
                  form.deliveryId
                }
                onChange={
                  handleDeliveryChange
                }
                disabled={
                  !form.customerId
                }
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
                        key={
                          delivery.id
                        }
                        value={
                          delivery.id
                        }
                      >
                        {delivery.date ||
                          "No date"}{" "}
                        —{" "}
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
                Select a specific
                delivery or leave
                it as General
                payment.
              </small>
            </div>

            {/* =============================================
                AMOUNT
                ============================================= */}

            <div className="form-group">
              <label>
                Amount (Rs.) *
              </label>

              <input
                ref={
                  amountInputRef
                }
                type="number"
                min="0"
                step="0.01"
                value={
                  form.amount
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (current) => ({
                      ...current,

                      amount:
                        event
                          .target
                          .value,
                    })
                  )
                }
                placeholder="Payment amount"
              />
            </div>

            {/* =============================================
                PAYMENT METHOD
                ============================================= */}

            <div className="form-group">
              <label>
                Payment Method *
              </label>

              <select
                value={
                  form.paymentMethod ||
                  "cash"
                }
                onChange={
                  handlePaymentMethodChange
                }
              >
                {PAYMENT_METHODS.map(
                  (method) => (
                    <option
                      key={
                        method.value
                      }
                      value={
                        method.value
                      }
                    >
                      {method.icon}{" "}
                      {method.label}
                    </option>
                  )
                )}
              </select>

              <small className="input-help">
                Choose how the customer
                paid.
              </small>
            </div>

            {/* =============================================
                TRANSACTION REFERENCE
                ============================================= */}

            {form.paymentMethod !==
              "cash" && (
              <div className="form-group">
                <label>
                  Transaction Reference
                </label>

                <input
                  type="text"
                  value={
                    form.transactionReference
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (current) => ({
                        ...current,

                        transactionReference:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Optional transaction ID"
                />

                <small className="input-help">
                  Optional reference for
                  eSewa, Khalti or Mobile
                  Banking.
                </small>
              </div>
            )}

            {/* =============================================
                DATE
                ============================================= */}

            <NepaliDateInput
              value={
                form.date
              }
              onChange={(
                value
              ) =>
                setForm(
                  (current) => ({
                    ...current,

                    date: value,
                  })
                )
              }
              label="Payment Date"
            />

            {/* =============================================
                NOTES
                ============================================= */}

            <div className="form-group form-group-full">
              <label>
                Notes
              </label>

              <textarea
                value={
                  form.notes
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (current) => ({
                      ...current,

                      notes:
                        event
                          .target
                          .value,
                    })
                  )
                }
                placeholder="Optional notes..."
              />
            </div>
          </div>

          {/* =============================================
              FORM ACTIONS
              ============================================= */}

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
              Overview of billed,
              paid and outstanding
              amounts.
            </p>
          </div>
        </div>

        {customerBalances.length ===
        0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              👥
            </div>

            <h3>
              No customers yet
            </h3>

            <p>
              Add customers to
              start tracking
              payments.
            </p>
          </div>
        ) : (
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
                  key={
                    customer.id
                  }
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
                        💰 Billed: Rs.{" "}
                        {formatMoney(
                          billed
                        )}
                      </span>

                      <span>
                        ✅ Paid: Rs.{" "}
                        {formatMoney(
                          paid
                        )}
                      </span>

                      <span>
                        ⚠️ Due: Rs.{" "}
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
        )}
      </div>

      {/* ===================================================
          PAYMENT HISTORY
          =================================================== */}

      <div className="payment-history">
        <div className="form-header">
          <div>
            <h3>
              💰 Payment History
            </h3>

            <p>
              Most recently recorded
              payments appear first.
            </p>
          </div>
        </div>

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
            {sortedPaymentHistory.map(
              (payment) => {
                const customer =
                  customers.find(
                    (item) =>
                      String(
                        item.id
                      ) ===
                      String(
                        payment.customerId
                      )
                  );

                const delivery =
                  deliveries.find(
                    (item) =>
                      String(
                        item.id
                      ) ===
                      String(
                        payment.deliveryId
                      )
                  );

                const method =
                  getPaymentMethodInfo(
                    payment.paymentMethod
                  );

                const transactionReference =
                  payment.transactionReference ||
                  "";

                return (
                  <div
                    className={`customer-card ${
                      String(
                        payment.id
                      ) ===
                      String(
                        recentPaymentId
                      )
                        ? "recent-payment"
                        : ""
                    }`}
                    key={
                      payment.id
                    }
                    ref={
                      String(
                        payment.id
                      ) ===
                      String(
                        recentPaymentId
                      )
                        ? recentPaymentRef
                        : null
                    }
                  >
                    <div className="customer-avatar">
                      💰
                    </div>

                    <div className="customer-info">
                      <h3>
                        {customer
                          ?.name ||
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
                          {method.icon}{" "}
                          {method.label}
                        </span>

                        <span>
                          📅{" "}
                          {payment.date
                            ? formatNepaliDate(
                                payment.date
                              )
                            : "No date"}
                        </span>

                        {payment.createdAt && (
                          <span>
                            🕐{" "}
                            {new Date(
                              payment.createdAt
                            ).toLocaleTimeString(
                              [],
                              {
                                hour:
                                  "2-digit",
                                minute:
                                  "2-digit",
                                second:
                                  "2-digit",
                              }
                            )}
                          </span>
                        )}

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

                        {transactionReference && (
                          <span>
                            🔖 Ref:{" "}
                            {
                              transactionReference
                            }
                          </span>
                        )}

                        {payment.notes && (
                          <span>
                            📝{" "}
                            {
                              payment.notes
                            }
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
              }
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Payments;
