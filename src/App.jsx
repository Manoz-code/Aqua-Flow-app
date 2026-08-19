
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { App as CapacitorApp } from "@capacitor/app";

import "./styles/index.css";

import { createId } from "./utils/format";

import {
  EMPTY_DATA,
  PIN_STORAGE_KEY,
  RECOVERY_STORAGE_KEY,
  STORAGE_KEY,
  getStoredPin,
  getStoredRecoveryCode,
  normalizeData,
} from "./utils/data";

import PinScreen from "./components/PinScreen";
import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Deliveries from "./pages/Deliveries";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

export default function App() {
  /* =========================================================
     APP / SECURITY STATE
     ========================================================= */

  const [isUnlocked, setIsUnlocked] =
    useState(false);

  const [pin, setPin] = useState("");

  const [pinError, setPinError] =
    useState("");

  const [activePage, setActivePage] =
    useState("Dashboard");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [currentPin, setCurrentPin] =
    useState(getStoredPin);

  const [recoveryCode, setRecoveryCode] =
    useState(getStoredRecoveryCode);

  /* =========================================================
     CUSTOMER DETAILS STATE
     ========================================================= */

  const [
    customerDetailsOpen,
    setCustomerDetailsOpen,
  ] = useState(false);

  const [
    customerDetailsBackSignal,
    setCustomerDetailsBackSignal,
  ] = useState(0);

  /* =========================================================
     DELIVERY FORM STATE
     ========================================================= */

  const [
    deliveryFormSignal,
    setDeliveryFormSignal,
  ] = useState(0);

  const [
    deliveryFormCustomerId,
    setDeliveryFormCustomerId,
  ] = useState(null);

  const [
    deliveryResetSignal,
    setDeliveryResetSignal,
  ] = useState(0);

  const [
    deliveryFormOpen,
    setDeliveryFormOpen,
  ] = useState(false);

  const [
  recentDeliveryId,
  setRecentDeliveryId,
] = useState(null);

  /* =========================================================
     PAYMENT FORM STATE
     ========================================================= */

  const [
    paymentFormSignal,
    setPaymentFormSignal,
  ] = useState(0);

  const [
    paymentFormCustomerId,
    setPaymentFormCustomerId,
  ] = useState(null);

  const [
  paymentDeliveryId,
  setPaymentDeliveryId,
] = useState(null);

  const [
    paymentResetSignal,
    setPaymentResetSignal,
  ] = useState(0);

  const [
    paymentFormOpen,
    setPaymentFormOpen,
  ] = useState(false);

  const [
  recentPaymentId,
  setRecentPaymentId,
] = useState(null);
  /* =========================================================
     LOCAL DATA
     ========================================================= */

  const [data, setData] = useState(() => {
    try {
      const saved =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!saved) {
        return EMPTY_DATA;
      }

      return normalizeData(
        JSON.parse(saved)
      );
    } catch (error) {
      console.error(
        "Failed to load AquaFlow data:",
        error
      );

      return EMPTY_DATA;
    }
  });

  /* =========================================================
     SAVE DATA
     ========================================================= */

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

  /* =========================================================
     SAVE SECURITY SETTINGS
     ========================================================= */

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
  }, [
    currentPin,
    recoveryCode,
  ]);

  /* =========================================================
     PIN HANDLERS
     ========================================================= */

  const handleNumberClick =
    useCallback((number) => {
      setPinError("");

      setPin((current) => {
        if (current.length >= 4) {
          return current;
        }

        return current + String(number);
      });
    }, []);

  const handlePinDelete =
    useCallback(() => {
      setPin((current) =>
        current.slice(0, -1)
      );

      setPinError("");
    }, []);

  const handlePinClear =
    useCallback(() => {
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

  /* =========================================================
     LOCK APP
     ========================================================= */

  const handleLock = useCallback(() => {
    setIsUnlocked(false);
    setPin("");
    setPinError("");

    setActivePage("Dashboard");
    setSidebarOpen(false);

    setCustomerDetailsOpen(false);

    setCustomerDetailsBackSignal(
      (current) => current + 1
    );

    setDeliveryFormCustomerId(null);
    setPaymentFormCustomerId(null);

    setDeliveryFormOpen(false);
    setPaymentFormOpen(false);

    setDeliveryResetSignal(
      (current) => current + 1
    );

    setPaymentResetSignal(
      (current) => current + 1
    );

    window.history.replaceState(
      {
        page: "Dashboard",
        aquaflow: true,
      },
      "",
      window.location.href
    );
  }, []);

  /* =========================================================
     CUSTOMER CRUD
     ========================================================= */

  const addCustomer = useCallback(
    (customer) => {
      const customerId =
        createId("customer_");

      setData((current) => ({
        ...current,

        customers: [
          ...current.customers,

          {
            ...customer,
            id: customerId,
            previousBalance:
              Number(
                customer.previousBalance
              ) || 0,
            createdAt:
              new Date().toISOString(),
          },
        ],
      }));

      return customerId;
    },
    []
  );

  const updateCustomer =
    useCallback((id, updates) => {
      setData((current) => ({
        ...current,

        customers:
          current.customers.map(
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
    }, []);

  const deleteCustomer =
    useCallback((id) => {
      setData((current) => ({
        ...current,

        customers:
          current.customers.filter(
            (customer) =>
              String(customer.id) !==
              String(id)
          ),
      }));
    }, []);

  /* =========================================================
     DELIVERY CRUD
     ========================================================= */
const addDelivery = useCallback((delivery) => {
  const deliveryId = createId("delivery_");

  setData((current) => ({
    ...current,

    deliveries: [
      ...current.deliveries,

      {
        ...delivery,
        id: deliveryId,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ],
  }));

  setRecentDeliveryId(deliveryId);

  return deliveryId;
}, []);

  const updateDelivery =
    useCallback((id, updates) => {
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
    }, []);

  const markDeliveryDelivered =
    useCallback((id) => {
      const now =
        new Date().toISOString();

      setData((current) => ({
        ...current,

        deliveries:
          current.deliveries.map(
            (delivery) =>
              String(delivery.id) ===
              String(id)
                ? {
                    ...delivery,
                    status:
                      "delivered",
                    deliveredAt: now,
                    updatedAt: now,
                  }
                : delivery
          ),
      }));
    }, []);

  const deleteDelivery =
    useCallback((id) => {
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
              String(
                payment.deliveryId
              ) !== String(id)
          ),
      }));
    }, []);

  /* =========================================================
     PAYMENT CRUD
     ========================================================= */

const addPayment = useCallback((payment) => {
  const paymentId = createId("payment_");

  setData((current) => ({
    ...current,

    payments: [
      ...current.payments,

      {
        ...payment,
        id: paymentId,
        createdAt: new Date().toISOString(),
      },
    ],
  }));

  setRecentPaymentId(paymentId);

  return paymentId;
}, []);

  const deletePayment =
    useCallback((id) => {
      setData((current) => ({
        ...current,

        payments:
          current.payments.filter(
            (payment) =>
              String(payment.id) !==
              String(id)
          ),
      }));
    }, []);

  /* =========================================================
     BROWSER HISTORY
     ========================================================= */

  useEffect(() => {
    window.history.replaceState(
      {
        page: "Dashboard",
        aquaflow: true,
      },
      "",
      window.location.href
    );

    const handlePopState = (event) => {
      const state = event.state;

      /*
       * Customer Details has its own browser
       * history state. Customers.jsx handles
       * clearing the selected customer.
       */
      if (
        state?.aquaflow &&
        state.customerDetails &&
        state.page === "Customers"
      ) {
        setActivePage("Customers");
        setSidebarOpen(false);

        setDeliveryFormCustomerId(null);
        setPaymentFormCustomerId(null);

        return;
      }

      const page = state?.aquaflow
        ? state.page
        : "Dashboard";

      setDeliveryFormCustomerId(null);
      setPaymentFormCustomerId(null);

      setCustomerDetailsOpen(false);

      setActivePage(page);
      setSidebarOpen(false);
    };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  /* =========================================================
     NAVIGATION
     ========================================================= */

  const navigateTo = useCallback(
    (page) => {
      setActivePage((current) => {
        if (current === page) {
          return current;
        }

        window.history.pushState(
          {
            page,
            aquaflow: true,
          },
          "",
          window.location.href
        );

        return page;
      });
    },
    []
  );

  /* =========================================================
     NORMAL NAVIGATION
     ========================================================= */

 const handleNavigate = useCallback(
  (page, options = {}) => {
    const {
      customerId = null,
      deliveryId = null,
    } = options;

    setDeliveryFormCustomerId(null);

    /*
     * PAYMENT NAVIGATION
     *
     * When coming from a delivery, keep the
     * customer and exact delivery selected.
     */
    if (page === "Payments" && customerId) {
      setPaymentFormCustomerId(
        String(customerId)
      );

      setPaymentFormSignal(
        (current) => current + 1
      );
    } else {
      setPaymentFormCustomerId(null);
    }

    if (page === "Payments" && deliveryId) {
      setPaymentDeliveryId(
        String(deliveryId)
      );
    } else {
      setPaymentDeliveryId(null);
    }

    setRecentDeliveryId(null);
    setRecentPaymentId(null);

    setCustomerDetailsOpen(false);

    setCustomerDetailsBackSignal(
      (current) => current + 1
    );

    setDeliveryResetSignal(
      (current) => current + 1
    );

    setPaymentResetSignal(
      (current) => current + 1
    );

    setSidebarOpen(false);

    navigateTo(page);
  },
  [navigateTo]
);
  /* =========================================================
     QUICK NEW DELIVERY
     ========================================================= */

  const handleQuickNewDelivery =
    useCallback(() => {
      setSidebarOpen(false);

      setDeliveryFormCustomerId(null);

      setDeliveryFormSignal(
        (current) => current + 1
      );

      navigateTo("Deliveries");
    }, [navigateTo]);

  /* =========================================================
     QUICK CUSTOMER DELIVERY
     ========================================================= */

  const handleQuickCustomerDelivery =
    useCallback(
      (customerId) => {
        setSidebarOpen(false);

        setDeliveryFormCustomerId(
          customerId || null
        );

        setDeliveryFormSignal(
          (current) => current + 1
        );

        navigateTo("Deliveries");
      },
      [navigateTo]
    );

  /* =========================================================
     QUICK CUSTOMER PAYMENT
     ========================================================= */

  const handleQuickPayment =
    useCallback(
      (customerId) => {
        setSidebarOpen(false);

        setPaymentFormCustomerId(
          customerId || null
        );

        setPaymentFormSignal(
          (current) => current + 1
        );

        navigateTo("Payments");
      },
      [navigateTo]
    );

  /* =========================================================
     ANDROID BACK BUTTON

     Priority:

       1. Sidebar
       2. Customer Details
       3. Delivery form
       4. Payment form
       5. AquaFlow history
       6. Android/browser default
     ========================================================= */

  useEffect(() => {
    let listener;

    const setupBackButton =
      async () => {
        listener =
          await CapacitorApp.addListener(
            "backButton",
            ({ canGoBack }) => {
              /* ---------------------------------------------
                 1. SIDEBAR
                 --------------------------------------------- */

              if (sidebarOpen) {
                setSidebarOpen(false);
                return;
              }

              /* ---------------------------------------------
                 2. CUSTOMER DETAILS
                 --------------------------------------------- */

              if (
                activePage ===
                  "Customers" &&
                customerDetailsOpen
              ) {
                /*
                 * Customers.jsx clears its
                 * selected customer.
                 */
                setCustomerDetailsBackSignal(
                  (current) =>
                    current + 1
                );

                setCustomerDetailsOpen(
                  false
                );

                return;
              }

              /* ---------------------------------------------
                 3. DELIVERY FORM
                 --------------------------------------------- */

              if (deliveryFormOpen) {
                setDeliveryFormOpen(
                  false
                );

                setDeliveryResetSignal(
                  (current) =>
                    current + 1
                );

                return;
              }

              /* ---------------------------------------------
                 4. PAYMENT FORM
                 --------------------------------------------- */

              if (paymentFormOpen) {
                setPaymentFormOpen(
                  false
                );

                setPaymentResetSignal(
                  (current) =>
                    current + 1
                );

                return;
              }

              /* ---------------------------------------------
                 5. AQUAFLOW PAGE HISTORY
                 --------------------------------------------- */
/* -----------------------------------------------
   4. DASHBOARD → EXIT APP
   ----------------------------------------------- */

if (activePage === "Dashboard") {
  CapacitorApp.exitApp();
  return;
}

/* -----------------------------------------------
   5. AQUAFLOW NAVIGATION HISTORY
   ----------------------------------------------- */

if (window.history.length > 1) {
  window.history.back();
  return;
}

/* -----------------------------------------------
   6. DEFAULT ANDROID/BROWSER BACK
   ----------------------------------------------- */

if (canGoBack) {
  window.history.back();
}
            }
          );
      };

    setupBackButton();

    return () => {
      listener?.remove();
    };
  }, [
    activePage,
    customerDetailsOpen,
    deliveryFormOpen,
    paymentFormOpen,
    sidebarOpen,
  ]);

  /* =========================================================
     RENDER PAGE
     ========================================================= */

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
            onQuickPayment={
              handleQuickPayment
            }
            onQuickDelivery={
              handleQuickCustomerDelivery
            }
            onDetailsStateChange={
              setCustomerDetailsOpen
            }
            detailsBackSignal={
              customerDetailsBackSignal
            }
          />
        );

      case "Deliveries":
        return (
          <Deliveries
            customers={data.customers}
            deliveries={data.deliveries}
            payments={data.payments}
            onAdd={addDelivery}
            onUpdate={
              updateDelivery
            }
            onDelete={
              deleteDelivery
            }
            onMarkDelivered={
              markDeliveryDelivered
            }
            onNavigate={
              handleNavigate
            }
            openFormSignal={
              deliveryFormSignal
            }
            prefillCustomerId={
              deliveryFormCustomerId
            }
            resetFormSignal={
              deliveryResetSignal
            }
            onFormStateChange={
              setDeliveryFormOpen
            }
            recentDeliveryId={recentDeliveryId}
          />
        );

      case "Payments":
        return (
          <Payments
            customers={data.customers}
            deliveries={data.deliveries}
            payments={data.payments}
            onAdd={addPayment}
            onDelete={
              deletePayment
            }
            openFormSignal={
              paymentFormSignal
            }
            prefillCustomerId={
              paymentFormCustomerId
            }
            deliveryId={paymentDeliveryId}
            resetFormSignal={
              paymentResetSignal
            }
            onFormStateChange={
              setPaymentFormOpen
            }
            recentPaymentId={recentPaymentId}
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
            setCurrentPin={
              setCurrentPin
            }
            recoveryCode={
              recoveryCode
            }
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
            onNavigate={
              handleNavigate
            }
            onNewDelivery={
              handleQuickNewDelivery
            }
            onQuickPayment={
              handleQuickPayment
            }
          />
        );
    }
  };

  /* =========================================================
     PIN SCREEN
     ========================================================= */

  if (!isUnlocked) {
    return (
      <PinScreen
        pin={pin}
        error={pinError}
        onNumberClick={
          handleNumberClick
        }
        onDelete={
          handlePinDelete
        }
        onClear={
          handlePinClear
        }
        onUnlock={
          handleUnlock
        }
        currentPin={
          currentPin
        }
        recoveryCode={
          recoveryCode
        }
        onPinRecovered={(
          newPin
        ) => {
          setCurrentPin(
            newPin
          );

          setPin("");
          setPinError("");
          setIsUnlocked(true);
        }}
      />
    );
  }

  /* =========================================================
     MAIN APP
     ========================================================= */

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button
            type="button"
            className="hamburger-button"
            aria-label="Open navigation"
            aria-expanded={
              sidebarOpen
            }
            onClick={() =>
              setSidebarOpen(
                (current) =>
                  !current
              )
            }
          >
            ☰
          </button>

          <div className="header-logo">
            <span>💧</span>

            <div>
              <h1>AquaFlow</h1>

              <small>
                Offline Water Management
              </small>
            </div>
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
        {sidebarOpen && (
          <button
            type="button"
            className="sidebar-overlay"
            aria-label="Close navigation"
            onClick={() =>
              setSidebarOpen(false)
            }
          />
        )}

        <Sidebar
          activePage={activePage}
          onNavigate={
            handleNavigate
          }
          isOpen={sidebarOpen}
          onClose={() =>
            setSidebarOpen(false)
          }
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
