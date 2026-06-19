import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import styles from "./resetPassword.module.css";
import rsrLogo from "../../assets/logo/rsrLogo.png";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton } from "@mui/material";

const RSRLogo = () => (
  <img src={rsrLogo} alt="RSR Logo" className={styles.logo} />
);

export default function ResetPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.password.trim() || !form.confirmPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const Email = sessionStorage.getItem("resetEmail");
      const code  = sessionStorage.getItem("resetCode");

      await api.post("/auth/Account/reset-password", {
        code,
        Email,
        newPassword: form.password,
      });

      sessionStorage.removeItem("resetEmail");
      sessionStorage.removeItem("resetCode");
      setSuccess(true);

    } catch (err) {
      if (err.response?.status === 400) {
        setError("Invalid or expired code.");
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
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.subtitle}>Enter your new password below</p>

        {success ? (
          <div className={styles.successBox}>
            ✅ Password reset successfully!
            <button
              className={styles.btn}
              style={{ marginTop: "20px" }}
              onClick={() => navigate("/login")}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>New Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={styles.input}
                />
                <IconButton
                  type="button"
                  onClick={() => setShowPass((prev) => !prev)}
                  size="small"
                  sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}
                >
                  {showPass
                    ? <Visibility fontSize="small" sx={{ color: "#888" }} />
                    : <VisibilityOff fontSize="small" sx={{ color: "#888" }} />
                  }
                </IconButton>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Confirm Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={styles.input}
                />
                <IconButton
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  size="small"
                  sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}
                >
                  {showConfirm
                    ? <Visibility fontSize="small" sx={{ color: "#888" }} />
                    : <VisibilityOff fontSize="small" sx={{ color: "#888" }} />
                  }
                </IconButton>
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : "Reset Password"}
            </button>
          </form>
        )}

        <button type="button" className={styles.back} onClick={() => navigate("/send-code")}>
          ← Back
        </button>
      </div>
    </div>
  );
}