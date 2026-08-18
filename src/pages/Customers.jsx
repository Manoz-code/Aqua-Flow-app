import { useMemo, useState } from "react";
import { formatMoney, getInitials } from "../utils/format";
import { getCustomerPayments, getDeliveryTotal } from "../utils/data";
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
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const selectedCustomerData = useMemo(
  () =>
    customers.find(
      (customer) =>
        String(customer.id) === String(selectedCustomer)
    ) || null,
  [customers, selectedCustomer]
);

  const emptyForm = { name: "", phone: "", address: "" };
  const [form, setForm] = useState(emptyForm);

  const sortedCustomers = useMemo(
    () =>
      [...customers].sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""), undefined, {
          sensitivity: "base",
        })
      ),
    [customers]
  );

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return sortedCustomers;
    }

    return sortedCustomers.filter((customer) =>
      [customer.name, customer.phone, customer.address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [sortedCustomers, search]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (customer) => {
    setEditingId(customer.id);

    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });

    setShowForm(true);
  };

  const handleInput = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      alert("Customer name is required.");
      return;
    }

    if (editingId) {
      onUpdate(editingId, {
        name,
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
    } else {
      onAdd({
        name,
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
    }

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = (customer) => {
    const relatedDeliveries = deliveries.filter(
      (delivery) => String(delivery.customerId) === String(customer.id)
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

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Customers</h2>
          <p className="welcome">Manage your water customers</p>
        </div>

        <button type="button" className="primary-button" onClick={openAdd}>
          + Add Customer
        </button>
      </div>
{selectedCustomerData && (
<CustomerDetails
  customer={selectedCustomerData}
  deliveries={deliveries}
  payments={payments}
  onUpdate={onUpdate}
  onClose={() => setSelectedCustomer(null)}
  onQuickPayment={(customerId) => {
    setSelectedCustomer(null);
    onQuickPayment?.(customerId);
  }}
  onQuickDelivery={(customerId) => {
    setSelectedCustomer(null);
    onQuickDelivery?.(customerId);
  }}
/>
)}
      {showForm && (
        <form className="customer-form-card" onSubmit={handleSubmit}>
          <div className="form-header">
            <div>
              <h3>{editingId ? "Edit Customer" : "Add Customer"}</h3>
              <p>Enter the customer's basic information.</p>
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
            <div className="form-group">
              <label>Customer Name *</label>

              <input
                name="name"
                value={form.name}
                onChange={handleInput}
                placeholder="Customer name"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Phone</label>

              <input
                name="phone"
                value={form.phone}
                onChange={handleInput}
                placeholder="Phone number"
              />
            </div>

            <div className="form-group form-group-full">
              <label>Address</label>

              <textarea
                name="address"
                value={form.address}
                onChange={handleInput}
                placeholder="Customer address"
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
              {editingId ? "Update Customer" : "Save Customer"}
            </button>
          </div>
        </form>
      )}

      <div className="customer-toolbar">
        <div className="search-box">
          <span>🔍</span>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer..."
          />
        </div>

        <div className="customer-count">
          {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>

          <h3>{search ? "No customers found" : "No customers yet"}</h3>

          <p>
            {search
              ? "Try another search."
              : "Add your first customer to get started."}
          </p>

          {!search && (
            <button type="button" className="primary-button" onClick={openAdd}>
              + Add Customer
            </button>
          )}
        </div>
      ) : (
        <div className="customers-list">
          {filteredCustomers.map((customer) => {
            const customerDeliveries = deliveries.filter(
              (delivery) => String(delivery.customerId) === String(customer.id)
            );

            const billed = customerDeliveries.reduce(
              (sum, delivery) => sum + getDeliveryTotal(delivery),
              0
            );

            const paid = getCustomerPayments(payments, customer.id);

            return (
              <div
                className="customer-card"
                key={customer.id}
                onClick={() => setSelectedCustomer(customer.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="customer-avatar">
                  {getInitials(customer.name)}
                </div>

                <div className="customer-info">
                  <h3>{customer.name}</h3>

                  <div className="customer-details">
                    {customer.phone && <span>📞 {customer.phone}</span>}
                    {customer.address && <span>📍 {customer.address}</span>}

                    <span>🚚 {customerDeliveries.length} deliveries</span>

                    <span>
                      💰 Rs.{" "}
                      {formatMoney(
                        Math.max(
                          0,
                          (Number(customer.previousBalance) || 0) + billed - paid
                        )
                      )}{" "}
                      due
                    </span>
                  </div>
                </div>

                <div className="customer-actions">
                  <button
                    type="button"
                    className="edit-button"
                    title="Edit customer"
                    onClick={(event) => {
                            event.stopPropagation();
                            openEdit(customer);
                          }}
                                            >
                    ✏️
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    title="Delete customer"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(customer);
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
    </>
  );
}

export default Customers;
