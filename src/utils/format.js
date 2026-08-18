import NepaliDateModule from "nepali-date-converter";

const NepaliDate =
  typeof NepaliDateModule === "function"
    ? NepaliDateModule
    : NepaliDateModule?.default;

/* =========================================================
   GENERAL HELPERS
   ========================================================= */

export const createId = (prefix = "") =>
  `${prefix}${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;

/* =========================================================
   CURRENT DATE
   ---------------------------------------------------------
   Internal storage remains AD:
   YYYY-MM-DD

   We are NOT changing stored customer names,
   phone numbers, or existing record dates.
   ========================================================= */

export const today = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =========================================================
   NEPALI DATE HELPERS
   ========================================================= */

const normalizeDateValue = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const stringValue = String(value).slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return null;
  }

  const [year, month, day] = stringValue
    .split("-")
    .map(Number);

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

/**
 * Convert an AD date to NepaliDate.
 */
export const toNepaliDate = (value) => {
  const date = normalizeDateValue(value);

  if (!date) {
    return null;
  }

  try {
    return new NepaliDate(date);
  } catch (error) {
    console.error(
      "Failed to convert date to Nepali date:",
      error
    );

    return null;
  }
};

/**
 * Format date as:
 * २०८३ जेठ २
 */
export const formatNepaliDate = (value) => {
  const nepaliDate = toNepaliDate(value);

  if (!nepaliDate) {
    return "—";
  }

  try {
    return nepaliDate.format(
      "DD MMMM YYYY",
      "np"
    );
  } catch (error) {
    console.error(
      "Failed to format Nepali date:",
      error
    );

    return "—";
  }
};

/**
 * Format date as:
 * २०८३-०२-०२
 */
export const formatNepaliDateISO = (value) => {
  const nepaliDate = toNepaliDate(value);

  if (!nepaliDate) {
    return "—";
  }

  try {
    return nepaliDate.format(
      "YYYY-MM-DD",
      "np"
    );
  } catch (error) {
    console.error(
      "Failed to format Nepali date:",
      error
    );

    return "—";
  }
};

/**
 * Get Nepali year/month/day information.
 */
export const getNepaliDateParts = (value) => {
  const nepaliDate = toNepaliDate(value);

  if (!nepaliDate) {
    return null;
  }

  const bs = nepaliDate.getBS();

  return {
    year: bs.year,
    month: bs.month + 1,
    date: bs.date,
    day: bs.day,
  };
};

/**
 * Convert an AD date to BS YYYY-MM-DD using
 * English numerals internally.
 *
 * Example:
 * 2026-08-18
 * → 2083-05-02
 */
export const getNepaliDateKey = (value) => {
  const parts = getNepaliDateParts(value);

  if (!parts) {
    return "";
  }

  return [
    String(parts.year),
    String(parts.month).padStart(2, "0"),
    String(parts.date).padStart(2, "0"),
  ].join("-");
};

/**
 * Get BS year-month key.
 *
 * Example:
 * 2083-05
 */
export const getNepaliMonthKey = (value) => {
  const parts = getNepaliDateParts(value);

  if (!parts) {
    return "";
  }

  return `${parts.year}-${String(parts.month).padStart(
    2,
    "0"
  )}`;
};

/* =========================================================
   NUMBER FORMATTING
   ========================================================= */

export const formatMoney = (value) => {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(number);
};

export const formatNumber = (value) => {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(number);
};

/* =========================================================
   CUSTOMER INITIALS
   ========================================================= */

export const getInitials = (name = "") => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "?";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};
