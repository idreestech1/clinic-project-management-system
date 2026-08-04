import "./About.css";

const MILESTONES = [
  {
    period: "2018 - Present",
    periodSide: "right",
    label: "Established Clinical Practice",
    desc: "Founded the Hammad Medical Group with a focus on holistic patient health and preventive care strategies.",
    icon: "🏥",
    iconBg: "#1a6fd4",
    align: "right",
  },
  {
    period: "2013 - 2017",
    periodSide: "left",
    label: "Chief Resident Physician",
    desc: "Led a team of 40 residents at Mayo Clinic, overseeing complex diagnostic cases and surgical protocols.",
    icon: "📊",
    iconBg: "#1a6fd4",
    align: "left",
  },
  {
    period: "2010 - 2012",
    periodSide: "right",
    label: "Specialized Fellowship",
    desc: "Completed advanced fellowship in Molecular Medicine at the Cleveland Clinic.",
    icon: "👤",
    iconBg: "#f5a623",
    align: "right",
  },
];

export default function About() {
  return (
    <div className="about-page" data-tour="about-page">

      {/* ── Bio Section ── */}
      <section className="about-bio">
        <div className="about-bio__image-wrap">
          <img
            src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&q=80"
            alt="Dr. Hammad"
            className="about-bio__image"
          />
        </div>

        <div className="about-bio__content">
          <p className="about-bio__label">CONSULTANT PHYSICIAN</p>
          <h1 className="about-bio__title">
            Empowering lives through{" "}
            <span className="about-bio__title--blue">compassionate care.</span>
          </h1>
          <p className="about-bio__desc">
            Dr. Hammad is a board-certified specialist with over 15 years of clinical excellence.
            His approach transcends traditional medicine, focusing on the synthesis of cutting-edge
            diagnostic precision and deeply personalized patient connection.
          </p>
          <p className="about-bio__desc">
            By treating the individual rather than just the symptoms, Dr. Hammad has built a practice
            centered on trust, transparency, and transformative health outcomes.
          </p>

          <div className="about-bio__badges">
            <div className="about-badge">
              <span className="about-badge__icon">🛡️</span>
              <div>
                <p className="about-badge__title">Board Certified</p>
                <p className="about-badge__sub">Internal Medicine Specialist</p>
              </div>
            </div>
            <div className="about-badge">
              <span className="about-badge__icon">👥</span>
              <div>
                <p className="about-badge__title">10k+ Patients</p>
                <p className="about-badge__sub">Healed &amp; Cared For</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Expertise Section ── */}
      <section className="about-expertise">
        <div className="about-expertise__header">
          <h2 className="about-expertise__title">Foundations of Expertise</h2>
          <p className="about-expertise__sub">
            Academic rigor meets professional mastery through decades of dedicated study and practice.
          </p>
        </div>
        <hr className="about-divider" />

        <div className="about-expertise__grid">
          {/* Education card */}
          <div className="about-edu-card">
            <div className="about-edu-card__header">
              <span className="about-edu-card__icon">🎓</span>
              <h3 className="about-edu-card__title">Medical Education</h3>
            </div>

            <div className="about-edu-item">
              <div>
                <p className="about-edu-item__degree">Doctor of Medicine (MD)</p>
                <p className="about-edu-item__school">Johns Hopkins School of Medicine</p>
              </div>
              <span className="about-edu-item__badge">2005 – 2009</span>
            </div>

            <div className="about-edu-item">
              <div>
                <p className="about-edu-item__degree">B.S. in Biomedical Sciences</p>
                <p className="about-edu-item__school">Stanford University • Summa Cum Laude</p>
              </div>
              <span className="about-edu-item__badge">2001 – 2005</span>
            </div>
          </div>

          {/* Certifications card */}
          <div className="about-cert-card">
            <div className="about-cert-card__icon-wrap">
              <span>🏅</span>
            </div>
            <h3 className="about-cert-card__title">Certifications</h3>
            <ul className="about-cert-list">
              <li>American Board of Internal Medicine</li>
              <li>Advanced Cardiovascular Life Support</li>
              <li>Endocrinology Specialty Certification</li>
            </ul>
            <p className="about-cert-renewed">Renewed through 2028</p>
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="about-timeline">
        <h2 className="about-timeline__title">Career Milestones</h2>
        <div className="about-timeline__bar" />

        <div className="about-timeline__list">
          {MILESTONES.map((m, i) => (
            <div key={i} className={`about-milestone about-milestone--${m.align}`}>
              <div className="about-milestone__text about-milestone__text--left">
                {m.align === "left" && (
                  <>
                    <p className="about-milestone__period">{m.period}</p>
                  </>
                )}
                {m.align === "right" && (
                  <>
                    <p className="about-milestone__label">{m.label}</p>
                    <p className="about-milestone__desc">{m.desc}</p>
                  </>
                )}
              </div>

              <div className="about-milestone__node" style={{ background: m.iconBg }}>
                <span>{m.icon}</span>
              </div>

              <div className="about-milestone__text about-milestone__text--right">
                {m.align === "right" && (
                  <p className="about-milestone__period">{m.period}</p>
                )}
                {m.align === "left" && (
                  <>
                    <p className="about-milestone__label">{m.label}</p>
                    <p className="about-milestone__desc">{m.desc}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Philosophy ── */}
      <section className="about-philosophy">
        <div className="about-philosophy__card">
          <div className="about-philosophy__quotes">"</div>
          <h3 className="about-philosophy__heading">Philosophy of Care</h3>
          <p className="about-philosophy__quote">
            "I believe medicine is an art as much as a science. My goal is to ensure every patient
            feels heard, respected, and empowered to take control of their health journey."
          </p>
          <div className="about-philosophy__attribution">
            <span className="about-philosophy__line" />
            <span className="about-philosophy__name">DR. HAMMAD, MD</span>
          </div>
        </div>
      </section>

    </div>
  );
}
