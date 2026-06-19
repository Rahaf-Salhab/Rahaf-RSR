import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { decodeToken } from "../../api/axiosInstance";

import styles from "./login.module.css";

import {
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

import { IconButton } from "@mui/material";

import rsrLogo from "../../assets/logo/rsrLogo.png";

const RSRLogo = () => (
  <img
    src={rsrLogo}
    alt="RSR Logo"
   className={styles.logo}
  />
);

// =========================
// ROLES
// =========================
const ROLE_LABELS = {
  Student: "Student",
  Supervisor: "Supervisor",
  Examiner: "Examiner",
  Coordinator: "Coordinator",
};

const ROLE_COLORS = {
  Student: "#22c55e",
  Supervisor: "#0ea5e9",
  Examiner: "#f59e0b",
  Coordinator: "#6366f1",
};

const AVAILABLE_ROLES = [
  "Student",
  "Supervisor",
  "Examiner",
  "Coordinator",
];

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState({
      email: "",
      password: "",
      loginAs: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showPass, setShowPass] =
    useState(false);

  const [showRoleModal,
    setShowRoleModal] =
    useState(false);

  const [
    pendingLoginData,
    setPendingLoginData,
  ] = useState(null);

  useEffect(() => {
    localStorage.clear();
  }, []);

  // =========================
  // HANDLE INPUT
  // =========================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  
    if (error) {
      setError("");
    }
  
    if (showRoleModal) {
      setShowRoleModal(false);
    }
  };

  // =========================
  // SAVE LOGIN DATA
  // =========================
  const saveLoginData = ({
    role,
    accessToken,
    refreshToken,
    decoded,
  }) => {
  
    const normalizedRole =
      role.toLowerCase();
  
    localStorage.setItem(
      "accessToken",
      accessToken
    );
  
    localStorage.setItem(
      "refreshToken",
      refreshToken || ""
    );
  
    localStorage.setItem(
      "role",
      normalizedRole
    );
  
    localStorage.setItem(
      "id",
      decoded?.id || ""
    );
  
    localStorage.setItem(
      "name",
      decoded?.name || ""
    );
  
    navigate(
      `/${normalizedRole}/home`
    );
  };

  // =========================
// LOGIN AFTER ROLE
// =========================
const handleRoleSelect = async (selectedRole) => {
  if (!pendingLoginData) return;

  try {
    setLoading(true);
    setError("");

    const response = await api.post(
      "/auth/Account/login",
      {
        email: pendingLoginData.email,
        password: pendingLoginData.password,
        loginAs: selectedRole,
      }
    );

    const success = response.data.success;

    if (!success) {
      setShowRoleModal(false);

      setError(
        response.data.message ||
        "Login failed."
      );

      return;
    }

    const accessToken =
      response.data.accessToken ||
      response.data.AccessToken;

    const refreshToken =
      response.data.refreshToken ||
      response.data.RefreshToken;

    const decoded =
      decodeToken(accessToken);

    if (!decoded) {
      setShowRoleModal(false);
      setError("Invalid token.");
      return;
    }

    setShowRoleModal(false);

    saveLoginData({
      role: selectedRole,
      accessToken,
      refreshToken,
      decoded,
    });
  } catch (err) {
    console.log(err);

    setShowRoleModal(false);

    setError(
      err.response?.data?.message ||
      "Invalid email, password, or role."
    );
  } finally {
    setLoading(false);
  }
};
  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = (
    e
  ) => {
    e.preventDefault();

    if (
      !form.email.trim() ||
      !form.password.trim()
    ) {
      setError(
        "Please fill in all fields."
      );

      return;
    }

    setPendingLoginData({
      email:
        form.email.trim(),

      password:
        form.password,
    });

    setShowRoleModal(true);
  };

  return (
    <div className={styles.page}>
      <div
        className={styles.wave}
      />

      <div
        className={styles.card}
      >
        <RSRLogo />

        <h1
          className={styles.title}
        >
          Welcome Back
        </h1>

        <p
          className={
            styles.subtitle
          }
        >
          Graduation Project
          Management Platform
        </p>

        <form
          onSubmit={
            handleSubmit
          }
          className={
            styles.form
          }
          noValidate
        >
          {/* EMAIL */}
          <div
            className={
              styles.fieldGroup
            }
          >
            <label
              className={
                styles.label
              }
            >
              Email
            </label>

            <input
              name="email"
              type="email"
              placeholder="example@ptuk.edu.ps"
              value={
                form.email
              }
              onChange={
                handleChange
              }
              className={
                styles.input
              }
            />
          </div>

          {/* PASSWORD */}
          <div
            className={
              styles.fieldGroup
            }
          >
            <label
              className={
                styles.label
              }
            >
              Password
            </label>

            <div
              className={
                styles.passwordWrapper
              }
            >
              <input
                name="password"
                type={
                  showPass
                    ? "text"
                    : "password"
                }
                placeholder="••••••••"
                value={
                  form.password
                }
                onChange={
                  handleChange
                }
                className={
                  styles.input
                }
              />

              <IconButton
                type="button"
                onClick={() =>
                  setShowPass(
                    !showPass
                  )
                }
                size="small"
                sx={{
                  position:
                    "absolute",
                  right: 8,
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                }}
              >
                {showPass ? (
                  <Visibility
                    fontSize="small"
                    sx={{
                      color:
                        "#888",
                    }}
                  />
                ) : (
                  <VisibilityOff
                    fontSize="small"
                    sx={{
                      color:
                        "#888",
                    }}
                  />
                )}
              </IconButton>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <p
              className={
                styles.error
              }
            >
              {error}
            </p>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            className={
              styles.btn
            }
            disabled={
              loading
            }
          >
            {loading ? (
              <span
                className={
                  styles.spinner
                }
              />
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* FORGOT */}
        <button
          type="button"
          className={
            styles.forgot
          }
          onClick={() =>
            navigate(
              "/forgotPassword"
            )
          }
        >
          Forgot Password?
        </button>
      </div>

      {/* ROLE MODAL */}
      {showRoleModal && (
        <div
          className={
            styles.modalOverlay
          }
          onClick={() => setShowRoleModal(false)}
        >
          <div
            className={
              styles.roleModal
            }
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className={
                styles
                  .roleModalTitle
              }
            >
              Select Your Role
            </h2>

            <p
              className={
                styles
                  .roleModalSubtitle
              }
            >
              Choose how you
              want to continue.
            </p>

            <div
              className={
                styles.roleList
              }
            >
              {AVAILABLE_ROLES.map(
                (
                  role
                ) => (
                  <button
                    key={
                      role
                    }
                    type="button"
                    className={
                      styles.roleOption
                    }
                    onClick={() =>
                      handleRoleSelect(
                        role
                      )
                    }
                    style={{
                      borderColor:
                        ROLE_COLORS[
                          role
                        ] +
                        "60",
                    }}
                  >
                    <span
                      className={
                        styles
                          .roleOptionDot
                      }
                      style={{
                        background:
                          ROLE_COLORS[
                            role
                          ],
                      }}
                    />

                    <span
                      className={
                        styles
                          .roleOptionLabel
                      }
                    >
                      {
                        ROLE_LABELS[
                          role
                        ]
                      }
                    </span>

                    <span
                      className={
                        styles
                          .roleOptionArrow
                      }
                      style={{
                        color:
                          ROLE_COLORS[
                            role
                          ],
                      }}
                    >
                      →
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}