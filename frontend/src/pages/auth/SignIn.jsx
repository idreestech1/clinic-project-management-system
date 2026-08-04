import { useState } from "react";
import "./Auth.css";

export default function SignIn({ isRegistered, onOpenRegister, onSignIn }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    const result = await onSignIn(form);
    setLoading(false);

    if (!result.success) {
      if (result.reason === "no_account") {
        setError("No patient account found. Please register first.");
      } else {
        setError(result.message || "Invalid email or password.");
      }
      return;
    }

    setError("");
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Patient Sign In</h1>
        <p className="auth-subtitle">Sign in to access all pages including appointment booking.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">Email</label>
          <input
            className="auth-input"
            name="email"
            type="email"
            placeholder="john@example.com"
            value={form.email}
            onChange={handleChange}
          />

          <label className="auth-label">Password</label>
          <input
            className="auth-input"
            name="password"
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-primary" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {!isRegistered && (
          <p className="auth-switch">
            New patient?{" "}
            <button type="button" onClick={onOpenRegister}>
              Register
            </button>
          </p>
        )}
      </div>
    </section>
  );
}
