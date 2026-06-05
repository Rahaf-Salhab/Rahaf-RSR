import { useEffect, useState, useRef } from "react";
import api from "../../api/axiosInstance";
import styles from "./Profile.module.css";
import {
  Person, Email, Lock, Visibility, VisibilityOff,
  CameraAlt, CheckCircle, School, ExpandMore, ExpandLess,
  Business, Badge, Domain
} from "@mui/icons-material";

const ROLE_ENDPOINT = {
  student: "student",
  supervisor: "supervisor",
  examiner: "examiner",
  coordinator: "coordinater",
};

const IMAGE_ENDPOINT = {
  student: "Student/image-profile-student",
  supervisor: "Supervisor/image-profile-supervisor",
  examiner: "User/image-profile-examiner",
  coordinator: "User/image-profile-coordinater",
};

const getRoleColor = (r) => {
  const map = { coordinator: "#6366f1", supervisor: "#0ea5e9", examiner: "#f59e0b", student: "#22c55e" };
  return map[r] || "#C0441A";
};

const extractUser = (data, role) => {
  if (role === "student") {
    const u = data.student;
    return { id: u.id, fullName: u.fullName, userName: u.userName, email: u.email, pictureProfileURL: u.pictureProfileURL || "", studentNumber: u.studentNumber, college: u.college, major: u.major };
  }
  if (role === "supervisor") {
    const u = data.supervisor;
    return { id: u.id, fullName: u.fullName, userName: u.userName, email: u.email, pictureProfileURL: u.pictureProfileURL || "", supervisorNumber: u.supervisorNumber, department: u.department };
  }
  if (role === "examiner") {
    const u = data.examiner;
    return { id: u.id, fullName: u.fullName, userName: u.userName, email: u.email, pictureProfileURL: u.pictureProfileURL || "", examinerNumber: u.examinerNumber, department: u.department };
  }
  if (role === "coordinator") {
    const u = data.coordinater;
    return { id: u.id, fullName: u.fullName, userName: u.userName, email: u.email, pictureProfileURL: u.pictureProfileURL || "", coordinatorNumber: u.coordinatorNumber, department: u.department };
  }
  return null;
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const [avatarError, setAvatarError] = useState("");

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
    setFetchError("");
    try {
      const endpoint = ROLE_ENDPOINT[role];
      if (!endpoint) throw new Error("Unknown role");
      const res = await api.get(`/User/${endpoint}/${userId}`);
      const extracted = extractUser(res.data, role);
      console.log("userId:", userId);    
      console.log("role:", role); 
      setUser(extracted);
    } catch (err) {
      console.error("fetchUser error:", err);
      setFetchError("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    setAvatarError("");
    setAvatarSuccess(false);
    try {
      const formData = new FormData();
      formData.append("MainImage", file);
      await api.post(`/${IMAGE_ENDPOINT[role]}`, formData);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUser(prev => ({ ...prev, pictureProfileURL: ev.target.result }));
      };
      reader.readAsDataURL(file);
      setAvatarSuccess(true);
      setTimeout(() => setAvatarSuccess(false), 3000);
    } catch (err) {
      setAvatarError("Failed to upload image. Please try again.");
      console.error("avatarUpload error:", err);
    } finally {
      setAvatarLoading(false);
      e.target.value = "";
    }
  };

  const validatePw = () => {
    const errs = {};
    if (!pwData.current) errs.current = "Required";
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!pwData.newPw) errs.newPw = "Required";
    else if (!pwRegex.test(pwData.newPw)) errs.newPw = "Min 8 chars, uppercase, lowercase, number & special character";
    if (!pwData.confirm) errs.confirm = "Required";
    else if (pwData.newPw !== pwData.confirm) errs.confirm = "Passwords don't match";
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSavePw = async () => {
    if (!validatePw()) return;
    setSavingPw(true);
    try {
      // ✅ REAL — لما يجهز الـ endpoint
      // await api.patch("/auth/Account/change-password", {
      //   currentPassword: pwData.current,
      //   newPassword: pwData.newPw,
      // });
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

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (fetchError) return <div className={styles.loading}>{fetchError}</div>;
  if (!user) return null;

  const idNumber =
    role === "student" ? user.studentNumber :
    role === "supervisor" ? user.supervisorNumber :
    role === "examiner" ? user.examinerNumber :
    role === "coordinator" ? user.coordinatorNumber : "-";

  const idLabel =
    role === "student" ? "Student Number" :
    role === "supervisor" ? "Supervisor Number" :
    role === "examiner" ? "Examiner Number" :
    role === "coordinator" ? "Coordinator Number" : "ID";

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
            {user.pictureProfileURL ? (
              <img src={user.pictureProfileURL} alt="avatar" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarFallback}>
                {user.fullName?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <button
              className={styles.avatarEditBtn}
              onClick={() => fileRef.current.click()}
              disabled={avatarLoading}
            >
              <CameraAlt style={{ fontSize: 14 }} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
          </div>

          <h2 className={styles.avatarName}>{user.fullName}</h2>
          <span
            className={styles.roleBadge}
            style={{
              background: getRoleColor(role) + "18",
              color: getRoleColor(role),
              border: `1px solid ${getRoleColor(role)}40`,
            }}
          >
            {role?.charAt(0).toUpperCase() + role?.slice(1)}
          </span>

          {avatarLoading && (
            <p style={{ fontSize: 12, color: "#888", margin: 0 }}>Uploading...</p>
          )}
          {avatarSuccess && (
            <div className={styles.avatarSuccess}>
              <CheckCircle style={{ fontSize: 14 }} /> Photo saved!
            </div>
          )}
          {avatarError && (
            <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>{avatarError}</p>
          )}

          <p className={styles.avatarHint}>Click the camera icon to update your photo</p>
        </div>

        {/* Right Col */}
        <div className={styles.rightCol}>

          {/* Personal Info */}
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
                    {user.fullName || "-"}
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Username</label>
                  <div className={styles.fieldValue}>
                    <Badge fontSize="small" className={styles.fieldIcon} />
                    {user.userName || "-"}
                  </div>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Email Address</label>
                  <div className={styles.fieldValue}>
                    <Email fontSize="small" className={styles.fieldIcon} />
                    {user.email || "-"}
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>{idLabel}</label>
                  <div className={styles.fieldValue}>
                    <Badge fontSize="small" className={styles.fieldIcon} />
                    {idNumber || "-"}
                  </div>
                </div>
              </div>

              {role === "student" && (
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>College</label>
                    <div className={styles.fieldValue}>
                      <School fontSize="small" className={styles.fieldIcon} />
                      {user.college || "-"}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Major</label>
                    <div className={styles.fieldValue}>
                      <School fontSize="small" className={styles.fieldIcon} />
                      {user.major || "-"}
                    </div>
                  </div>
                </div>
              )}

              {["supervisor", "examiner", "coordinator"].includes(role) && (
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Department</label>
                    <div className={styles.fieldValue}>
                      <Domain fontSize="small" className={styles.fieldIcon} />
                      {user.department || "-"}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>University</label>
                    <div className={styles.fieldValue}>
                      <Business fontSize="small" className={styles.fieldIcon} />
                      Palestine Technical University
                    </div>
                  </div>
                </div>
              )}
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