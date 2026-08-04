import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Pie,
  PieChart,
} from "recharts";
import "./Dashboard.css";
const AdminAppointment = lazy(() => import("../appointment/Appointment"));
const Patients = lazy(() => import("../patients/Patients"));
const AdminServices = lazy(() => import("../services/Services"));
const AdminReviews = lazy(() => import("../reviews/Reviews"));
const AdminGallery = lazy(() => import("../gallery/Gallery"));
const AdminSettings = lazy(() => import("../settings/Settings"));
import { api } from "../../../api/client";

const NAV_ITEMS = [
  { icon: "⊞", label: "Dashboard" },
  { icon: "📅", label: "Appointments" },
  { icon: "👥", label: "Patients" },
  { icon: "➕", label: "Services" },
  { icon: "⭐", label: "Reviews" },
  { icon: "🖼", label: "Gallery" },
  { icon: "PKR", label: "Finance" },

  { icon: "⚙️", label: "Settings" },
];

const STATS = [
  {
    icon: "👥",
    label: "TOTAL PATIENTS",
    value: "0",
    sub: "Waiting for live data",
    subColor: "#22c55e",
    bg: "#ffffff",
  },
  {
    icon: "📅",
    label: "TODAY'S APPTS",
    value: "0",
    sub: "Waiting for live data",
    subColor: "#6a7a8a",
    bg: "#ffffff",
  },
  {
    icon: "⭐",
    label: "PENDING REVIEWS",
    value: "0",
    sub: "Waiting for live data",
    subColor: "#f59e0b",
    bg: "#ffffff",
  },
  {
    icon: "✉️",
    label: "NEW MESSAGES",
    value: "0",
    sub: "Waiting for live data",
    subColor: "#1a6fd4",
    bg: "#dbeafe",
  },
];

const CHART_FILTERS = {
  "Last 7 Days": 7,
  "Last 14 Days": 14,
  "Last Month": 30,
};

const AUTO_REFRESH_MS = 20000;

const formatBookedAt = (value) => {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return date.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("en-PK")} PKR`;

function FinancePanel({ appointments = [], onSelectAppointment = () => {} }) {
  const totalBilled = appointments.reduce(
    (sum, appointment) => sum + Number(appointment.feeAmount ?? 1000),
    0,
  );
  const totalCollected = appointments
    .filter((appointment) => appointment.paymentStatus === "paid")
    .reduce(
      (sum, appointment) => sum + Number(appointment.feeAmount ?? 1000),
      0,
    );
  const pendingAmount = totalBilled - totalCollected;

  return (
    <div className="dash-finance-page">
      <div className="dash-finance-hero">
        <div>
          <p className="dash-card__sub">Clinic revenue center</p>
          <h2>Finance Management</h2>
          <p>
            Track consultation fees, pending payments, and paid patient visits.
          </p>
        </div>
        <strong>{formatCurrency(totalCollected)}</strong>
      </div>

      <div className="dash-finance-grid">
        <div className="dash-finance-card">
          <span>Total Billed</span>
          <strong>{formatCurrency(totalBilled)}</strong>
        </div>
        <div className="dash-finance-card">
          <span>Collected</span>
          <strong>{formatCurrency(totalCollected)}</strong>
        </div>
        <div className="dash-finance-card">
          <span>Pending</span>
          <strong>{formatCurrency(pendingAmount)}</strong>
        </div>
      </div>

      <div className="dash-card">
        <h3 className="dash-card__title">Appointment Payments</h3>
        <p className="dash-card__sub">
          Open any appointment to edit fee, mark paid, completed, or cancelled.
        </p>
        <div className="dash-finance-table">
          {appointments.length === 0 && (
            <p className="dash-empty-state">No appointment payments yet.</p>
          )}
          {appointments.map((appointment) => (
            <button
              className="dash-finance-row"
              key={appointment.id}
              onClick={() => onSelectAppointment(appointment)}
              type="button"
            >
              <span>
                <strong>{appointment.name}</strong>
                <small>
                  {appointment.date} at {appointment.time}
                </small>
              </span>
              <span>{formatCurrency(appointment.feeAmount ?? 1000)}</span>
              <span
                className={`dash-payment-pill dash-payment-pill--${appointment.paymentStatus || "unpaid"}`}
              >
                {appointment.paymentStatus || "unpaid"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ onAdminLogout = () => {} }) {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chartFilter, setChartFilter] = useState("Last 7 Days");
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedFeeAmount, setSelectedFeeAmount] = useState(1000);
  const [allAppointments, setAllAppointments] = useState([]);
  const isFirstDashboardLoad = useRef(true);

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent || isFirstDashboardLoad.current) {
          setDashboardLoading(true);
        }

        const range = CHART_FILTERS[chartFilter] || 7;
        const [dashboardResponse, appointmentsResponse] = await Promise.all([
          api.get(`/dashboard?range=${range}`),
          api.get("/appointments"),
        ]);

        setDashboardData(dashboardResponse);
        setAllAppointments(appointmentsResponse.appointments || []);
        setDashboardError("");
        setLastUpdated(new Date());
        isFirstDashboardLoad.current = false;
      } catch (err) {
        setDashboardError(err.message || "Unable to load dashboard data.");
      } finally {
        setDashboardLoading(false);
      }
    },
    [chartFilter],
  );

  useEffect(() => {
    isFirstDashboardLoad.current = true;
    const timeoutId = window.setTimeout(() => {
      loadDashboard();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);

  useEffect(() => {
    if (activeNav !== "Dashboard") {
      if (activeNav !== "Finance") {
        return undefined;
      }
    }

    const intervalId = window.setInterval(() => {
      if (!document.hidden) {
        loadDashboard({ silent: true });
      }
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, [activeNav, loadDashboard]);

  useEffect(() => {
    if (selectedAppointment) {
      const timeoutId = window.setTimeout(() => {
        setSelectedFeeAmount(Number(selectedAppointment.feeAmount ?? 1000));
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [selectedAppointment]);

  const handleNavClick = (label) => {
    setActiveNav(label);
    if (
      typeof window !== "undefined" &&
      window.innerWidth &&
      window.innerWidth < 900
    ) {
      setSidebarOpen(false);
    }
  };

  const refreshSelectedAppointment = (appointment) => {
    setAllAppointments((current) =>
      current.map((item) => (item.id === appointment.id ? appointment : item)),
    );
    setDashboardData((current) => {
      if (!current?.recentAppointments) return current;

      return {
        ...current,
        recentAppointments: current.recentAppointments.map((item) =>
          item.id === appointment.id ? appointment : item,
        ),
      };
    });
    setSelectedAppointment(appointment);
  };

  const updateAppointment = async (appointmentId, updates) => {
    try {
      const response = await api.patch(
        `/appointments/${appointmentId}`,
        updates,
      );
      refreshSelectedAppointment(response.appointment);
      loadDashboard({ silent: true });
      setDashboardError("");
    } catch (err) {
      setDashboardError(err.message || "Unable to update appointment.");
    }
  };

  const stats = dashboardData
    ? [
        {
          icon: "👥",
          label: "TOTAL PATIENTS",
          value: dashboardData.stats?.totalPatients ?? 0,
          sub: "Registered patients",
          subColor: "#22c55e",
          bg: "#ffffff",
        },
        {
          icon: "📅",
          label: "TODAY'S APPTS",
          value: dashboardData.stats?.todaysAppointments ?? 0,
          sub: `${dashboardData.stats?.totalAppointments ?? 0} total appointments`,
          subColor: "#6a7a8a",
          bg: "#ffffff",
        },
        {
          icon: "⭐",
          label: "PENDING REVIEWS",
          value: dashboardData.stats?.pendingReviews ?? 0,
          sub: "Action required",
          subColor: "#f59e0b",
          bg: "#ffffff",
        },
        {
          icon: "⭐",
          label: "NEW MESSAGES",
          value: dashboardData.stats?.newContactMessages ?? 0,
          sub: `${dashboardData.stats?.totalContactMessages ?? 0} total contacts`,
          subColor: "#1a6fd4",
          bg: "#dbeafe",
        },
      ]
    : STATS;

  const chartData = dashboardData?.chartData?.length
    ? dashboardData.chartData
    : [];
  const maxPatients = Math.max(
    ...chartData.map((item) => Number(item.patients) || 0),
    1,
  );
  const activityLabel =
    dashboardData?.activityReport?.label ||
    "Live activity for the selected period";
  const doctors = dashboardData?.doctors?.length
    ? dashboardData.doctors
    : [
        {
          name: "Dr. Hammad",
          specialty: "Specialist Physician",
          status: "Active",
          avatar:
            "https://ui-avatars.com/api/?name=Dr.%20Hammad&background=1a6fd4&color=fff",
        },
      ];

  // Real efficiency data from backend
  const efficiency = dashboardData?.efficiency
    ? [
        {
          label: "CHECK-IN SPEED",
          value: dashboardData.efficiency.checkInSpeed,
          color: "#1a6fd4",
        },
        {
          label: "PATIENT SATISFACTION",
          value: dashboardData.efficiency.patientSatisfaction,
          color: "#22c55e",
        },
      ]
    : [
        { label: "CHECK-IN SPEED", value: 0, color: "#1a6fd4" },
        { label: "PATIENT SATISFACTION", value: 0, color: "#22c55e" },
      ];

  const patientStatusData = dashboardData?.demographics?.patientStatus?.length
    ? dashboardData.demographics.patientStatus
    : [{ label: "No patients", value: 1, color: "#e2e8f0" }];
  const appointmentStatusData = dashboardData?.demographics?.appointmentStatus
    ?.length
    ? dashboardData.demographics.appointmentStatus
    : [];
  const totalPatientStatuses = patientStatusData.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0,
  );
  const latestContactMessages = dashboardData?.latestContactMessages || [];

  return (
    <div
      className={`dash-layout ${sidebarOpen ? "dash-layout--sidebar-open" : ""}`}
    >
      {/* ── SIDEBAR ── */}
      <aside className="dash-sidebar">
        {/* Logo */}
        <div className="dash-sidebar__logo">
          <div className="dash-sidebar__logo-icon">⊞</div>
          <div>
            <p className="dash-sidebar__logo-title">Clinical Portal</p>
            <p className="dash-sidebar__logo-sub">DR. HAMMAD ADMIN</p>
          </div>
        </div>

        <button
          className="dash-sidebar__close"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        >
          ✕
        </button>

        {/* Nav */}
        <nav className="dash-sidebar__nav">
          {NAV_ITEMS.map(({ icon, label }) => (
            <button
              key={label}
              className={`dash-nav-item ${activeNav === label ? "dash-nav-item--active" : ""}`}
              onClick={() => handleNavClick(label)}
            >
              <span className="dash-nav-item__icon">{icon}</span>
              <span className="dash-nav-item__label">{label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="dash-sidebar__bottom">
          <button className="dash-sidebar__consult-btn">QUICK CONSULT</button>
          <button className="dash-sidebar__util-btn">
            <span>❓</span> Help Center
          </button>
          <button
            className="dash-sidebar__util-btn dash-sidebar__util-btn--red"
            onClick={onAdminLogout}
          >
            <span>↪</span> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="dash-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* ── MAIN ── */}
      <main className="dash-main">
        <Suspense fallback={<div className="dash-section-loading">Loading…</div>}>
          {activeNav === "Appointments" ? (
            <AdminAppointment />
          ) : activeNav === "Patients" ? (
            <Patients />
          ) : activeNav === "Services" ? (
            <AdminServices />
          ) : activeNav === "Reviews" ? (
            <AdminReviews />
          ) : activeNav === "Gallery" ? (
            <AdminGallery />
          ) : activeNav === "Finance" ? (
            <FinancePanel
              appointments={allAppointments}
              onSelectAppointment={(appointment) => {
                setSelectedAppointment(appointment);
              }}
            />
          ) : activeNav === "Settings" ? (
            <AdminSettings />
          ) : (
          <>
            {/* Header */}
            <div className="dash-header">
              <button
                className="dash-header__hamburger"
                aria-label="Toggle menu"
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen((v) => !v)}
              >
                ☰
              </button>
              <div>
                <h1 className="dash-header__title">
                  Welcome back,
                  <br />
                  <span className="dash-header__title--blue">Dr. Hammad</span>
                </h1>
                <p className="dash-header__sub">
                  Your practice is performing 12% better than last month.
                </p>
              </div>
              <div className="dash-header__actions">
                <div className="dash-header__avatars">
                  <img
                    src="https://i.pravatar.cc/36?img=11"
                    alt=""
                    className="dash-header__avatar"
                  />
                  <div className="dash-header__avatar-more">+3</div>
                </div>
                <button className="dash-header__bell">🔔</button>
              </div>
            </div>

            {dashboardLoading && (
              <p className="dash-header__sub">Loading live dashboard data...</p>
            )}
            {dashboardError && (
              <p className="dash-header__sub" style={{ color: "#dc2626" }}>
                {dashboardError}
              </p>
            )}
            <div className="dash-live-strip">
              <span className="dash-live-dot" />
              Auto-refreshing every {AUTO_REFRESH_MS / 1000}s
              {lastUpdated && (
                <strong>Last update: {lastUpdated.toLocaleTimeString()}</strong>
              )}
            </div>

            {/* Stat Cards */}
            <div className="dash-stats">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="dash-stat-card"
                  style={{ background: s.bg }}
                >
                  <span className="dash-stat-card__icon">{s.icon}</span>
                  <p className="dash-stat-card__label">{s.label}</p>
                  <p className="dash-stat-card__value">{s.value}</p>
                  <p
                    className="dash-stat-card__sub"
                    style={{ color: s.subColor }}
                  >
                    {s.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* Chart + Appointments Row */}
            <div className="dash-row">
              {/* Chart */}
              <div className="dash-card dash-chart-card">
                <div className="dash-chart-card__header">
                  <div>
                    <h3 className="dash-card__title">Patients per week</h3>
                    <p className="dash-card__sub">
                      Live activity: {activityLabel}
                    </p>
                  </div>
                  <select
                    className="dash-chart__filter"
                    value={chartFilter}
                    onChange={(e) => setChartFilter(e.target.value)}
                  >
                    <option>Last 7 Days</option>
                    <option>Last 14 Days</option>
                    <option>Last Month</option>
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 16, right: 14, left: -16, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient
                        id="patientsGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#1a6fd4"
                          stopOpacity={0.36}
                        />
                        <stop
                          offset="95%"
                          stopColor="#1a6fd4"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="#eef4fb"
                      strokeDasharray="4 8"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "#9aaabb", fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      domain={[0, maxPatients + 1]}
                      tick={{ fontSize: 11, fill: "#9aaabb", fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                      width={32}
                    />
                    <Tooltip
                      cursor={{
                        stroke: "#1a6fd4",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                      contentStyle={{
                        borderRadius: 14,
                        border: "none",
                        fontSize: 12,
                        boxShadow: "0 14px 34px rgba(15, 23, 42, 0.14)",
                      }}
                      labelFormatter={(_label, payload) =>
                        payload?.[0]?.payload?.date || "Selected day"
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="patients"
                      name="Patients"
                      stroke="#1a6fd4"
                      strokeWidth={4}
                      fill="url(#patientsGradient)"
                      activeDot={{
                        r: 7,
                        fill: "#ffffff",
                        stroke: "#1a6fd4",
                        strokeWidth: 4,
                      }}
                      dot={{
                        r: 4,
                        fill: "#1a6fd4",
                        stroke: "#ffffff",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dash-row">
              {/* Demographics */}
              <div className="dash-card dash-demo-card">
                <h3 className="dash-card__title">Patient Demographics</h3>
                <p className="dash-card__sub">
                  Live patient and appointment status mix
                </p>
                <div className="dash-demo-content">
                  <div className="dash-demo-chart">
                    <ResponsiveContainer width="100%" height={170}>
                      <PieChart>
                        <Pie
                          data={patientStatusData}
                          dataKey="value"
                          nameKey="label"
                          innerRadius={52}
                          outerRadius={76}
                          paddingAngle={4}
                        >
                          {patientStatusData.map((entry) => (
                            <Cell key={entry.label} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 14,
                            border: "none",
                            boxShadow: "0 14px 34px rgba(15, 23, 42, 0.14)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="dash-demo-total">
                      <strong>{totalPatientStatuses}</strong>
                      <span>Patients</span>
                    </div>
                  </div>
                  <div className="dash-demo-legend">
                    {patientStatusData.map((item) => (
                      <div className="dash-demo-legend-item" key={item.label}>
                        <span
                          className="dash-demo-legend-dot"
                          style={{ background: item.color }}
                        />
                        {item.label} ({item.value})
                      </div>
                    ))}
                  </div>
                </div>
                <div className="dash-demo-bars">
                  {appointmentStatusData.map((item) => (
                    <div className="dash-demo-bar" key={item.label}>
                      <div className="dash-demo-bar__head">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                      <div className="dash-demo-bar__track">
                        <span
                          style={{
                            width: `${item.percent}%`,
                            background: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Efficiency */}
              <div className="dash-card dash-efficiency-card">
                <h3 className="dash-card__title">Clinic Efficiency</h3>
                <div className="dash-efficiency-list">
                  {efficiency.map(({ label, value, color }) => (
                    <div key={label} className="dash-efficiency-item">
                      <div className="dash-efficiency-item__header">
                        <span className="dash-efficiency-item__label">
                          {label}
                        </span>
                        <span
                          className="dash-efficiency-item__value"
                          style={{ color }}
                        >
                          {value}%
                        </span>
                      </div>
                      <div className="dash-efficiency-item__track">
                        <div
                          className="dash-efficiency-item__fill"
                          style={{ width: `${value}%`, background: color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="dash-card dash-contact-card">
              <div className="dash-appt-card__header">
                <div>
                  <h3 className="dash-card__title">Latest Contact Messages</h3>
                  <p className="dash-card__sub">
                    Live contact requests from the website
                  </p>
                </div>
                <span className="dash-appt-card__count">
                  {latestContactMessages.length}
                </span>
              </div>
              <div className="dash-contact-list">
                {latestContactMessages.length === 0 && (
                  <p className="dash-empty-state">No contact messages yet.</p>
                )}
                {latestContactMessages.map((message) => (
                  <div className="dash-contact-item" key={message.id}>
                    <div>
                      <p className="dash-appt-item__name">{message.name}</p>
                      <p className="dash-appt-item__type">
                        {message.subject || "General Inquiry"}
                      </p>
                    </div>
                    <span
                      className="dash-appt-item__badge"
                      style={
                        message.status === "New"
                          ? { background: "#dbeafe", color: "#1d4ed8" }
                          : { background: "#f1f5f9", color: "#6a7a8a" }
                      }
                    >
                      {message.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dash-card dash-appt-card">
              <h3 className="dash-card__title">Doctors List</h3>
              <div className="dash-appt-list">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.email || doctor.name}
                    className="dash-appt-item"
                  >
                    <img
                      src={
                        doctor.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=1a6fd4&color=fff`
                      }
                      alt={doctor.name}
                      className="dash-appt-item__avatar"
                    />
                    <div className="dash-appt-item__info">
                      <p className="dash-appt-item__name">{doctor.name}</p>
                      <p className="dash-appt-item__type">{doctor.specialty}</p>
                    </div>
                    <span
                      className="dash-appt-item__badge"
                      style={{ background: "#dcfce7", color: "#16a34a" }}
                    >
                      {doctor.status || "Active"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <footer className="dash-footer">
              <p className="dash-footer__copy">
                © 2024 DR. HAMMAD MEDICAL PRACTICE. ALL RIGHTS RESERVED.
              </p>
              <nav className="dash-footer__links">
                {[
                  "PRIVACY POLICY",
                  "TERMS OF SERVICE",
                  "HIPAA COMPLIANCE",
                  "CONTACT SUPPORT",
                ].map((l) => (
                  <a key={l} href="#" className="dash-footer__link">
                    {l}
                  </a>
                ))}
              </nav>
            </footer>
          </>
        )}

        {/* Modal: Appointment Details */}
        {selectedAppointment && (
          <div
            className="dash-modal-overlay"
            onClick={() => setSelectedAppointment(null)}
          >
            <div
              className="dash-modal dash-modal--large"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dash-modal__header">
                <h2>Appointment Details</h2>
                <button
                  className="dash-modal__close"
                  onClick={() => setSelectedAppointment(null)}
                >
                  ✕
                </button>
              </div>
              <div className="dash-modal__content dash-modal__content--details">
                <div className="dash-appointment-details">
                  <div className="dash-detail-row">
                    <div className="dash-detail-field">
                      <label>Patient Name</label>
                      <p>{selectedAppointment.name}</p>
                    </div>
                    <div className="dash-detail-field">
                      <label>Phone</label>
                      <p>{selectedAppointment.phone}</p>
                    </div>
                  </div>
                  <div className="dash-detail-row">
                    <div className="dash-detail-field">
                      <label>Email</label>
                      <p>{selectedAppointment.email}</p>
                    </div>
                    <div className="dash-detail-field">
                      <label>Status</label>
                      <p
                        style={{
                          color:
                            selectedAppointment.status === "completed"
                              ? "#16a34a"
                              : selectedAppointment.status === "confirmed"
                                ? "#1d4ed8"
                                : "#f59e0b",
                          fontWeight: "600",
                        }}
                      >
                        {selectedAppointment.status?.toUpperCase() ||
                          "CONFIRMED"}
                      </p>
                    </div>
                  </div>
                  <div className="dash-detail-row">
                    <div className="dash-detail-field">
                      <label>Date</label>
                      <p>{selectedAppointment.date}</p>
                    </div>
                    <div className="dash-detail-field">
                      <label>Time</label>
                      <p>{selectedAppointment.time}</p>
                    </div>
                  </div>
                  <div className="dash-detail-row">
                    <div className="dash-detail-field">
                      <label>Booked At</label>
                      <p>{formatBookedAt(selectedAppointment.createdAt)}</p>
                    </div>
                    <div className="dash-detail-field">
                      <label>Payment</label>
                      <p>
                        {selectedAppointment.paymentStatus?.toUpperCase() ||
                          "UNPAID"}
                        {selectedAppointment.paidAt
                          ? ` - ${formatBookedAt(selectedAppointment.paidAt)}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="dash-detail-row">
                    <div className="dash-detail-field">
                      <label>Doctor Fee</label>
                      <div className="dash-fee-control">
                        <input
                          type="number"
                          min="0"
                          value={selectedFeeAmount}
                          onChange={(event) =>
                            setSelectedFeeAmount(event.target.value)
                          }
                        />
                        <span>PKR</span>
                      </div>
                    </div>
                    <div className="dash-detail-field">
                      <label>Quick Actions</label>
                      <div className="dash-status-actions">
                        <button
                          className="dash-btn-secondary"
                          onClick={() =>
                            updateAppointment(selectedAppointment.id, {
                              status: "confirmed",
                            })
                          }
                        >
                          Confirmed
                        </button>
                        <button
                          className="dash-btn-primary"
                          onClick={() =>
                            updateAppointment(selectedAppointment.id, {
                              status: "completed",
                              paymentStatus: "paid",
                              feeAmount: selectedFeeAmount,
                            })
                          }
                        >
                          Completed & Paid
                        </button>
                        <button
                          className="dash-btn-danger"
                          onClick={() =>
                            updateAppointment(selectedAppointment.id, {
                              status: "cancelled",
                            })
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                  {selectedAppointment.notes && (
                    <div className="dash-detail-row">
                      <div className="dash-detail-field dash-detail-field--full">
                        <label>Notes</label>
                        <p>{selectedAppointment.notes}</p>
                      </div>
                    </div>
                  )}
                  <div className="dash-detail-row">
                    <div className="dash-detail-field dash-detail-field--full">
                      <label>Appointment ID</label>
                      <p style={{ fontSize: "12px", color: "#6a7a8a" }}>
                        {selectedAppointment.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="dash-modal__footer">
                <button
                  className="dash-btn-secondary"
                  onClick={() => setSelectedAppointment(null)}
                >
                  Back
                </button>
                <button
                  className="dash-btn-primary"
                  onClick={() =>
                    updateAppointment(selectedAppointment.id, {
                      paymentStatus:
                        selectedAppointment.paymentStatus === "paid"
                          ? "unpaid"
                          : "paid",
                      feeAmount: selectedFeeAmount,
                    })
                  }
                >
                  {selectedAppointment.paymentStatus === "paid"
                    ? "Mark Unpaid"
                    : "Submit Fee"}
                </button>
              </div>
            </div>
          </div>
        )}
        </Suspense>
      </main>
    </div>
  );
}
