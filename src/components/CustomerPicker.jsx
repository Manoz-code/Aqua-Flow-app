import { memo, useCallback, useMemo, useState } from "react";
import { getInitials } from "../utils/format";

/* =========================================================
   SEARCHABLE CUSTOMER PICKER
   Used by BOTH Deliveries and Payments
   ========================================================= */

const CustomerPicker = memo(function CustomerPicker({
  customers,
  value,
  onChange,
  label = "Customer *",
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), undefined, {
        sensitivity: "base",
      })
    );
  }, [customers]);

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

  const selectedCustomer = useMemo(() => {
    return customers.find((customer) => String(customer.id) === String(value));
  }, [customers, value]);

  const selectCustomer = useCallback(
    (customer) => {
      onChange(customer.id);
      setOpen(false);
      setSearch("");
    },
    [onChange]
  );

  const clearCustomer = useCallback(() => {
    onChange("");
    setSearch("");
    setOpen(false);
  }, [onChange]);

  return (
    <div className="customer-picker form-group-full">
      <label>{label}</label>

      {!selectedCustomer ? (
        <button
          type="button"
          className="customer-picker-trigger"
          onClick={() => setOpen((current) => !current)}
        >
          <span className="picker-search-icon">🔍</span>
          <span>Search and select customer</span>
          <span className="picker-arrow">▾</span>
        </button>
      ) : (
        <div className="selected-customer">
          <div className="selected-customer-avatar">
            {getInitials(selectedCustomer.name)}
          </div>

          <div className="selected-customer-info">
            <strong>{selectedCustomer.name}</strong>
            <span>
              {selectedCustomer.phone ||
                selectedCustomer.address ||
                "Customer selected"}
            </span>
          </div>

          <button
            type="button"
            className="change-customer-button"
            onClick={() => {
              setOpen(true);
              setSearch("");
            }}
          >
            Change
          </button>

          <button
            type="button"
            className="close-button"
            style={{ marginLeft: 6, width: 34, height: 34 }}
            onClick={clearCustomer}
            title="Clear customer"
          >
            ×
          </button>
        </div>
      )}

      {open && (
        <div className="customer-picker-panel">
          <div className="customer-picker-search">
            <span>🔍</span>

            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, phone or address..."
            />

            {search && (
              <button type="button" onClick={() => setSearch("")}>
                ×
              </button>
            )}
          </div>

          <div className="customer-picker-count">
            {filteredCustomers.length} customer
            {filteredCustomers.length !== 1 ? "s" : ""} found
          </div>

          <div className="customer-picker-list">
            {filteredCustomers.length === 0 ? (
              <div className="picker-empty">
                <span>🔍</span>
                <strong>No customer found</strong>
                <p>Try another name or phone number.</p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <button
                  type="button"
                  className="customer-picker-item"
                  key={customer.id}
                  onClick={() => selectCustomer(customer)}
                >
                  <div className="picker-avatar">
                    {getInitials(customer.name)}
                  </div>

                  <div className="picker-customer-info">
                    <strong>{customer.name}</strong>

                    <div>
                      {customer.phone && <span>📞 {customer.phone}</span>}
                      {customer.address && <span>📍 {customer.address}</span>}
                    </div>
                  </div>

                  <span className="picker-check">✓</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default CustomerPicker;
