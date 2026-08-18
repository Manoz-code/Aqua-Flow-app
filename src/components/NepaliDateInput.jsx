
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import NepaliDateModule from "nepali-date-converter";

/* =========================================================
   NEPALI DATE INPUT

   Internal value:
     AD YYYY-MM-DD

   User-visible value:
     BS YYYY-MM-DD

   Examples:

     Stored:
       2026-08-18

     Displayed:
       २०८३-०५-०२

   The component accepts both English and Nepali digits.
   Customer names and phone numbers are completely
   unaffected by this component.
   ========================================================= */

/* =========================================================
   PACKAGE EXPORT COMPATIBILITY
   ========================================================= */

const NepaliDate =
  typeof NepaliDateModule === "function"
    ? NepaliDateModule
    : NepaliDateModule?.default;

/* =========================================================
   CONSTANTS
   ========================================================= */

const AD_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

const BS_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

const NEPALI_DIGITS =
  "०१२३४५६७८९";

/* =========================================================
   DIGIT HELPERS
   ========================================================= */

const toEnglishDigits = (value = "") => {
  return String(value).replace(
    /[०-९]/g,
    (digit) =>
      String(
        NEPALI_DIGITS.indexOf(digit)
      )
  );
};

const toNepaliDigits = (value = "") => {
  return String(value).replace(
    /\d/g,
    (digit) =>
      NEPALI_DIGITS[Number(digit)]
  );
};

/* =========================================================
   DATE HELPERS
   ========================================================= */

const isValidAdDate = (value) => {
  if (!AD_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] =
    value.split("-").map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

const formatBsValue = (value) => {
  if (
    !value ||
    !AD_DATE_PATTERN.test(value) ||
    !isValidAdDate(value)
  ) {
    return "";
  }

  try {
    const nepaliDate = new NepaliDate(
      new Date(`${value}T00:00:00`)
    );

    const formatted =
      nepaliDate.format(
        "YYYY-MM-DD",
        "np"
      );

    return formatted;
  } catch (error) {
    console.error(
      "Failed to format Nepali date:",
      error
    );

    return "";
  }
};

const convertBsToAd = (value) => {
  const englishValue =
    toEnglishDigits(value);

  if (
    !BS_DATE_PATTERN.test(
      englishValue
    )
  ) {
    return null;
  }

  try {
    const nepaliDate = new NepaliDate(
      englishValue
    );

    const jsDate =
      nepaliDate.toJsDate();

    if (!jsDate) {
      return null;
    }

    const year =
      jsDate.getFullYear();

    const month = String(
      jsDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      jsDate.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
};

/* =========================================================
   COMPONENT
   ========================================================= */

function NepaliDateInput({
  value = "",
  onChange,
  label = "Date",
  required = false,
  disabled = false,
}) {
  const formattedValue = useMemo(
    () => formatBsValue(value),
    [value]
  );

  const [displayValue, setDisplayValue] =
    useState(formattedValue);

  const [invalid, setInvalid] =
    useState(false);

  /* =======================================================
     SYNC WHEN PARENT VALUE CHANGES
     ======================================================= */

  useEffect(() => {
    setDisplayValue(
      formatBsValue(value)
    );

    setInvalid(false);
  }, [value]);

  /* =======================================================
     INPUT CHANGE
     ======================================================= */

  const handleChange = (event) => {
    const nextValue =
      event.target.value;

    setDisplayValue(nextValue);

    /*
     * Empty field
     */

    if (!nextValue.trim()) {
      setInvalid(false);
      onChange?.("");
      return;
    }

    /*
     * Convert a complete BS date into
     * the internal AD date.
     */

    const englishValue =
      toEnglishDigits(nextValue);

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        englishValue
      )
    ) {
      const adValue =
        convertBsToAd(nextValue);

      if (adValue) {
        setInvalid(false);
        onChange?.(adValue);
        return;
      }

      setInvalid(true);
      return;
    }

    /*
     * Allow typing to continue without
     * immediately showing an error.
     */

    setInvalid(false);
  };

  /* =======================================================
     BLUR
     ======================================================= */

  const handleBlur = () => {
    /*
     * Empty is allowed unless required.
     */

    if (!displayValue.trim()) {
      setInvalid(Boolean(required));
      return;
    }

    const englishValue =
      toEnglishDigits(
        displayValue
      );

    if (
      !BS_DATE_PATTERN.test(
        englishValue
      ) ||
      !convertBsToAd(displayValue)
    ) {
      setInvalid(true);
      return;
    }

    /*
     * Normalize the visible value
     * into Nepali digits after editing.
     */

    setDisplayValue(
      toNepaliDigits(
        englishValue
      )
    );

    setInvalid(false);
  };

  /* =======================================================
     DISPLAY
     ======================================================= */

  return (
    <div className="form-group nepali-date-input">
      <label>
        {label}
        {required ? " *" : ""}
      </label>

      <div className="nepali-date-input-wrap">
        <span className="nepali-date-icon">
          📅
        </span>

        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="YYYY-MM-DD"
          disabled={disabled}
          aria-label={`${label} in Nepali calendar`}
          aria-invalid={invalid}
          autoComplete="off"
          className={
            invalid
              ? "input-error"
              : ""
          }
        />
      </div>

      <small className="input-help">
        Bikram Sambat date
      </small>

      {invalid && (
        <small className="input-help input-error-text">
          Please enter a valid Nepali date.
        </small>
      )}
    </div>
  );
}

export default NepaliDateInput;

