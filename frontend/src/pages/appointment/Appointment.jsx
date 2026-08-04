import { useState, useEffect } from "react";
import { api } from "../../api/client";
import "./Appointment.css";

// ── Constants ────────────────────────────────────────────────────────────────
const SLOT_DURATION_MINUTES = 10;
const WORKDAY_START_MINUTES = 16 * 60;
const WORKDAY_END_MINUTES = 20 * 60;

const formatSlotTime = (totalMinutes) => {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
};

const ALLOWED_SLOTS = Array.from(
  { length: (WORKDAY_END_MINUTES - WORKDAY_START_MINUTES) / SLOT_DURATION_MINUTES },
  (_, index) => formatSlotTime(WORKDAY_START_MINUTES + index * SLOT_DURATION_MINUTES)
);

const TIME_BLOCKS = [
  { id: "4-5", label: "4:00 - 5:00 PM", start: 16 * 60, end: 17 * 60 },
  { id: "5-6", label: "5:00 - 6:00 PM", start: 17 * 60, end: 18 * 60 },
  { id: "6-7", label: "6:00 - 7:00 PM", start: 18 * 60, end: 19 * 60 },
  { id: "7-8", label: "7:00 - 8:00 PM", start: 19 * 60, end: 20 * 60 },
];

const DAYS_HEADER = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

// Build current month calendar (2 rows shown, May 2025 example)
// Week starting Mon 28 Apr → rows cover Apr 28 – May 11
const CALENDAR_ROWS = [
  [28, 29, 30, 1, 2, 3, 4],
  [5, 6, 7, 8, 9, 10, 11],
];
const PREV_MONTH_DAYS = [28, 29, 30];

// Day-of-week index for each calendar cell (0=Mon … 6=Sun)
// Row 0: Apr28=Mon(0) Apr29=Tue(1) Apr30=Wed(2) May1=Thu(3) May2=Fri(4) May3=Sat(5) May4=Sun(6)
// Row 1: May5=Mon(0) … May11=Sun(6)
const WEEKEND_COLS = [5, 6]; // SA, SU columns

// ── Helpers ──────────────────────────────────────────────────────────────────
const getTodayKey = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (dateKey) => {
  if (!dateKey) return "";
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getDateDay = (dateKey) => {
  if (!dateKey) return "";
  const [, , day] = dateKey.split("-");
  return String(Number(day));
};

const isPastDate = (dateKey) => dateKey < getTodayKey();

const isWeekendDate = (dateKey) => {
  if (!dateKey) return false;
  const [year, month, day] = dateKey.split("-").map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

const loadBookings = () => {
  try {
    return JSON.parse(localStorage.getItem("dr_bookings") || "[]");
  } catch {
    return [];
  }
};

const saveBookings = (bookings) => {
  localStorage.setItem("dr_bookings", JSON.stringify(bookings));
};

const fetchBookings = async () => {
  const data = await api.get("/appointments");
  return data.appointments || [];
};

const createBooking = async (booking) => {
  const data = await api.post("/appointments", booking);
  return data.appointment;
};

const isSlotBooked = (bookings, date, slot) =>
  bookings.some((b) => b.date === date && b.time === slot);

// ── Component ─────────────────────────────────────────────────────────────────
export default function Appointment({ currentUser = null }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTimeBlock, setSelectedTimeBlock] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);     // { dateKey, display, day }
  const [form, setForm] = useState({ name: currentUser?.name || "", phone: currentUser?.phone || "", email: currentUser?.email || "", notes: "" });
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors]   = useState({});
  const [bookings, setBookings] = useState([]);
  const todayKey = getTodayKey();

  useEffect(() => {
    const loadAppointmentData = async () => {
      try {
        const appointments = await fetchBookings();
        setBookings(appointments);
        saveBookings(appointments);
      } catch {
        setBookings(loadBookings());
      }
    };

    loadAppointmentData();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || currentUser.name || "",
      email: prev.email || currentUser.email || "",
      phone: prev.phone || currentUser.phone || "",
    }));
  }, [currentUser]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const isWeekend = (colIdx) => WEEKEND_COLS.includes(colIdx);
  const isPrevMonthDay = (rowIdx, day) => rowIdx === 0 && PREV_MONTH_DAYS.includes(day);

  const selectedDateKey = selectedDate
    ? selectedDate.dateKey
    : null;
  const activeTimeBlock = TIME_BLOCKS.find((block) => block.id === selectedTimeBlock);
  const visibleSlots = activeTimeBlock
    ? ALLOWED_SLOTS.filter((_, index) => {
        const slotMinutes = WORKDAY_START_MINUTES + index * SLOT_DURATION_MINUTES;
        return slotMinutes >= activeTimeBlock.start && slotMinutes < activeTimeBlock.end;
      })
    : [];

  const getBlockAvailability = (block) => {
    const slots = ALLOWED_SLOTS.filter((_, index) => {
      const slotMinutes = WORKDAY_START_MINUTES + index * SLOT_DURATION_MINUTES;
      return slotMinutes >= block.start && slotMinutes < block.end;
    });

    if (!selectedDateKey) return slots.length;
    return slots.filter((slot) => !isSlotBooked(bookings, selectedDateKey, slot)).length;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDayClick = () => {
    setErrors((prev) => ({ ...prev, date: "Please use the full date picker above." }));
  };

  const handleDateChange = (e) => {
    const dateKey = e.target.value;
    setSelectedSlot(null);

    if (!dateKey) {
      setSelectedDate(null);
      setSelectedTimeBlock(null);
      setErrors((prev) => ({ ...prev, date: "Please select a date." }));
      return;
    }

    if (isPastDate(dateKey)) {
      setSelectedDate(null);
      setSelectedTimeBlock(null);
      setErrors((prev) => ({ ...prev, date: "Please choose today or a future date." }));
      return;
    }

    if (isWeekendDate(dateKey)) {
      setSelectedDate(null);
      setSelectedTimeBlock(null);
      setErrors((prev) => ({ ...prev, date: "Please select a weekday (Mon-Fri)." }));
      return;
    }

    setSelectedDate({
      dateKey,
      display: formatDate(dateKey),
      day: getDateDay(dateKey),
    });
    setErrors((prev) => ({ ...prev, date: undefined, slot: undefined }));
  };

  const handleTimeBlockClick = (blockId) => {
    if (!selectedDate) {
      setErrors((prev) => ({ ...prev, date: "Please select a date first." }));
      return;
    }

    setSelectedTimeBlock(blockId);
    setSelectedSlot(null);
    setErrors((prev) => ({ ...prev, date: undefined, slot: undefined }));
  };

  const handleSlotClick = (slot) => {
    if (!selectedDate) {
      setErrors({ date: "Please select a date first." });
      return;
    }
    if (isSlotBooked(bookings, selectedDateKey, slot)) return;
    setSelectedSlot(slot);
    setErrors((prev) => ({ ...prev, slot: undefined }));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!selectedDate)   errs.date  = "Please select a weekday (Mon–Fri).";
    if (selectedDate && isPastDate(selectedDate.dateKey)) errs.date = "Please choose today or a future date.";
    if (selectedDate && isWeekendDate(selectedDate.dateKey)) errs.date = "Please select a weekday (Mon-Fri).";
    if (!selectedSlot)   errs.slot  = "Please select an available time slot.";
    if (!form.name.trim())  errs.name  = "Full name is required.";
    if (!form.phone.trim()) errs.phone = "Phone number is required.";
    if (!form.email.trim()) errs.email = "Email address is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const bookingPayload = {
      name:  form.name,
      phone: form.phone,
      email: form.email,
      notes: form.notes,
      date:  selectedDateKey,
      time:  selectedSlot,
    };

    try {
      const savedBooking = await createBooking(bookingPayload);
      const bookingForUi = {
        ...savedBooking,
        dateDisplay: selectedDate.display,
        day: selectedDate.day,
      };
      const updated = [...bookings, bookingForUi];
      setBookings(updated);
      saveBookings(updated);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        submit: err.message || "Unable to confirm appointment. Please try again.",
      }));
      return;
    }

    setConfirmed(true);
    setForm({ name: "", phone: "", email: "", notes: "" });
    setSelectedSlot(null);
    setSelectedTimeBlock(null);
    setSelectedDate(null);
    setErrors({});
    setTimeout(() => setConfirmed(false), 5000);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="appt-page" data-tour="appointment-page">
      {/* ── Hero ── */}
      <div className="appt-hero">
        <span className="appt-hero__badge">🔒 SECURE BOOKING</span>
        <h1 className="appt-hero__title">Schedule Your Visit</h1>
        <p className="appt-hero__sub">
          Experience healthcare designed around you. Select a convenient time and
          provide your details to confirm your appointment with Dr. Hammad.
        </p>
        {/* Hours notice */}
        <div className="appt-hero__notice">
          <span>🗓️</span>
          <span>Appointments available <strong>Mon–Fri</strong>, between <strong>4:00 PM – 8:00 PM</strong></span>
        </div>
      </div>

      {/* ── Success Banner ── */}
      {confirmed && (
        <div className="appt-success-banner">
          <span className="appt-success-banner__icon">✅</span>
          <div>
            <p className="appt-success-banner__title">Appointment Confirmed!</p>
            <p className="appt-success-banner__sub">
              You'll receive a confirmation email shortly. We look forward to seeing you!
            </p>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="appt-body">
        {/* LEFT */}
        <div className="appt-left">
          {/* Doctor Card */}
          <div className="appt-card">
            <div className="appt-doctor">
              <div className="appt-doctor__avatar-wrap">
                <img
                  src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&q=80"
                  alt="Dr. Hammad"
                  className="appt-doctor__avatar"
                />
                <span className="appt-doctor__online" />
              </div>
              <div>
                <p className="appt-doctor__name">Dr. Hammad</p>
                <p className="appt-doctor__role">Specialist Physician</p>
                <p className="appt-doctor__rating">⭐ 4.9 (120+ Reviews)</p>
              </div>
            </div>

            <div className="appt-divider" />

            <div className="appt-info-row">
              <div className="appt-info-icon">📍</div>
              <div>
                <p className="appt-info-row__title">Clinical Center</p>
                <p className="appt-info-row__sub">123 Wellness Way, Suite 500, New York</p>
              </div>
            </div>
            <div className="appt-info-row">
              <div className="appt-info-icon">🕐</div>
              <div>
                <p className="appt-info-row__title">Avg. Duration</p>
                <p className="appt-info-row__sub">10 Minutes per Patient</p>
              </div>
            </div>
            <div className="appt-info-row">
              <div className="appt-info-icon">📅</div>
              <div>
                <p className="appt-info-row__title">Working Hours</p>
                <p className="appt-info-row__sub">Mon–Fri &nbsp;|&nbsp; 4:00 PM – 8:00 PM</p>
              </div>
            </div>
          </div>

          {/* Calendar Card */}
          <div className="appt-card appt-calendar-card">
            <h3 className="appt-calendar__title">
              <span>📅</span> Select Date
            </h3>

            {errors.date && <p className="appt-error appt-error--block">{errors.date}</p>}

            <div className="appt-date-picker">
              <label className="appt-date-picker__label" htmlFor="appointment-date">
                Choose appointment date
              </label>
              <input
                id="appointment-date"
                type="date"
                min={todayKey}
                value={selectedDate?.dateKey || ""}
                onChange={handleDateChange}
                className={`appt-form__input appt-date-picker__input ${errors.date ? "appt-form__input--error" : ""}`}
              />
              {selectedDate && (
                <p className="appt-date-picker__selected">
                  Selected: <strong>{selectedDate.display}</strong>
                </p>
              )}
            </div>

            <div className="appt-calendar appt-calendar--legacy">
              <div className="appt-calendar__header">
                {DAYS_HEADER.map((d, i) => (
                  <span
                    key={d}
                    className={`appt-calendar__day-label ${WEEKEND_COLS.includes(i) ? "appt-calendar__day-label--weekend" : ""}`}
                  >
                    {d}
                  </span>
                ))}
              </div>

              {CALENDAR_ROWS.map((row, ri) => (
                <div key={ri} className="appt-calendar__row">
                  {row.map((day, ci) => {
                    const prev    = isPrevMonthDay(ri, day);
                    const weekend = isWeekend(ci);
                    const isSelected =
                      selectedDate &&
                      selectedDate.day === day &&
                      selectedDate.rowIdx === ri;

                    return (
                      <button
                        key={ci}
                        className={[
                          "appt-calendar__day",
                          prev    ? "appt-calendar__day--prev"    : "",
                          weekend ? "appt-calendar__day--weekend" : "",
                          isSelected ? "appt-calendar__day--selected" : "",
                        ].join(" ").trim()}
                        onClick={() => handleDayClick(day, ri, ci)}
                        disabled={prev || weekend}
                        title={weekend ? "Weekends unavailable" : ""}
                      >
                        {day}
                        {weekend && <span className="appt-calendar__day-x">✕</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <p className="appt-calendar__legend">
              <span className="appt-legend-dot appt-legend-dot--off" /> Past dates and weekends unavailable
            </p>
          </div>

          {/* Saved Bookings Preview */}
          {bookings.length > 0 && (
            <div className="appt-card appt-bookings-card">
              <h3 className="appt-bookings__title">📋 Your Bookings ({bookings.length})</h3>
              <div className="appt-bookings__list">
                {bookings.slice(-3).reverse().map((b, i) => (
                  <div key={i} className="appt-booking-item">
                    <div className="appt-booking-item__left">
                      <p className="appt-booking-item__name">{b.name}</p>
                      <p className="appt-booking-item__meta">{b.email}</p>
                    </div>
                    <div className="appt-booking-item__right">
                      <span className="appt-booking-item__time">{b.time}</span>
                      <span className="appt-booking-item__date">{b.dateDisplay || `Day ${b.day}`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="appt-card appt-right">
          <h3 className="appt-slots__title">
            <span>🕐</span> Available Time Slots
          </h3>
          <p className="appt-slots__range-note">
            Choose an evening hour, then pick a 10-minute appointment.
          </p>

          {errors.slot && <p className="appt-error appt-error--block">{errors.slot}</p>}

          <div className="appt-slots__toolbar">
            <p className="appt-slots__group-label">EVENING HOURS</p>
            <span className="appt-slots__count">
              {ALLOWED_SLOTS.length} slots
            </span>
          </div>

          <div className="appt-time-blocks" role="listbox" aria-label="Appointment hour groups">
            {TIME_BLOCKS.map((block) => {
              const active = selectedTimeBlock === block.id;
              const availableCount = getBlockAvailability(block);
              const fullyBooked = selectedDateKey && availableCount === 0;

              return (
                <button
                  key={block.id}
                  type="button"
                  className={[
                    "appt-time-block",
                    active ? "appt-time-block--selected" : "",
                    fullyBooked ? "appt-time-block--booked" : "",
                    !selectedDate ? "appt-time-block--no-date" : "",
                  ].join(" ").trim()}
                  onClick={() => handleTimeBlockClick(block.id)}
                  disabled={!selectedDate || fullyBooked}
                  role="option"
                  aria-selected={active}
                  title={
                    !selectedDate ? "Select a date first"
                    : fullyBooked ? "This hour is fully booked"
                    : ""
                  }
                >
                  <span className="appt-time-block__label">{block.label}</span>
                  <span className="appt-time-block__meta">
                    {selectedDateKey ? `${availableCount} available` : "6 appointments"}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedDate && activeTimeBlock && (
            <div className="appt-slots__toolbar appt-slots__toolbar--sub">
              <p className="appt-slots__group-label">{activeTimeBlock.label}</p>
              <span className="appt-slots__count">
                {visibleSlots.length} slots
              </span>
            </div>
          )}

          {selectedDate && !activeTimeBlock && (
            <p className="appt-slots__hint">Select an hour above to view the 10-minute appointments.</p>
          )}

          <div className="appt-slots__grid appt-slots__grid--compact" role="listbox" aria-label="Available appointment times">
            {visibleSlots.map((slot) => {
              const booked = selectedDateKey
                ? isSlotBooked(bookings, selectedDateKey, slot)
                : false;
              const active = selectedSlot === slot;

              return (
                <button
                  key={slot}
                  className={[
                    "appt-slot",
                    active  ? "appt-slot--selected" : "",
                    booked  ? "appt-slot--booked"   : "",
                    !selectedDate ? "appt-slot--no-date" : "",
                  ].join(" ").trim()}
                  onClick={() => handleSlotClick(slot)}
                  disabled={booked || !selectedDate}
                  role="option"
                  aria-selected={active}
                  title={
                    !selectedDate ? "Select a date first"
                    : booked      ? "Already booked"
                    : ""
                  }
                >
                  {slot}
                  {active  && <span className="appt-slot__check">✓</span>}
                  {booked  && <span className="appt-slot__booked-label">Booked</span>}
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form className="appt-form" onSubmit={handleSubmit} noValidate>
            {errors.submit && <p className="appt-error appt-error--block">{errors.submit}</p>}

            <div className="appt-form__row">
              <div className="appt-form__field">
                <label className="appt-form__label">FULL NAME</label>
                <input
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  className={`appt-form__input ${errors.name ? "appt-form__input--error" : ""}`}
                />
                {errors.name && <span className="appt-error">{errors.name}</span>}
              </div>
              <div className="appt-form__field">
                <label className="appt-form__label">PHONE NUMBER</label>
                <input
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={handleChange}
                  className={`appt-form__input ${errors.phone ? "appt-form__input--error" : ""}`}
                />
                {errors.phone && <span className="appt-error">{errors.phone}</span>}
              </div>
            </div>

            <div className="appt-form__field">
              <label className="appt-form__label">EMAIL ADDRESS</label>
              <input
                name="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={handleChange}
                className={`appt-form__input ${errors.email ? "appt-form__input--error" : ""}`}
              />
              {errors.email && <span className="appt-error">{errors.email}</span>}
            </div>

            <div className="appt-form__field">
              <label className="appt-form__label">NOTES / MEDICAL CONCERN</label>
              <textarea
                name="notes"
                placeholder="Briefly describe the reason for your visit..."
                value={form.notes}
                onChange={handleChange}
                rows={4}
                className="appt-form__input appt-form__textarea"
              />
            </div>

            {/* Booking summary */}
            {selectedDate && selectedSlot && (
              <div className="appt-summary">
                <p className="appt-summary__label">📌 Booking Summary</p>
                <p className="appt-summary__line">
                  <strong>Date:</strong>&nbsp; {selectedDate.display} &nbsp;|&nbsp;
                  <strong>Time:</strong>&nbsp; {selectedSlot}
                </p>
              </div>
            )}

            <button type="submit" className="appt-form__submit">
              Confirm Appointment →
            </button>

            <p className="appt-form__security">
              🔒 Your data is protected by HIPAA compliant 256-bit encryption
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
