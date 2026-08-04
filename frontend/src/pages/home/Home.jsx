import "./Home.css";

const SERVICES = [
  {
    icon: "🩺",
    iconBg: "#e8f0fc",
    title: "General Diagnosis",
    desc: "Comprehensive health screenings and accurate diagnostic assessments for patients of all ages.",
  },
  {
    icon: "💓",
    iconBg: "#dcfce7",
    title: "Cardiology Care",
    desc: "Advanced heart health monitoring, risk assessments, and personalized cardiovascular wellness plans.",
  },
  {
    icon: "✚",
    iconBg: "#fff3e0",
    title: "Urgent Consultation",
    desc: "Fast-track appointments for acute symptoms that require immediate clinical attention and care.",
  },
];

const STATS = [
  { value: "15+", label: "YEARS EXPERIENCE" },
  { value: "10k+", label: "HAPPY PATIENTS" },
  { value: "500+", label: "SUCCESSFUL PROCEDURES" },
];

export default function Home({
  onBookAppointment = () => {},
  onContact = () => {},
  onVirtualTour = () => {},
}) {
  return (
    <div className="home-page">

      {/* ── HERO ── */}
      <section className="home-hero" data-tour="home-hero">
        <div className="home-hero__left">
          <div className="home-hero__badge">
            <span className="home-hero__badge-icon">✓</span>
            TRUSTED CLINICAL EXPERTISE
          </div>
          <h1 className="home-hero__title">
            <span className="home-hero__title--blue">Dr. Hammad</span>{" "}
            Compassionate Care for a Healthier Life
          </h1>
          <p className="home-hero__desc">
            Combining advanced medical technology with a personalized human touch to provide
            the comprehensive care you and your family deserve.
          </p>
          <div className="home-hero__actions">
            <button className="home-btn home-btn--primary" data-tour="hero-book" onClick={onBookAppointment}>Book Appointment</button>
            <button className="home-btn home-btn--outline" data-tour="hero-contact" onClick={onContact}>Contact Us</button>
          </div>
        </div>

        <div className="home-hero__right">
          <div className="home-hero__img-wrap">
            <img
              src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80"
              alt="Dr. Hammad"
              className="home-hero__img"
            />
          </div>
          <div className="home-hero__badge-float">
            <div className="home-hero__badge-float-icon">🕐</div>
            <div>
              <p className="home-hero__badge-float-label">NEXT AVAILABLE</p>
              <p className="home-hero__badge-float-value">Today, 2:30 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="home-stats">
        {STATS.map(({ value, label }) => (
          <div key={label} className="home-stat">
            <span className="home-stat__value">{value}</span>
            <span className="home-stat__label">{label}</span>
          </div>
        ))}
      </section>

      {/* ── SERVICES ── */}
      <section className="home-services" data-tour="home-services">
        <div className="home-services__header">
          <h2 className="home-services__title">Expert Medical Services</h2>
          <p className="home-services__sub">
            Providing a wide range of specialized healthcare solutions tailored to your unique
            wellness journey.
          </p>
        </div>
        <div className="home-services__grid">
          {SERVICES.map((s) => (
            <div key={s.title} className="home-svc-card">
              <div className="home-svc-card__icon" style={{ background: s.iconBg }}>
                <span>{s.icon}</span>
              </div>
              <h3 className="home-svc-card__title">{s.title}</h3>
              <p className="home-svc-card__desc">{s.desc}</p>
              <a href="#" className="home-svc-card__link">Learn More →</a>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="home-cta" data-tour="home-cta">
        <div className="home-cta__box">
          <div className="home-cta__left">
            <h2 className="home-cta__title">Ready to prioritize your health today?</h2>
            <p className="home-cta__sub">
              Join thousands of patients who trust Dr. Hammad for their healthcare needs.
              Simple booking, zero hassle.
            </p>
          </div>
          <div className="home-cta__actions">
            <button className="home-cta__btn home-cta__btn--white" data-tour="cta-schedule" onClick={onBookAppointment}>Schedule Now</button>
            <button className="home-cta__btn home-cta__btn--ghost" data-tour="cta-tour" onClick={onVirtualTour}>Virtual Tour</button>
          </div>
        </div>
      </section>

    </div>
  );
}
