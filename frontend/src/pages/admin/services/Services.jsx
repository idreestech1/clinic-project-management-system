import { useEffect, useMemo, useState } from "react";
import { api } from "../../../api/client";
import { useToast } from "../../../components/toast/useToast";
import AdminModal, { ConfirmDialog } from "../shared/AdminModal";
import { EmptyState, SkeletonCards, SkeletonRows } from "../shared/AdminUi";
import { exportCsv } from "../../../utils/csvExport";
import "../shared/AdminSection.css";
import "./Services.css";

const CATEGORY_OPTIONS = ["Primary Care", "Diagnostics", "Wellness", "Chronic Care"];
const DURATION_OPTIONS = ["10 min", "20 min", "30 min", "45 min", "60 min"];
const STATUS_OPTIONS = ["Live", "Draft", "Hidden"];

const emptyForm = {
  name: "",
  category: CATEGORY_OPTIONS[0],
  duration: DURATION_OPTIONS[0],
  price: "",
  description: "",
  status: "Live",
  featured: false,
};

const SERVICE_CSV_COLUMNS = [
  { label: "Name", value: "name" },
  { label: "Category", value: "category" },
  { label: "Duration", value: "duration" },
  { label: "Price", value: "price" },
  { label: "Status", value: "status" },
  { label: "Featured", value: (row) => (row.featured ? "Yes" : "No") },
];

export default function AdminServices() {
  const toast = useToast();
  const [serviceList, setServiceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await api.get("/services");
      setServiceList(data.services || []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const liveStats = useMemo(
    () => [
      {
        label: "Active Services",
        value: serviceList.filter((service) => service.status === "Live").length,
        note: "Visible on website",
      },
      { label: "Total Services", value: serviceList.length, note: "In the catalog" },
      {
        label: "Draft / Hidden",
        value: serviceList.filter((service) => service.status !== "Live").length,
        note: "Not visible publicly",
      },
      {
        label: "Featured",
        value: serviceList.filter((service) => service.featured).length,
        note: "Shown on home page",
      },
    ],
    [serviceList],
  );

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingId(service.id);
    setForm({
      name: service.name || "",
      category: service.category || CATEGORY_OPTIONS[0],
      duration: service.duration || DURATION_OPTIONS[0],
      price: service.price || "",
      description: service.description || "",
      status: service.status || "Live",
      featured: Boolean(service.featured),
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

    if (!form.name.trim()) {
      setFormError("Service name is required.");
      return;
    }

    if (!form.price.trim()) {
      setFormError("Fee is required, e.g. $60.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editingId) {
        const { service } = await api.put(`/services/${editingId}`, form);
        setServiceList((current) => current.map((item) => (item.id === editingId ? service : item)));
        toast.success(`"${service.name}" updated.`);
      } else {
        const { service } = await api.post("/services", form);
        setServiceList((current) => [service, ...current]);
        toast.success(`"${service.name}" added to the catalog.`);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err.message || "Unable to save service.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (service) => {
    const nextStatus = service.status === "Live" ? "Hidden" : "Live";
    try {
      const { service: updated } = await api.put(`/services/${service.id}`, { status: nextStatus });
      setServiceList((current) => current.map((item) => (item.id === service.id ? updated : item)));
      toast.success(`"${service.name}" is now ${nextStatus}.`);
    } catch (err) {
      toast.error(err.message || "Unable to update status.");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/services/${pendingDelete.id}`);
      setServiceList((current) => current.filter((item) => item.id !== pendingDelete.id));
      toast.success(`"${pendingDelete.name}" deleted.`);
      setPendingDelete(null);
    } catch (err) {
      toast.error(err.message || "Unable to delete service.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="admin-section admin-services">
      <header className="admin-section__header">
        <div>
          <p className="admin-section__eyebrow">Service Catalog</p>
          <h1 className="admin-section__title">Manage Clinic Services</h1>
          <p className="admin-section__sub">
            Control which medical services appear on the public website, update pricing, and keep appointment
            durations aligned with clinic capacity.
          </p>
        </div>
        <div className="admin-section__actions">
          <button
            className="admin-btn admin-btn--ghost"
            onClick={() => exportCsv("services.csv", serviceList, SERVICE_CSV_COLUMNS)}
            disabled={!serviceList.length}
          >
            Export List
          </button>
          <button className="admin-btn admin-btn--primary" onClick={openCreateModal}>
            + Add Service
          </button>
        </div>
      </header>

      {error && <p className="admin-form-error">{error}</p>}

      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="admin-grid admin-grid--4">
          {liveStats.map((item) => (
            <article className="admin-card" key={item.label}>
              <p className="admin-card__label">{item.label}</p>
              <p className="admin-card__value">{item.value}</p>
              <p className="admin-card__note">{item.note}</p>
            </article>
          ))}
        </div>
      )}

      <article className="admin-card">
        <h2 className="admin-panel-title">Service Directory</h2>
        <p className="admin-panel-sub">
          Review active, draft, and hidden services before publishing website updates.
        </p>

        {loading ? (
          <SkeletonRows count={4} />
        ) : serviceList.length === 0 ? (
          <EmptyState
            icon="➕"
            title="No services yet"
            message='Click "Add Service" to publish your first service to the website.'
          />
        ) : (
          <div className="admin-table-wrap admin-services__table">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {serviceList.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <strong>{service.name}</strong>
                      {service.featured && (
                        <span className="admin-status admin-status--live" style={{ marginLeft: 8 }}>
                          Featured
                        </span>
                      )}
                    </td>
                    <td>{service.category}</td>
                    <td>{service.duration}</td>
                    <td>{service.price}</td>
                    <td>
                      <span className={`admin-status admin-status--${service.status.toLowerCase()}`}>
                        {service.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-inline-actions">
                        <button className="admin-icon-btn" title="Edit" onClick={() => openEditModal(service)}>
                          ✎
                        </button>
                        <button
                          className="admin-icon-btn"
                          title={service.status === "Live" ? "Hide" : "Publish"}
                          onClick={() => toggleStatus(service)}
                        >
                          {service.status === "Live" ? "🙈" : "👁"}
                        </button>
                        <button
                          className="admin-icon-btn admin-icon-btn--danger"
                          title="Delete"
                          onClick={() => setPendingDelete(service)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {modalOpen && (
        <AdminModal
          title={editingId ? "Edit Service" : "Add Service"}
          subtitle="These details control what patients see on the public website."
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="admin-btn admin-btn--ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button type="submit" form="service-form" className="admin-btn admin-btn--primary" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save Changes" : "Add Service"}
              </button>
            </>
          }
        >
          <form
            id="service-form"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {formError && <p className="admin-form-error">{formError}</p>}

            <div className="admin-field">
              <label>Service Name</label>
              <input
                className="admin-input"
                value={form.name}
                onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
                placeholder="e.g. General Consultation"
              />
            </div>

            <div className="admin-form-row">
              <div className="admin-field">
                <label>Category</label>
                <select
                  className="admin-select"
                  value={form.category}
                  onChange={(event) => setForm((f) => ({ ...f, category: event.target.value }))}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="admin-field">
                <label>Duration</label>
                <select
                  className="admin-select"
                  value={form.duration}
                  onChange={(event) => setForm((f) => ({ ...f, duration: event.target.value }))}
                >
                  {DURATION_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-field">
                <label>Fee</label>
                <input
                  className="admin-input"
                  value={form.price}
                  onChange={(event) => setForm((f) => ({ ...f, price: event.target.value }))}
                  placeholder="e.g. $60"
                />
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
            </div>

            <div className="admin-field">
              <label>Description</label>
              <textarea
                className="admin-textarea"
                value={form.description}
                onChange={(event) => setForm((f) => ({ ...f, description: event.target.value }))}
                placeholder="What does this service include?"
              />
            </div>

            <label className="admin-checkbox-field">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => setForm((f) => ({ ...f, featured: event.target.checked }))}
              />
              Feature on home page
            </label>
          </form>
        </AdminModal>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete service?"
          message={`This will permanently remove "${pendingDelete.name}" from the catalog and the public website.`}
          confirmLabel="Delete"
          danger
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </section>
  );
}
