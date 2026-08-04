import "./Footer.css";

const LINKS = ["Privacy Policy", "Terms of Service", "HIPAA Compliance", "Contact Support"];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__copy">
          © 2024 DR. HAMMAD MEDICAL PRACTICE. ALL RIGHTS RESERVED.
        </p>
        <nav className="footer__links">
          {LINKS.map((link) => (
            <a key={link} href="#" className="footer__link">
              {link.toUpperCase()}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}