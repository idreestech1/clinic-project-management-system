import { useEffect, useState } from "react";
import "./Header.css";

const ALL_NAV_LINKS = ["Home", "About", "Services", "Appointment", "Reviews", "Contact"];

export default function TopNavBar({
  active,
  onNavClick,
  isSignedIn,
  isAdminSignedIn,
  isRegistered,
  onPatientLogin,
  onOpenSignIn,
  onLogout,
  sections,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAnySignedIn = isSignedIn || isAdminSignedIn;

  const navLinks = sections ?? ALL_NAV_LINKS;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleNavClick = (e, link) => {
    e.preventDefault();
    onNavClick(link);
    setMenuOpen(false);
  };

  const handleActionClick = (handler) => {
    handler();
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <div className="navbar__logo" data-tour="navbar-logo">Dr. Hammad</div>

        <ul className="navbar__links">
          {navLinks.map((link) => (
            <li key={link}>
              <a
                href="#"
                data-tour={`nav-${link.toLowerCase()}`}
                className={`navbar__link ${active === link ? "navbar__link--active" : ""}`}
                onClick={(e) => handleNavClick(e, link)}
              >
                {link}
                {active === link && <span className="navbar__link-underline" />}
              </a>
            </li>
          ))}
        </ul>

        <div className="navbar__mobile-controls">
          <div className="navbar__actions">
            {!isAnySignedIn && (
              <>
                <button className="navbar__login" data-tour="patient-login" onClick={() => handleActionClick(onPatientLogin)}>
                  Patient Login
                </button>
                {isRegistered && (
                  <button className="navbar__signin" onClick={() => handleActionClick(onOpenSignIn)}>
                    Sign In
                  </button>
                )}
              </>
            )}

            {isAnySignedIn && (
              <>
                <button className="navbar__login" onClick={() => handleActionClick(onLogout)}>
                  Logout
                </button>
                {isSignedIn && (
                  <button className="navbar__book" data-tour="book-now" onClick={(e) => handleNavClick(e, "Appointment")}>Book Now</button>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            className={`navbar__hamburger ${menuOpen ? "navbar__hamburger--open" : ""}`}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div
        className={`navbar__mobile-overlay ${menuOpen ? "navbar__mobile-overlay--open" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`navbar__mobile-panel ${menuOpen ? "navbar__mobile-panel--open" : ""}`}>
        <button
          type="button"
          className="navbar__mobile-close"
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
        >
          x
        </button>
        <ul className="navbar__mobile-links">
          {navLinks.map((link) => (
            <li key={link}>
              <a
                href="#"
                className={`navbar__mobile-link ${active === link ? "navbar__mobile-link--active" : ""}`}
                onClick={(e) => handleNavClick(e, link)}
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </nav>
  );
}
