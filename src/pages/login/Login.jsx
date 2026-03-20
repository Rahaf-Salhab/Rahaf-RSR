import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { decodeToken } from "../../api/axiosInstance";
import styles from "./login.module.css";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import rsrLogo from "../../assets/logo/rsrLogo.png";

const RSRLogo = () => (
  <img src={rsrLogo} alt="RSR Logo" style={{ width: "80px", marginBottom: "4px" }} />
);

const ROLE_LABELS = {
  student: "Student",
  supervisor: "Supervisor",
  examiner: "Examiner",
  coordinator: "Coordinator",
};

const ROLE_COLORS = {
  student: "#22c55e",
  supervisor: "#0ea5e9",
  examiner: "#f59e0b",
  coordinator: "#6366f1",
};

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Role selection modal
  const [pendingData, setPendingData] = useState(null); // { roles, accessToken, refreshToken, decoded }
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    localStorage.clear();
  }, []);

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

      const { accessToken, refreshToken, success, roles } = res.data;

      if (!success) {
        setError("Something went wrong. Please try again.");
        return;
      }

      const decoded = decodeToken(accessToken);
      if (!decoded) {
        setError("Invalid token. Please try again.");
        return;
      }

      const normalizedRoles = (roles || []).map(r => r.toLowerCase());

      if (normalizedRoles.length === 1) {
        // مستخدم بـ role واحد — ينتقل مباشرة
        saveAndNavigate(normalizedRoles[0], accessToken, refreshToken, decoded);
      } else {
        // أكثر من role — أعرض modal الاختيار
        setPendingData({ roles: normalizedRoles, accessToken, refreshToken, decoded });
        setShowRoleModal(true);
      }

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

  const saveAndNavigate = (role, accessToken, refreshToken, decoded) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken || "");
    localStorage.setItem("role", role);
    localStorage.setItem("id", decoded.id);
    localStorage.setItem("name", decoded.name);
    navigate(`/${role}/home`);
  };

  const handleRoleSelect = (role) => {
    if (!pendingData) return;
    const { accessToken, refreshToken, decoded } = pendingData;
    setShowRoleModal(false);
    saveAndNavigate(role, accessToken, refreshToken, decoded);
  };

  return (
    <div className={styles.page}>
      <div className={styles.wave} />
      <div className={styles.card}>
        <RSRLogo />
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Graduation Project Management Platform</p>

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
                onClick={() => setShowPass(prev => !prev)}
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

      {/* Role Selection Modal */}
      {showRoleModal && pendingData && (
        <div className={styles.modalOverlay}>
          <div className={styles.roleModal}>
            <h2 className={styles.roleModalTitle}>Select Your Role</h2>
            <p className={styles.roleModalSubtitle}>
              You have multiple roles. Please choose how you'd like to sign in.
            </p>
            <div className={styles.roleList}>
              {pendingData.roles.map(role => (
                <button
                  key={role}
                  className={styles.roleOption}
                  onClick={() => handleRoleSelect(role)}
                  style={{ borderColor: ROLE_COLORS[role] + "60" }}
                >
                  <span
                    className={styles.roleOptionDot}
                    style={{ background: ROLE_COLORS[role] }}
                  />
                  <span className={styles.roleOptionLabel}>
                    {ROLE_LABELS[role] || role}
                  </span>
                  <span
                    className={styles.roleOptionArrow}
                    style={{ color: ROLE_COLORS[role] }}
                  >
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}