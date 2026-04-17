import { useState } from "react";
import { Close, Search } from "@mui/icons-material";
import styles from "./SupervisorGroups.module.css";

export default function EditGroupModal({
  group,
  students,
  assignedStudentNumbers,
  saveLoading,
  saveError,
  onClose,
  onSave,
  onClearError,
}) {
  const [form, setForm] = useState(group);
  const [localError, setLocalError] = useState("");
  const [studentSearch, setStudentSearch] = useState(""); // قائمة البحث عن الطلاب

  const displayError = saveError || localError;

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.studentNumber || "").includes(studentSearch),
  );

const isStudentAssigned = (student) => {
  const currentIds = form.StudentIds || [];
  const currentStudentNumbers = form.CurrentStudentNumbers || [];

  const isInCurrentGroupById = currentIds.includes(student.id);
  const isInCurrentGroupByNumber = currentStudentNumbers.includes(
    String(student.studentNumber).trim(),
  );

  // إذا الطالب من نفس الجروب الحالي، لا نعتبره محجوز
  if (isInCurrentGroupById || isInCurrentGroupByNumber) return false;

  // إذا موجود بجروب آخر، نمنعه
  return assignedStudentNumbers.includes(
    String(student.studentNumber).trim(),
  );
};

  const handleStudentToggle = (student) => {
    // add or remove student from group
    if (isStudentAssigned(student)) return;

   setForm((prev) => ({
  ...prev,
StudentIds: (prev.StudentIds || []).includes(student.id)
  ? prev.StudentIds.filter((id) => id !== student.id)
  : [...(prev.StudentIds || []), student.id],
}));

    setLocalError("");
    onClearError?.();
  };

  const handleChange = (field, value) => {
    //
    setForm((prev) => ({ ...prev, [field]: value }));
    setLocalError("");
    onClearError?.();
  };

  const handleSubmit = () => {
    // validate form data
    if (!form.GroupName?.trim()) {
      setLocalError("Group name is required.");
      return;
    }

    if (!form.ProjectName?.trim()) {
      setLocalError("Project name is required.");
      return;
    }

    if (!form.ProjectIdea?.trim()) {
      setLocalError("Project idea is required.");
      return;
    }

    if (!form.StudentIds || form.StudentIds.length === 0) {
      setLocalError("Please select at least one student.");
      return;
    }

    setLocalError("");
    onSave(form);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Edit Group</h3>

          <button className={styles.closeBtn} onClick={onClose}>
            <Close fontSize="small" />
          </button>
        </div>

        <div className={styles.modalBody}>
          {displayError && <p className={styles.errorMsg}>{displayError}</p>}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Group Name <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              value={form.GroupName}
              onChange={(e) => handleChange("GroupName", e.target.value)}
              placeholder="e.g. Group A"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Project Name <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              value={form.ProjectName}
              onChange={(e) => handleChange("ProjectName", e.target.value)}
              placeholder="e.g. RSR Platform"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Project Idea <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              value={form.ProjectIdea}
              onChange={(e) => handleChange("ProjectIdea", e.target.value)}
              placeholder="e.g. Graduation Project Management System"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Description <span className={styles.optional}>(Optional)</span>
            </label>
            <input
              className={styles.input}
              value={form.Description}
              onChange={(e) => handleChange("Description", e.target.value)}
              placeholder="Short description"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Students <span className={styles.required}>*</span>
            </label>

            <div className={styles.studentSearchWrapper}>
              <Search className={styles.studentSearchIcon} fontSize="small" />
              <input
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className={styles.studentSearchInput}
              />
            </div>

            <div className={styles.studentsCheckList}>
              {filteredStudents.map((s) => {
                const assigned = isStudentAssigned(s);

                return (
                  <label
                    key={s.id}
                    className={`${styles.checkLabel} ${
                      assigned ? styles.checkLabelDisabled : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.StudentIds.includes(s.id)}
                      onChange={() => handleStudentToggle(s)}
                      disabled={assigned}
                    />
                    <span>{s.fullName}</span>
                    {s.studentNumber && (
                      <span className={styles.studentId}>
                        #{s.studentNumber}
                      </span>
                    )}
                    {assigned && (
                      <span className={styles.assignedBadge}>
                        Already in a group
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>

          <button
            className={styles.saveBtn}
            onClick={handleSubmit}
            disabled={saveLoading}
          >
            {saveLoading ? "Saving..." : "Update Group"}
          </button>
        </div>
      </div>
    </div>
  );
}
