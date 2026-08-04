import { useEffect, useState } from "react";
import { api } from "../../../api/client";
import { useToast } from "../../../components/toast/useToast";
import "../shared/AdminSection.css";
import "./Settings.css";

const DEFAULT_SETTINGS = {
  clinicName: "Dr. Hammad Medical Practice",
  adminEmail: "admin@gmail.com",
  openingTime: "04:00 PM",
  closingTime: "08:00 PM",
  appointmentDuration: "10 minutes",
  bookingDays: "Mon - Fri",
  advanceBooking: "30 days",
  autoConfirmation: true,
  notifyNewAppointment: true,
  notifyNewReview: true,
  notifyDailySummary: true,
  notifyGalleryApproved: false,
};

export default function AdminSettings() {
  const toast = useToast();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await api.get("/settings");
        const merged = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
        setSettings(merged);
        setInitialSettings(merged);
      } catch (err) {
        toast.error(err.message || "Unable to load settings.");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setSettings(initialSettings);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await api.put("/settings", settings);
      const merged = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
      setSettings(merged);
      setInitialSettings(merged);
      toast.success("Settings saved successfully.");
    } catch (err) {
      toast.error(err.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const settingsStats = [
    { label: "Profile", value: settings.clinicName ? "Complete" : "Incomplete", note: "Clinic details" },
    { label: "Booking Window", value: settings.advanceBooking, note: "Advance booking limit" },
    {
      label: "Active Alerts",
      value: [
        settings.notifyNewAppointment,
        settings.notifyNewReview,
        settings.notifyDailySummary,
        settings.notifyGalleryApproved,
      ].filter(Boolean).length,
      note: "Notification rules on",
    },
    { label: "Auto Confirmation", value: settings.autoConfirmation ? "On" : "Off", note: "New appointments" },
  ];

  const notificationRules = [
    { key: "notifyNewAppointment", label: "New appointment request" },
    { key: "notifyNewReview", label: "Patient review submitted" },
    { key: "notifyDailySummary", label: "Daily clinic summary" },
    { key: "notifyGalleryApproved", label: "Gallery asset approved" },
  ];

  return (
    <section className="admin-section admin-settings">
      <header className="admin-section__header">
        <div>
          <p className="admin-section__eyebrow">Portal Control</p>
          <h1 className="admin-section__title">Admin Settings</h1>
          <p className="admin-section__sub">
            Manage clinic profile details, booking rules, and notification preferences for the admin portal.
          </p>
        </div>
        <div className="admin-section__actions">
          <button className="admin-btn admin-btn--ghost" onClick={handleReset} disabled={!isDirty || saving}>
            Reset Changes
          </button>
          <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </header>

      <div className="admin-grid admin-grid--4">
        {settingsStats.map((item) => (
          <article className="admin-card" key={item.label}>
            <p className="admin-card__label">{item.label}</p>
            <p className="admin-card__value">{loading ? "…" : item.value}</p>
            <p className="admin-card__note">{item.note}</p>
          </article>
        ))}
      </div>

      <div className="admin-grid admin-grid--2">
        <article className="admin-card admin-settings__panel">
          <h2 className="admin-panel-title">Clinic Profile</h2>
          <p className="admin-panel-sub">These details can appear on public pages and appointment confirmations.</p>
          <div className="admin-settings__form">
            <div className="admin-field">
              <label>Clinic Name</label>
              <input
                className="admin-input"
                value={settings.clinicName}
                onChange={(e) => handleChange("clinicName", e.target.value)}
              />
            </div>
            <div className="admin-field">
              <label>Admin Email</label>
              <input
                className="admin-input"
                value={settings.adminEmail}
                onChange={(e) => handleChange("adminEmail", e.target.value)}
              />
            </div>
            <div className="admin-settings__form-row">
              <div className="admin-field">
                <label>Opening Time</label>
                <input
                  className="admin-input"
                  value={settings.openingTime}
                  onChange={(e) => handleChange("openingTime", e.target.value)}
                />
              </div>
              <div className="admin-field">
                <label>Closing Time</label>
                <input
                  className="admin-input"
                  value={settings.closingTime}
                  onChange={(e) => handleChange("closingTime", e.target.value)}
                />
              </div>
            </div>
          </div>
        </article>

        <article className="admin-card admin-settings__panel">
          <h2 className="admin-panel-title">Appointment Rules</h2>
          <p className="admin-panel-sub">Control patient booking behavior from the public appointment page.</p>
          <div className="admin-settings__form">
            <div className="admin-settings__form-row">
              <div className="admin-field">
                <label>Appointment Duration</label>
                <input
                  className="admin-input"
                  value={settings.appointmentDuration}
                  onChange={(e) => handleChange("appointmentDuration", e.target.value)}
                />
              </div>
              <div className="admin-field">
                <label>Booking Days</label>
                <input
                  className="admin-input"
                  value={settings.bookingDays}
                  onChange={(e) => handleChange("bookingDays", e.target.value)}
                />
              </div>
            </div>
            <div className="admin-field">
              <label>Advance Booking Window</label>
              <input
                className="admin-input"
                value={settings.advanceBooking}
                onChange={(e) => handleChange("advanceBooking", e.target.value)}
              />
            </div>
            <label className="admin-settings__toggle">
              <span>Auto confirmation for new bookings</span>
              <input
                type="checkbox"
                checked={Boolean(settings.autoConfirmation)}
                onChange={(e) => handleChange("autoConfirmation", e.target.checked)}
              />
            </label>
          </div>
        </article>
      </div>

      <div className="admin-grid admin-grid--2">
        <article className="admin-card admin-settings__panel">
          <h2 className="admin-panel-title">Notification Rules</h2>
          <p className="admin-panel-sub">Choose which admin events should send an alert.</p>
          <div className="admin-settings__toggles">
            {notificationRules.map((rule) => (
              <label className="admin-settings__toggle" key={rule.key}>
                <span>{rule.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings[rule.key])}
                  onChange={(e) => handleChange(rule.key, e.target.checked)}
                />
              </label>
            ))}
          </div>
        </article>

        <article className="admin-card admin-settings__panel admin-settings__security">
          <h2 className="admin-panel-title">Security</h2>
          <p className="admin-panel-sub">Keep admin-only controls protected.</p>
          <div className="admin-settings__security-box">
            <div>
              <strong>Admin login</strong>
              <p>Managed via environment credentials</p>
            </div>
            <button
              className="admin-btn admin-btn--ghost"
              onClick={() =>
                toast.info("Password changes are managed by your developer through environment configuration.")
              }
            >
              Change Password
            </button>
          </div>
          <div className="admin-settings__security-box">
            <div>
              <strong>Two-factor authentication</strong>
              <p>Not yet available for this portal</p>
            </div>
            <button
              className="admin-btn admin-btn--primary"
              onClick={() => toast.info("Two-factor authentication isn't set up yet — ask your developer to enable it.")}
            >
              Enable 2FA
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
