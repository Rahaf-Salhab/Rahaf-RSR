import { useState } from "react";
import styles from "./Users.module.css";
import { Close } from "@mui/icons-material";

const ID_LABEL = {
  student: "Student Number",
  supervisor: "Supervisor Number",
  coordinator: "Coordinator Number",
};

const getRoleLabel = (role) => {
  if (!role) return "User";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export default function EditUserModal({
  user,
  externalError,
  saveLoading,
  onClose,
  onSave,
  onClearError,
}) {
  //  وليس فارغPreFilled Data بفتح Modal ال
  const [form, setForm] = useState({
    id: user?.id || "",
    fullName: user?.fullName || user?.name || "",
    userName: user?.userName || "",
    email: user?.email || "",
    role: user?.role || "",
    number: user?.number || user?.userId || "",
    department: user?.department || "",
    college: user?.college || "",
    major: user?.major || "",
  });

  const [localError, setLocalError] = useState("");
  const displayError = externalError || localError;
  const roleLabel = getRoleLabel(form.role);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setLocalError("");
    onClearError?.();
  };

  const validate = () => {
    if (!form.fullName.trim()) return "Full Name is required.";
    if (!form.userName.trim()) return "Username is required.";
    if (!form.email.trim()) return "Email is required.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email))
      return "Please enter a valid email address.";

    if (!form.number.trim())
      return `${ID_LABEL[form.role] || "ID"} is required.`;

    if (form.role === "student") {
      if (!form.college.trim()) return "College is required.";
      if (!form.major.trim()) return "Major is required.";
    }

    if (["supervisor", "coordinator", "examiner"].includes(form.role)) {
      if (!form.department.trim()) return "Department is required.";
    }

    return null;
  };

  const handleSave = () => {
    const err = validate();
    if (err) {
      setLocalError(err);
      return;
    }

    setLocalError("");
    onSave(form);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Edit {roleLabel}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <Close fontSize="small" />
          </button>
        </div>

        <div className={styles.modalBody}>
          {displayError && <p className={styles.errorMsg}>{displayError}</p>}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Full Name <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              placeholder="e.g. Ahmad Khalil"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Username <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              value={form.userName}
              onChange={(e) => handleChange("userName", e.target.value)}
              placeholder="e.g. ahmad.khalil"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Email <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="e.g. ahmad@ptuk.edu.ps"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              {ID_LABEL[form.role] || "ID"}{" "}
              <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              value={form.number}
              onChange={(e) => handleChange("number", e.target.value)}
              placeholder="e.g. 1201234"
            />
          </div>

          {["supervisor", "coordinator", "examiner"].includes(form.role) && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Department <span className={styles.required}>*</span>
              </label>
              <input
                className={styles.input}
                value={form.department}
                onChange={(e) => handleChange("department", e.target.value)}
                placeholder="e.g. Computer Engineering"
              />
            </div>
          )}

          {form.role === "student" && (
            <>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  College <span className={styles.required}>*</span>
                </label>
                <input
                  className={styles.input}
                  value={form.college}
                  onChange={(e) => handleChange("college", e.target.value)}
                  placeholder="e.g. Engineering"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Major <span className={styles.required}>*</span>
                </label>
                <input
                  className={styles.input}
                  value={form.major}
                  onChange={(e) => handleChange("major", e.target.value)}
                  placeholder="e.g. Computer Engineering"
                />
              </div>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={saveLoading}
          >
            Cancel
          </button>

          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saveLoading}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
