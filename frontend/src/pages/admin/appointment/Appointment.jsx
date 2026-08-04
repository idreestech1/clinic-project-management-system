import { useEffect, useMemo, useState } from "react";
import { api } from "../../../api/client";
import { useToast } from "../../../components/toast/useToast";
import { exportCsv } from "../../../utils/csvExport";
import "./Appointment.css";

const APPOINTMENT_CSV_COLUMNS = [
  { label: "Name", value: "name" },
  { label: "Email", value: "email" },
  { label: "Phone", value: "phone" },
  { label: "Date", value: "date" },
  { label: "Time", value: "time" },
  { label: "Status", value: "status" },
  { label: "Payment Status", value: "paymentStatus" },
  { label: "Fee", value: "feeAmount" },
];

const stats = [
  {
    icon: "📅",
    label: "TOTAL APPOINTMENTS",
    value: "128",
    badge: "+12%",
    badgeColor: "badge-blue",
    iconBg: "icon-blue",
  },
  {
    icon: "📋",
    label: "PENDING REVIEW",
    value: "14",
    badge: "High",
    badgeColor: "badge-red",
    iconBg: "icon-orange",
  },
  {
    icon: "👤",
    label: "NEW PATIENTS",
    value: "32",
    badge: "New",
    badgeColor: "badge-green",
    iconBg: "icon-green",
  },
  {
    icon: "📆",
    label: "UPCOMING APPOINTMENTS",
    value: "4",
    badge: "Next 50",
    badgeColor: "badge-blue",
    iconBg: "icon-gray",
  },
];

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("en-PK")} PKR`;

const formatBookedAt = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-PK", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
const formatTime = (timeStr) => {
  if (!timeStr) return "Not available";
  const [hours, minutes] = timeStr.split(":");
  if (!hours || !minutes) return timeStr;
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour.toString().padStart(2, "0")}:${minutes} ${period}`;
};
const getPatientKey = (appointment) =>
  appointment.email?.toLowerCase().trim() ||
  appointment.phone?.trim() ||
  appointment.name?.toLowerCase().trim() ||
  "";

const matchesAppointmentSearch = (appointment, query) => {
  const term = query.trim().toLowerCase();
  if (!term) return true;

  return [
    appointment.name,
    appointment.phone,
    appointment.email,
    appointment.notes,
    appointment.type,
    appointment.date,
    appointment.time,
    appointment.status,
    appointment.paymentStatus,
    appointment.feeAmount,
  ]
    .filter((value) => value !== undefined && value !== null)
    .some((value) => String(value).toLowerCase().includes(term));
};

const isUpcomingAppointment = (appointmentDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const apptDate = new Date(appointmentDate);
  apptDate.setHours(0, 0, 0, 0);
  return apptDate >= today;
};

export default function Appointment() {
  const toast = useToast();
  const [liveAppointments, setLiveAppointments] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentActionLoading, setAppointmentActionLoading] =
    useState(false);
  const [actionError, setActionError] = useState("");
  const [patientHistoryKey, setPatientHistoryKey] = useState("");
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const data = await api.get("/appointments");
        setLiveAppointments(data.appointments || []);
        setLoadError("");
      } catch (err) {
        setLoadError(err.message || "Unable to load appointments.");
      }
    };

    loadAppointments();
  }, []);

  const displayAppointments = useMemo(() => {
    if (!liveAppointments.length) return [];
    return liveAppointments.map((appointment) => ({
      id: appointment.id,
      initials: appointment.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      color: "#1a6fd4",
      name: appointment.name,
      type: appointment.notes || appointment.type || "Clinic Appointment",
      date: appointment.date,
      time: appointment.time,
      status: appointment.status?.toUpperCase() || "CONFIRMED",
      statusClass:
        appointment.status?.toLowerCase() === "pending"
          ? "status-pending"
          : "status-confirmed",
      phone: appointment.phone || "",
      email: appointment.email || "",
      notes: appointment.notes || "",
      feeAmount: appointment.feeAmount ?? 1000,
      paymentStatus: appointment.paymentStatus || "unpaid",
      createdAt: appointment.createdAt,
      paidAt: appointment.paidAt,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        appointment.name,
      )}&background=1a6fd4&color=fff`,
    }));
  }, [liveAppointments]);

  const recentAppointments = useMemo(() => {
    return displayAppointments
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.date).getTime() -
          new Date(a.createdAt || a.date).getTime(),
      )
      .slice(0, 50);
  }, [displayAppointments]);

  const upcomingAppointments = useMemo(() => {
    return displayAppointments
      .filter((a) => isUpcomingAppointment(a.date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 50);
  }, [displayAppointments]);

  const filteredRecentAppointments = useMemo(
    () =>
      recentAppointments.filter((appointment) =>
        matchesAppointmentSearch(appointment, patientSearchTerm),
      ),
    [recentAppointments, patientSearchTerm],
  );

  const activeHistoryKey = useMemo(() => {
    if (patientHistoryKey) return patientHistoryKey;
    const term = patientSearchTerm.trim();
    if (!term) return "";
    const matches = displayAppointments.filter((appointment) =>
      matchesAppointmentSearch(appointment, term),
    );
    const uniqueKeys = [...new Set(matches.map(getPatientKey))];
    return matches.length > 0 && uniqueKeys.length === 1 ? uniqueKeys[0] : "";
  }, [displayAppointments, patientSearchTerm, patientHistoryKey]);

  const patientHistory = useMemo(
    () =>
      activeHistoryKey
        ? displayAppointments
            .filter(
              (appointment) => getPatientKey(appointment) === activeHistoryKey,
            )
            .sort(
              (a, b) =>
                new Date(b.createdAt || b.date).getTime() -
                new Date(a.createdAt || a.date).getTime(),
            )
        : [],
    [displayAppointments, activeHistoryKey],
  );

  const historyPatient = patientHistory[0] || null;

  const allPatientHistory = useMemo(
    () =>
      displayAppointments.sort(
        (a, b) =>
          new Date(b.createdAt || b.date).getTime() -
          new Date(a.createdAt || a.date).getTime(),
      ),
    [displayAppointments],
  );

  const selectPatientHistory = (appointment) => {
    setPatientHistoryKey(getPatientKey(appointment));
  };

  const showAllHistoryView = () => {
    setShowAllHistory(true);
  };

  const hideAllHistoryView = () => {
    setShowAllHistory(false);
    setPatientHistoryKey("");
  };

  const refreshAppointmentState = (updatedAppointment) => {
    setLiveAppointments((current) =>
      current.map((appointment) =>
        appointment.id === updatedAppointment.id
          ? { ...appointment, ...updatedAppointment }
          : appointment,
      ),
    );

    setSelectedAppointment((current) =>
      current?.id === updatedAppointment.id
        ? { ...current, ...updatedAppointment }
        : current,
    );
  };

  const updateAppointment = async (appointmentId, updates, successMessage) => {
    try {
      setAppointmentActionLoading(true);
      setActionError("");

      const response = await api.patch(
        `/appointments/${appointmentId}`,
        updates,
      );
      refreshAppointmentState(response.appointment);
      if (successMessage) toast.success(successMessage);
    } catch (err) {
      const message = err.message || "Unable to update appointment.";
      setActionError(message);
      toast.error(message);
    } finally {
      setAppointmentActionLoading(false);
    }
  };

  const handleAppointmentStatus = async (appointment, status) => {
    if (!appointment || appointment.status === status.toUpperCase()) return;
    await updateAppointment(appointment.id, { status }, `Appointment ${status}.`);
  };

  const handlePaymentStatus = async (appointment, paymentStatus) => {
    const updates = { paymentStatus };
    if (appointment.feeAmount === undefined || appointment.feeAmount === null) {
      updates.feeAmount = 1000;
    }
    await updateAppointment(
      appointment.id,
      updates,
      paymentStatus === "paid" ? "Marked as paid." : "Marked as unpaid.",
    );
  };

  const printAppointmentReceipt = (appointment) => {
    if (!appointment) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Receipt - ${appointment.name}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif; background: #f3f5f9; color: #111827; padding: 32px 0; }
          .receipt-shell { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12); }
          .receipt-title { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #f1f5f9; }
          .receipt-title h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a; }
          .receipt-title > div:first-child p { margin: 12px 0 0; color: #475569; font-size: 14px; }
          .receipt-meta { text-align: right; font-size: 13px; color: #64748b; line-height: 1.8; }
          .receipt-meta > div { margin-bottom: 8px; }
          .receipt-section { margin-bottom: 28px; }
          .receipt-section h2 { margin: 0 0 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #475569; font-weight: 700; }
          .receipt-grid { display: grid; gap: 14px 20px; grid-template-columns: repeat(2, 1fr); margin-bottom: 12px; }
          .receipt-field { background: #f8fafc; border-radius: 12px; padding: 16px; }
          .receipt-field strong { display: block; margin-bottom: 6px; color: #0f172a; font-weight: 600; font-size: 13px; }
          .receipt-field span { color: #475569; font-size: 14px; }
          .receipt-notes { background: #eef2ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; color: #1e3a8a; line-height: 1.6; font-size: 14px; }
          .receipt-notes strong { display: block; margin-bottom: 8px; }
          .receipt-summary { margin-top: 32px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .summary-card { background: linear-gradient(135deg, #e0f2fe 0%, #cffafe 100%); padding: 20px; border-radius: 16px; text-align: center; }
          .summary-card strong { display: block; font-size: 24px; color: #0c4a6e; margin-bottom: 6px; font-weight: 700; }
          .summary-card span { color: #0c4a6e; font-weight: 600; font-size: 13px; }
          .receipt-footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
          @media print { body { background: #fff; padding: 0; } .receipt-shell { box-shadow: none; border-radius: 0; margin: 0; padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="receipt-shell">
          <div class="receipt-title">
            <div>
              <h1>📋 Appointment Receipt</h1>
              <p>${appointment.type}</p>
            </div>
            <div class="receipt-meta">
              <div><strong>Appointment ID:</strong> ${appointment.id || "N/A"}</div>
              <div><strong>Date & Time:</strong> ${appointment.date} • ${appointment.time}</div>
              <div><strong>Printed:</strong> ${new Date().toLocaleString("en-PK")}</div>
            </div>
          </div>

          <div class="receipt-section">
            <h2>👤 Patient Information</h2>
            <div class="receipt-grid">
              <div class="receipt-field">
                <strong>Full Name</strong>
                <span>${appointment.name}</span>
              </div>
              <div class="receipt-field">
                <strong>Phone Number</strong>
                <span>${appointment.phone || "Not Available"}</span>
              </div>
              <div class="receipt-field">
                <strong>Email Address</strong>
                <span>${appointment.email || "Not Available"}</span>
              </div>
              <div class="receipt-field">
                <strong>Status</strong>
                <span style="font-weight: 600; color: ${appointment.statusClass === "status-confirmed" ? "#16a34a" : "#ea580c"}">${appointment.status}</span>
              </div>
            </div>
          </div>

          <div class="receipt-section">
            <h2>📅 Appointment Details</h2>
            <div class="receipt-grid">
              <div class="receipt-field">
                <strong>Service Type</strong>
                <span>${appointment.type}</span>
              </div>
              <div class="receipt-field">
                <strong>Appointment Date</strong>
                <span>${formatDate(appointment.date)}</span>
              </div>
              <div class="receipt-field">
                <strong>Appointment Time</strong>
                <span>${formatTime(appointment.time)}</span>
              </div>
              <div class="receipt-field">
                <strong>Booking Date</strong>
                <span>${formatBookedAt(appointment.createdAt)}</span>
              </div>
            </div>
          </div>

          <div class="receipt-section">
            <h2>💳 Payment Information</h2>
            <div class="receipt-grid">
              <div class="receipt-field">
                <strong>Fee Amount</strong>
                <span style="font-weight: 700; color: #0c4a6e;">${formatCurrency(appointment.feeAmount)}</span>
              </div>
              <div class="receipt-field">
                <strong>Payment Status</strong>
                <span style="font-weight: 600; color: ${appointment.paymentStatus === "paid" ? "#16a34a" : "#ea580c"}">${(appointment.paymentStatus || "unpaid").toUpperCase()}</span>
              </div>
            </div>
          </div>

          ${
            appointment.notes
              ? `
          <div class="receipt-section">
            <h2>📝 Clinical Notes</h2>
            <div class="receipt-notes">
              <strong>Patient Notes</strong>
              <div>${appointment.notes}</div>
            </div>
          </div>
          `
              : ""
          }

          <div class="receipt-summary">
            <div class="summary-card">
              <strong>${formatCurrency(appointment.feeAmount)}</strong>
              <span>Total Amount Charged</span>
            </div>
            <div class="summary-card">
              <strong>${appointment.paymentStatus === "paid" ? "✓ PAID" : "PENDING"}</strong>
              <span>Payment Status</span>
            </div>
          </div>

          <div class="receipt-footer">
            <div>© 2024 Dr. Hammad Medical Practice</div>
            <div>HIPAA Compliant | Professional Medical Receipt</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const displayStats = useMemo(() => {
    return stats.map((item) => {
      if (item.label === "TOTAL APPOINTMENTS")
        return {
          ...item,
          value: String(displayAppointments.length || item.value),
        };
      if (item.label === "PENDING REVIEW")
        return {
          ...item,
          value: String(
            displayAppointments.filter(
              (a) => a.status?.toUpperCase() === "PENDING"
            ).length || item.value,
          ),
        };
      if (item.label === "NEW PATIENTS")
        return {
          ...item,
          value: String(
            new Set(displayAppointments.map((a) => a.email).filter(Boolean)).size ||
              item.value,
          ),
        };
      if (item.label === "UPCOMING APPOINTMENTS")
        return {
          ...item,
          value: String(upcomingAppointments.length || item.value),
        };
      return item;
    });
  }, [displayAppointments, upcomingAppointments]);

  return (
    <div className="appointment-dashboard">
      {/* Header */}
      <header className="appt-dash-header">
        <div>
          <h1 className="appt-dash-title">Appointment Management</h1>
          <p className="appt-dash-subtitle">
            Manage schedules, recent bookings, and patient appointments for Dr.
            Hammad's Practice.
          </p>
        </div>
        <div className="appt-dash-header-right">
          <button
            className="appt-notif-btn"
            title="Export appointments as CSV"
            onClick={() =>
              exportCsv("appointments.csv", displayAppointments, APPOINTMENT_CSV_COLUMNS)
            }
          >
            ⭳
          </button>
          <div className="appt-avatar-group">
            <img
              className="appt-avatar-main"
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="Dr. Hammad"
            />
            <span className="appt-avatar-count">+4</span>
          </div>
          <button
            className="appt-notif-btn"
            title="Pending appointments"
            onClick={() => {
              const pendingCount = displayAppointments.filter(
                (a) => a.status?.toUpperCase() === "PENDING",
              ).length;
              toast.info(
                pendingCount > 0
                  ? `You have ${pendingCount} appointment${pendingCount === 1 ? "" : "s"} awaiting review.`
                  : "You're all caught up — no pending appointments.",
              );
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
        </div>
      </header>

      {/* Error Message */}
      {loadError && (
        <p style={{ color: "#dc2626", padding: "12px 0" }}>{loadError}</p>
      )}

      {/* Stats Cards */}
      <section className="appt-stats-grid">
        {displayStats.map((s, i) => (
          <div className="appt-stat-card" key={i}>
            <div className="appt-stat-card-top">
              <div className={`appt-stat-icon ${s.iconBg}`}>{s.icon}</div>
              <span className={`appt-stat-badge ${s.badgeColor}`}>
                {s.badge}
              </span>
            </div>
            <p className="appt-stat-label">{s.label}</p>
            <p className="appt-stat-value">{s.value}</p>
          </div>
        ))}
      </section>

      {/* Main Content Grid */}
      <section className="appt-main-content">
        {/* Left Column: Recent and Upcoming Appointments */}
        <div className="appt-left-column">
          {/* Recent Appointments */}
          <div className="appt-section appt-recent-section">
            <div className="appt-section-header">
              <div>
                <span className="appt-section-accent"></span>
                <h2 className="appt-section-title">Recent Appointments</h2>
                <p className="appt-section-subtitle">
                  Newest bookings from patients
                </p>
              </div>
            </div>

            <div className="appt-search-box">
              <span className="appt-search-label">Search</span>
              <input
                type="search"
                value={patientSearchTerm}
                onChange={(e) => setPatientSearchTerm(e.target.value)}
                placeholder="Find by name, phone, email, date, status..."
                className="appt-search-input"
              />
            </div>

            <div className="appt-list-container">
              {filteredRecentAppointments.length === 0 ? (
                <p className="appt-empty-state">
                  {displayAppointments.length === 0
                    ? "No appointments available."
                    : "No appointments match your search."}
                </p>
              ) : (
                <div className="appt-list">
                  {filteredRecentAppointments.map((appointment, index) => (
                    <div
                      key={`${appointment.id}-${index}`}
                      className="appt-item appt-item-recent"
                    >
                      <div className="appt-item-left">
                        <div
                          className="appt-item-avatar"
                          style={{ background: appointment.color }}
                        >
                          {appointment.initials}
                        </div>
                        <div className="appt-item-info">
                          <p className="appt-item-name">{appointment.name}</p>
                          <p className="appt-item-type">{appointment.type}</p>
                          <p className="appt-item-meta">{appointment.phone}</p>
                        </div>
                      </div>
                      <div className="appt-item-middle">
                        <p className="appt-item-date">
                          {formatDate(appointment.date)}
                        </p>
                        <p className="appt-item-time">
                          {formatTime(appointment.time)}
                        </p>
                      </div>
                      <div className="appt-item-right">
                        <span
                          className={`appt-item-status ${appointment.statusClass}`}
                        >
                          {appointment.status}
                        </span>
                        <span
                          className={`appt-payment-badge appt-payment-${appointment.paymentStatus}`}
                        >
                          {appointment.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                      <div className="appt-item-actions">
                        {appointment.status !== "CONFIRMED" && (
                          <button
                            className="appt-btn-confirm"
                            disabled={appointmentActionLoading}
                            onClick={() =>
                              handleAppointmentStatus(appointment, "confirmed")
                            }
                          >
                            Confirm
                          </button>
                        )}
                        {appointment.status !== "CANCELLED" && (
                          <button
                            className="appt-btn-cancel"
                            disabled={appointmentActionLoading}
                            onClick={() =>
                              handleAppointmentStatus(appointment, "cancelled")
                            }
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          className="appt-action-btn"
                          onClick={() => {
                            showAllHistoryView();
                            selectPatientHistory(appointment);
                          }}
                          title="View patient history"
                        >
                          History
                        </button>
                        <button
                          className="appt-action-btn appt-action-details"
                          onClick={() => setSelectedAppointment(appointment)}
                          title="View details"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="appt-view-all-row">
              <button
                className="appt-btn-view-all"
                onClick={() => {
                  showAllHistoryView();
                  setPatientHistoryKey("");
                }}
              >
                VIEW ALL APPOINTMENTS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div
          className="appt-modal-overlay"
          onClick={() => setSelectedAppointment(null)}
        >
          <div
            className="appt-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="appt-modal-header">
              <div>
                <h2 className="appt-modal-title">Appointment Details</h2>
                <p className="appt-modal-subtitle">
                  Review booking details and print a professional appointment
                  receipt.
                </p>
              </div>
              <div className="appt-modal-actions">
                <button
                  className="appt-btn-print-receipt"
                  onClick={() => printAppointmentReceipt(selectedAppointment)}
                  type="button"
                >
                  🖨️ Print Receipt
                </button>
                <button
                  className="appt-modal-close"
                  onClick={() => setSelectedAppointment(null)}
                  type="button"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="appt-modal-content">
              <div className="appt-modal-body">
                <div className="appt-modal-section">
                  <h3 className="appt-modal-section-title">
                    Patient Information
                  </h3>
                  <div className="appt-modal-grid">
                    <div className="appt-modal-field">
                      <label>Full Name</label>
                      <p>{selectedAppointment.name}</p>
                    </div>
                    <div className="appt-modal-field">
                      <label>Phone Number</label>
                      <p>{selectedAppointment.phone || "Not available"}</p>
                    </div>
                    <div className="appt-modal-field">
                      <label>Email Address</label>
                      <p>{selectedAppointment.email || "Not available"}</p>
                    </div>
                    <div className="appt-modal-field">
                      <label>Status</label>
                      <p
                        className={`appt-status-text ${selectedAppointment.statusClass}`}
                      >
                        {selectedAppointment.status}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="appt-modal-section">
                  <h3 className="appt-modal-section-title">
                    Appointment Details
                  </h3>
                  <div className="appt-modal-grid">
                    <div className="appt-modal-field">
                      <label>Service Type</label>
                      <p>{selectedAppointment.type}</p>
                    </div>
                    <div className="appt-modal-field">
                      <label>Appointment Date</label>
                      <p>{formatDate(selectedAppointment.date)}</p>
                    </div>
                    <div className="appt-modal-field">
                      <label>Appointment Time</label>
                      <p>{formatTime(selectedAppointment.time)}</p>
                    </div>
                    <div className="appt-modal-field">
                      <label>Booking Date</label>
                      <p>{formatBookedAt(selectedAppointment.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="appt-modal-section">
                  <h3 className="appt-modal-section-title">
                    Payment Information
                  </h3>
                  <div className="appt-modal-grid">
                    <div className="appt-modal-field">
                      <label>Fee Amount</label>
                      <div className="appt-fee-control">
                        <input
                          type="number"
                          value={1000}
                          readOnly
                          disabled
                        />
                        <span>PKR</span>
                      </div>
                    </div>
                    <div className="appt-modal-field">
                      <label>Payment Status</label>
                      <p
                        className={`appt-payment-text appt-payment-${selectedAppointment.paymentStatus}`}
                      >
                        {(
                          selectedAppointment.paymentStatus || "unpaid"
                        ).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  {actionError && (
                    <p className="appt-action-error">{actionError}</p>
                  )}
                  <div className="appt-modal-action-row">
                    <button
                      className="appt-btn-confirm"
                      type="button"
                      disabled={
                        appointmentActionLoading ||
                        selectedAppointment.status === "CONFIRMED"
                      }
                      onClick={() =>
                        handleAppointmentStatus(
                          selectedAppointment,
                          "confirmed",
                        )
                      }
                    >
                      {selectedAppointment.status === "CONFIRMED"
                        ? "Confirmed"
                        : "Confirm"}
                    </button>
                    <button
                      className="appt-btn-cancel"
                      type="button"
                      disabled={
                        appointmentActionLoading ||
                        selectedAppointment.status === "CANCELLED"
                      }
                      onClick={() =>
                        handleAppointmentStatus(
                          selectedAppointment,
                          "cancelled",
                        )
                      }
                    >
                      {selectedAppointment.status === "CANCELLED"
                        ? "Cancelled"
                        : "Cancel"}
                    </button>
                    <button
                      className="appt-btn-payment"
                      type="button"
                      disabled={appointmentActionLoading}
                      onClick={() =>
                        handlePaymentStatus(
                          selectedAppointment,
                          selectedAppointment.paymentStatus === "paid"
                            ? "unpaid"
                            : "paid",
                        )
                      }
                    >
                      {selectedAppointment.paymentStatus === "paid"
                        ? "Mark Unpaid"
                        : "Mark Paid"}
                    </button>
                    <button
                      className="appt-btn-print"
                      type="button"
                      onClick={() =>
                        printAppointmentReceipt(selectedAppointment)
                      }
                    >
                      🖨️ Print Receipt
                    </button>
                  </div>
                </div>

                {selectedAppointment.notes && (
                  <div className="appt-modal-section">
                    <h3 className="appt-modal-section-title">Clinical Notes</h3>
                    <div className="appt-modal-notes">
                      {selectedAppointment.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient History Modal */}
      {showAllHistory && (
        <div className="appt-modal-overlay" onClick={hideAllHistoryView}>
          <div
            className="appt-modal-dialog appt-history-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="appt-modal-header">
              <div>
                <h2 className="appt-modal-title">
                  {patientHistoryKey ? "Patient Medical History" : "All Patients History"}
                </h2>
                <p className="appt-modal-subtitle">
                  {patientHistoryKey
                    ? `Detailed medical consultation timeline and history for ${historyPatient?.name || "Patient"}.`
                    : "Complete archive of all patient consultations and bookings."}
                </p>
              </div>
              <div className="appt-modal-actions">
                <button
                  className="appt-modal-close"
                  onClick={hideAllHistoryView}
                  type="button"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="appt-modal-content">
              {patientHistoryKey && historyPatient ? (
                <>
                  {/* Patient Profile Card */}
                  <div className="appt-history-profile-card">
                    <div className="appt-history-avatar-large">
                      {historyPatient.initials}
                    </div>
                    <div className="appt-history-profile-info">
                      <h3>{historyPatient.name}</h3>
                      <div className="appt-history-profile-details">
                        <span>📞 {historyPatient.phone || "No phone"}</span>
                        <span>✉️ {historyPatient.email || "No email"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Patient Stats Grid */}
                  <div className="appt-history-summary">
                    <div className="appt-history-stat">
                      <span className="appt-history-stat-value">
                        {patientHistory.length}
                      </span>
                      <span className="appt-history-stat-label">
                        Total Appointments
                      </span>
                    </div>
                    <div className="appt-history-stat">
                      <span className="appt-history-stat-value">
                        {formatCurrency(
                          patientHistory.reduce((sum, h) => sum + (h.feeAmount || 0), 0)
                        )}
                      </span>
                      <span className="appt-history-stat-label">
                        Total Billings
                      </span>
                    </div>
                  </div>

                  {/* Timeline Visit Log */}
                  <div className="appt-history-modal-list">
                    {patientHistory.map((history, index) => (
                      <div
                        key={`history-${index}`}
                        className="appt-history-card-item"
                      >
                        <div className="appt-history-card-header">
                          <div className="appt-history-card-date">
                            <span className="appt-history-card-day">
                              📅 {formatDate(history.date)}
                            </span>
                            <span className="appt-history-card-time">
                              ⏰ {formatTime(history.time)}
                            </span>
                          </div>
                          <span
                            className={`appt-item-status ${history.statusClass}`}
                          >
                            {history.status}
                          </span>
                        </div>
                        <div className="appt-history-card-body">
                          <h4 className="appt-history-card-service">
                            {history.type}
                          </h4>
                          <p className="appt-history-card-notes">
                            <strong>Clinical Notes:</strong>{" "}
                            {history.notes || "No notes recorded for this session."}
                          </p>
                        </div>
                        <div className="appt-history-card-footer">
                          <span className="appt-history-card-fee">
                            Fee Charged: {formatCurrency(history.feeAmount)}
                          </span>
                          <span
                            className={`appt-payment-badge appt-payment-${history.paymentStatus}`}
                          >
                            {history.paymentStatus.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* All Patients Consolidated History */}
                  <div className="appt-history-summary">
                    <div className="appt-history-stat">
                      <span className="appt-history-stat-value">
                        {allPatientHistory.length}
                      </span>
                      <span className="appt-history-stat-label">
                        Total Appointments
                      </span>
                    </div>
                    <div className="appt-history-stat">
                      <span className="appt-history-stat-value">
                        {new Set(allPatientHistory.map((a) => a.email)).size}
                      </span>
                      <span className="appt-history-stat-label">
                        Unique Patients
                      </span>
                    </div>
                  </div>

                  <div className="appt-history-modal-list">
                    {allPatientHistory.map((history, index) => (
                      <div
                        key={`all-history-${index}`}
                        className="appt-history-card-item"
                      >
                        <div className="appt-history-card-header">
                          <div className="appt-history-card-date">
                            <span className="appt-history-card-day">
                              📅 {formatDate(history.date)}
                            </span>
                            <span className="appt-history-card-time">
                              ⏰ {formatTime(history.time)}
                            </span>
                          </div>
                          <span
                            className={`appt-item-status ${history.statusClass}`}
                          >
                            {history.status}
                          </span>
                        </div>
                        <div className="appt-history-card-body">
                          <h4 className="appt-history-card-service">
                            {history.name} - {history.type}
                          </h4>
                          <p className="appt-history-card-notes">
                            <strong>Notes:</strong> {history.notes || "No notes added"}
                          </p>
                        </div>
                        <div className="appt-history-card-footer">
                          <div className="appt-history-actions-row">
                            {history.status !== "CONFIRMED" && (
                              <button
                                className="appt-btn-confirm"
                                disabled={appointmentActionLoading}
                                onClick={() =>
                                  handleAppointmentStatus(history, "confirmed")
                                }
                              >
                                Confirm
                              </button>
                            )}
                            {history.status !== "CANCELLED" && (
                              <button
                                className="appt-btn-cancel"
                                disabled={appointmentActionLoading}
                                onClick={() =>
                                  handleAppointmentStatus(history, "cancelled")
                                }
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              className="appt-btn-payment"
                              disabled={appointmentActionLoading}
                              onClick={() =>
                                handlePaymentStatus(
                                  history,
                                  history.paymentStatus === "paid" ? "unpaid" : "paid",
                                )
                              }
                            >
                              {history.paymentStatus === "paid" ? "Unpaid" : "Paid"}
                            </button>
                          </div>
                          <span
                            className={`appt-payment-badge appt-payment-${history.paymentStatus}`}
                          >
                            {history.paymentStatus.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="appt-dash-footer">
        <p className="appt-footer-copy">
          © 2024 DR. HAMMAD MEDICAL PRACTICE. ALL RIGHTS RESERVED.
        </p>
        <div className="appt-footer-links">
          <a href="#">PRIVACY POLICY</a>
          <a href="#">TERMS OF SERVICE</a>
          <a href="#">HIPAA COMPLIANCE</a>
        </div>
      </footer>
    </div>
  );
}