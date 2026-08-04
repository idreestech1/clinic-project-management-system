import { useRef, useState } from "react";
import { api } from "../../api/client";
import "./Contact.css";

const HOURS = [
  { day: "MONDAY - FRIDAY", time: "08:00 - 18:00", closed: false },
  { day: "SATURDAY", time: "10:00 - 14:00", closed: false },
  { day: "SUNDAY", time: "CLOSED", closed: true },
];

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });
  const [notice, setNotice] = useState({ show: false, type: "success", text: "" });
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [sending, setSending] = useState(false);
  const noticeTimerRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const showNotice = (type, text) => {
    setNotice({ show: true, type, text });

    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }

    noticeTimerRef.current = setTimeout(() => {
      setNotice((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !email || !message || !emailValid) {
      setShowFieldErrors(true);
      showNotice("warning", "Please fill in all required details before sending.");
      return;
    }

    setShowFieldErrors(false);
    setSending(true);

    try {
      await api.post("/contact", { name, email, subject: form.subject, message });
      showNotice("success", "Success! Your message is sent.");
      setForm({
        name: "",
        email: "",
        subject: "General Inquiry",
        message: "",
      });
    } catch (err) {
      showNotice("warning", err.message || "Unable to send your message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="contact-page" data-tour="contact-page">
      {notice.show && (
        <div className={`contact-notice contact-notice--${notice.type}`} role="status" aria-live="polite">
          {notice.text}
        </div>
      )}

      <section className="contact-hero">
        <p className="contact-hero__label">GET IN TOUCH</p>
        <h1 className="contact-hero__title">
          Let&apos;s start a <span className="contact-hero__title--blue">conversation</span> about your health.
        </h1>
        <p className="contact-hero__sub">
          Our clinic provides a serene environment for personalized medical care. Reach out today to
          schedule your consultation or inquire about our specialized services.
        </p>
      </section>

      <section className="contact-body">
        <div className="contact-left">
          <div className="contact-info-card">
            <div className="contact-info-item">
              <div className="contact-info-icon" style={{ background: "#1a6fd4" }}>P</div>
              <div>
                <p className="contact-info-item__title">Phone Number</p>
                <p className="contact-info-item__main">+1 (555) 012-3456</p>
                <p className="contact-info-item__sub">Mon-Fri, 9am - 6pm</p>
              </div>
            </div>
            <div className="contact-info-item">
              <div className="contact-info-icon" style={{ background: "#1a6fd4" }}>M</div>
              <div>
                <p className="contact-info-item__title">Email Address</p>
                <p className="contact-info-item__main">contact@drhammad.com</p>
                <p className="contact-info-item__sub">Response within 24h</p>
              </div>
            </div>
            <div className="contact-info-item">
              <div className="contact-info-icon" style={{ background: "#1a6fd4" }}>L</div>
              <div>
                <p className="contact-info-item__title">Medical Office</p>
                <p className="contact-info-item__main">482 Clinical Heights, Suite 102</p>
                <p className="contact-info-item__sub">Beverly Hills, CA 90210</p>
              </div>
            </div>
          </div>

          <div className="contact-hours-card">
            <div className="contact-hours-card__header">
              <span>T</span>
              <span className="contact-hours-card__title">Clinical Hours</span>
            </div>
            {HOURS.map(({ day, time, closed }) => (
              <div key={day} className="contact-hours-row">
                <span className="contact-hours-row__day">{day}</span>
                <span className={`contact-hours-row__time ${closed ? "contact-hours-row__time--closed" : ""}`}>
                  {time}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="contact-form-card">
          <h2 className="contact-form__title">Send an Inquiry</h2>
          <p className="contact-form__sub">
            Use the form below for general questions. For medical emergencies, please call 911 immediately.
          </p>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form__row">
              <div className="contact-form__field">
                <label className="contact-form__label">FULL NAME</label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  className="contact-form__input"
                />
                {showFieldErrors && !form.name.trim() && <span className="contact-form__required">Required</span>}
              </div>
              <div className="contact-form__field">
                <label className="contact-form__label">EMAIL ADDRESS</label>
                <input
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className="contact-form__input"
                />
                {showFieldErrors && !form.email.trim() && <span className="contact-form__required">Required</span>}
                {showFieldErrors && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) && (
                  <span className="contact-form__required">Enter a valid email</span>
                )}
              </div>
            </div>

            <div className="contact-form__field">
              <label className="contact-form__label">SUBJECT</label>
              <select
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className="contact-form__input contact-form__select"
              >
                <option>General Inquiry</option>
                <option>Book Appointment</option>
                <option>Medical Records</option>
                <option>Billing</option>
                <option>Other</option>
              </select>
            </div>

            <div className="contact-form__field">
              <label className="contact-form__label">YOUR MESSAGE</label>
              <textarea
                name="message"
                placeholder="How can we help you today?"
                value={form.message}
                onChange={handleChange}
                rows={6}
                className="contact-form__input contact-form__textarea"
              />
              {showFieldErrors && !form.message.trim() && <span className="contact-form__required">Required</span>}
            </div>

            <button type="submit" className="contact-form__submit">
              {sending ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </section>

      <section className="contact-map">
        <iframe
          title="Dr. Hammad Clinical Center"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d26430.393553120906!2d-118.43209874999999!3d34.0736204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2bc04d6d147ab%3A0xd6c7c379fd081ed1!2sBeverly%20Hills%2C%20CA%2090210!5e0!3m2!1sen!2sus!4v1706000000000!5m2!1sen!2sus"
          className="contact-map__iframe"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="contact-map__popup">
          <p className="contact-map__popup-title">Dr. Hammad Clinical Center</p>
          <p className="contact-map__popup-desc">
            Located in the heart of the medical district with ample private parking available for patients.
          </p>
          <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="contact-map__popup-link">
            Get Driving Directions -&gt;
          </a>
        </div>
      </section>
    </div>
  );
}
