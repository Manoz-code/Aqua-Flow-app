import { useEffect, useMemo, useState } from "react";
import NepaliDate from "nepali-date-converter";

/* =========================================================
   NEPALI DATE INPUT

   External value:
     AD YYYY-MM-DD

   Display:
     BS YYYY-MM-DD using Nepali digits

   The stored value remains AD so existing AquaFlow
   data and date filtering continue to work.
   ========================================================= */

const AD_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatBsValue(value) {
  if (!value || !AD_DATE_PATTERN.test(value)) {
    return "";
  }

  try {
    const nepaliDate = new NepaliDate(
      new Date(`${value}T00:00:00`)
    );

    return nepaliDate.format(
      "YYYY-MM-DD",
      "np"
    );
  } catch (error) {
    console.error(
      "Failed to format Nepali date:",
      error
    );

    return "";
  }
}

function getBsParts(value) {
  if (!value || !AD_DATE_PATTERN.test(value)) {
    return null;
  }

  try {
    const nepaliDate = new NepaliDate(
      new Date(`${value}T00:00:00`)
    );

    const bs = nepaliDate.getBS();

    return {
      year: bs.year,
      month: bs.month + 1,
      date: bs.date,
    };
  } catch {
    return null;
  }
}

function NepaliDateInput({
  value = "",
  onChange,
  label = "Date",
  required = false,
  min,
  max,
  disabled = false,
}) {
  const initialBs = useMemo(
    () => formatBsValue(value),
    [value]
  );

  const [displayValue, setDisplayValue] =
    useState(initialBs);

  useEffect(() => {
    setDisplayValue(formatBsValue(value));
  }, [value]);

  const handleChange = (event) => {
    const nextValue = event.target.value;

    setDisplayValue(nextValue);

    /*
     * The visible field is intentionally Nepali.
     *
     * We only emit a new AD value after the user enters
     * a complete BS date.
     *
     * The package supports parsing Nepali date strings,
     * so convert the completed BS date back to JS Date.
     */
    const nepaliDigits =
      "०१२३४५६७८९";

    const englishValue = nextValue.replace(
      /[०-९]/g,
      (digit) =>
        String(
          nepaliDigits.indexOf(digit)
        )
    );

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        englishValue
      )
    ) {
      try {
        const nepaliDate = new NepaliDate(
          englishValue
        );

        const jsDate =
          nepaliDate.toJsDate();

        const year =
          jsDate.getFullYear();

        const month = String(
          jsDate.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
          jsDate.getDate()
        ).padStart(2, "0");

        onChange?.(
          `${year}-${month}-${day}`
        );
      } catch {
        // Incomplete/invalid dates stay in the
        // input until the user completes them.
      }
    } else if (!nextValue) {
      onChange?.("");
    }
  };

  const parts = getBsParts(value);

  return (
    <div className="form-group nepali-date-input">
      <label>
        {label}
        {required ? " *" : ""}
      </label>

      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder="YYYY-MM-DD"
        disabled={disabled}
        aria-label={`${label} in Nepali calendar`}
        autoComplete="off"
      />

      {parts && (
        <small className="input-help">
          BS {parts.year}-{String(
            parts.month
          ).padStart(2, "0")}-{String(
            parts.date
          ).padStart(2, "0")}
        </small>
      )}

      {(min || max) && (
        <small className="input-help">
          Date range checking remains based on
          the stored AD date.
        </small>
      )}
    </div>
  );
}

export default NepaliDateInput;
