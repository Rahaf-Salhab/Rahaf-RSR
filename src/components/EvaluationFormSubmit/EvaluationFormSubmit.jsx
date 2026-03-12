import { useEffect, useState } from "react";
import { mockApi as api } from "../../api/axiosInstance";
import styles from "./EvaluationFormSubmit.module.css";
import {
  RateReview, Close, CheckCircle, HourglassEmpty, Group, Lock
} from "@mui/icons-material";

export default function EvaluationFormSubmit({ role }) {
  const [forms, setForms] = useState([]);
  const [groups, setGroups] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState(null);

  const userId = localStorage.getItem("id");
  const assignTo = role === "examiner" ? "Examiner" : "Supervisor";

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 🔴 MOCK
      const [formsRes, groupsRes, gradesRes, finalGradesRes] = await Promise.all([
        api.get("/evaluationForms"),
        api.get("/groups"),
        api.get("/grades"),
        api.get("/finalGrades"),
      ]);

      const publishedForms = formsRes.data.filter(f =>
        f.assignTo === assignTo && f.status === "published"
      );
      const latestForm = publishedForms
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 1);
      setForms(latestForm);

      // شيل الـ groups الـ published من القائمة
      const myGroups = groupsRes.data.filter(g => {
        const isMyGroup = role === "examiner" ? g.examinerId === userId : g.supervisorId === userId;
        const isPublished = finalGradesRes.data.some(f => f.groupId === g.id && f.status === "published");
        return isMyGroup && !isPublished;
      });

      setGroups(myGroups);
      setGrades(gradesRes.data);

      // ✅ REAL
      // const [formsRes, groupsRes, gradesRes, finalGradesRes] = await Promise.all([
      //   api.get(`/${role}/evaluation-forms`),
      //   api.get(`/${role}/groups`),
      //   api.get(`/${role}/grades`),
      //   api.get(`/${role}/final-grades`),
      // ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitted = (formId, groupId) =>
    grades.some(g => g.formId === formId && g.groupId === groupId && g.role === role);

  const getSubmittedGrade = (formId, groupId) =>
    grades.find(g => g.formId === formId && g.groupId === groupId && g.role === role);

  const submittedCount = (formId) =>
    groups.filter(g => isSubmitted(formId, g.id)).length;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Evaluation Forms</h1>
          <p className={styles.pageSubtitle}>Submit grades for your assigned groups</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : forms.length === 0 ? (
        <div className={styles.emptyBox}>
          <RateReview style={{ fontSize: 56, color: "#ddd" }} />
          <p>No evaluation forms assigned to you yet.</p>
        </div>
      ) : groups.length === 0 ? (
        <div className={styles.emptyBox}>
          <Lock style={{ fontSize: 56, color: "#ddd" }} />
          <p>All your groups have been finalized and published.</p>
        </div>
      ) : (
        <div className={styles.formsList}>
          {forms.map(form => (
            <div key={form.id} className={styles.formCard} onClick={() => setSelectedForm(form)}>
              <div className={styles.formCardLeft}>
                <div className={styles.formIcon}><RateReview /></div>
                <div>
                  <h3 className={styles.formTitle}>{form.title}</h3>
                  {form.description && <p className={styles.formDesc}>{form.description}</p>}
                  <div className={styles.formMeta}>
                    <span className={styles.metaItem}>
                      <Group fontSize="small" /> {groups.length} Groups
                    </span>
                    <span className={styles.metaItem}>
                      <CheckCircle fontSize="small" /> {submittedCount(form.id)} Submitted
                    </span>
                    <span className={styles.metaItem}>
                      <HourglassEmpty fontSize="small" /> {groups.length - submittedCount(form.id)} Pending
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.formCardRight}>
                <div className={styles.progressWrap}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: groups.length > 0
                          ? `${(submittedCount(form.id) / groups.length) * 100}%`
                          : "0%"
                      }}
                    />
                  </div>
                  <span className={styles.progressText}>
                    {groups.length > 0
                      ? Math.round((submittedCount(form.id) / groups.length) * 100)
                      : 0}%
                  </span>
                </div>
                <button className={styles.openBtn}>Open →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedForm && (
        <FormDetailModal
          form={selectedForm}
          groups={groups}
          role={role}
          userId={userId}
          isSubmitted={isSubmitted}
          getSubmittedGrade={getSubmittedGrade}
          onClose={() => setSelectedForm(null)}
          onSubmit={(newGrade) => {
            setGrades(prev => [
              ...prev.filter(g => !(g.formId === newGrade.formId && g.groupId === newGrade.groupId && g.role === role)),
              newGrade
            ]);
          }}
        />
      )}
    </div>
  );
}

// ── Form Detail Modal ───────────────────────────────────────────────
function FormDetailModal({ form, groups, role, userId, isSubmitted, getSubmittedGrade, onClose, onSubmit }) {
  const [selectedGroup, setSelectedGroup] = useState(null);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>{form.title}</h3>
            {form.description && <p className={styles.modalSubtitle}>{form.description}</p>}
          </div>
          <button className={styles.closeBtn} onClick={onClose}><Close fontSize="small" /></button>
        </div>

        <div className={styles.modalBody}>
          {!selectedGroup ? (
            <div className={styles.groupsList}>
              <p className={styles.groupsLabel}>Select a group to evaluate:</p>
              {groups.map(group => {
                const submitted = isSubmitted(form.id, group.id);
                const grade = getSubmittedGrade(form.id, group.id);
                return (
                  <div
                    key={group.id}
                    className={`${styles.groupRow} ${submitted ? styles.groupSubmitted : ""}`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className={styles.groupRowLeft}>
                      <div className={styles.groupAvatar}>{group.name.charAt(0)}</div>
                      <div>
                        <p className={styles.groupName}>{group.name}</p>
                        {submitted && (
                          <p className={styles.submittedInfo}>
                            Submitted · Total: {grade?.total} pts
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={styles.groupRowRight}>
                      {submitted ? (
                        <span className={styles.submittedBadge}>
                          <CheckCircle fontSize="small" /> Submitted
                        </span>
                      ) : (
                        <span className={styles.pendingBadge}>
                          <HourglassEmpty fontSize="small" /> Pending
                        </span>
                      )}
                      <span className={styles.arrowIcon}>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <GradeForm
              form={form}
              group={selectedGroup}
              role={role}
              userId={userId}
              existingGrade={getSubmittedGrade(form.id, selectedGroup.id)}
              onBack={() => setSelectedGroup(null)}
              onSubmit={(grade) => {
                onSubmit(grade);
                setSelectedGroup(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Grade Form ──────────────────────────────────────────────────────
function GradeForm({ form, group, role, userId, existingGrade, onBack, onSubmit }) {
  const [values, setValues] = useState(() => {
    const init = {};
    form.fields.forEach(f => {
      init[f.id] = existingGrade?.fields?.find(ef => ef.fieldName === f.fieldName)?.value ?? "";
    });
    return init;
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (fieldId, value) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
    setError("");
  };

  const handleSubmit = async () => {
    for (const field of form.fields) {
      const val = Number(values[field.id]);
      if (values[field.id] === "" || isNaN(val)) {
        setError(`Please enter a value for "${field.fieldName}".`);
        return;
      }
      if (val < Number(field.minValue) || val > Number(field.maxValue)) {
        setError(`"${field.fieldName}" must be between ${field.minValue} and ${field.maxValue}.`);
        return;
      }
    }

    const total = form.fields.reduce((sum, f) => sum + Number(values[f.id]), 0);
    const gradeData = {
      id: existingGrade?.id || Date.now().toString(),
      groupId: group.id,
      groupName: group.name,
      formId: form.id,
      submittedBy: userId,
      role,
      fields: form.fields.map(f => ({ fieldName: f.fieldName, value: Number(values[f.id]) })),
      total,
      status: "submitted",
      createdAt: new Date().toISOString(),
    };

    setLoading(true);
    try {
      // 🔴 MOCK
      if (existingGrade) {
        await api.put(`/grades/${existingGrade.id}`, gradeData);
      } else {
        await api.post("/grades", gradeData);
      }
      // ✅ REAL
      // if (existingGrade) await api.put(`/grades/${existingGrade.id}`, gradeData);
      // else await api.post("/grades", gradeData);

      setSuccess(true);
      setTimeout(() => { onSubmit(gradeData); }, 1200);
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.successBox}>
        <CheckCircle style={{ fontSize: 48, color: "#22c55e" }} />
        <p className={styles.successText}>Grades submitted successfully!</p>
      </div>
    );
  }

  return (
    <div className={styles.gradeForm}>
      <button className={styles.backBtn} onClick={onBack}>← Back</button>
      <div className={styles.gradeFormHeader}>
        <h4 className={styles.gradeGroupName}>{group.name}</h4>
        <p className={styles.gradeFormHint}>Enter grades within the allowed range for each field</p>
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      <div className={styles.fieldsTable}>
        <div className={styles.fieldsTableHeader}>
          <span>Field</span>
          <span>Range</span>
          <span>Grade</span>
        </div>
        {form.fields.map(field => (
          <div key={field.id} className={styles.fieldRow}>
            <span className={styles.fieldName}>{field.fieldName}</span>
            <span className={styles.fieldRange}>{field.minValue} – {field.maxValue}</span>
            <input
              type="number"
              className={styles.gradeInput}
              value={values[field.id]}
              onChange={(e) => handleChange(field.id, e.target.value)}
              min={field.minValue}
              max={field.maxValue}
              placeholder={`${field.minValue}-${field.maxValue}`}
            />
          </div>
        ))}
        <div className={styles.totalRow}>
          <span>Total</span>
          <span></span>
          <span className={styles.totalValue}>
            {form.fields.reduce((sum, f) => sum + (Number(values[f.id]) || 0), 0)} pts
          </span>
        </div>
      </div>

      <div className={styles.gradeFormFooter}>
        <button className={styles.cancelBtn} onClick={onBack}>Cancel</button>
        <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : existingGrade ? "Update Grades" : "Submit Grades"}
        </button>
      </div>
    </div>
  );
}