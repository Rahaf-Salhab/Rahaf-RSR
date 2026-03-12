import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import styles from "./forgotPassword.module.css";
import rsrLogo from "../../assets/logo/rsrLogo.png";

const RSRLogo = () => (
  <img src={rsrLogo} alt="RSR Logo" style={{ width: "80px", marginBottom: "4px" }} />
);

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      // ✅ REAL
      await api.post("/auth/Account/send-code", { Email: email });
      sessionStorage.setItem("resetEmail", email);
      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 400) {
        setError("Email not found.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.wave} />
      <div className={styles.card}>
        <RSRLogo />
        <h1 className={styles.title}>Forgot Password?</h1>
        <p className={styles.subtitle}>
          Enter your email and we'll send you a reset code
        </p>

        {success ? (
          <div className={styles.successBox}>
            ✅ A reset code has been sent to <strong>{email}</strong>
            <button
              className={styles.btn}
              style={{ marginTop: "20px" }}
              onClick={() => navigate("/send-code")}
            >
              Enter Code
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Email</label>
              <input
                name="email"
                type="email"
                placeholder="ahmad@ptuk.edu.ps"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                className={styles.input}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : "Send Reset Code"}
            </button>
          </form>
        )}

        <button
          type="button"
          className={styles.back}
          onClick={() => navigate("/login")}
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
}