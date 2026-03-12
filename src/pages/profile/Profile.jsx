import { useEffect, useState, useRef } from "react";
import { mockApi as api } from "../../api/axiosInstance";
import styles from "./Profile.module.css";
import {
  Person, Email, Lock, Visibility, VisibilityOff,
  CameraAlt, CheckCircle, School, ExpandMore, ExpandLess, Business
} from "@mui/icons-material";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState(null);
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  const [showPwSection, setShowPwSection] = useState(false);
  const [pwData, setPwData] = useState({ current: "", newPw: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });

  const fileRef = useRef();
  const userId = localStorage.getItem("id");
  const role = localStorage.getItem("role");

  useEffect(() => { fetchUser(); }, []);

  const fetchUser = async () => {
    setLoading(true);
    try {
      // 🔴 MOCK
      const res = await api.get(`/users/${userId}`);
      setUser(res.data);
      if (res.data.avatar) setAvatar(res.data.avatar);
      // ✅ REAL
      // const res = await api.get("/profile");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const newAvatar = ev.target.result;
      setAvatar(newAvatar);
      try {
        // 🔴 MOCK
        await api.patch(`/users/${userId}`, { avatar: newAvatar });
        // ✅ REAL
        // const formData = new FormData();
        // formData.append("avatar", file);
        // await api.post("/profile/avatar", formData);
        setAvatarSuccess(true);
        setTimeout(() => setAvatarSuccess(false), 3000);
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  const validatePw = () => {
    const errs = {};

    if (!pwData.current) {
      errs.current = "Required";
    } else if (pwData.current !== user?.password) {
      errs.current = "Current password is incorrect";
    }

    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!pwData.newPw) {
      errs.newPw = "Required";
    } else if (!pwRegex.test(pwData.newPw)) {
      errs.newPw = "Min 8 chars, uppercase, lowercase, number & special character (@$!%*?&)";
    }

    if (!pwData.confirm) {
      errs.confirm = "Required";
    } else if (pwData.newPw !== pwData.confirm) {
      errs.confirm = "Passwords don't match";
    }

    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSavePw = async () => {
    if (!validatePw()) return;
    setSavingPw(true);
    try {
      // 🔴 MOCK
      await api.patch(`/users/${userId}`, { password: pwData.newPw });
      setUser(prev => ({ ...prev, password: pwData.newPw }));
      // ✅ REAL
      // await api.put("/profile/password", { currentPassword: pwData.current, newPassword: pwData.newPw });
      setPwData({ current: "", newPw: "", confirm: "" });
      setPwErrors({});
      setPwSuccess(true);
      setShowPwSection(false);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPw(false);
    }
  };

  const getRoleColor = (r) => {
    const map = { coordinator: "#6366f1", supervisor: "#0ea5e9", examiner: "#f59e0b", student: "#22c55e" };
    return map[r] || "#C0441A";
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Profile</h1>
          <p className={styles.pageSubtitle}>View your personal information and account settings</p>
        </div>
      </div>

      <div className={styles.grid}>

        {/* Avatar Card */}
        <div className={styles.avatarCard}>
          <div className={styles.avatarWrapper}>
            {avatar ? (
              <img src={avatar} alt="avatar" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarFallback}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <button className={styles.avatarEditBtn} onClick={() => fileRef.current.click()}>
              <CameraAlt style={{ fontSize: 14 }} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          </div>
          <h2 className={styles.avatarName}>{user?.name}</h2>
          <span
            className={styles.roleBadge}
            style={{
              background: getRoleColor(role) + "18",
              color: getRoleColor(role),
              border: `1px solid ${getRoleColor(role)}40`
            }}
          >
            {role?.charAt(0).toUpperCase() + role?.slice(1)}
          </span>
          {avatarSuccess && (
            <div className={styles.avatarSuccess}>
              <CheckCircle style={{ fontSize: 14 }} /> Photo saved!
            </div>
          )}
          <p className={styles.avatarHint}>Click the camera icon to update your photo</p>
        </div>

        {/* Right Col */}
        <div className={styles.rightCol}>

          {/* Personal Info - Read Only */}
          <div className={styles.card}>
            <div className={styles.cardTitleRow}>
              <Person fontSize="small" style={{ color: "#C0441A" }} />
              <h3 className={styles.cardTitle}>Personal Information</h3>
            </div>

            <div className={styles.fields}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Full Name</label>
                  <div className={styles.fieldValue}>
                    <Person fontSize="small" className={styles.fieldIcon} />
                    {user?.name || "-"}
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Email Address</label>
                  <div className={styles.fieldValue}>
                    <Email fontSize="small" className={styles.fieldIcon} />
                    {user?.email || "-"}
                  </div>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Role</label>
                  <div className={styles.fieldValue}>
                    <Person fontSize="small" className={styles.fieldIcon} />
                    {role?.charAt(0).toUpperCase() + role?.slice(1) || "-"}
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>University</label>
                  <div className={styles.fieldValue}>
                    <Business fontSize="small" className={styles.fieldIcon} />
                    Palestine Technical University - Kadoorie
                  </div>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Faculty</label>
                  <div className={styles.fieldValue}>
                    <School fontSize="small" className={styles.fieldIcon} />
                    Faculty of Engineering & Technology
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Specialization</label>
                  <div className={styles.fieldValue}>
                    <School fontSize="small" className={styles.fieldIcon} />
                    Computer Systems Engineering
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className={styles.card}>
            <button
              className={styles.pwToggle}
              onClick={() => { setShowPwSection(p => !p); setPwErrors({}); }}
            >
              <div className={styles.cardTitleRow}>
                <Lock fontSize="small" style={{ color: "#C0441A" }} />
                <h3 className={styles.cardTitle}>Change Password</h3>
              </div>
              {showPwSection
                ? <ExpandLess fontSize="small" style={{ color: "#888" }} />
                : <ExpandMore fontSize="small" style={{ color: "#888" }} />
              }
            </button>

            {pwSuccess && (
              <div className={styles.successMsg}>
                <CheckCircle fontSize="small" /> Password changed successfully!
              </div>
            )}

            {showPwSection && (
              <div className={styles.pwBody}>
                <div className={styles.fields}>
                  {[
                    { key: "current", label: "Current Password" },
                    { key: "newPw", label: "New Password" },
                    { key: "confirm", label: "Confirm Password" },
                  ].map(({ key, label }) => (
                    <div className={styles.field} key={key}>
                      <label className={styles.fieldLabel}>{label}</label>
                      <div className={styles.pwWrapper}>
                        <input
                          className={`${styles.fieldInput} ${pwErrors[key] ? styles.inputError : ""}`}
                          type={showPw[key] ? "text" : "password"}
                          value={pwData[key]}
                          onChange={e => setPwData(p => ({ ...p, [key]: e.target.value }))}
                          placeholder="••••••••"
                        />
                        <button
                          className={styles.eyeBtn}
                          onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                        >
                          {showPw[key] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </button>
                      </div>
                      {pwErrors[key] && <p className={styles.errorText}>{pwErrors[key]}</p>}
                    </div>
                  ))}
                </div>
                <button className={styles.savePwBtn} onClick={handleSavePw} disabled={savingPw}>
                  <Lock fontSize="small" /> {savingPw ? "Saving..." : "Change Password"}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}