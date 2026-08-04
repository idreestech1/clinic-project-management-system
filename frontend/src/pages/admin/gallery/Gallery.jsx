import { useEffect, useMemo, useState } from "react";
import { api } from "../../../api/client";
import { useToast } from "../../../components/toast/useToast";
import AdminModal, { ConfirmDialog } from "../shared/AdminModal";
import { EmptyState, SkeletonCards } from "../shared/AdminUi";
import "../shared/AdminSection.css";
import "./Gallery.css";

const TAG_OPTIONS = ["Clinic Interior", "Front Office", "Equipment", "Staff", "Patient Experience", "Community"];
const STATUS_OPTIONS = ["Active", "Pending", "Draft", "Hidden"];

const emptyForm = { title: "", tag: TAG_OPTIONS[0], image: "", status: "Pending" };

export default function AdminGallery() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const data = await api.get("/gallery");
      setItems(data.gallery || []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load gallery.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const liveStats = useMemo(
    () => [
      { label: "Total Assets", value: items.length, note: "Images and clinic media" },
      { label: "Website Visible", value: items.filter((item) => item.status === "Active").length, note: "Published publicly" },
      { label: "Pending Review", value: items.filter((item) => item.status === "Pending").length, note: "Need approval" },
      { label: "Hidden / Draft", value: items.filter((item) => ["Hidden", "Draft"].includes(item.status)).length, note: "Not shown publicly" },
    ],
    [items],
  );

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      tag: item.tag || TAG_OPTIONS[0],
      image: item.image || "",
      status: item.status || "Pending",
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

    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    if (!form.image.trim() || !/^https?:\/\//i.test(form.image.trim())) {
      setFormError("Please provide a valid image URL (starting with http:// or https://).");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editingId) {
        const { item } = await api.put(`/gallery/${editingId}`, form);
        setItems((current) => current.map((existing) => (existing.id === editingId ? item : existing)));
        toast.success(`"${item.title}" updated.`);
      } else {
        const { item } = await api.post("/gallery", form);
        setItems((current) => [item, ...current]);
        toast.success(`"${item.title}" added to the gallery.`);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err.message || "Unable to save image.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item) => {
    const nextStatus = item.status === "Active" ? "Hidden" : "Active";
    try {
      const { item: updated } = await api.put(`/gallery/${item.id}`, { status: nextStatus });
      setItems((current) => current.map((existing) => (existing.id === item.id ? updated : existing)));
      toast.success(`"${item.title}" is now ${nextStatus}.`);
    } catch (err) {
      toast.error(err.message || "Unable to update status.");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/gallery/${pendingDelete.id}`);
      setItems((current) => current.filter((existing) => existing.id !== pendingDelete.id));
      toast.success(`"${pendingDelete.title}" deleted.`);
      setPendingDelete(null);
    } catch (err) {
      toast.error(err.message || "Unable to delete image.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="admin-section admin-gallery">
      <header className="admin-section__header">
        <div>
          <p className="admin-section__eyebrow">Media Library</p>
          <h1 className="admin-section__title">Gallery Management</h1>
          <p className="admin-section__sub">
            Curate the images used across the website, approve new clinic photos, and keep public visuals
            trustworthy and professional.
          </p>
        </div>
        <div className="admin-section__actions">
          <button className="admin-btn admin-btn--primary" onClick={openCreateModal}>
            + Add Image
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

      {!loading && items.length === 0 ? (
        <article className="admin-card">
          <EmptyState
            icon="🖼"
            title="No images yet"
            message='Click "Add Image" and paste a hosted image URL to publish your first clinic photo.'
          />
        </article>
      ) : (
        <div className="admin-gallery__grid">
          {items.map((item) => (
            <article className="admin-gallery__item" key={item.id}>
              <img src={item.image} alt={item.title} loading="lazy" />
              <div className="admin-gallery__item-body">
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.tag}</p>
                </div>
                <span className={`admin-status admin-status--${item.status.toLowerCase()}`}>{item.status}</span>
              </div>
              <div className="admin-gallery__item-actions">
                <button type="button" onClick={() => window.open(item.image, "_blank", "noopener")}>
                  Preview
                </button>
                <button type="button" onClick={() => openEditModal(item)}>
                  Edit
                </button>
                <button type="button" onClick={() => togglePublish(item)}>
                  {item.status === "Active" ? "Hide" : "Publish"}
                </button>
                <button type="button" onClick={() => setPendingDelete(item)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <AdminModal
          title={editingId ? "Edit Image" : "Add Image"}
          subtitle="Paste a hosted image URL — recommended size 1600 x 1000px."
          onClose={closeModal}
          footer={
            <>
              <button type="button" className="admin-btn admin-btn--ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button type="submit" form="gallery-form" className="admin-btn admin-btn--primary" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save Changes" : "Add Image"}
              </button>
            </>
          }
        >
          <form
            id="gallery-form"
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {formError && <p className="admin-form-error">{formError}</p>}

            <div className="admin-field">
              <label>Title</label>
              <input
                className="admin-input"
                value={form.title}
                onChange={(event) => setForm((f) => ({ ...f, title: event.target.value }))}
                placeholder="e.g. Consultation Room"
              />
            </div>

            <div className="admin-field">
              <label>Image URL</label>
              <input
                className="admin-input"
                value={form.image}
                onChange={(event) => setForm((f) => ({ ...f, image: event.target.value }))}
                placeholder="https://…"
              />
              {form.image && /^https?:\/\//i.test(form.image) && (
                <img
                  src={form.image}
                  alt="Preview"
                  style={{ marginTop: 8, borderRadius: 12, maxHeight: 160, objectFit: "cover", width: "100%" }}
                />
              )}
            </div>

            <div className="admin-form-row">
              <div className="admin-field">
                <label>Category</label>
                <select
                  className="admin-select"
                  value={form.tag}
                  onChange={(event) => setForm((f) => ({ ...f, tag: event.target.value }))}
                >
                  {TAG_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
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
          </form>
        </AdminModal>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete image?"
          message={`This will permanently remove "${pendingDelete.title}" from the gallery.`}
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
