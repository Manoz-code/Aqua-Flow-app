import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./App.css";

/* =========================================================
   AQUAFLOW OFFLINE
   ========================================================= */

const STORAGE_KEY = "aquaflow_offline_data_v3";
const PIN_STORAGE_KEY = "aquaflow_pin_v1";
const RECOVERY_STORAGE_KEY = "aquaflow_recovery_v1";

/*
 * IMPORTANT:
 * This is an OFFLINE app.
 *
 * The default recovery code is:
 *
 * AQUA-RESET-1234
 *
 * Change it from Settings after opening the app.
 */

const DEFAULT_PIN = "1234";
const DEFAULT_RECOVERY_CODE = "AQUA-RESET-1234";

/* =========================================================
   DEFAULT DATA
   ========================================================= */

const EMPTY_DATA = {
  customers: [],
  deliveries: [],
  payments: [],
};

/* =========================================================
   HELPERS
   ========================================================= */

const createId = (prefix = "") =>
  `${prefix}${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;

const today = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatMoney = (value) => {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(number);
};

const formatNumber = (value) => {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(number);
};

const getInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!words.length) return "?";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

const normalizeData = (data) => {
  if (!data || typeof data !== "object") {
    return EMPTY_DATA;
  }

  return {
    customers: Array.isArray(data.customers)
      ? data.customers
      : [],

    deliveries: Array.isArray(data.deliveries)
      ? data.deliveries
      : [],

    payments: Array.isArray(data.payments)
      ? data.payments
      : [],
  };
};

const getStoredPin = () => {
  try {
    return (
      localStorage.getItem(PIN_STORAGE_KEY) ||
      DEFAULT_PIN
    );
  } catch {
    return DEFAULT_PIN;
  }
};

const getStoredRecoveryCode = () => {
  try {
    return (
      localStorage.getItem(RECOVERY_STORAGE_KEY) ||
      DEFAULT_RECOVERY_CODE
    );
  } catch {
    return DEFAULT_RECOVERY_CODE;
  }
};

const getDefaultPrice = (quantity) => {
  const qty = Number(quantity);

  if (qty === 1000) return 900;
  if (qty === 2000) return 1600;

  return "";
};

/*
 * finalPrice = water price
 * extraCharge = additional charge
 *
 * Total = finalPrice + extraCharge
 */

const getDeliveryTotal = (delivery) => {
  const finalPrice =
    delivery.finalPrice !== undefined
      ? Number(delivery.finalPrice) || 0
      : Number(delivery.totalPrice) || 0;

  const extraCharge =
    Number(delivery.extraCharge) || 0;

  /*
   * Old records may have pricePerLiter instead
   * of finalPrice.
   */
  if (
    delivery.finalPrice === undefined &&
    delivery.totalPrice === undefined
  ) {
    return (
      (Number(delivery.quantity) || 0) *
        (Number(delivery.pricePerLiter) || 0) +
      extraCharge
    );
  }

  return finalPrice + extraCharge;
};

const getCustomerPayments = (
  payments,
  customerId
) => {
  return payments
    .filter(
      (payment) =>
        String(payment.customerId) ===
        String(customerId)
    )
    .reduce(
      (sum, payment) =>
        sum + (Number(payment.amount) || 0),
      0
    );
};

const getDeliveryPayments = (
  payments,
  deliveryId
) => {
  return payments
    .filter(
      (payment) =>
        payment.deliveryId &&
        String(payment.deliveryId) ===
          String(deliveryId)
    )
    .reduce(
      (sum, payment) =>
        sum + (Number(payment.amount) || 0),
      0
    );
};

const getDeliveryRemaining = (
  delivery,
  payments
) => {
  const total = getDeliveryTotal(delivery);

  const paid = getDeliveryPayments(
    payments,
    delivery.id
  );

  return Math.max(0, total - paid);
};

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
      String(a.name || "").localeCompare(
        String(b.name || ""),
        undefined,
        {
          sensitivity: "base",
        }
      )
    );
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return sortedCustomers;
    }

    return sortedCustomers.filter((customer) =>
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
  }, [sortedCustomers, search]);

  const selectedCustomer = useMemo(() => {
    return customers.find(
      (customer) =>
        String(customer.id) === String(value)
    );
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
          onClick={() =>
            setOpen((current) => !current)
          }
        >
          <span className="picker-search-icon">
            🔍
          </span>

          <span>
            Search and select customer
          </span>

          <span className="picker-arrow">
            ▾
          </span>
        </button>
      ) : (
        <div className="selected-customer">
          <div className="selected-customer-avatar">
            {getInitials(selectedCustomer.name)}
          </div>

          <div className="selected-customer-info">
            <strong>
              {selectedCustomer.name}
            </strong>

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
            style={{
              marginLeft: 6,
              width: 34,
              height: 34,
            }}
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
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search name, phone or address..."
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>

          <div className="customer-picker-count">
            {filteredCustomers.length} customer
            {filteredCustomers.length !== 1
              ? "s"
              : ""}{" "}
            found
          </div>

          <div className="customer-picker-list">
            {filteredCustomers.length === 0 ? (
              <div className="picker-empty">
                <span>🔍</span>

                <strong>
                  No customer found
                </strong>

                <p>
                  Try another name or phone
                  number.
                </p>
              </div>
            ) : (
              filteredCustomers.map(
                (customer) => (
                  <button
                    type="button"
                    className="customer-picker-item"
                    key={customer.id}
                    onClick={() =>
                      selectCustomer(customer)
                    }
                  >
                    <div className="picker-avatar">
                      {getInitials(
                        customer.name
                      )}
                    </div>

                    <div className="picker-customer-info">
                      <strong>
                        {customer.name}
                      </strong>

                      <div>
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
                      </div>
                    </div>

                    <span className="picker-check">
                      ✓
                    </span>
                  </button>
                )
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
});

/* =========================================================
   APP
   ========================================================= */

export default function App() {
  const [isUnlocked, setIsUnlocked] =
    useState(false);

  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  const [activePage, setActivePage] =
    useState("Dashboard");

  const [currentPin, setCurrentPin] =
    useState(getStoredPin);

  const [recoveryCode, setRecoveryCode] =
    useState(getStoredRecoveryCode);

  const [data, setData] = useState(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return EMPTY_DATA;
      }

      return normalizeData(
        JSON.parse(saved)
      );
    } catch {
      return EMPTY_DATA;
    }
  });

  /* -------------------------------------------------------
     SAVE DATA
     ------------------------------------------------------- */

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error(
        "Failed to save AquaFlow data:",
        error
      );
    }
  }, [data]);

  /* -------------------------------------------------------
     SAVE PIN
     ------------------------------------------------------- */

  useEffect(() => {
    try {
      localStorage.setItem(
        PIN_STORAGE_KEY,
        currentPin
      );

      localStorage.setItem(
        RECOVERY_STORAGE_KEY,
        recoveryCode
      );
    } catch (error) {
      console.error(
        "Failed to save security settings:",
        error
      );
    }
  }, [currentPin, recoveryCode]);

  /* -------------------------------------------------------
     PIN
     ------------------------------------------------------- */

  const handleNumberClick = useCallback(
    (number) => {
      setPinError("");

      setPin((current) => {
        if (current.length >= 4) {
          return current;
        }

        return current + String(number);
      });
    },
    []
  );

  const handlePinDelete = useCallback(() => {
    setPin((current) =>
      current.slice(0, -1)
    );

    setPinError("");
  }, []);

  const handlePinClear = useCallback(() => {
    setPin("");
    setPinError("");
  }, []);

  const handleUnlock = useCallback(() => {
    if (pin === currentPin) {
      setIsUnlocked(true);
      setPin("");
      setPinError("");
      return;
    }

    setPin("");
    setPinError("Incorrect PIN");
  }, [pin, currentPin]);

  const handleLock = useCallback(() => {
    setIsUnlocked(false);
    setPin("");
    setPinError("");
    setActivePage("Dashboard");
  }, []);

  /* -------------------------------------------------------
     DATA ACTIONS
     ------------------------------------------------------- */

  const addCustomer = useCallback(
    (customer) => {
      setData((current) => ({
        ...current,

        customers: [
          ...current.customers,

          {
            ...customer,
            id: createId("customer_"),
            createdAt:
              new Date().toISOString(),
          },
        ],
      }));
    },
    []
  );

  const updateCustomer = useCallback(
    (id, updates) => {
      setData((current) => ({
        ...current,

        customers: current.customers.map(
          (customer) =>
            String(customer.id) ===
            String(id)
              ? {
                  ...customer,
                  ...updates,
                  updatedAt:
                    new Date().toISOString(),
                }
              : customer
        ),
      }));
    },
    []
  );

  const deleteCustomer = useCallback(
    (id) => {
      setData((current) => ({
        ...current,

        customers:
          current.customers.filter(
            (customer) =>
              String(customer.id) !==
              String(id)
          ),
      }));
    },
    []
  );

  const addDelivery = useCallback(
    (delivery) => {
      setData((current) => ({
        ...current,

        deliveries: [
          ...current.deliveries,

          {
            ...delivery,

            id: createId("delivery_"),

            /*
             * Every new delivery starts pending.
             */
            status: "pending",

            createdAt:
              new Date().toISOString(),
          },
        ],
      }));
    },
    []
  );

  const updateDelivery = useCallback(
    (id, updates) => {
      setData((current) => ({
        ...current,

        deliveries:
          current.deliveries.map(
            (delivery) =>
              String(delivery.id) ===
              String(id)
                ? {
                    ...delivery,
                    ...updates,
                    updatedAt:
                      new Date().toISOString(),
                  }
                : delivery
          ),
      }));
    },
    []
  );

  const markDeliveryDelivered =
    useCallback((id) => {
      setData((current) => ({
        ...current,

        deliveries:
          current.deliveries.map(
            (delivery) =>
              String(delivery.id) ===
              String(id)
                ? {
                    ...delivery,
                    status: "delivered",
                    deliveredAt:
                      new Date().toISOString(),
                    updatedAt:
                      new Date().toISOString(),
                  }
                : delivery
          ),
      }));
    }, []);

  const deleteDelivery = useCallback(
    (id) => {
      setData((current) => ({
        ...current,

        deliveries:
          current.deliveries.filter(
            (delivery) =>
              String(delivery.id) !==
              String(id)
          ),

        payments:
          current.payments.filter(
            (payment) =>
              String(payment.deliveryId) !==
              String(id)
          ),
      }));
    },
    []
  );

  const addPayment = useCallback(
    (payment) => {
      setData((current) => ({
        ...current,

        payments: [
          ...current.payments,

          {
            ...payment,
            id: createId("payment_"),
            createdAt:
              new Date().toISOString(),
          },
        ],
      }));
    },
    []
  );

  const deletePayment = useCallback(
    (id) => {
      setData((current) => ({
        ...current,

        payments:
          current.payments.filter(
            (payment) =>
              String(payment.id) !==
              String(id)
          ),
      }));
    },
    []
  );

  /* -------------------------------------------------------
     NAVIGATION
     ------------------------------------------------------- */

  const handleNavigate = useCallback(
    (page) => {
      setActivePage(page);
    },
    []
  );

  const renderPage = () => {
    switch (activePage) {
      case "Customers":
        return (
          <Customers
            customers={data.customers}
            deliveries={data.deliveries}
            payments={data.payments}
            onAdd={addCustomer}
            onUpdate={updateCustomer}
            onDelete={deleteCustomer}
          />
        );

      case "Deliveries":
        return (
          <Deliveries
            customers={data.customers}
            deliveries={data.deliveries}
            payments={data.payments}
            onAdd={addDelivery}
            onUpdate={updateDelivery}
            onDelete={deleteDelivery}
            onMarkDelivered={
              markDeliveryDelivered
            }
            onNavigate={handleNavigate}
          />
        );

      case "Payments":
        return (
          <Payments
            customers={data.customers}
            deliveries={data.deliveries}
            payments={data.payments}
            onAdd={addPayment}
            onDelete={deletePayment}
          />
        );

      case "Reports":
        return (
          <Reports
            customers={data.customers}
            deliveries={data.deliveries}
            payments={data.payments}
          />
        );

      case "Settings":
        return (
          <Settings
            data={data}
            setData={setData}
            currentPin={currentPin}
            setCurrentPin={setCurrentPin}
            recoveryCode={recoveryCode}
            setRecoveryCode={
              setRecoveryCode
            }
          />
        );

      case "Dashboard":
      default:
        return (
          <Dashboard
            customers={data.customers}
            deliveries={data.deliveries}
            payments={data.payments}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  /* -------------------------------------------------------
     LOCK SCREEN
     ------------------------------------------------------- */

  if (!isUnlocked) {
    return (
      <PinScreen
        pin={pin}
        error={pinError}
        onNumberClick={handleNumberClick}
        onDelete={handlePinDelete}
        onClear={handlePinClear}
        onUnlock={handleUnlock}
        currentPin={currentPin}
        recoveryCode={recoveryCode}
        onPinRecovered={(newPin) => {
          setCurrentPin(newPin);
          setPin("");
          setPinError("");
          setIsUnlocked(true);
        }}
      />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-logo">
          <span>💧</span>

          <div>
            <h1>AquaFlow</h1>

            <small>
              Offline Water Management
            </small>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLock}
        >
          🔒 Lock
        </button>
      </header>

      <div className="app-layout">
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
        />

        <main className="main-content">
          <div className="page">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   PIN SCREEN
   ========================================================= */

const PinScreen = memo(function PinScreen({
  pin,
  error,
  onNumberClick,
  onDelete,
  onClear,
  onUnlock,
  recoveryCode,
  onPinRecovered,
}) {
  const [showRecovery, setShowRecovery] =
    useState(false);

  const [enteredRecovery, setEnteredRecovery] =
    useState("");

  const [newPin, setNewPin] =
    useState("");

  const [confirmPin, setConfirmPin] =
    useState("");

  const [recoveryError, setRecoveryError] =
    useState("");

  const handleRecovery = () => {
    setRecoveryError("");

    if (
      enteredRecovery.trim() !==
      recoveryCode
    ) {
      setRecoveryError(
        "Incorrect recovery code."
      );
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setRecoveryError(
        "New PIN must contain exactly 4 digits."
      );
      return;
    }

    if (newPin !== confirmPin) {
      setRecoveryError(
        "PINs do not match."
      );
      return;
    }

    onPinRecovered(newPin);
  };

  if (showRecovery) {
    return (
      <div className="pin-screen">
        <div className="pin-card">
          <div className="logo">🔐</div>

          <h1>Recover PIN</h1>

          <p className="subtitle">
            Reset your AquaFlow PIN
          </p>

          <div className="form-group">
            <label>Recovery Code</label>

            <input
              value={enteredRecovery}
              onChange={(event) =>
                setEnteredRecovery(
                  event.target.value
                )
              }
              placeholder="Enter recovery code"
              autoFocus
            />
          </div>

          <div
            className="form-group"
            style={{ marginTop: 12 }}
          >
            <label>New 4-Digit PIN</label>

            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              onChange={(event) =>
                setNewPin(
                  event.target.value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
              placeholder="New PIN"
            />
          </div>

          <div
            className="form-group"
            style={{ marginTop: 12 }}
          >
            <label>Confirm New PIN</label>

            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(event) =>
                setConfirmPin(
                  event.target.value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
              placeholder="Confirm PIN"
            />
          </div>

          {recoveryError && (
            <p className="pin-error">
              {recoveryError}
            </p>
          )}

          <button
            type="button"
            className="unlock-button"
            onClick={handleRecovery}
            style={{ marginTop: 20 }}
          >
            Reset PIN
          </button>

          <button
            type="button"
            className="secondary-button"
            style={{
              width: "100%",
              marginTop: 10,
            }}
            onClick={() => {
              setShowRecovery(false);
              setRecoveryError("");
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const numbers = [
    1, 2, 3,
    4, 5, 6,
    7, 8, 9,
  ];

  return (
    <div className="pin-screen">
      <div className="pin-card">
        <div className="logo">💧</div>

        <h1>AquaFlow</h1>

        <p className="subtitle">
          Offline Water Management
        </p>

        <h2>Enter PIN</h2>

        <div className="pin-dots">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={`dot ${
                pin.length > index
                  ? "filled"
                  : ""
              }`}
            >
              ●
            </span>
          ))}
        </div>

        {error && (
          <p className="pin-error">
            {error}
          </p>
        )}

        <div className="number-pad">
          {numbers.map((number) => (
            <button
              key={number}
              type="button"
              onClick={() =>
                onNumberClick(number)
              }
            >
              {number}
            </button>
          ))}

          <button
            type="button"
            onClick={onClear}
          >
            C
          </button>

          <button
            type="button"
            onClick={() =>
              onNumberClick(0)
            }
          >
            0
          </button>

          <button
            type="button"
            onClick={onDelete}
          >
            ←
          </button>
        </div>

        <button
          type="button"
          className="unlock-button"
          onClick={onUnlock}
          disabled={pin.length !== 4}
        >
          Unlock
        </button>

        <button
          type="button"
          className="secondary-button"
          style={{
            width: "100%",
            marginTop: 10,
          }}
          onClick={() => {
            setShowRecovery(true);
            setEnteredRecovery("");
            setNewPin("");
            setConfirmPin("");
            setRecoveryError("");
          }}
        >
          🔑 Forgot PIN?
        </button>

        <p className="demo-pin">
          Default PIN: 1234
        </p>
      </div>
    </div>
  );
});

/* =========================================================
   SIDEBAR
   ========================================================= */

const Sidebar = memo(function Sidebar({
  activePage,
  onNavigate,
}) {
  const items = [
    ["Dashboard", "📊"],
    ["Customers", "👥"],
    ["Deliveries", "🚚"],
    ["Payments", "💰"],
    ["Reports", "📈"],
    ["Settings", "⚙️"],
  ];

  return (
    <aside className="sidebar">
      <nav>
        {items.map(([name, icon]) => (
          <button
            key={name}
            type="button"
            className={
              activePage === name
                ? "active"
                : ""
            }
            onClick={() =>
              onNavigate(name)
            }
          >
            <span>{icon}</span>
            {name}
          </button>
        ))}
      </nav>
    </aside>
  );
});

/* =========================================================
   DASHBOARD
   ========================================================= */

const Dashboard = memo(function Dashboard({
  customers,
  deliveries,
  payments,
  onNavigate,
}) {
  const stats = useMemo(() => {
    const todayDate = today();

    const todayDeliveries =
      deliveries.filter(
        (delivery) =>
          String(
            delivery.date || ""
          ).slice(0, 10) === todayDate
      );

    const todayRevenue =
      todayDeliveries.reduce(
        (sum, delivery) =>
          sum + getDeliveryTotal(delivery),
        0
      );

    const totalBilled =
      deliveries.reduce(
        (sum, delivery) =>
          sum + getDeliveryTotal(delivery),
        0
      );

    const totalPaid =
      payments.reduce(
        (sum, payment) =>
          sum +
          (Number(payment.amount) || 0),
        0
      );

    const totalLiters =
      deliveries.reduce(
        (sum, delivery) =>
          sum +
          (Number(delivery.quantity) || 0),
        0
      );

    const pendingDeliveries =
      deliveries.filter(
        (delivery) =>
          delivery.status !== "delivered"
      ).length;

    return {
      customers: customers.length,
      deliveries: deliveries.length,
      totalLiters,
      totalBilled,
      totalPaid,

      outstanding: Math.max(
        0,
        totalBilled - totalPaid
      ),

      todayDeliveries:
        todayDeliveries.length,

      todayRevenue,

      pendingDeliveries,
    };
  }, [
    customers,
    deliveries,
    payments,
  ]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>

          <p className="welcome">
            Welcome to AquaFlow
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            onNavigate("Deliveries")
          }
        >
          + New Delivery
        </button>
      </div>

      <div className="dashboard-cards">
        <DashboardCard
          icon="👥"
          title="Customers"
          value={stats.customers}
        />

        <DashboardCard
          icon="🚚"
          title="Total Deliveries"
          value={stats.deliveries}
        />

        <DashboardCard
          icon="⏳"
          title="Pending Deliveries"
          value={stats.pendingDeliveries}
        />

        <DashboardCard
          icon="💧"
          title="Total Liters"
          value={formatNumber(
            stats.totalLiters
          )}
        />

        <DashboardCard
          icon="💰"
          title="Total Billed"
          value={`Rs. ${formatMoney(
            stats.totalBilled
          )}`}
        />

        <DashboardCard
          icon="✅"
          title="Total Paid"
          value={`Rs. ${formatMoney(
            stats.totalPaid
          )}`}
        />

        <DashboardCard
          icon="⚠️"
          title="Outstanding"
          value={`Rs. ${formatMoney(
            stats.outstanding
          )}`}
        />

        <DashboardCard
          icon="📦"
          title="Today's Deliveries"
          value={stats.todayDeliveries}
        />

        <DashboardCard
          icon="💵"
          title="Today's Revenue"
          value={`Rs. ${formatMoney(
            stats.todayRevenue
          )}`}
        />
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">
          ⚡
        </div>

        <h3>Quick Actions</h3>

        <p>
          Quickly access the main AquaFlow
          features.
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 20,
          }}
        >
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              onNavigate("Customers")
            }
          >
            👥 Customers
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              onNavigate("Deliveries")
            }
          >
            🚚 Deliveries
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              onNavigate("Payments")
            }
          >
            💰 Payments
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              onNavigate("Reports")
            }
          >
            📈 Reports
          </button>
        </div>
      </div>
    </>
  );
});

const DashboardCard = memo(
  function DashboardCard({
    icon,
    title,
    value,
  }) {
    return (
      <div className="dashboard-card">
        <div className="card-icon">
          {icon}
        </div>

        <h3>{title}</h3>

        <p>{value}</p>
      </div>
    );
  }
);

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
}) {
  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const emptyForm = {
    name: "",
    phone: "",
    address: "",
  };

  const [form, setForm] =
    useState(emptyForm);

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

  const filteredCustomers =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

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
      address:
        customer.address || "",
    });

    setShowForm(true);
  };

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

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      alert(
        "Customer name is required."
      );
      return;
    }

    if (editingId) {
      onUpdate(editingId, {
        name,
        phone: form.phone.trim(),
        address:
          form.address.trim(),
      });
    } else {
      onAdd({
        name,
        phone: form.phone.trim(),
        address:
          form.address.trim(),
      });
    }

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

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

  return (
    <>
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

      <div className="customer-toolbar">
        <div className="search-box">
          <span>🔍</span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search customer..."
          />
        </div>

        <div className="customer-count">
          {filteredCustomers.length} of{" "}
          {customers.length} customers
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
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
                    String(customer.id)
                );

              const billed =
                customerDeliveries.reduce(
                  (sum, delivery) =>
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

              return (
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
                          Math.max(
                            0,
                            billed - paid
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
                      onClick={() =>
                        openEdit(customer)
                      }
                    >
                      ✏️
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      title="Delete customer"
                      onClick={() =>
                        handleDelete(
                          customer
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
    </>
  );
}

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
}) {
  const getEmptyForm = () => ({
    customerId: "",
    quantity: "1000",
    finalPrice: "900",
    extraCharge: "0",
    date: today(),
    notes: "",
  });

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] = useState(
    getEmptyForm()
  );

  const deliveryStats = useMemo(() => {
    const totalLiters =
      deliveries.reduce(
        (sum, delivery) =>
          sum +
          (Number(
            delivery.quantity
          ) || 0),
        0
      );

    const totalBilled =
      deliveries.reduce(
        (sum, delivery) =>
          sum +
          getDeliveryTotal(delivery),
        0
      );

    const pending =
      deliveries.filter(
        (delivery) =>
          delivery.status !==
          "delivered"
      ).length;

    return {
      totalLiters,
      totalBilled,
      pending,
    };
  }, [deliveries]);

  const openAdd = () => {
    setEditingId(null);
    setForm(getEmptyForm());
    setShowForm(true);
  };

  const openEdit = (delivery) => {
    setEditingId(delivery.id);

    setForm({
      customerId:
        delivery.customerId || "",

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
        ? String(
            delivery.date
          ).slice(0, 10)
        : today(),

      notes: delivery.notes || "",
    });

    setShowForm(true);
  };

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

  const handleQuantityChange = (
    event
  ) => {
    setForm((current) => ({
      ...current,
      quantity:
        event.target.value,
    }));
  };

  const calculatedTotal = useMemo(() => {
    return (
      (Number(form.finalPrice) ||
        0) +
      (Number(form.extraCharge) ||
        0)
    );
  }, [
    form.finalPrice,
    form.extraCharge,
  ]);

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
      Number(form.extraCharge) ||
      0;

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

    const delivery = {
      customerId: form.customerId,
      quantity,
      finalPrice,
      extraCharge,
      date: form.date || today(),
      notes: form.notes.trim(),
    };

    if (editingId) {
      onUpdate(
        editingId,
        delivery
      );
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

  const handleDelivered = (
    delivery
  ) => {
    if (
      delivery.status ===
      "delivered"
    ) {
      return;
    }

    if (
      !window.confirm(
        "Mark this delivery as delivered?"
      )
    ) {
      return;
    }

    onMarkDelivered(
      delivery.id
    );
  };

  const sortedDeliveries =
    useMemo(() => {
      return [...deliveries].sort(
        (a, b) =>
          new Date(
            b.date || b.createdAt
          ) -
          new Date(
            a.date || a.createdAt
          )
      );
    }, [deliveries]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Deliveries</h2>

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

      {showForm && (
        <form
          className="customer-form-card"
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
            <CustomerPicker
              customers={customers}
              value={form.customerId}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  customerId: value,
                }))
              }
            />

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
                value={form.quantity}
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

            <div className="form-group">
              <label>
                Final Price (Rs.) *
              </label>

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
                onChange={handleInput}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label>
                Delivery Date
              </label>

              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleInput}
              />
            </div>

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

            <div className="form-group form-group-full">
              <label>
                Notes
              </label>

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

              return (
                <div
                  className="delivery-card"
                  key={delivery.id}
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
                          {delivery.date ||
                            "No date"}
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
                              "Payments"
                            )
                          }
                        >
                          💰 Payment
                        </button>
                      )}

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

/* =========================================================
   PAYMENTS
   ========================================================= */

function Payments({
  customers,
  deliveries,
  payments,
  onAdd,
  onDelete,
}) {
  const getEmptyForm = () => ({
    customerId: "",
    deliveryId: "",
    amount: "",
    date: today(),
    notes: "",
  });

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] = useState(
    getEmptyForm()
  );

  /*
   * Outstanding deliveries.
   *
   * These are displayed directly on the
   * Payments page so the user does not
   * have to search through all deliveries.
   */

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
                b.delivery.createdAt
            ) -
            new Date(
              a.delivery.date ||
                a.delivery.createdAt
            )
        );
    }, [
      customers,
      deliveries,
      payments,
    ]);

  const selectedCustomerDeliveries =
    useMemo(() => {
      if (!form.customerId) {
        return [];
      }

      return deliveries.filter(
        (delivery) =>
          String(
            delivery.customerId
          ) ===
          String(
            form.customerId
          )
      );
    }, [
      deliveries,
      form.customerId,
    ]);

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
                (sum, delivery) =>
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

  const openPaymentForDelivery =
    useCallback(
      (item) => {
        setForm({
          customerId:
            item.customer?.id ||
            "",

          deliveryId:
            item.delivery.id,

          amount:
            item.remaining > 0
              ? String(
                  item.remaining
                )
              : "",

          date: today(),

          notes: "",
        });

        setShowForm(true);
      },
      []
    );

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.customerId) {
      alert(
        "Please select a customer."
      );
      return;
    }

    const amount = Number(
      form.amount
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert(
        "Enter a valid payment amount."
      );
      return;
    }

    /*
     * If a specific delivery was selected,
     * prevent paying more than its remaining
     * balance.
     */

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

    onAdd({
      customerId:
        form.customerId,

      deliveryId:
        form.deliveryId || null,

      amount,

      date:
        form.date || today(),

      notes:
        form.notes.trim(),
    });

    setForm(getEmptyForm());
    setShowForm(false);
  };

  const handleCustomerChange =
    useCallback((value) => {
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

          <p className="welcome">
            Record and track customer
            payments
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setForm(
              getEmptyForm()
            );
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
            <h3>
              💰 Outstanding Deliveries
            </h3>

            <p>
              Click Record Payment beside
              a delivery to record money
              received.
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
              All delivery balances are
              currently paid.
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
                          .date ||
                          "No date"}
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
                      style={{
                        padding:
                          "9px 14px",
                        fontSize: 13,
                      }}
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
          onSubmit={handleSubmit}
        >
          <div className="form-header">
            <div>
              <h3>
                Record Payment
              </h3>

              <p>
                Record money received from
                a customer.
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
            {/* SAME CUSTOMER PICKER AS DELIVERY */}

            <CustomerPicker
              customers={customers}
              value={form.customerId}
              onChange={
                handleCustomerChange
              }
            />

            {/* DELIVERY */}

            <div className="form-group">
              <label>
                Delivery
              </label>

              <select
                value={
                  form.deliveryId
                }
                onChange={(event) => {
                  const deliveryId =
                    event.target
                      .value;

                  const delivery =
                    deliveries.find(
                      (item) =>
                        String(
                          item.id
                        ) ===
                        String(
                          deliveryId
                        )
                    );

                  setForm(
                    (current) => ({
                      ...current,

                      deliveryId,

                      amount:
                        delivery
                          ? String(
                              getDeliveryRemaining(
                                delivery,
                                payments
                              )
                            )
                          : "",
                    })
                  );
                }}
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
                Select a specific
                delivery or leave it
                as General payment.
              </small>
            </div>

            <div className="form-group">
              <label>
                Amount (Rs.) *
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      amount:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="Payment amount"
              />
            </div>

            <div className="form-group">
              <label>
                Date
              </label>

              <input
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      date:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </div>

            <div className="form-group form-group-full">
              <label>
                Notes
              </label>

              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      notes:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="Optional notes..."
              />
            </div>
          </div>

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
                      {formatMoney(
                        billed
                      )}
                    </span>

                    <span>
                      Paid: Rs.{" "}
                      {formatMoney(
                        paid
                      )}
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

      <div
        style={{
          marginTop: 25,
        }}
      >
        <h3>
          Payment History
        </h3>

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

                return (
                  <div
                    className="customer-card"
                    key={
                      payment.id
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
                        onClick={() => {
                          if (
                            window.confirm(
                              "Delete this payment?"
                            )
                          ) {
                            onDelete(
                              payment.id
                            );
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

/* =========================================================
   REPORTS
   ========================================================= */

function Reports({
  customers,
  deliveries,
  payments,
}) {
  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const filteredDeliveries =
    useMemo(() => {
      return deliveries.filter(
        (delivery) => {
          const date = String(
            delivery.date || ""
          ).slice(0, 10);

          if (
            fromDate &&
            date < fromDate
          ) {
            return false;
          }

          if (
            toDate &&
            date > toDate
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      deliveries,
      fromDate,
      toDate,
    ]);

  const report = useMemo(() => {
    const totalLiters =
      filteredDeliveries.reduce(
        (sum, delivery) =>
          sum +
          (Number(
            delivery.quantity
          ) || 0),
        0
      );

    const totalBilled =
      filteredDeliveries.reduce(
        (sum, delivery) =>
          sum +
          getDeliveryTotal(
            delivery
          ),
        0
      );

    const deliveryIds =
      new Set(
        filteredDeliveries.map(
          (delivery) =>
            String(
              delivery.id
            )
        )
      );

    const filteredPayments =
      payments.filter(
        (payment) => {
          if (
            payment.deliveryId &&
            deliveryIds.has(
              String(
                payment.deliveryId
              )
            )
          ) {
            return true;
          }

          const date = String(
            payment.date || ""
          ).slice(0, 10);

          if (
            fromDate &&
            date < fromDate
          ) {
            return false;
          }

          if (
            toDate &&
            date > toDate
          ) {
            return false;
          }

          return true;
        }
      );

    const totalPaid =
      filteredPayments.reduce(
        (sum, payment) =>
          sum +
          (Number(
            payment.amount
          ) || 0),
        0
      );

    return {
      totalLiters,
      totalBilled,
      totalPaid,

      outstanding:
        Math.max(
          0,
          totalBilled -
            totalPaid
        ),

      deliveries:
        filteredDeliveries.length,

      payments:
        filteredPayments.length,
    };
  }, [
    filteredDeliveries,
    payments,
    fromDate,
    toDate,
  ]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>
            Reports
          </h2>

          <p className="welcome">
            View AquaFlow business
            summaries
          </p>
        </div>
      </div>

      <div className="customer-form-card">
        <div className="form-grid">
          <div className="form-group">
            <label>
              From Date
            </label>

            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(
                  event.target
                    .value
                )
              }
            />
          </div>

          <div className="form-group">
            <label>
              To Date
            </label>

            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(
                  event.target
                    .value
                )
              }
            />
          </div>
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
        <DashboardCard
          icon="🚚"
          title="Deliveries"
          value={
            report.deliveries
          }
        />

        <DashboardCard
          icon="💧"
          title="Total Liters"
          value={`${formatNumber(
            report.totalLiters
          )} L`}
        />

        <DashboardCard
          icon="💰"
          title="Total Billed"
          value={`Rs. ${formatMoney(
            report.totalBilled
          )}`}
        />

        <DashboardCard
          icon="✅"
          title="Total Paid"
          value={`Rs. ${formatMoney(
            report.totalPaid
          )}`}
        />

        <DashboardCard
          icon="⚠️"
          title="Outstanding"
          value={`Rs. ${formatMoney(
            report.outstanding
          )}`}
        />

        <DashboardCard
          icon="💳"
          title="Payments"
          value={
            report.payments
          }
        />
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">
          📊
        </div>

        <h3>
          Customer Summary
        </h3>

        <p>
          Customer-level report for
          the selected date range.
        </p>

        <div
          className="customers-list"
          style={{
            marginTop: 20,
          }}
        >
          {customers
            .map((customer) => {
              const customerDeliveries =
                filteredDeliveries.filter(
                  (delivery) =>
                    String(
                      delivery.customerId
                    ) ===
                    String(
                      customer.id
                    )
                );

              if (
                customerDeliveries.length ===
                0
              ) {
                return null;
              }

              const billed =
                customerDeliveries.reduce(
                  (sum, delivery) =>
                    sum +
                    getDeliveryTotal(
                      delivery
                    ),
                  0
                );

              const paid =
                payments
                  .filter(
                    (payment) => {
                      const customerMatch =
                        String(
                          payment.customerId
                        ) ===
                        String(
                          customer.id
                        );

                      if (
                        !customerMatch
                      ) {
                        return false;
                      }

                      const date =
                        String(
                          payment.date ||
                            ""
                        ).slice(
                          0,
                          10
                        );

                      if (
                        fromDate &&
                        date <
                          fromDate
                      ) {
                        return false;
                      }

                      if (
                        toDate &&
                        date >
                          toDate
                      ) {
                        return false;
                      }

                      return true;
                    }
                  )
                  .reduce(
                    (
                      sum,
                      payment
                    ) =>
                      sum +
                      (Number(
                        payment.amount
                      ) || 0),
                    0
                  );

              const liters =
                customerDeliveries.reduce(
                  (
                    sum,
                    delivery
                  ) =>
                    sum +
                    (Number(
                      delivery.quantity
                    ) || 0),
                  0
                );

              return (
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
                      {
                        customer.name
                      }
                    </h3>

                    <div className="customer-details">
                      <span>
                        💧{" "}
                        {formatNumber(
                          liters
                        )}{" "}
                        L
                      </span>

                      <span>
                        💰 Billed:
                        Rs.{" "}
                        {formatMoney(
                          billed
                        )}
                      </span>

                      <span>
                        ✅ Paid:
                        Rs.{" "}
                        {formatMoney(
                          paid
                        )}
                      </span>

                      <span>
                        ⚠️ Due:
                        Rs.{" "}
                        {formatMoney(
                          Math.max(
                            0,
                            billed -
                              paid
                          )
                        )}
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

/* =========================================================
   SETTINGS
   ========================================================= */

function Settings({
  data,
  setData,
  currentPin,
  setCurrentPin,
  recoveryCode,
  setRecoveryCode,
}) {
  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("success");

  const [oldPin, setOldPin] =
    useState("");

  const [newPin, setNewPin] =
    useState("");

  const [confirmPin, setConfirmPin] =
    useState("");

  const [newRecoveryCode, setNewRecoveryCode] =
    useState("");

  const showMessage = (
    text,
    type = "success"
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  const handleExport = () => {
    const backup = {
      version: 3,
      exportedAt:
        new Date().toISOString(),
      data,
      security: {
        recoveryCode,
      },
    };

    const json = JSON.stringify(
      backup,
      null,
      2
    );

    const blob = new Blob(
      [json],
      {
        type: "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = `aquaflow-backup-${today()}.json`;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    showMessage(
      "Backup exported successfully."
    );
  };

  const handleImport = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {
      try {
        const parsed =
          JSON.parse(
            reader.result
          );

        /*
         * Support both:
         * old plain data backup
         * new backup format
         */

        const importedData =
          parsed?.data
            ? normalizeData(
                parsed.data
              )
            : normalizeData(
                parsed
              );

        setData(
          importedData
        );

        if (
          parsed?.security
            ?.recoveryCode
        ) {
          setRecoveryCode(
            parsed.security
              .recoveryCode
          );
        }

        showMessage(
          "Backup imported successfully."
        );
      } catch {
        showMessage(
          "Invalid backup file.",
          "error"
        );
      }

      event.target.value = "";
    };

    reader.readAsText(file);
  };

  const handleChangePin = (
    event
  ) => {
    event.preventDefault();

    if (
      oldPin !== currentPin
    ) {
      showMessage(
        "Current PIN is incorrect.",
        "error"
      );
      return;
    }

    if (
      !/^\d{4}$/.test(newPin)
    ) {
      showMessage(
        "New PIN must contain exactly 4 digits.",
        "error"
      );
      return;
    }

    if (
      newPin !== confirmPin
    ) {
      showMessage(
        "New PINs do not match.",
        "error"
      );
      return;
    }

    setCurrentPin(newPin);

    setOldPin("");
    setNewPin("");
    setConfirmPin("");

    showMessage(
      "PIN changed successfully."
    );
  };

  const handleChangeRecoveryCode = (
    event
  ) => {
    event.preventDefault();

    const code =
      newRecoveryCode.trim();

    if (code.length < 6) {
      showMessage(
        "Recovery code must contain at least 6 characters.",
        "error"
      );
      return;
    }

    setRecoveryCode(code);

    setNewRecoveryCode("");

    showMessage(
      "Recovery code updated successfully."
    );
  };

  const handleClear = () => {
    const confirmed =
      window.confirm(
        "This will permanently remove all customers, deliveries and payments from this device. Continue?"
      );

    if (!confirmed) {
      return;
    }

    setData({
      customers: [],
      deliveries: [],
      payments: [],
    });

    showMessage(
      "All local data has been cleared."
    );
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>
            Settings
          </h2>

          <p className="welcome">
            Manage your offline
            AquaFlow data and security
          </p>
        </div>
      </div>

      {/* ===================================================
          SECURITY
          =================================================== */}

      <div className="customer-form-card">
        <div className="form-header">
          <div>
            <h3>
              🔐 Security
            </h3>

            <p>
              Change your PIN and set
              your recovery code.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleChangePin}
        >
          <div className="form-grid">
            <div className="form-group">
              <label>
                Current PIN
              </label>

              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={oldPin}
                onChange={(event) =>
                  setOldPin(
                    event.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                placeholder="Current PIN"
              />
            </div>

            <div className="form-group">
              <label>
                New PIN
              </label>

              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(event) =>
                  setNewPin(
                    event.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                placeholder="4-digit PIN"
              />
            </div>

            <div className="form-group">
              <label>
                Confirm New PIN
              </label>

              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(event) =>
                  setConfirmPin(
                    event.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                placeholder="Confirm PIN"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="primary-button"
            >
              🔑 Change PIN
            </button>
          </div>
        </form>

        <hr
          style={{
            margin:
              "25px 0",
            border: 0,
            borderTop:
              "1px solid #e5e7eb",
          }}
        />

        <form
          onSubmit={
            handleChangeRecoveryCode
          }
        >
          <div className="form-group">
            <label>
              New Recovery Code
            </label>

            <input
              value={
                newRecoveryCode
              }
              onChange={(event) =>
                setNewRecoveryCode(
                  event.target.value
                )
              }
              placeholder="Enter a recovery code"
            />

            <small className="input-help">
              Keep this code somewhere
              safe. You need it if you
              forget your PIN.
            </small>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="primary-button"
            >
              🔐 Change Recovery Code
            </button>
          </div>
        </form>

        <div
          style={{
            marginTop: 15,
            padding: 12,
            borderRadius: 10,
            background:
              "#f8fafc",
          }}
        >
          <strong>
            Forgot PIN?
          </strong>

          <p
            style={{
              margin:
                "5px 0 0",
              fontSize: 13,
            }}
          >
            From the lock screen,
            select{" "}
            <strong>
              "Forgot PIN?"
            </strong>{" "}
            and enter your recovery
            code.
          </p>
        </div>
      </div>

      {/* ===================================================
          BACKUP
          =================================================== */}

      <div className="customer-form-card">
        <div className="form-header">
          <div>
            <h3>
              Data Backup
            </h3>

            <p>
              Export your AquaFlow data
              so you can restore it
              later.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="primary-button"
            onClick={
              handleExport
            }
          >
            ⬇️ Export Backup
          </button>

          <label className="secondary-button">
            ⬆️ Import Backup

            <input
              type="file"
              accept="application/json,.json"
              onChange={
                handleImport
              }
              style={{
                display: "none",
              }}
            />
          </label>
        </div>

        {message && (
          <p
            style={{
              marginTop: 15,
              color:
                messageType ===
                "error"
                  ? "#dc2626"
                  : "#0369a1",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {message}
          </p>
        )}
      </div>

      {/* ===================================================
          STORAGE
          =================================================== */}

      <div className="customer-form-card">
        <div className="form-header">
          <div>
            <h3>
              Storage
            </h3>

            <p>
              AquaFlow currently stores
              its data locally on this
              device.
            </p>
          </div>
        </div>

        <div className="customer-details">
          <span>
            👥{" "}
            {data.customers.length}{" "}
            customers
          </span>

          <span>
            🚚{" "}
            {data.deliveries.length}{" "}
            deliveries
          </span>

          <span>
            💰{" "}
            {data.payments.length}{" "}
            payments
          </span>
        </div>
      </div>

      {/* ===================================================
          DANGER ZONE
          =================================================== */}

      <div className="customer-form-card">
        <div className="form-header">
          <div>
            <h3>
              Danger Zone
            </h3>

            <p>
              Permanently delete all
              local AquaFlow data.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="delete-button"
          style={{
            width: "auto",
            padding:
              "0 15px",
          }}
          onClick={
            handleClear
          }
        >
          🗑️ Clear All Data
        </button>
      </div>
    </>
  );
}