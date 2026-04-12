import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import styles from "./Semester.module.css";
import { CalendarMonth, Edit, Check, Close, Add } from "@mui/icons-material";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
};

const getDaysRemaining = (end) => {
  const diff = new Date(end) - new Date();
  if (diff < 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getDuration = (start, end) => {
  const diff = new Date(end) - new Date(start);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getProgress = (start, end) => {
  const total = new Date(end) - new Date(start);
  const elapsed = new Date() - new Date(start);
  if (elapsed < 0) return 0;
  if (elapsed > total) return 100;
  return Math.round((elapsed / total) * 100);
};

export default function Semester() {
  const [semester, setSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [semesterEnded, setSemesterEnded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ Name: "", StartDate: "", EndDate: "" });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Create new semester states
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ Name: "", StartDate: "", EndDate: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => { fetchSemester(); }, []);

  const fetchSemester = async () => {
    setLoading(true);
    setSemesterEnded(false);
    try {
      const res = await api.get("/Semester/ActiveSemester");
      const s = res.data.semester;

      if (s) {
        const now = new Date();
        const endDate = new Date(s.endDate);
        if (now >= endDate) {
          setSemesterEnded(true);
        } else {
          setSemester(s);
          setForm({
            Name: s.name,
            StartDate: s.startDate?.split("T")[0],
            EndDate: s.endDate?.split("T")[0],
          });
        }
      } else {
        setSemesterEnded(true);
      }
    } catch (err) {
      setSemesterEnded(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.Name.trim() || !form.StartDate || !form.EndDate) {
      setSaveError("All fields are required.");
      return;
    }
    if (new Date(form.EndDate) <= new Date(form.StartDate)) {
      setSaveError("End date must be after start date.");
      return;
    }
    setSaveLoading(true);
    setSaveError("");
    try {
      await api.patch(`/Semester/UpdateSemester/${semester.semesterId}`, {
        Name: form.Name,
        StartDate: new Date(form.StartDate).toISOString(),
        EndDate: new Date(form.EndDate).toISOString(),
      });
      setSemester(prev => ({
        ...prev,
        name: form.Name,
        startDate: new Date(form.StartDate).toISOString(),
        endDate: new Date(form.EndDate).toISOString(),
      }));
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError("Failed to update semester. Please try again.");
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setSaveError("");
    setForm({
      Name: semester.name,
      StartDate: semester.startDate?.split("T")[0],
      EndDate: semester.endDate?.split("T")[0],
    });
  };

  const handleCreate = async () => {
    if (!createForm.Name.trim() || !createForm.StartDate || !createForm.EndDate) {
      setCreateError("All fields are required.");
      return;
    }
    if (new Date(createForm.EndDate) <= new Date(createForm.StartDate)) {
      setCreateError("End date must be after start date.");
      return;
    }
    setCreateLoading(true);
    setCreateError("");
    try {
      await api.post("/Semester/CreateSemester", {
        Name: createForm.Name,
        StartDate: new Date(createForm.StartDate).toISOString(),
        EndDate: new Date(createForm.EndDate).toISOString(),
      });
      setCreateSuccess(true);
      setTimeout(() => {
        setCreateSuccess(false);
        setCreating(false);
        setCreateForm({ Name: "", StartDate: "", EndDate: "" });
        fetchSemester();
      }, 1500);
    } catch (err) {
      setCreateError("Failed to create semester. Please try again.");
      console.error(err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCancelCreate = () => {
    setCreating(false);
    setCreateError("");
    setCreateForm({ Name: "", StartDate: "", EndDate: "" });
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  // ─── Semester Ended / No Active Semester ───────────────────────────────────
  if (semesterEnded) return (
    <div className={styles.page}>
      {!creating ? (
        <div className={styles.semesterEndedBox}>
          <CalendarMonth style={{ fontSize: 56, color: "#C0441A" }} />
          <h2>Semester Has Ended</h2>
          <p>The current semester has ended. Start a new semester to continue.</p>
          <button className={styles.createBtn} onClick={() => setCreating(true)}>
            <Add fontSize="small" /> Create New Semester
          </button>
        </div>
      ) : (
        <>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Create New Semester</h1>
              <p className={styles.pageSubtitle}>Set up a new active semester</p>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <CalendarMonth style={{ fontSize: 28, color: "#C0441A" }} />
              </div>
              <div>
                <h2 className={styles.semesterName}>New Semester</h2>
                <span className={styles.newBadge}>New</span>
              </div>
            </div>

            {createSuccess && (
              <div className={styles.successMsg}>
                <Check fontSize="small" /> Semester created successfully!
              </div>
            )}

            {createError && (
              <div className={styles.errorMsg}>{createError}</div>
            )}

            <div className={styles.form}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Semester Name <span className={styles.required}>*</span></label>
                <input
                  className={styles.input}
                  value={createForm.Name}
                  onChange={e => { setCreateForm(p => ({ ...p, Name: e.target.value })); setCreateError(""); }}
                  placeholder="e.g. 2025/2026"
                />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Start Date <span className={styles.required}>*</span></label>
                  <input
                    className={styles.input}
                    type="date"
                    value={createForm.StartDate}
                    onChange={e => { setCreateForm(p => ({ ...p, StartDate: e.target.value })); setCreateError(""); }}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>End Date <span className={styles.required}>*</span></label>
                  <input
                    className={styles.input}
                    type="date"
                    value={createForm.EndDate}
                    onChange={e => { setCreateForm(p => ({ ...p, EndDate: e.target.value })); setCreateError(""); }}
                  />
                </div>
              </div>
              <div className={styles.formActions}>
                <button className={styles.cancelBtn} onClick={handleCancelCreate} disabled={createLoading}>
                  <Close fontSize="small" /> Cancel
                </button>
                <button className={styles.saveBtn} onClick={handleCreate} disabled={createLoading}>
                  <Check fontSize="small" /> {createLoading ? "Creating..." : "Create Semester"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (!semester) return <div className={styles.loading}>No active semester found.</div>;

  const daysRemaining = getDaysRemaining(semester.endDate);
  const duration = getDuration(semester.startDate, semester.endDate);
  const progress = getProgress(semester.startDate, semester.endDate);

  // ─── Active Semester View ──────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Semester</h1>
          <p className={styles.pageSubtitle}>Manage the current active semester</p>
        </div>
        {!editing && (
          <button className={styles.editBtn} onClick={() => setEditing(true)}>
            <Edit fontSize="small" /> Edit Semester
          </button>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <CalendarMonth style={{ fontSize: 28, color: "#C0441A" }} />
          </div>
          <div>
            <h2 className={styles.semesterName}>{semester.name}</h2>
            <span className={styles.activeBadge}>Active</span>
          </div>
        </div>

        {saveSuccess && (
          <div className={styles.successMsg}>
            <Check fontSize="small" /> Semester updated successfully!
          </div>
        )}

        {saveError && (
          <div className={styles.errorMsg}>{saveError}</div>
        )}

        {editing ? (
          <div className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Semester Name <span className={styles.required}>*</span></label>
              <input
                className={styles.input}
                value={form.Name}
                onChange={e => { setForm(p => ({ ...p, Name: e.target.value })); setSaveError(""); }}
                placeholder="e.g. 2024/2025"
              />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Start Date <span className={styles.required}>*</span></label>
                <input
                  className={styles.input}
                  type="date"
                  value={form.StartDate}
                  onChange={e => { setForm(p => ({ ...p, StartDate: e.target.value })); setSaveError(""); }}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>End Date <span className={styles.required}>*</span></label>
                <input
                  className={styles.input}
                  type="date"
                  value={form.EndDate}
                  onChange={e => { setForm(p => ({ ...p, EndDate: e.target.value })); setSaveError(""); }}
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <button className={styles.cancelBtn} onClick={handleCancel} disabled={saveLoading}>
                <Close fontSize="small" /> Cancel
              </button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saveLoading}>
                <Check fontSize="small" /> {saveLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>Start Date</label>
                <p className={styles.infoValue}>{formatDate(semester.startDate)}</p>
              </div>
              <div className={styles.infoItem}>
                <label className={styles.infoLabel}>End Date</label>
                <p className={styles.infoValue}>{formatDate(semester.endDate)}</p>
              </div>
            </div>

            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>Semester Progress</span>
                <span className={styles.progressPercent}>{progress}%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className={styles.counterSection}>
              <div className={styles.counterBox}>
                <div className={styles.counterNumber}>{daysRemaining}</div>
                <div className={styles.counterLabel}>Days Remaining</div>
                <div className={styles.counterSub}>out of {duration} total days</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}