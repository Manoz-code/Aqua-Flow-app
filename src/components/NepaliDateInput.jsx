

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BS_MONTH_NAMES,
  adToBS,
  bsToAD,
  getBSMonthLength,
} from "@sushill/bikram-sambat";

import { formatNepaliDate } from "../utils/format";

import "../styles/forms.css";

/* =========================================================
   NEPALI DATE INPUT

   Internal/external value:
     AD YYYY-MM-DD

   Display:
     Bikram Sambat

   IMPORTANT:
   We intentionally do NOT use the package's NepaliCalendar
   component here.

   @sushill/react-nepali-calendar internally renders its own
   DayButton. That causes the BS day and React Day Picker's
   child value to appear together:

       1 + 1 = 11
       2 + 2 = 22
       3 + 3 = 33

   This component renders the BS calendar grid directly.
   ========================================================= */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const WEEKDAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

/* =========================================================
   DATE HELPERS
   ========================================================= */

function toJsDate(value) {
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
}

function toIsoDate(date) {
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
}

function getTodayBS() {
  return adToBS(new Date());
}

/* =========================================================
   COMPONENT
   ========================================================= */

function NepaliCalendarPicker({
  value = "",
  onChange,
  label = "Date",
  placeholder = "Select Nepali date",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef(null);

  const selectedDate = useMemo(
    () => toJsDate(value),
    [value]
  );

  const selectedBS = useMemo(() => {
    if (!selectedDate) {
      return null;
    }

    return adToBS(selectedDate);
  }, [selectedDate]);

  const todayBS = useMemo(
    () => getTodayBS(),
    []
  );

  /* =======================================================
     CALENDAR MONTH STATE

     Start from selected date when available.
     Otherwise use today's Nepali month.
     ======================================================= */

  const initialBS = selectedBS || todayBS;

  const [calendarYear, setCalendarYear] = useState(
    initialBS.year
  );

  const [calendarMonth, setCalendarMonth] = useState(
    initialBS.month
  );

  /* =======================================================
     SYNC CALENDAR WHEN VALUE CHANGES
     ======================================================= */

  useEffect(() => {
    if (!selectedBS) {
      return;
    }

    setCalendarYear(selectedBS.year);
    setCalendarMonth(selectedBS.month);
  }, [value]);

  /* =======================================================
     CLOSE OUTSIDE
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
     ESCAPE
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
     MONTH INFORMATION
     ======================================================= */

  const monthLength = useMemo(() => {
    return getBSMonthLength(
      calendarYear,
      calendarMonth
    );
  }, [calendarYear, calendarMonth]);

  const firstDayAD = useMemo(() => {
    return bsToAD(
      calendarYear,
      calendarMonth,
      1
    );
  }, [calendarYear, calendarMonth]);

  const firstWeekday = firstDayAD.getDay();

  /* =======================================================
     CALENDAR CELLS

     Only actual BS numbers are rendered.

     There is NO second number.
     ======================================================= */

  const calendarCells = useMemo(() => {
    const cells = [];

    /* Empty cells before day 1 */
    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push(null);
    }

    /* Actual Nepali days */
    for (
      let day = 1;
      day <= monthLength;
      day += 1
    ) {
      cells.push(day);
    }

    /* Complete final week */
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [firstWeekday, monthLength]);

  /* =======================================================
     NAVIGATION
     ======================================================= */

  const goPreviousMonth = () => {
    if (calendarMonth === 1) {
      setCalendarYear((year) => year - 1);
      setCalendarMonth(12);
    } else {
      setCalendarMonth((month) => month - 1);
    }
  };

  const goNextMonth = () => {
    if (calendarMonth === 12) {
      setCalendarYear((year) => year + 1);
      setCalendarMonth(1);
    } else {
      setCalendarMonth((month) => month + 1);
    }
  };

  /* =======================================================
     SELECT DAY
     ======================================================= */

  const handleSelectDay = (day) => {
    if (!day) {
      return;
    }

    const adDate = bsToAD(
      calendarYear,
      calendarMonth,
      day
    );

    const isoDate = toIsoDate(adDate);

    if (!isoDate) {
      return;
    }

    onChange?.(isoDate);

    setOpen(false);
  };

  /* =======================================================
     CHECK SELECTED / TODAY
     ======================================================= */

  const isSelected = (day) => {
    return Boolean(
      selectedBS &&
      selectedBS.year === calendarYear &&
      selectedBS.month === calendarMonth &&
      selectedBS.day === day
    );
  };

  const isToday = (day) => {
    return (
      todayBS.year === calendarYear &&
      todayBS.month === calendarMonth &&
      todayBS.day === day
    );
  };

  /* =======================================================
     RENDER
     ======================================================= */

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
        onClick={() => {
          if (!open) {
            const current = selectedBS || todayBS;

            setCalendarYear(current.year);
            setCalendarMonth(current.month);
          }

          setOpen((current) => !current);
        }}
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
          <div className="custom-nepali-calendar">

            {/* HEADER */}

            <div className="custom-nepali-calendar-header">

              <button
                type="button"
                className="custom-nepali-calendar-nav"
                onClick={goPreviousMonth}
                aria-label="Previous Nepali month"
              >
                ‹
              </button>

              <div className="custom-nepali-calendar-title">
                <strong>
                  {BS_MONTH_NAMES[calendarMonth - 1]}
                </strong>

                <span>
                  {calendarYear} BS
                </span>
              </div>

              <button
                type="button"
                className="custom-nepali-calendar-nav"
                onClick={goNextMonth}
                aria-label="Next Nepali month"
              >
                ›
              </button>

            </div>

            {/* WEEKDAYS */}

            <div className="custom-nepali-calendar-weekdays">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  className="custom-nepali-calendar-weekday"
                >
                  {weekday}
                </div>
              ))}
            </div>

            {/* DAYS */}

            <div className="custom-nepali-calendar-grid">
              {calendarCells.map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="custom-nepali-calendar-empty"
                    />
                  );
                }

                const selected = isSelected(day);
                const today = isToday(day);

                return (
                  <button
                    key={day}
                    type="button"
                    className={[
                      "custom-nepali-calendar-day",
                      selected
                        ? "selected"
                        : "",
                      today
                        ? "today"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      handleSelectDay(day)
                    }
                  >
                    {day}
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default NepaliCalendarPicker;
