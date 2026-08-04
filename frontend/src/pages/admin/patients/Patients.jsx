import { useEffect, useMemo, useState } from "react";
import { api } from "../../../api/client";
import { useToast } from "../../../components/toast/useToast";
import AdminModal, { ConfirmDialog } from "../shared/AdminModal";
import { exportCsv } from "../../../utils/csvExport";
import "../shared/AdminSection.css";
import "./Patients.css";

const PATIENT_CSV_COLUMNS = [
  { label: "Name", value: "name" },
  { label: "Email", value: "email" },
  { label: "Phone", value: (row) => row.phone || "" },
  { label: "Patient ID", value: "id" },
  { label: "Status", value: "status" },
  { label: "Last Visit", value: "lastVisit" },
  { label: "Joined", value: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "") },
];

const PAGE_SIZE = 8;
const STATUS_OPTIONS = ["Active", "Pending", "Inactive"];
const emptyForm = { name: "", email: "", phone: "", status: "Active" };

const getStatusClass = (status) => {
  if (status === "Pending") return "status-pending";
  if (status === "Inactive") return "status-inactive";
  return "status-active";
};

export default function PatientManagement() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewingPatient, setViewingPatient] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [patientsData, appointmentsData] = await Promise.all([
        api.get("/patients"),
        api.get("/appointments"),
      ]);
      setPatients(patientsData.patients || []);
      setAppointments(appointmentsData.appointments || []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load patients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((patient) =>
      [patient.name, patient.email, patient.id].some((value) =>
        String(value || "").toLowerCase().includes(term),
      ),
    );
  }, [patients, search]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedPatients = filteredPatients.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPatients = patients.length;
  const newThisMonth = patients.filter((patient) => {
    if (!patient.createdAt) return false;
    const created = new Date(patient.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const todayKey = new Date().toISOString().slice(0, 10);
  const todaysAppointments = appointments
    .filter((appointment) => appointment.date === todayKey)
    .slice(0, 5);

  const statusBreakdown = useMemo(() => {
    const counts = { Active: 0, Pending: 0, Inactive: 0 };
    patients.forEach((patient) => {
      counts[patient.status] = (counts[patient.status] || 0) + 1;
    });
    const total = patients.length || 1;
    return [
      { label: "Active", percent: Math.round((counts.Active / total) * 100), count: counts.Active, color: "#16a34a" },
      { label: "Pending", percent: Math.round((counts.Pending / total) * 100), count: counts.Pending, color: "#d97706" },
      { label: "Inactive", percent: Math.round((counts.Inactive / total) * 100), count: counts.Inactive, color: "#94a3b8" },
    ];
  }, [patients]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (patient) => {
    setEditingId(patient._id || patient.id);
    setForm({
      name: patient.name || "",
      email: patient.email || "",
      phone: patient.phone || "",
      status: patient.status || "Active",
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      setFormError("Name and email are required.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editingId) {
        const { patient } = await api.put(`/patients/${editingId}`, form);
        setPatients((current) =>
          current.map((item) => ((item._id || item.id) === editingId ? { ...item, ...patient } : item)),
        );
        toast.success(`"${patient.name}" updated.`);
      } else {
        const { patient } = await api.post("/patients", form);
        setPatients((current) => [patient, ...current]);
        toast.success(`"${patient.name}" added as a new patient.`);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err.message || "Unable to save patient.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete._id || pendingDelete.id;
    setDeleting(true);
    try {
      await api.delete(`/patients/${id}`);
      setPatients((current) => current.filter((item) => (item._id || item.id) !== id));
      toast.success(`"${pendingDelete.name}" removed.`);
      setPendingDelete(null);
    } catch (err) {
      toast.error(err.message || "Unable to delete patient.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="pm-root">
      <main className="pm-body">
        <div className="pm-page-header">
          <div>
            <h1 className="pm-page-title">Patient Management</h1>
            <p className="pm-page-sub">Maintain and organize your patient ecosystem with precision.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="admin-btn admin-btn--ghost"
              onClick={() => exportCsv("patients.csv", filteredPatients, PATIENT_CSV_COLUMNS)}
              disabled={!filteredPatients.length}
            >
              Export CSV
            </button>
            <button className="pm-add-btn" onClick={openCreateModal}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Add New Patient
            </button>
          </div>
        </div>

        <div className="pm-stats">
          <div className="pm-stat-card">
            <div>
              <p className="pm-stat-label">TOTAL PATIENTS</p>
              <p className="pm-stat-value">{totalPatients}</p>
              <p className="pm-stat-note green">{loading ? "Loading..." : "Live from database"}</p>
            </div>
            <div className="pm-stat-icon blue-bg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className="pm-stat-card">
            <div>
              <p className="pm-stat-label">NEW THIS MONTH</p>
              <p className="pm-stat-value">{newThisMonth}</p>
              <p className="pm-stat-note gray">Registered this month</p>
            </div>
            <div className="pm-stat-icon green-bg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
          </div>
          <div className="pm-stat-card">
            <div>
              <p className="pm-stat-label">MATCHING SEARCH</p>
              <p className="pm-stat-value">{filteredPatients.length}</p>
              <p className="pm-stat-note gray">{search ? `For "${search}"` : "All patients shown"}</p>
            </div>
            <div className="pm-stat-icon orange-bg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </div>
          </div>
        </div>

        <div className="pm-table-card">
          <div className="pm-toolbar">
            {error && <span className="pm-pagination-info">{error}</span>}
            <div className="pm-table-search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                placeholder="Search by name, ID or email..."
                className="pm-table-search-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <table className="pm-table">
            <thead>
              <tr>
                <th>PATIENT NAME</th>
                <th>PATIENT ID</th>
                <th>LAST VISIT</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pagedPatients.map((p) => (
                <tr key={p._id || p.id}>
                  <td>
                    <div className="pm-patient-cell">
                      <img
                        src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1a6fd4&color=fff`}
                        alt={p.name}
                        className="pm-patient-avatar"
                      />
                      <div>
                        <p className="pm-patient-name">{p.name}</p>
                        <p className="pm-patient-email">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="pm-id-cell">{p.id}</td>
                  <td>
                    <p className="pm-visit-date">{p.lastVisit}</p>
                    <p className="pm-visit-time">{p.visitTime}</p>
                  </td>
                  <td>
                    <span className={`pm-status ${getStatusClass(p.status)}`}>
                      <span className="pm-status-dot" />
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div className="pm-actions">
                      <button className="pm-action-view" title="View" onClick={() => setViewingPatient(p)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="pm-action-edit" title="Edit" onClick={() => openEditModal(p)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="pm-action-delete" title="Delete" onClick={() => setPendingDelete(p)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && pagedPatients.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "32px 0", color: "#8a9aaa" }}>
                    {search ? "No patients match your search." : "No patients yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="pm-pagination">
            <span className="pm-pagination-info">
              Showing {pagedPatients.length ? (safePage - 1) * PAGE_SIZE + 1 : 0}
              –{(safePage - 1) * PAGE_SIZE + pagedPatients.length} of {filteredPatients.length} patients
            </span>
            <div className="pm-pagination-controls">
              <button
                className="pm-page-btn"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .slice(0, 5)
                .map((n) => (
                  <button
                    key={n}
                    className={`pm-page-num ${safePage === n ? "active" : ""}`}
                    onClick={() => setCurrentPage(n)}
                  >
                    {n}
                  </button>
                ))}
              <button
                className="pm-page-btn"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="pm-bottom-row">
          <div className="pm-appt-card">
            <div className="pm-appt-header">
              <h2 className="pm-section-title">Today's Appointments</h2>
            </div>
            <div className="pm-appt-list">
              {todaysAppointments.length === 0 && (
                <p style={{ color: "#8a9aaa", fontSize: "0.85rem" }}>No appointments booked for today.</p>
              )}
              {todaysAppointments.map((a) => {
                const [hour, minute] = String(a.time || "").split(":");
                return (
                  <div className="pm-appt-row" key={a.id}>
                    <div className="pm-appt-time">
                      <span className="pm-appt-hour">{hour || "--"}:{minute || "--"}</span>
                    </div>
                    <div className="pm-appt-divider" />
                    <div className="pm-appt-info">
                      <p className="pm-appt-name">{a.name}</p>
                      <p className="pm-appt-type">{a.notes || "General consultation"}</p>
                    </div>
                    <span className={`pm-appt-status appt-${a.status}`}>{a.status}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pm-seg-card">
            <h2 className="pm-section-title">Patient Status Breakdown</h2>
            <div className="pm-seg-list">
              {statusBreakdown.map((s) => (
                <div className="pm-seg-item" key={s.label}>
                  <div className="pm-seg-row">
                    <span className="pm-seg-label">{s.label} ({s.count})</span>
                    <span className="pm-seg-pct">{s.percent}%</span>
                  </div>
                  <div className="pm-seg-bar-bg">
                    <div className="pm-seg-bar-fill" style={{ width: `${s.percent}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {modalOpen && (
        <AdminModal
          title={editingId ? "Edit Patient" : "Add New Patient"}
          subtitle={editingId ? "Update this patient's record." : "Register a walk-in or manually-added patient."}
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="admin-btn admin-btn--ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button type="submit" form="patient-form" className="admin-btn admin-btn--primary" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save Changes" : "Add Patient"}
              </button>
            </>
          }
        >
          <form
            id="patient-form"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {formError && <p className="admin-form-error">{formError}</p>}
            <div className="admin-field">
              <label>Full Name</label>
              <input
                className="admin-input"
                value={form.name}
                onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
              />
            </div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label>Email</label>
                <input
                  type="email"
                  className="admin-input"
                  value={form.email}
                  disabled={Boolean(editingId)}
                  onChange={(event) => setForm((f) => ({ ...f, email: event.target.value }))}
                />
              </div>
              <div className="admin-field">
                <label>Phone</label>
                <input
                  className="admin-input"
                  value={form.phone}
                  onChange={(event) => setForm((f) => ({ ...f, phone: event.target.value }))}
                />
              </div>
            </div>
            <div className="admin-field">
              <label>Status</label>
              <select
                className="admin-select"
                value={form.status}
                onChange={(event) => setForm((f) => ({ ...f, status: event.target.value }))}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </form>
        </AdminModal>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Remove patient?"
          message={`This will permanently remove "${pendingDelete.name}" from your patient records.`}
          confirmLabel="Delete"
          danger
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {viewingPatient && (
        <AdminModal
          title={viewingPatient.name}
          subtitle={viewingPatient.email}
          onClose={() => setViewingPatient(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.9rem", color: "#4a5a6a" }}>
            <p><strong>Patient ID:</strong> {viewingPatient.id}</p>
            <p><strong>Phone:</strong> {viewingPatient.phone || "Not provided"}</p>
            <p><strong>Status:</strong> {viewingPatient.status}</p>
            <p><strong>Last Visit:</strong> {viewingPatient.lastVisit}</p>
            <p><strong>Joined:</strong> {viewingPatient.createdAt ? new Date(viewingPatient.createdAt).toLocaleDateString() : "—"}</p>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
