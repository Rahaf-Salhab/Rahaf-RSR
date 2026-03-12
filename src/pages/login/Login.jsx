import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { decodeToken } from "../../api/axiosInstance";
import styles from "./login.module.css";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import rsrLogo from "../../assets/logo/rsrLogo.png";

const RSRLogo = () => (
  <img
    src={rsrLogo}
    alt="RSR Logo"
    style={{ width: "80px", marginBottom: "4px" }}
  />
);

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/Account/login", {
        email: form.email,
        password: form.password,
      });

      const { accessToken, refreshToken } = res.data;
      const decoded = decodeToken(accessToken);

      if (!decoded) {
        setError("Something went wrong. Please try again.");
        return;
      }

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken || "");
      localStorage.setItem("role", decoded.role.toLowerCase());
      localStorage.setItem("id", decoded.id);
      localStorage.setItem("name", decoded.name);

      navigate(`/${decoded.role.toLowerCase()}/home`);

    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError("Invalid email or password.");
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
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>
          Graduation Project Management Platform
        </p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Email</label>
            <input
              name="email"
              type="email"
              placeholder="ahmad@ptuk.edu.ps"
              value={form.email}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Password</label>
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
                sx={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                {showPass ? (
                  <Visibility fontSize="small" sx={{ color: "#888" }} />
                ) : (
                  <VisibilityOff fontSize="small" sx={{ color: "#888" }} />
                )}
              </IconButton>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : "Login"}
          </button>
        </form>

        <button
          type="button"
          className={styles.forgot}
          onClick={() => navigate("/forgotPassword")}
        >
          Forgot Password?
        </button>
      </div>
    </div>
  );
}