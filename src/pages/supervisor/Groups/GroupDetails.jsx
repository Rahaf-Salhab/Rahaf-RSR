import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import styles from "./GroupDetails.module.css";
import {
  ArrowBack,
  Add,
  Edit,
  School,
  Assignment,
  CheckCircle,
  HourglassEmpty,
  Close,
  AttachFile,
} from "@mui/icons-material";

const STATUS_COLORS = {
  InProgress: { bg: "#e0f2fe", color: "#0369a1" },
  Completed: { bg: "#f0fdf4", color: "#166534" },
  Pending: { bg: "#fef3e2", color: "#92400e" },
};

function TaskModal({ task, onClose, onSave, loading, error, onClearError }) {
  const isEdit = !!task?.taskId;
  const [form, setForm] = useState({
    Title: task?.title || "",
    Description: task?.description || "",
    DeadLine: task?.deadLine?.split("T")[0] || "",
    TaskFileURL: task?.taskFileURL || "",
    SupervisorNotes: task?.supervisorNotes || "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [localError, setLocalError] = useState("");
  const fileInputRef = useRef(null);
  const displayError = error || localError;

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setLocalError("");
    onClearError();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    handleChange("TaskFileURL", file.name);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    handleChange("TaskFileURL", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getFileName = (url) => {
    if (!url) return "";
    // بيجيب اسم الملف بس بدون الرابط
    return url.split("/").pop().split("\\").pop();
  };

  const handleSave = () => {
    if (!form.Title.trim()) {
      setLocalError("Title is required.");
      return;
    }
    if (!form.DeadLine) {
      setLocalError("Deadline is required.");
      return;
    }
    setLocalError("");
    onSave(form, selectedFile);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEdit ? "Edit Task" : "Add Task"}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <Close fontSize="small" />
          </button>
        </div>
        <div className={styles.modalBody}>
          {displayError && <p className={styles.errorMsg}>{displayError}</p>}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Title <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              value={form.Title}
              onChange={(e) => handleChange("Title", e.target.value)}
              placeholder="e.g. Submit project proposal"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Description <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              className={styles.textarea}
              rows={3}
              value={form.Description}
              onChange={(e) => handleChange("Description", e.target.value)}
              placeholder="Task description..."
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Deadline <span className={styles.required}>*</span>
            </label>
            <input
              type="date"
              className={styles.input}
              value={form.DeadLine}
              onChange={(e) => handleChange("DeadLine", e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Task File <span className={styles.optional}>(optional)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {!selectedFile && !form.TaskFileURL ? (
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                <AttachFile fontSize="small" /> Upload File
              </button>
            ) : (
              <div className={styles.filePreview}>
                <AttachFile
                  style={{ color: "#C0441A", fontSize: 18, flexShrink: 0 }}
                />
                <span className={styles.fileName}>
                  {selectedFile
                    ? selectedFile.name
                    : getFileName(form.TaskFileURL)}
                </span>
                <button
                  type="button"
                  className={styles.removeFileBtn}
                  onClick={handleRemoveFile}
                >
                  <Close fontSize="small" />
                </button>
              </div>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Supervisor Notes{" "}
              <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              className={styles.textarea}
              rows={2}
              value={form.SupervisorNotes}
              onChange={(e) => handleChange("SupervisorNotes", e.target.value)}
              placeholder="Notes for students..."
            />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GroupDetails() {
  const { groupId } = useParams();// من الرابط الحاليGroupId بنجيب ال 
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState("");

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, tasksRes] = await Promise.all([
        api.get("/Group/groups-supervisor"),
        api.get(`/Task/tasks-group/${groupId}`),
      ]);
      const groups = groupsRes.data?.groups || [];
      const found = groups.find((g) => g.groupId === groupId);
      setGroup(found || null);
      setTasks(tasksRes.data?.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (form, file) => {
    setTaskLoading(true);
    setTaskError("");
    try {
      const formData = new FormData();
      formData.append("Title", form.Title);
      formData.append("Description", form.Description || "");
      formData.append("DeadLine", `${form.DeadLine}T00:00:00`);
      formData.append("SupervisorNotes", form.SupervisorNotes || "");
      if (file) formData.append("TaskFileURL", file);

      if (taskModal?.taskId) {
        await api.patch(
          `/Task/${groupId}/tasks/${taskModal.taskId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
      } else {
        await api.post(`/Task/create/${groupId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await fetchData();
      setTaskModal(null);
    } catch {
      setTaskError("Something went wrong. Please try again.");
    } finally {
      setTaskLoading(false);
    }
  };

 const handleViewSubmissions = (taskId) => {// لما يضغط على عرض التسليمات بيروح لصفحة التسليمات الخاصة بالمهمة هاي
    navigate(`/supervisor/groups/${groupId}/tasks/${taskId}/submissions`);//  عشان الصفحة الجديدة تعرف لأي جروب واي تاسك نجيب التسليمات TasKId وحطينا UseParamsمن GroupIdجبنا 
  };

  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFileName = (url) => {
    if (!url) return "";
    return url.split("/").pop().split("\\").pop();
  };

  const isOverdue = (deadline) => deadline && new Date(deadline) < new Date();

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!group) return <div className={styles.loading}>Group not found.</div>;

  const status = STATUS_COLORS[group.projectStatus] || STATUS_COLORS.InProgress;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <button
            className={styles.backBtn}
            onClick={() => navigate("/supervisor/groups")}
          >
            <ArrowBack fontSize="small" /> Back
          </button>
          <div>
            <h1 className={styles.pageTitle}>{group.groupName}</h1>
            <p className={styles.pageSubtitle}>{group.projectName}</p>
          </div>
        </div>
        <span
          className={styles.statusBadge}
          style={{ background: status.bg, color: status.color }}
        >
          {group.projectStatus}
        </span>
      </div>

      {/* Project Info */}
      <div className={styles.card}>
        <div className={styles.cardTitleRow}>
          <Assignment fontSize="small" style={{ color: "#C0441A" }} />
          <h3 className={styles.cardTitle}>Project Information</h3>
        </div>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <label className={styles.infoLabel}>Project Name</label>
            <p className={styles.infoValue}>{group.projectName || "-"}</p>
          </div>
          <div className={styles.infoItem}>
            <label className={styles.infoLabel}>Project Idea</label>
            <p className={styles.infoValue}>{group.projectIdea || "-"}</p>
          </div>
          {group.description && (
            <div className={styles.infoItem} style={{ gridColumn: "1 / -1" }}>
              <label className={styles.infoLabel}>Description</label>
              <p className={styles.infoValue}>{group.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Students */}
      <div className={styles.card}>
        <div className={styles.cardTitleRow}>
          <School fontSize="small" style={{ color: "#C0441A" }} />
          <h3 className={styles.cardTitle}>Students</h3>
        </div>
        <div className={styles.studentsGrid}>
          {group.students?.map((s, i) => (
            <div key={i} className={styles.studentCard}>
              <div className={styles.studentAvatar}>
                {s.fullName?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className={styles.studentName}>{s.fullName}</p>
                <p className={styles.studentNumber}>#{s.studentNumber}</p>
              </div>
            </div>
          ))}
          {(!group.students || group.students.length === 0) && (
            <p className={styles.empty}>No students assigned.</p>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className={styles.card}>
        <div className={styles.cardTitleRow}>
          <Assignment fontSize="small" style={{ color: "#C0441A" }} />
          <h3 className={styles.cardTitle}>Tasks</h3>
          <button
            className={styles.addTaskBtn}
            onClick={() => {
              setTaskError("");
              setTaskModal({});
            }}
          >
            <Add fontSize="small" /> Add Task
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className={styles.emptyTasks}>
            <HourglassEmpty style={{ fontSize: 40, color: "#ddd" }} />
            <p>No tasks yet. Add a task to get started.</p>
          </div>
        ) : (
          <div className={styles.tasksList}>
            {tasks.map((t) => (
              <div
                key={t.taskId}
                className={`${styles.taskItem} ${isOverdue(t.deadLine) && !t.isCompleted ? styles.taskOverdue : ""}`}
              >
                <div className={styles.taskLeft}>
                  <div className={styles.taskIcon}>
                    {t.isCompleted ? (
                      <CheckCircle style={{ color: "#22c55e", fontSize: 20 }} />
                    ) : (
                      <HourglassEmpty
                        style={{ color: "#f59e0b", fontSize: 20 }}
                      />
                    )}
                  </div>
                  <div>
                    <p className={styles.taskTitle}>{t.title}</p>
                    {t.description && (
                      <p className={styles.taskDesc}>{t.description}</p>
                    )}
                    {t.supervisorNotes && (
                      <p className={styles.taskNotes}>📝 {t.supervisorNotes}</p>
                    )}
                    <p className={styles.taskDeadline}>
                      Deadline: {formatDate(t.deadLine)}
                      {isOverdue(t.deadLine) && !t.isCompleted && (
                        <span className={styles.overdueBadge}>Overdue</span>
                      )}
                    </p>
                    {t.taskFileURL && (
                      <a
                        href={t.taskFileURL}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.taskFile}
                      >
                        📎 {getFileName(t.taskFileURL)}
                      </a>
                    )}
                  </div>
                </div>
                <button
                  className={styles.viewSubmissionBtn}
                  onClick={() => handleViewSubmissions(t.taskId)}// 
                >
                  View Submission
                </button> {/* Opens the submissions page for this specific task */}
                <button
                  className={styles.editTaskBtn}
                  onClick={() => {
                    setTaskError("");
                    setTaskModal(t);
                  }}
                >
                  <Edit fontSize="small" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {taskModal && (
        <TaskModal
          task={taskModal}
          onClose={() => {
            setTaskModal(null);
            setTaskError("");
          }}
          onSave={handleSaveTask}
          loading={taskLoading}
          error={taskError}
          onClearError={() => setTaskError("")}
        />
      )}
    </div>
  );
}
