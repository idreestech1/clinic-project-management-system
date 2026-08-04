import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import "./Services.css";

const SERVICES_TOP = [
  {
    icon: "➕",
    iconBg: "#dbeafe",
    iconColor: "#1d4ed8",
    title: "Comprehensive Diagnostics",
    desc: "Advanced screening and diagnostic protocols utilizing the latest in clinical imaging and laboratory analysis to provide absolute clarity for your health journey.",
    large: true,
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=500&q=80",
  },
  {
    icon: "❤️",
    iconBg: "#dcfce7",
    iconColor: "#15803d",
    title: "Cardiology",
    desc: "Specialized heart care focused on prevention, early detection, and chronic management of cardiovascular health.",
    large: false,
  },
];

const SERVICES_MID = [
  {
    icon: "🧠",
    iconBg: "#ffedd5",
    iconColor: "#c2410c",
    title: "Neurology",
    desc: "Expert consultation for complex neurological conditions, focusing on precision medicine and patient quality of life.",
  },
  {
    icon: "🫁",
    iconBg: "#dbeafe",
    iconColor: "#1d4ed8",
    title: "Pulmonology",
    desc: "Advanced care for respiratory health, from asthma management to chronic lung disease treatment protocols.",
  },
  {
    icon: "🩻",
    iconBg: "#dcfce7",
    iconColor: "#15803d",
    title: "Imaging Services",
    desc: "High-resolution imaging including X-Ray, Ultrasound, and digital scans with rapid specialist reporting.",
  },
];

export default function Services() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await api.get("/services");
        setServices((data.services || []).filter((service) => service.status !== "Hidden"));
      } catch {
        setServices([]);
      }
    };

    loadServices();
  }, []);

  const dynamicServices = useMemo(() => {
    if (!services.length) {
      return [...SERVICES_TOP, ...SERVICES_MID, {
        title: "Preventative Medicine",
        desc: "Proactive healthcare including immunizations, annual check-ups, and personalized wellness roadmaps.",
      }];
    }

    return services.map((service) => ({
      title: service.name,
      desc: service.description || `${service.category} care with ${service.duration} appointment planning.`,
    }));
  }, [services]);

  return (
    <div className="srv-page" data-tour="services-page">
      {/* Hero */}
      <section className="srv-hero">
        <h1 className="srv-hero__title">
          Specialized Care<br />
          <span className="srv-hero__title--blue">Human Precision.</span>
        </h1>
        <p className="srv-hero__sub">
          Combining advanced clinical methodology with a serene patient experience.
          Explore our comprehensive range of medical services tailored to your long-term
          health and vitality.
        </p>
      </section>

      {/* Top Row */}
      <section className="srv-grid-top">
        {/* Large card */}
        <div className="srv-card srv-card--large">
          <div className="srv-card__content">
            <div className="srv-icon" style={{ background: SERVICES_TOP[0].iconBg, color: SERVICES_TOP[0].iconColor }}>
              <span>🏥</span>
            </div>
            <h3 className="srv-card__title">{dynamicServices[0]?.title}</h3>
            <p className="srv-card__desc">{dynamicServices[0]?.desc}</p>
            <a href="#" className="srv-link">Learn More →</a>
          </div>
          <div className="srv-card__image-overlay">
            <img src={SERVICES_TOP[0].image} alt="clinic" />
          </div>
        </div>

        {/* Small card */}
        <div className="srv-card srv-card--small">
          <div className="srv-icon" style={{ background: "#dcfce7", color: "#15803d" }}>
            <span>❤️</span>
          </div>
          <h3 className="srv-card__title">{dynamicServices[1]?.title}</h3>
          <p className="srv-card__desc">{dynamicServices[1]?.desc}</p>
          <a href="#" className="srv-link srv-link--bottom">Learn More</a>
        </div>
      </section>

      {/* Mid Row — 3 equal cards */}
      <section className="srv-grid-mid">
        {dynamicServices.slice(2, 5).map((s, index) => (
          <div className="srv-card srv-card--mid" key={s.title}>
            <div className="srv-icon" style={{ background: SERVICES_MID[index]?.iconBg || "#dbeafe", color: SERVICES_MID[index]?.iconColor || "#1d4ed8" }}>
              <span>{SERVICES_MID[index]?.icon || "➕"}</span>
            </div>
            <h3 className="srv-card__title">{s.title}</h3>
            <p className="srv-card__desc">{s.desc}</p>
            <a href="#" className="srv-link">Learn More</a>
          </div>
        ))}
      </section>

      {/* Bottom Row */}
      <section className="srv-grid-bottom">
        {/* Image CTA card */}
        <div className="srv-card srv-card--cta">
          <img
            src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80"
            alt="doctor"
            className="srv-cta__bg"
          />
          <div className="srv-cta__overlay">
            <h3 className="srv-cta__title">Patient-Centric Consults</h3>
            <p className="srv-cta__sub">Experience a different kind of clinical relationship built on time and trust.</p>
            <button className="srv-cta__btn">Book Consultation</button>
          </div>
        </div>

        {/* Preventative card */}
        <div className="srv-card srv-card--prev">
          <div className="srv-icon" style={{ background: "#ffedd5", color: "#c2410c" }}>
            <span>💊</span>
          </div>
          <h3 className="srv-card__title">{dynamicServices[5]?.title || dynamicServices[3]?.title || "Preventative Medicine"}</h3>
          <p className="srv-card__desc">
            {dynamicServices[5]?.desc || dynamicServices[3]?.desc || "Proactive healthcare including immunizations, annual check-ups, and personalized wellness roadmaps."}
          </p>
          <a href="#" className="srv-link">Learn More</a>
        </div>
      </section>
    </div>
  );
}
