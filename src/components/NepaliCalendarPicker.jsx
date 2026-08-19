
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
  if (
    !(date instanceof Date) ||
    Number.isNaN(date.getTime())
  ) {
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
    () => adToBS(new Date()),
    []
  );

  const initialBS = selectedBS || todayBS;

  const [calendarYear, setCalendarYear] = useState(
    initialBS.year
  );

  const [calendarMonth, setCalendarMonth] = useState(
    initialBS.month
  );

  useEffect(() => {
    if (!selectedBS) {
      return;
    }

    setCalendarYear(selectedBS.year);
    setCalendarMonth(selectedBS.month);
  }, [selectedBS]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target
        )
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

  const monthLength = getBSMonthLength(
    calendarYear,
    calendarMonth
  );

  const firstDayAD = bsToAD(
    calendarYear,
    calendarMonth,
    1
  );

  const firstWeekday = firstDayAD.getDay();

  const calendarCells = [];

  for (
    let i = 0;
    i < firstWeekday;
    i += 1
  ) {
    calendarCells.push(null);
  }

  for (
    let day = 1;
    day <= monthLength;
    day += 1
  ) {
    calendarCells.push(day);
  }

  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  const previousMonth = () => {
    if (calendarMonth === 1) {
      setCalendarYear(
        (year) => year - 1
      );
      setCalendarMonth(12);
    } else {
      setCalendarMonth(
        (month) => month - 1
      );
    }
  };

  const nextMonth = () => {
    if (calendarMonth === 12) {
      setCalendarYear(
        (year) => year + 1
      );
      setCalendarMonth(1);
    } else {
      setCalendarMonth(
        (month) => month + 1
      );
    }
  };

  const selectDay = (day) => {
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
            const current =
              selectedBS || todayBS;

            setCalendarYear(current.year);
            setCalendarMonth(current.month);
          }

          setOpen(
            (current) => !current
          );
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

            <div className="custom-nepali-calendar-header">

              <button
                type="button"
                className="custom-nepali-calendar-nav"
                onClick={previousMonth}
                aria-label="Previous Nepali month"
              >
                ‹
              </button>

              <div className="custom-nepali-calendar-title">
                <strong>
                  {BS_MONTH_NAMES[
                    calendarMonth - 1
                  ]}
                </strong>

                <span>
                  {calendarYear} BS
                </span>
              </div>

              <button
                type="button"
                className="custom-nepali-calendar-nav"
                onClick={nextMonth}
                aria-label="Next Nepali month"
              >
                ›
              </button>

            </div>

            <div className="custom-nepali-calendar-weekdays">
              {WEEKDAYS.map(
                (weekday) => (
                  <div
                    key={weekday}
                    className="custom-nepali-calendar-weekday"
                  >
                    {weekday}
                  </div>
                )
              )}
            </div>

            <div className="custom-nepali-calendar-grid">
              {calendarCells.map(
                (day, index) => {
                  if (day === null) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="custom-nepali-calendar-empty"
                      />
                    );
                  }

                  return (
                    <button
                      key={day}
                      type="button"
                      className={[
                        "custom-nepali-calendar-day",
                        isSelected(day)
                          ? "selected"
                          : "",
                        isToday(day)
                          ? "today"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() =>
                        selectDay(day)
                      }
                    >
                      {day}
                    </button>
                  );
                }
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default NepaliCalendarPicker;
