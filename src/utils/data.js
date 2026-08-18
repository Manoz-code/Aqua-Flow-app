/* =========================================================
   STORAGE KEYS
   ========================================================= */

export const STORAGE_KEY = "aquaflow_offline_data_v3";
export const PIN_STORAGE_KEY = "aquaflow_pin_v1";
export const RECOVERY_STORAGE_KEY = "aquaflow_recovery_v1";

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

export const DEFAULT_PIN = "1234";
export const DEFAULT_RECOVERY_CODE = "AQUA-RESET-1234";

/* =========================================================
   DEFAULT DATA
   ========================================================= */

export const EMPTY_DATA = {
  customers: [],
  deliveries: [],
  payments: [],
};

/* =========================================================
   DATA HELPERS
   ========================================================= */

export const normalizeData = (data) => {
  if (!data || typeof data !== "object") {
    return EMPTY_DATA;
  }

 return {
  customers: Array.isArray(data.customers)
    ? data.customers.map((customer) => ({
        ...customer,
        previousBalance: Number(customer.previousBalance) || 0,
      }))
    : [],

  deliveries: Array.isArray(data.deliveries) ? data.deliveries : [],

  payments: Array.isArray(data.payments) ? data.payments : [],
};
};

export const getStoredPin = () => {
  try {
    return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
  } catch {
    return DEFAULT_PIN;
  }
};

export const getStoredRecoveryCode = () => {
  try {
    return localStorage.getItem(RECOVERY_STORAGE_KEY) || DEFAULT_RECOVERY_CODE;
  } catch {
    return DEFAULT_RECOVERY_CODE;
  }
};

export const getDefaultPrice = (quantity) => {
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

export const getDeliveryTotal = (delivery) => {
  const finalPrice =
    delivery.finalPrice !== undefined
      ? Number(delivery.finalPrice) || 0
      : Number(delivery.totalPrice) || 0;

  const extraCharge = Number(delivery.extraCharge) || 0;

  /*
   * Old records may have pricePerLiter instead
   * of finalPrice.
   */
  if (delivery.finalPrice === undefined && delivery.totalPrice === undefined) {
    return (
      (Number(delivery.quantity) || 0) * (Number(delivery.pricePerLiter) || 0) +
      extraCharge
    );
  }

  return finalPrice + extraCharge;
};

export const getCustomerPayments = (payments, customerId) => {
  return payments
    .filter((payment) => String(payment.customerId) === String(customerId))
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
};

export const getDeliveryPayments = (payments, deliveryId) => {
  return payments
    .filter(
      (payment) =>
        payment.deliveryId && String(payment.deliveryId) === String(deliveryId)
    )
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
};

export const getDeliveryRemaining = (delivery, payments) => {
  const total = getDeliveryTotal(delivery);
  const paid = getDeliveryPayments(payments, delivery.id);

  return Math.max(0, total - paid);
};
