import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import "./Reviews.css";

const TABS = ["All Reviews", "Surgery", "Consultation"];
const REVIEWS_PER_PAGE = 3;
const emptyReviewForm = {
  name: "",
  email: "",
  category: "Consultation",
  stars: 5,
  text: "",
};

const TESTIMONIALS = [
  {
    category: "Surgery",
    stars: 5,
    text: '"Dr. Hammad\'s attention to detail is remarkable. The staff made me feel welcome from the moment I stepped into the clinic. My recovery was faster than expected thanks to their expertise."',
    name: "Sarah Jenkins",
    date: "OCTOBER 12, 2023",
    avatar: "https://i.pravatar.cc/48?img=47",
    featured: false,
  },
  {
    category: "Consultation",
    stars: 5,
    text: '"Highly professional and thorough. The clinic\'s precision in treatment planning is unmatched. Dr. Hammad and the team provided me with Preliminary findings before my procedure."',
    name: "Michael Richardson",
    date: "JANUARY 05, 2024",
    avatar: "https://i.pravatar.cc/48?img=12",
    featured: true,
  },
  {
    category: "Consultation",
    stars: 4,
    text: '"The clinic is spotless and equipped with the latest technology. It gave me a lot of confidence in my treatment plan. Highly recommend for any specialized consultations."',
    name: "Emily Davenport",
    date: "MARCH 18, 2024",
    avatar: "https://i.pravatar.cc/48?img=32",
    featured: false,
  },
  {
    category: "Surgery",
    stars: 5,
    text: '"My procedure was explained step by step and I felt safe the whole time. Follow-up care was excellent and the team checked in regularly during recovery."',
    name: "Daniel Carter",
    date: "APRIL 02, 2024",
    avatar: "https://i.pravatar.cc/48?img=68",
    featured: false,
  },
  {
    category: "Consultation",
    stars: 4,
    text: '"I came for a second opinion and received a very clear plan. The doctor answered every question patiently and made complex details easy to understand."',
    name: "Alicia Monroe",
    date: "MAY 14, 2024",
    avatar: "https://i.pravatar.cc/48?img=15",
    featured: false,
  },
  {
    category: "Surgery",
    stars: 5,
    text: '"Outstanding surgical care from admission to discharge. The clinic was organized, clean, and every staff member was professional and kind."',
    name: "Jonathan Price",
    date: "JUNE 03, 2024",
    avatar: "https://i.pravatar.cc/48?img=22",
    featured: true,
  },
  {
    category: "Consultation",
    stars: 5,
    text: '"Consultation was detailed and practical. I left with confidence and a treatment timeline that actually fit my schedule and budget."',
    name: "Nadia Freeman",
    date: "JULY 19, 2024",
    avatar: "https://i.pravatar.cc/48?img=33",
    featured: false,
  },
  {
    category: "Surgery",
    stars: 4,
    text: '"Recovery support was very strong. I appreciated the clear instructions and quick response whenever I had a concern after surgery."',
    name: "Peter Lawson",
    date: "AUGUST 08, 2024",
    avatar: "https://i.pravatar.cc/48?img=8",
    featured: false,
  },
  {
    category: "Consultation",
    stars: 5,
    text: '"The clinic combines modern technology with genuine care. My consultation report was comprehensive and easy to follow."',
    name: "Hina Ashraf",
    date: "SEPTEMBER 10, 2024",
    avatar: "https://i.pravatar.cc/48?img=25",
    featured: true,
  },
];

const GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80",
    alt: "Examination room with blue bed",
    large: true,
  },
  {
    src: "https://images.unsplash.com/photo-1530026405186-ed1f139313f3?w=400&q=80",
    alt: "Medical equipment",
    large: false,
  },
  {
    src: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&q=80",
    alt: "Doctor consultation desk",
    large: false,
  },
  {
    src: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80",
    alt: "Treatment chair",
    large: false,
  },
  {
    src: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=400&q=80",
    alt: "Surgical equipment",
    large: false,
  },
  {
    src: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&q=80",
    alt: "Recovery lounge",
    large: false,
  },
];

function StarRating({ count, total = 5 }) {
  return (
    <div className="stars">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`star ${i < count ? "star--filled" : "star--empty"}`}>
          &#9733;
        </span>
      ))}
    </div>
  );
}

export default function Reviews({ onBookAppointment = () => {}, onViewServices = () => {} }) {
  const [activeTab, setActiveTab] = useState("All Reviews");
  const [page, setPage] = useState(1);
  const [patientReviews, setPatientReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState(emptyReviewForm);
  const [reviewErrors, setReviewErrors] = useState({});
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewLoadError, setReviewLoadError] = useState("");

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setReviewLoading(true);
        const data = await api.get("/reviews?public=true");
        setPatientReviews(data.reviews || []);
        setReviewLoadError("");
      } catch (err) {
        setPatientReviews(TESTIMONIALS);
        setReviewLoadError(err.message || "Unable to load live reviews.");
      } finally {
        setReviewLoading(false);
      }
    };

    loadReviews();
  }, []);

  const allTestimonials = useMemo(
    () => patientReviews,
    [patientReviews],
  );

  const filteredTestimonials = useMemo(() => {
    if (activeTab === "All Reviews") {
      return allTestimonials;
    }
    return allTestimonials.filter((item) => item.category === activeTab);
  }, [activeTab, allTestimonials]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTestimonials.length / REVIEWS_PER_PAGE),
  );

  const currentPageTestimonials = useMemo(() => {
    const start = (page - 1) * REVIEWS_PER_PAGE;
    const end = start + REVIEWS_PER_PAGE;
    return filteredTestimonials.slice(start, end);
  }, [filteredTestimonials, page]);

  const handleReviewChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
    setReviewErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleStarSelect = (stars) => {
    setReviewForm((prev) => ({ ...prev, stars }));
    setReviewErrors((prev) => ({ ...prev, stars: undefined }));
  };

  const validateReview = () => {
    const errors = {};
    if (!reviewForm.name.trim()) errors.name = "Please enter your name.";
    if (!reviewForm.email.trim()) errors.email = "Please enter your email.";
    else if (!/\S+@\S+\.\S+/.test(reviewForm.email)) errors.email = "Please enter a valid email.";
    if (!reviewForm.text.trim()) errors.text = "Please write your review.";
    else if (reviewForm.text.trim().length < 20) errors.text = "Please write at least 20 characters.";
    return errors;
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    const errors = validateReview();
    if (Object.keys(errors).length) {
      setReviewErrors(errors);
      return;
    }

    const newReview = {
      category: reviewForm.category,
      stars: Number(reviewForm.stars),
      text: reviewForm.text.trim(),
      name: reviewForm.name.trim(),
      email: reviewForm.email.trim(),
    };

    try {
      const data = await api.post("/reviews", newReview);
      setPatientReviews((prev) => [data.review, ...prev]);
      setReviewForm(emptyReviewForm);
      setReviewErrors({});
      setReviewSubmitted(true);
      setActiveTab("All Reviews");
      setPage(1);
      setTimeout(() => setReviewSubmitted(false), 5000);
    } catch (err) {
      setReviewErrors((prev) => ({
        ...prev,
        submit: err.message || "Unable to submit review.",
      }));
    }
  };

  return (
    <main className="main-page">
      {/* HERO */}
      <section className="hero-section">
        <p className="hero-label">PATIENT EXPERIENCE</p>
        <h1 className="hero-title">
          Voices of Care &amp; <span className="hero-title--blue">Clinical Excellence.</span>
        </h1>
        <p className="hero-subtitle">
          Dedicated to providing high-fidelity medical services with a human touch. Explore our
          gallery and read what our patients have to say.
        </p>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials-section">
        <div className="testimonials-header">
          <div>
            <h2 className="section-title">Patient Testimonials</h2>
            <p className="section-subtitle">Real feedback from our valued community.</p>
          </div>
          <div className="tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? "tab--active" : ""}`}
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="cards-grid">
          {reviewLoading && <p className="section-subtitle">Loading live reviews...</p>}
          {reviewLoadError && <p className="section-subtitle">{reviewLoadError}</p>}
          {currentPageTestimonials.map((t) => (
            <div key={t.name} className={`card ${t.featured ? "card--featured" : ""}`}>
              <StarRating count={t.stars} />
              <p className="card__text">{t.text}</p>
              <div className="card__author">
                <img src={t.avatar} alt={t.name} className="card__avatar" />
                <div>
                  <p className="card__name">{t.name}</p>
                  <p className="card__date">{t.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pagination">
          <button
            className="pagination__btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <span className="pagination__btn-icon">{"<"}</span>
            <span>Previous</span>
          </button>
          <span className="pagination__label">
            Page {page} of {totalPages}
          </span>
          <button
            className="pagination__btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <span>Next</span>
            <span className="pagination__btn-icon">{">"}</span>
          </button>
        </div>
      </section>

      {/* GALLERY */}
      <section className="gallery-section">
        <div>
          <h2 className="section-title">Our Environment</h2>
          <p className="section-subtitle">
            A glimpse into our state-of-the-art facilities designed for patient comfort and
            clinical precision.
          </p>
        </div>

        <div className="gallery-grid">
          <div className="gallery-item gallery-item--large">
            <img src={GALLERY[0].src} alt={GALLERY[0].alt} />
          </div>
          <div className="gallery-item">
            <img src={GALLERY[1].src} alt={GALLERY[1].alt} />
          </div>
          <div className="gallery-item">
            <img src={GALLERY[2].src} alt={GALLERY[2].alt} />
          </div>
          <div className="gallery-item">
            <img src={GALLERY[3].src} alt={GALLERY[3].alt} />
          </div>
          <div className="gallery-item">
            <img src={GALLERY[4].src} alt={GALLERY[4].alt} />
          </div>
          <div className="gallery-item">
            <img src={GALLERY[5].src} alt={GALLERY[5].alt} />
          </div>
        </div>
      </section>

      {/* LEAVE REVIEW */}
      <section className="review-form-section">
        <div className="review-form-card">
          <div className="review-form-card__content">
            <p className="review-form-card__label">Share Your Experience</p>
            <h2 className="review-form-card__title">Review Dr. Hammad Clinic</h2>
            <p className="review-form-card__sub">
              Your feedback helps other patients choose care with confidence and helps our clinic improve every visit.
            </p>
            <div className="review-form-card__stats">
              <div>
                <strong>4.9/5</strong>
                <span>Average rating</span>
              </div>
              <div>
                <strong>{allTestimonials.length}</strong>
                <span>Total reviews</span>
              </div>
            </div>
          </div>

          <form className="review-form" onSubmit={handleReviewSubmit} noValidate>
            {reviewSubmitted && (
              <p className="review-form__success">Thank you. Your review has been added.</p>
            )}
            {reviewErrors.submit && (
              <p className="review-form__error">{reviewErrors.submit}</p>
            )}

            <div className="review-form__row">
              <div className="review-form__field">
                <label htmlFor="review-name">Full Name</label>
                <input
                  id="review-name"
                  name="name"
                  value={reviewForm.name}
                  onChange={handleReviewChange}
                  placeholder="Your name"
                  className={reviewErrors.name ? "review-form__input--error" : ""}
                />
                {reviewErrors.name && <span className="review-form__error">{reviewErrors.name}</span>}
              </div>
              <div className="review-form__field">
                <label htmlFor="review-email">Email</label>
                <input
                  id="review-email"
                  name="email"
                  type="email"
                  value={reviewForm.email}
                  onChange={handleReviewChange}
                  placeholder="you@example.com"
                  className={reviewErrors.email ? "review-form__input--error" : ""}
                />
                {reviewErrors.email && <span className="review-form__error">{reviewErrors.email}</span>}
              </div>
            </div>

            <div className="review-form__row">
              <div className="review-form__field">
                <label htmlFor="review-category">Visit Type</label>
                <select
                  id="review-category"
                  name="category"
                  value={reviewForm.category}
                  onChange={handleReviewChange}
                >
                  <option>Consultation</option>
                  <option>Surgery</option>
                </select>
              </div>
              <div className="review-form__field">
                <label>Rating</label>
                <div className="review-form__stars" aria-label={`${reviewForm.stars} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={star <= reviewForm.stars ? "review-form__star review-form__star--active" : "review-form__star"}
                      onClick={() => handleStarSelect(star)}
                      aria-label={`Rate ${star} out of 5`}
                    >
                      &#9733;
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="review-form__field">
              <label htmlFor="review-text">Your Review</label>
              <textarea
                id="review-text"
                name="text"
                value={reviewForm.text}
                onChange={handleReviewChange}
                placeholder="Tell us about your visit..."
                rows={5}
                className={reviewErrors.text ? "review-form__input--error" : ""}
              />
              {reviewErrors.text && <span className="review-form__error">{reviewErrors.text}</span>}
            </div>

            <button className="review-form__submit" type="submit">Submit Review</button>
          </form>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-box">
          <h2 className="cta-title">Experience Premium Care Yourself</h2>
          <p className="cta-subtitle">
            Ready to schedule your consultation? Dr. Hammad and the team are here to provide the
            clinical excellence you deserve.
          </p>
          <div className="cta-actions">
            <button className="cta-btn cta-btn--primary" onClick={onBookAppointment}>Book an Appointment</button>
            <button className="cta-btn cta-btn--outline" onClick={onViewServices}>View Services</button>
          </div>
        </div>
      </section>
    </main>
  );
}
