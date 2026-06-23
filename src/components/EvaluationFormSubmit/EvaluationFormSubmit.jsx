import { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import styles from "./EvaluationFormSubmit.module.css";
import {
  RateReview, Close, CheckCircle, HourglassEmpty, Group, Lock
} from "@mui/icons-material";

export default function EvaluationFormSubmit({ role }) {
  const [form, setForm] = useState(null);
  const [groups, setGroups] = useState([]);
  const [submittedGroupIds, setSubmittedGroupIds] = useState([]);
  const [submittedTotals, setSubmittedTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState(null);

  const groupsEndpoint = role === "supervisor"
    ? "/Group/groups-supervisor"
    : "/Groups/groups-examiner";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [formsRes, groupsRes] = await Promise.all([
        api.get("/Evaluation/EvaluationSubmissions/my-forms"),
        api.get(groupsEndpoint),
      ]);

      const forms = formsRes.data || [];
      const latest = forms
        .filter((f) => f.status === 2)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;

      setForm(latest);

      const myGroups = groupsRes.data?.groups || [];
      setGroups(myGroups);

       if (latest && myGroups.length > 0) {
        try {
          const submittedRes = await api.get(
            `/Evaluation/EvaluationSubmissions/my-submissions/${latest.id}`
          );
          console.log("MY SUBMISSIONS:", submittedRes.data);

          // submittedRes.data = [{ groupId, total }, ...]
          const ids = (submittedRes.data || []).map(s => s.groupId);
          const totals = {};
          (submittedRes.data || []).forEach(s => {
            totals[s.groupId] = s.total;
          });

          setSubmittedGroupIds(ids);
          setSubmittedTotals(totals);
        } catch (e) {
          console.error("Could not fetch submissions:", e);
        }
      }

    } catch (err) {
      console.error("FETCH ERROR =", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGrade = (groupId, total) => {
    setSubmittedGroupIds(prev => [...prev, groupId]);
    setSubmittedTotals(prev => ({ ...prev, [groupId]: total }));
  };

  const isSubmitted = (groupId) =>
    submittedGroupIds.some(id => String(id) === String(groupId));

  const submittedCount = groups.filter(g => isSubmitted(g.groupId)).length;
  const totalGroups = groups.length;

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
      ) : !form ? (
        <div className={styles.emptyBox}>
          <RateReview style={{ fontSize: 56, color: "#ddd" }} />
          <p>No evaluation forms assigned to you yet.</p>
        </div>
      ) : groups.length === 0 ? (
        <div className={styles.emptyBox}>
          <Lock style={{ fontSize: 56, color: "#ddd" }} />
          <p>You have no assigned groups.</p>
        </div>
      ) : (
        <div className={styles.formsList}>
          <div
            className={styles.formCard}
            onClick={() => setSelectedForm(form)}
            style={submittedCount === totalGroups ? { cursor: "default", opacity: 0.75 } : {}}
          >
            <div className={styles.formCardLeft}>
              <div className={styles.formIcon}>
                {submittedCount === totalGroups ? <Lock /> : <RateReview />}
              </div>
              <div>
                <h3 className={styles.formTitle}>{form.title}</h3>
                {form.description && <p className={styles.formDesc}>{form.description}</p>}
                <div className={styles.formMeta}>
                  <span className={styles.metaItem}>
                    <Group fontSize="small" /> {totalGroups} Groups
                  </span>
                  <span className={styles.metaItem}>
                    <CheckCircle fontSize="small" /> {submittedCount} Submitted
                  </span>
                  <span className={styles.metaItem}>
                    <HourglassEmpty fontSize="small" /> {totalGroups - submittedCount} Pending
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
                      width: totalGroups > 0
                        ? `${(submittedCount / totalGroups) * 100}%`
                        : "0%"
                    }}
                  />
                </div>
                <span className={styles.progressText}>
                  {totalGroups > 0
                    ? Math.round((submittedCount / totalGroups) * 100)
                    : 0}%
                </span>
              </div>
              {submittedCount === totalGroups ? (
                <span style={{
                  fontSize: 12, color: "#166534", fontWeight: 600,
                  background: "#f0fdf4", padding: "4px 10px", borderRadius: 99
                }}>
                  ✓ All Done
                </span>
              ) : (
                <button className={styles.openBtn}>Open →</button>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedForm && (
        <FormDetailModal
          form={selectedForm}
          groups={groups}
          isSubmitted={isSubmitted}
          submittedTotals={submittedTotals}
          onClose={() => setSelectedForm(null)}
          onSubmit={handleSubmitGrade}
        />
      )}
    </div>
  );
}

// ── Form Detail Modal ───────────────────────────────────────────────
function FormDetailModal({ form, groups, isSubmitted, submittedTotals, onClose, onSubmit }) {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [localSubmitted, setLocalSubmitted] = useState(
    groups.reduce((acc, g) => ({
      ...acc,
      [g.groupId]: isSubmitted(g.groupId)
    }), {})
  );
  const [localTotals, setLocalTotals] = useState({ ...submittedTotals });

  const handleGradeSubmit = (groupId, total) => {
    setLocalSubmitted(prev => ({ ...prev, [groupId]: true }));
    setLocalTotals(prev => ({ ...prev, [groupId]: total }));
    setSelectedGroup(null);
    onSubmit(groupId, total);
  };

  const pendingGroups = groups.filter(g => !localSubmitted[g.groupId]);
  const doneGroups = groups.filter(g => localSubmitted[g.groupId]);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>{form.title}</h3>
            {form.description && (
              <p className={styles.modalSubtitle}>{form.description}</p>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <Close fontSize="small" />
          </button>
        </div>

        <div className={styles.modalBody}>
          {!selectedGroup ? (
            <div className={styles.groupsList}>
              <p className={styles.groupsLabel}>Select a group to evaluate:</p>

              {pendingGroups.map(group => (
                <div
                  key={group.groupId}
                  className={styles.groupRow}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className={styles.groupRowLeft}>
                    <div className={styles.groupAvatar}>
                      {group.groupName?.charAt(0).toUpperCase() || "G"}
                    </div>
                    <div>
                      <p className={styles.groupName}>{group.groupName}</p>
                      <p className={styles.submittedInfo}>{group.projectName}</p>
                    </div>
                  </div>
                  <div className={styles.groupRowRight}>
                    <span className={styles.pendingBadge}>
                      <HourglassEmpty fontSize="small" /> Pending
                    </span>
                    <span className={styles.arrowIcon}>→</span>
                  </div>
                </div>
              ))}

              {doneGroups.map(group => (
                <div
                  key={group.groupId}
                  className={`${styles.groupRow} ${styles.groupSubmitted}`}
                >
                  <div className={styles.groupRowLeft}>
                    <div className={styles.groupAvatar}>
                      {group.groupName?.charAt(0).toUpperCase() || "G"}
                    </div>
                    <div>
                      <p className={styles.groupName}>{group.groupName}</p>
                      <p className={styles.submittedInfo}>
                        Submitted · Total: {localTotals[group.groupId] ?? "-"} pts
                      </p>
                    </div>
                  </div>
                  <div className={styles.groupRowRight}>
                    <span className={styles.submittedBadge}>
                      <CheckCircle fontSize="small" /> Submitted
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <GradeForm
              form={form}
              group={selectedGroup}
              onBack={() => setSelectedGroup(null)}
              onSubmit={handleGradeSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Grade Form ──────────────────────────────────────────────────────
function GradeForm({ form, group, onBack, onSubmit }) {
  const [values, setValues] = useState(() => {
    const init = {};
    (form.fields || []).forEach(f => { init[f.id] = ""; });
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
    for (const field of (form.fields || [])) {
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

    const payload = {
      evaluationFormId: form.id,
      groupId: group.groupId,
      answers: (form.fields || []).map(f => ({
        evaluationFieldId: f.id,
        value: Number(values[f.id]),
      })),
    };

    const total = (form.fields || []).reduce(
      (sum, f) => sum + (Number(values[f.id]) || 0), 0
    );

    setLoading(true);
    try {
      const res = await api.post("/Evaluation/EvaluationSubmissions", payload);

      if (res.data?.success === false) {
        setError(res.data.message || "Something went wrong.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSubmit(group.groupId, total);
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        "Something went wrong. Please try again."
      );
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
        <h4 className={styles.gradeGroupName}>{group.groupName}</h4>
        <p className={styles.gradeFormHint}>
          Enter grades within the allowed range for each field
        </p>
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      <div className={styles.fieldsTable}>
        <div className={styles.fieldsTableHeader}>
          <span>Field</span>
          <span>Range</span>
          <span>Grade</span>
        </div>
        {(form.fields || []).map(field => (
          <div key={field.id} className={styles.fieldRow}>
            <span className={styles.fieldName}>{field.fieldName}</span>
            <span className={styles.fieldRange}>
              {field.minValue} – {field.maxValue}
            </span>
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
            {(form.fields || []).reduce(
              (sum, f) => sum + (Number(values[f.id]) || 0), 0
            )} pts
          </span>
        </div>
      </div>

      <div className={styles.gradeFormFooter}>
        <button className={styles.cancelBtn} onClick={onBack}>Cancel</button>
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Grades"}
        </button>
      </div>
    </div>
  );
}