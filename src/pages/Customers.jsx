
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  formatMoney,
  getInitials,
} from "../utils/format";

import {
  getCustomerPayments,
  getDeliveryTotal,
} from "../utils/data";

import CustomerDetails from "../components/CustomerDetails";

/* =========================================================
   CUSTOMERS
   ========================================================= */

function Customers({
  customers,
  deliveries,
  payments,
  onAdd,
  onUpdate,
  onDelete,
  onQuickPayment,
  onQuickDelivery,
}) {
  /* =======================================================
     STATE
     ======================================================= */

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] =
    useState(false);
  const [editingId, setEditingId] =
    useState(null);
  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  /*
   * Used after creating a customer.
   * The newly created customer card will be
   * automatically scrolled into view.
   */
  const [
    newlyCreatedCustomerId,
    setNewlyCreatedCustomerId,
  ] = useState(null);

  /*
   * Store DOM references for customer cards.
   */
  const customerRefs = useRef(
    new Map()
  );

  /* =======================================================
     SELECTED CUSTOMER DATA
     ======================================================= */

  const selectedCustomerData = useMemo(
    () =>
      customers.find(
        (customer) =>
          String(customer.id) ===
          String(selectedCustomer)
      ) || null,
    [
      customers,
      selectedCustomer,
    ]
  );

  /* =======================================================
     EMPTY FORM
     ======================================================= */

  const emptyForm = {
    name: "",
    phone: "",
    address: "",
  };

  const [form, setForm] =
    useState(emptyForm);

  /* =======================================================
     SORT CUSTOMERS
     ======================================================= */

  const sortedCustomers = useMemo(
    () =>
      [...customers].sort((a, b) =>
        String(a.name || "").localeCompare(
          String(b.name || ""),
          undefined,
          {
            sensitivity: "base",
          }
        )
      ),
    [customers]
  );

  /* =======================================================
     FILTER CUSTOMERS
     ======================================================= */

  const filteredCustomers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return sortedCustomers;
    }

    return sortedCustomers.filter(
      (customer) =>
        [
          customer.name,
          customer.phone,
          customer.address,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          )
    );
  }, [
    sortedCustomers,
    search,
  ]);

  /* =======================================================
     SCROLL TO NEWLY CREATED CUSTOMER
     ======================================================= */

  useEffect(() => {
    if (!newlyCreatedCustomerId) {
      return undefined;
    }

    const timer = setTimeout(() => {
      const element =
        customerRefs.current.get(
          String(
            newlyCreatedCustomerId
          )
        );

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      setNewlyCreatedCustomerId(null);
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [
    newlyCreatedCustomerId,
    filteredCustomers,
  ]);

  /* =======================================================
     OPEN ADD FORM
     ======================================================= */

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  /* =======================================================
     OPEN EDIT FORM
     ======================================================= */

  const openEdit = (customer) => {
    setEditingId(customer.id);

    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });

    setShowForm(true);
  };

  /* =======================================================
     HANDLE INPUT
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
     SAVE CUSTOMER
     ======================================================= */

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      alert(
        "Customer name is required."
      );
      return;
    }

    /* -----------------------------------------------------
       EDIT EXISTING CUSTOMER
       ----------------------------------------------------- */

    if (editingId) {
      onUpdate(editingId, {
        name,
        phone: form.phone.trim(),
        address:
          form.address.trim(),
      });
    }

    /* -----------------------------------------------------
       ADD NEW CUSTOMER
       ----------------------------------------------------- */

    else {
      const customerId = onAdd({
        name,
        phone: form.phone.trim(),
        address:
          form.address.trim(),
      });

      /*
       * App.jsx returns the newly generated ID.
       * Save it so we can scroll directly to
       * the new card after React renders it.
       */

      if (customerId) {
        setNewlyCreatedCustomerId(
          String(customerId)
        );
      }
    }

    /* -----------------------------------------------------
       RESET FORM
       ----------------------------------------------------- */

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  /* =======================================================
     DELETE CUSTOMER
     ======================================================= */

  const handleDelete = (customer) => {
    const relatedDeliveries =
      deliveries.filter(
        (delivery) =>
          String(
            delivery.customerId
          ) === String(customer.id)
      );

    const message =
      relatedDeliveries.length > 0
        ? `This customer has ${relatedDeliveries.length} delivery record(s). Delete the customer anyway?`
        : `Delete "${customer.name}"?`;

    if (!window.confirm(message)) {
      return;
    }

    onDelete(customer.id);
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
          <h2>Customers</h2>

          <p className="welcome">
            Manage your water customers
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAdd}
        >
          + Add Customer
        </button>
      </div>

      {/* ===================================================
          CUSTOMER DETAILS
          =================================================== */}

      {selectedCustomerData && (
        <CustomerDetails
          customer={selectedCustomerData}
          deliveries={deliveries}
          payments={payments}
          onUpdate={onUpdate}
          onClose={() =>
            setSelectedCustomer(null)
          }
          onQuickPayment={(
            customerId
          ) => {
            setSelectedCustomer(null);

            onQuickPayment?.(
              customerId
            );
          }}
          onQuickDelivery={(
            customerId
          ) => {
            setSelectedCustomer(null);

            onQuickDelivery?.(
              customerId
            );
          }}
        />
      )}

      {/* ===================================================
          CUSTOMER FORM
          =================================================== */}

      {showForm && (
        <form
          className="customer-form-card"
          onSubmit={handleSubmit}
        >
          <div className="form-header">
            <div>
              <h3>
                {editingId
                  ? "Edit Customer"
                  : "Add Customer"}
              </h3>

              <p>
                Enter the customer's basic
                information.
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
                NAME
                ============================================= */}

            <div className="form-group">
              <label>
                Customer Name *
              </label>

              <input
                name="name"
                value={form.name}
                onChange={handleInput}
                placeholder="Customer name"
                autoFocus
              />
            </div>

            {/* =============================================
                PHONE
                ============================================= */}

            <div className="form-group">
              <label>
                Phone
              </label>

              <input
                name="phone"
                value={form.phone}
                onChange={handleInput}
                placeholder="Phone number"
              />
            </div>

            {/* =============================================
                ADDRESS
                ============================================= */}

            <div className="form-group form-group-full">
              <label>
                Address
              </label>

              <textarea
                name="address"
                value={form.address}
                onChange={handleInput}
                placeholder="Customer address"
              />
            </div>
          </div>

          {/* ===============================================
              FORM ACTIONS
              =============================================== */}

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
                ? "Update Customer"
                : "Save Customer"}
            </button>
          </div>
        </form>
      )}

      {/* ===================================================
          SEARCH
          =================================================== */}

      <div className="customer-toolbar">
        <div className="search-box">
          <span>🔍</span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search customer..."
          />
        </div>

        <div className="customer-count">
          {filteredCustomers.length} of{" "}
          {customers.length} customers
        </div>
      </div>

      {/* ===================================================
          CUSTOMER LIST
          =================================================== */}

      {filteredCustomers.length ===
      0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            👥
          </div>

          <h3>
            {search
              ? "No customers found"
              : "No customers yet"}
          </h3>

          <p>
            {search
              ? "Try another search."
              : "Add your first customer to get started."}
          </p>

          {!search && (
            <button
              type="button"
              className="primary-button"
              onClick={openAdd}
            >
              + Add Customer
            </button>
          )}
        </div>
      ) : (
        <div className="customers-list">
          {filteredCustomers.map(
            (customer) => {
              const customerDeliveries =
                deliveries.filter(
                  (delivery) =>
                    String(
                      delivery.customerId
                    ) ===
                    String(
                      customer.id
                    )
                );

              const billed =
                customerDeliveries.reduce(
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

              const outstanding =
                Math.max(
                  0,
                  (Number(
                    customer.previousBalance
                  ) || 0) +
                    billed -
                    paid
                );

              return (
                <div
                  className="customer-card"
                  key={customer.id}
                  ref={(element) => {
                    const id =
                      String(
                        customer.id
                      );

                    if (element) {
                      customerRefs.current.set(
                        id,
                        element
                      );
                    } else {
                      customerRefs.current.delete(
                        id
                      );
                    }
                  }}
                  onClick={() =>
                    setSelectedCustomer(
                      customer.id
                    )
                  }
                  style={{
                    cursor:
                      "pointer",
                  }}
                >
                  {/* =======================================
                      AVATAR
                      ======================================= */}

                  <div className="customer-avatar">
                    {getInitials(
                      customer.name
                    )}
                  </div>

                  {/* =======================================
                      CUSTOMER INFORMATION
                      ======================================= */}

                  <div className="customer-info">
                    <h3>
                      {customer.name}
                    </h3>

                    <div className="customer-details">
                      {customer.phone && (
                        <span>
                          📞{" "}
                          {customer.phone}
                        </span>
                      )}

                      {customer.address && (
                        <span>
                          📍{" "}
                          {customer.address}
                        </span>
                      )}

                      <span>
                        🚚{" "}
                        {
                          customerDeliveries.length
                        }{" "}
                        deliveries
                      </span>

                      <span>
                        💰 Rs.{" "}
                        {formatMoney(
                          outstanding
                        )}{" "}
                        due
                      </span>
                    </div>
                  </div>

                  {/* =======================================
                      ACTIONS
                      ======================================= */}

                  <div className="customer-actions">
                    <button
                      type="button"
                      className="edit-button"
                      title="Edit customer"
                      onClick={(
                        event
                      ) => {
                        event.stopPropagation();
                        openEdit(
                          customer
                        );
                      }}
                    >
                      ✏️
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      title="Delete customer"
                      onClick={(
                        event
                      ) => {
                        event.stopPropagation();
                        handleDelete(
                          customer
                        );
                      }}
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
    </>
  );
}

export default Customers;
