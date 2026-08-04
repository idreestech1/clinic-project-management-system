import { useEffect, useMemo, useState } from "react";
import { api } from "../../../api/client";
import { useToast } from "../../../components/toast/useToast";
import { ConfirmDialog } from "../shared/AdminModal";
import "../shared/AdminSection.css";
import "./Reviews.css";

export default function AdminReviews() {
  const toast = useToast();
  const [reviewList, setReviewList] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [responseText, setResponseText] = useState(
    "Thank you for trusting Dr. Hammad and our clinical team. We appreciate your feedback and are glad your visit was helpful.",
  );

  const copyToClipboard = async (text, successMessage) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch {
      toast.error("Couldn't copy — your browser may be blocking clipboard access.");
    }
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      // Get all reviews (not just approved ones for admin view)
      const data = await api.get("/reviews");
      const allReviews = data.reviews || [];

      // Sort by pending first, then by date
      const sorted = allReviews
        .map((review) => ({
          ...review,
          patient: review.name,
          rating: review.stars,
          service: review.category || "Consultation",
        }))
        .sort((a, b) => {
          if (a.status === "Pending" && b.status !== "Pending") return -1;
          if (a.status !== "Pending" && b.status === "Pending") return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

      setReviewList(sorted);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleApprove = async (reviewId) => {
    try {
      setActionLoading(reviewId);
      await api.put(`/reviews/${reviewId}`, { status: "Approved" });
      setReviewList((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: "Approved" } : r)),
      );
      toast.success("Review approved and published.");
    } catch (err) {
      toast.error(err.message || "Unable to approve review.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reviewId) => {
    try {
      setActionLoading(reviewId);
      await api.put(`/reviews/${reviewId}`, { status: "Hidden" });
      setReviewList((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: "Hidden" } : r)),
      );
      toast.success("Review hidden from the public site.");
    } catch (err) {
      toast.error(err.message || "Unable to reject review.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId) => {
    setPendingDeleteId(reviewId);
  };

  const confirmDeleteReview = async () => {
    const reviewId = pendingDeleteId;
    if (!reviewId) return;
    try {
      setActionLoading(reviewId);
      await api.delete(`/reviews/${reviewId}`);
      setReviewList((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success("Review deleted.");
    } catch (err) {
      toast.error(err.message || "Unable to delete review.");
    } finally {
      setActionLoading(null);
      setPendingDeleteId(null);
    }
  };

  const liveStats = useMemo(() => {
    const avg = reviewList.length
      ? (
          reviewList.reduce(
            (sum, review) => sum + Number(review.rating || 0),
            0,
          ) / reviewList.length
        ).toFixed(1)
      : "0.0";
    const pending = reviewList.filter(
      (review) => review.status === "Pending",
    ).length;
    const approved = reviewList.filter(
      (review) => review.status === "Approved",
    ).length;

    return [
      {
        label: "Average Rating",
        value: avg,
        note: `Across ${reviewList.length} reviews`,
      },
      { label: "Pending Reviews", value: pending, note: "Need moderation" },
      { label: "Published", value: approved, note: "Visible on website" },
      { label: "Total Reviews", value: reviewList.length, note: "All time" },
    ];
  }, [reviewList]);

  const liveSentiment = useMemo(() => {
    const positive = reviewList.filter((r) => Number(r.rating) >= 4).length;
    const neutral = reviewList.filter((r) => Number(r.rating) === 3).length;
    const negative = reviewList.filter((r) => Number(r.rating) < 3).length;
    const total = reviewList.length || 1;

    return [
      {
        label: "Positive",
        value: Math.round((positive / total) * 100),
        color: "#22c55e",
      },
      {
        label: "Neutral",
        value: Math.round((neutral / total) * 100),
        color: "#1a6fd4",
      },
      {
        label: "Needs Attention",
        value: Math.round((negative / total) * 100),
        color: "#f59e0b",
      },
    ];
  }, [reviewList]);

  return (
    <section className="admin-section admin-reviews">
      <header className="admin-section__header">
        <div>
          <p className="admin-section__eyebrow">Patient Feedback</p>
          <h1 className="admin-section__title">Review Management</h1>
          <p className="admin-section__sub">
            Moderate patient reviews, publish trusted testimonials, and respond
            quickly to feedback that needs clinical attention.
          </p>
        </div>
        <div className="admin-section__actions">
          <button className="admin-btn admin-btn--ghost" onClick={loadReviews}>
            ↻ Refresh
          </button>
          <button
            className="admin-btn admin-btn--primary"
            onClick={() =>
              copyToClipboard(
                `${window.location.origin}/reviews`,
                "Review link copied — share it with your patient.",
              )
            }
          >
            Request Review
          </button>
        </div>
      </header>

      <div className="admin-grid admin-grid--4">
        {liveStats.map((item) => (
          <article className="admin-card" key={item.label}>
            <p className="admin-card__label">{item.label}</p>
            <p className="admin-card__value">{item.value}</p>
            <p className="admin-card__note">{item.note}</p>
          </article>
        ))}
      </div>

      <div className="admin-grid admin-grid--2">
        <article className="admin-card">
          <h2 className="admin-panel-title">Sentiment Overview</h2>
          <p className="admin-panel-sub">
            Real-time analysis of patient feedback sentiment.
          </p>
          <div className="admin-reviews__sentiment">
            {liveSentiment.map((item) => (
              <div className="admin-reviews__sentiment-item" key={item.label}>
                <div className="admin-reviews__sentiment-head">
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
                <div className="admin-reviews__bar">
                  <span
                    style={{ width: `${item.value}%`, background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-card admin-reviews__reply">
          <h2 className="admin-panel-title">Quick Response</h2>
          <p className="admin-panel-sub">
            Prepare a polished reply before publishing it.
          </p>
          <div className="admin-field">
            <label>Response Template</label>
            <textarea
              className="admin-textarea"
              value={responseText}
              onChange={(event) => setResponseText(event.target.value)}
            />
          </div>
          <button
            className="admin-btn admin-btn--primary"
            onClick={() => copyToClipboard(responseText, "Response copied to clipboard.")}
          >
            Copy Response
          </button>
        </article>
      </div>

      <article className="admin-card">
        <h2 className="admin-panel-title">Latest Reviews</h2>
        {error && (
          <p className="admin-panel-sub" style={{ color: "#dc2626" }}>
            ⚠️ {error}
          </p>
        )}
        {loading && <p className="admin-panel-sub">Loading reviews...</p>}
        <p className="admin-panel-sub">
          Approve, reject, or delete patient reviews. Pending reviews are shown
          first.
        </p>
        {reviewList.length === 0 && !loading ? (
          <p className="admin-panel-sub">
            No reviews yet. Patients can submit reviews after their
            appointments.
          </p>
        ) : (
          <div className="admin-table-wrap admin-reviews__table">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Review</th>
                  <th>Rating</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviewList.map((review) => (
                  <tr key={review.id}>
                    <td>
                      <strong>{review.patient}</strong>
                    </td>
                    <td title={review.text}>
                      {review.text.substring(0, 50)}...
                    </td>
                    <td>
                      <span className="admin-reviews__stars">
                        ⭐ {review.rating}/5
                      </span>
                    </td>
                    <td>{review.date}</td>
                    <td>
                      <span
                        className={`admin-status admin-status--${review.status.toLowerCase()}`}
                      >
                        {review.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-inline-actions">
                        {review.status === "Pending" && (
                          <>
                            <button
                              className="admin-icon-btn"
                              onClick={() => handleApprove(review.id)}
                              disabled={actionLoading === review.id}
                              style={{ color: "#22c55e" }}
                              title="Approve"
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="admin-icon-btn"
                              onClick={() => handleReject(review.id)}
                              disabled={actionLoading === review.id}
                              style={{ color: "#f59e0b" }}
                              title="Reject"
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}
                        <button
                          className="admin-icon-btn"
                          onClick={() => handleDelete(review.id)}
                          disabled={actionLoading === review.id}
                          style={{ color: "#dc2626" }}
                          title="Delete"
                        >
                          🗑 Delete
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

      {pendingDeleteId && (
        <ConfirmDialog
          title="Delete review?"
          message="This will permanently remove this review from the site."
          confirmLabel="Delete"
          danger
          busy={actionLoading === pendingDeleteId}
          onConfirm={confirmDeleteReview}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </section>
  );
}
