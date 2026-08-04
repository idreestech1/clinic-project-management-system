import { useState } from "react";
import "./Auth.css";

export default function Register({ isRegistered, onRegister, onOpenSignIn }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.confirmPassword.trim()) {
      setError("Please fill all fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);
    const result = await onRegister({ name: form.name, email: form.email, password: form.password });
    setLoading(false);

    if (!result?.success) {
      setError(result?.message || "Unable to register. Please try again.");
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Patient Registration</h1>
        <p className="auth-subtitle">Create your account to access appointment booking.</p>

        {isRegistered && (
          <p className="auth-info">
            You are already registered. You can go directly to <button onClick={onOpenSignIn}>Sign In</button>.
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">Full Name</label>
          <input
            className="auth-input"
            name="name"
            placeholder="John Doe"
            value={form.name}
            onChange={handleChange}
          />

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

          <label className="auth-label">Confirm Password</label>
          <input
            className="auth-input"
            name="confirmPassword"
            type="password"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={handleChange}
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-primary" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="auth-switch">
          Already registered?{" "}
          <button type="button" onClick={onOpenSignIn}>
            Sign In
          </button>
        </p>
      </div>
    </section>
  );
}
