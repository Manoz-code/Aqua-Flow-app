import { useEffect, useMemo, useRef, useState } from "react";

import { NepaliCalendar } from "@sushill/react-nepali-calendar";

import "react-day-picker/style.css";
import "@sushill/react-nepali-calendar/styles.css";

import { formatNepaliDate } from "../utils/format";

/* =========================================================
   NEPALI CALENDAR PICKER

   Internal AquaFlow value:
     AD YYYY-MM-DD

   User sees:
     Bikram Sambat calendar

   On selection:
     Returns AD YYYY-MM-DD

   Existing reports/data filtering therefore remains
   unchanged.
   ========================================================= */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toJsDate = (value) => {
  if (
    !value ||
    !ISO_DATE_PATTERN.test(String(value))
  ) {
    return undefined;
  }

  const [year, month, day] = String(value)
    .slice(0, 10)
    .split("-")
    .map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
};

const toIsoDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function NepaliCalendarPicker({
  value = "",
  onChange,
  label = "Date",
  placeholder = "छान्नुहोस्",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selectedDate = useMemo(
    () => toJsDate(value),
    [value]
  );

  /* =======================================================
     CLOSE ON OUTSIDE CLICK
     ======================================================= */

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
    };
  }, [open]);

  /* =======================================================
     CLOSE WITH ESC
     ======================================================= */

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open]);

  /* =======================================================
     SELECT DATE
     ======================================================= */

  const handleSelect = (date) => {
    if (!(date instanceof Date)) {
      return;
    }

    const isoDate = toIsoDate(date);

    if (!isoDate) {
      return;
    }

    onChange?.(isoDate);
    setOpen(false);
  };

  return (
    <div
      className="form-group nepali-calendar-picker"
      ref={wrapperRef}
    >
      <label>{label}</label>

      <button
        type="button"
        className="nepali-calendar-trigger"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() =>
          setOpen((current) => !current)
        }
      >
        <span className="nepali-calendar-trigger-icon">
          📅
        </span>

        <span className="nepali-calendar-trigger-value">
          {value
            ? formatNepaliDate(value)
            : placeholder}
        </span>

        <span className="nepali-calendar-trigger-arrow">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <div
          className="nepali-calendar-popup"
          role="dialog"
          aria-label={`${label} calendar`}
        >
          <NepaliCalendar
            mode="single"
            selected={selectedDate}
            {...(selectedDate
              ? { defaultMonth: selectedDate }
              : {})}
            onSelect={handleSelect}
            showGregorianDates={false}
          />
        </div>
      )}
    </div>
  );
}

export default NepaliCalendarPicker;
