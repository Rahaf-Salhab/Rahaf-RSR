import { useEffect, useState } from "react";
import { mockApi as api } from "../../../api/axiosInstance";
import styles from "./ThesisManagement.module.css";
import {
  Add, Search, Edit, Delete, Close, FilterList,
  MenuBook, Person, Group, CalendarToday, Description
} from "@mui/icons-material";

const STATUS_OPTIONS = ["All", "pending", "in-progress", "completed"];

const STATUS_COLORS = {
  "pending": { bg: "#fef3e2", color: "#92400e", label: "Pending" },
  "in-progress": { bg: "#e8f4fd", color: "#1e40af", label: "In Progress" },
  "completed": { bg: "#f0fdf4", color: "#166534", label: "Completed" },
};

export default function ThesisManagement() {
  const [theses, setTheses] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewThesis, setViewThesis] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 🔴 MOCK
      const [thesisRes, usersRes, groupsRes] = await Promise.all([
        api.get("/thesis"),
        api.get("/users"),
        api.get("/groups"),
      ]);
      setTheses(thesisRes.data);
      setUsers(usersRes.data);
      setGroups(groupsRes.data);
      // ✅ REAL
      // const [thesisRes, usersRes, groupsRes] = await Promise.all([
      //   api.get("/thesis"),
      //   api.get("/admin/users"),
      //   api.get("/admin/groups"),
      // ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = theses.filter(t => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.groupName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getUserName = (id) => users.find(u => u.id === id)?.name || "-";
  const getGroupStudents = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];
    return group.students
      .map(sid => users.find(u => u.id === sid)?.name)
      .filter(Boolean);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/thesis/${id}`);
      setTheses(prev => prev.filter(t => t.id !== id));
      setDeleteId(null);
    } catch (err) { console.error(err); }
  };

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await api.put(`/thesis/${data.id}`, data);
        setTheses(prev => prev.map(t => t.id === data.id ? data : t));
      } else {
        const newItem = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
        const res = await api.post("/thesis", newItem);
        setTheses(prev => [...prev, res.data]);
      }
      setModal(null);
    } catch (err) { console.error(err); }
  };

  const stats = {
    total: theses.length,
    pending: theses.filter(t => t.status === "pending").length,
    inProgress: theses.filter(t => t.status === "in-progress").length,
    completed: theses.filter(t => t.status === "completed").length,
  };

  const emptyForm = {
    title: "", groupId: "", groupName: "",
    supervisorId: "", description: "",
    submissionDate: "", status: "pending"
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Thesis Management</h1>
          <p className={styles.pageSubtitle}>Track and manage graduation projects</p>
        </div>
        <button className={styles.addBtn} onClick={() => setModal(emptyForm)}>
          <Add fontSize="small" /> Add Project
        </button>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        {[
          { label: "Total Projects", value: stats.total, color: "#6366f1", bg: "#eef2ff" },
          { label: "Pending", value: stats.pending, color: "#92400e", bg: "#fef3e2" },
          { label: "In Progress", value: stats.inProgress, color: "#1e40af", bg: "#e8f4fd" },
          { label: "Completed", value: stats.completed, color: "#166534", bg: "#f0fdf4" },
        ].map((s, i) => (
          <div key={i} className={styles.statCard} style={{ borderLeft: `4px solid ${s.color}` }}>
            <p className={styles.statValue} style={{ color: s.color }}>{s.value}</p>
            <p className={styles.statLabel}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.filtersBox}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} fontSize="small" />
          <input
            type="text"
            placeholder="Search by title or group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <FilterList fontSize="small" style={{ color: "#888" }} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s === "All" ? "All Status" : STATUS_COLORS[s]?.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyBox}>
          <MenuBook style={{ fontSize: 56, color: "#ddd" }} />
          <p>No projects found.</p>
          <button className={styles.addBtn} onClick={() => setModal(emptyForm)}>
            <Add fontSize="small" /> Add Project
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((t) => {
            const students = getGroupStudents(t.groupId);
            const statusInfo = STATUS_COLORS[t.status] || STATUS_COLORS["pending"];
            return (
              <div key={t.id} className={styles.card} onClick={() => setViewThesis(t)}>
                <div className={styles.cardTop}>
                  <div className={styles.cardIcon}>
                    <MenuBook />
                  </div>
                  <span className={styles.statusBadge} style={{ background: statusInfo.bg, color: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                </div>

                <h3 className={styles.cardTitle}>{t.title}</h3>
                <p className={styles.cardDesc}>{t.description}</p>

                <div className={styles.cardMeta}>
                  <div className={styles.metaItem}>
                    <Group fontSize="small" />
                    <span>{t.groupName}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Person fontSize="small" />
                    <span>{getUserName(t.supervisorId)}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <CalendarToday fontSize="small" />
                    <span>{t.submissionDate || "-"}</span>
                  </div>
                </div>

                {students.length > 0 && (
                  <div className={styles.studentChips}>
                    {students.map((s, i) => (
                      <span key={i} className={styles.chip}>{s}</span>
                    ))}
                  </div>
                )}

                <div className={styles.cardFooter} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.editBtn} onClick={() => setModal(t)}>
                    <Edit fontSize="small" /> Edit
                  </button>
                  <button className={styles.deleteBtn} onClick={() => setDeleteId(t.id)}>
                    <Delete fontSize="small" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <ThesisModal
          data={modal}
          users={users}
          groups={groups}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* View Modal */}
      {viewThesis && (
        <ViewModal
          thesis={viewThesis}
          users={users}
          groups={groups}
          onClose={() => setViewThesis(null)}
          onEdit={() => { setModal(viewThesis); setViewThesis(null); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <h3 className={styles.modalTitle}>Delete Project</h3>
            <p className={styles.modalText}>Are you sure you want to delete this project?</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add/Edit Modal ──────────────────────────────────────────────────
function ThesisModal({ data, users, groups, onClose, onSave }) {
  const [form, setForm] = useState({ ...data });
  const [error, setError] = useState("");

  const supervisors = users.filter(u => u.role === "supervisor");

  const handleGroupChange = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    setForm(prev => ({
      ...prev,
      groupId: group?.id || "",
      groupName: group?.name || "",
      supervisorId: group?.supervisorId || "",
    }));
    setError("");
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.groupId || !form.supervisorId || !form.submissionDate) {
      setError("Title, Group, Supervisor and Submission Date are required.");
      return;
    }
    setError("");
    onSave(form);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{data.id ? "Edit Project" : "Add Project"}</h3>
          <button className={styles.closeBtn} onClick={onClose}><Close fontSize="small" /></button>
        </div>
        <div className={styles.modalBody}>
          {error && <p className={styles.errorMsg}>{error}</p>}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Project Title <span className={styles.required}>*</span></label>
            <input
              className={styles.input}
              value={form.title}
              onChange={(e) => { setForm({ ...form, title: e.target.value }); setError(""); }}
              placeholder="e.g. AI-Powered Learning System"
            />
          </div>

          <div className={styles.modalRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Group <span className={styles.required}>*</span></label>
              <select className={styles.select} value={form.groupId} onChange={(e) => handleGroupChange(e.target.value)}>
                <option value="">Select Group</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Supervisor <span className={styles.required}>*</span></label>
              <select className={styles.select} value={form.supervisorId} onChange={(e) => { setForm({ ...form, supervisorId: e.target.value }); setError(""); }}>
                <option value="">Select Supervisor</option>
                {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.modalRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Submission Date <span className={styles.required}>*</span></label>
              <input
                type="date"
                className={styles.input}
                value={form.submissionDate}
                onChange={(e) => { setForm({ ...form, submissionDate: e.target.value }); setError(""); }}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Status</label>
              <select className={styles.select} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Description / Abstract</label>
            <textarea
              className={styles.textarea}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the project..."
              rows={4}
            />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave}>
            {data.id ? "Save Changes" : "Add Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── View Modal ──────────────────────────────────────────────────────
function ViewModal({ thesis, users, groups, onClose, onEdit }) {
  const getUserName = (id) => users.find(u => u.id === id)?.name || "-";
  const group = groups.find(g => g.id === thesis.groupId);
  const students = group?.students.map(sid => users.find(u => u.id === sid)?.name).filter(Boolean) || [];
  const statusInfo = STATUS_COLORS[thesis.status] || STATUS_COLORS["pending"];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Project Details</h3>
          <button className={styles.closeBtn} onClick={onClose}><Close fontSize="small" /></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.viewHeader}>
            <div className={styles.viewIcon}><MenuBook /></div>
            <div>
              <h2 className={styles.viewTitle}>{thesis.title}</h2>
              <span className={styles.statusBadge} style={{ background: statusInfo.bg, color: statusInfo.color }}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {thesis.description && (
            <div className={styles.viewSection}>
              <p className={styles.viewSectionLabel}><Description fontSize="small" /> Abstract</p>
              <p className={styles.viewSectionText}>{thesis.description}</p>
            </div>
          )}

          <div className={styles.viewGrid}>
            <div className={styles.viewItem}>
              <p className={styles.viewItemLabel}>Group</p>
              <p className={styles.viewItemValue}>{thesis.groupName}</p>
            </div>
            <div className={styles.viewItem}>
              <p className={styles.viewItemLabel}>Supervisor</p>
              <p className={styles.viewItemValue}>{getUserName(thesis.supervisorId)}</p>
            </div>
            <div className={styles.viewItem}>
              <p className={styles.viewItemLabel}>Submission Date</p>
              <p className={styles.viewItemValue}>{thesis.submissionDate || "-"}</p>
            </div>
          </div>

          {students.length > 0 && (
            <div className={styles.viewSection}>
              <p className={styles.viewSectionLabel}><Group fontSize="small" /> Students</p>
              <div className={styles.studentChips}>
                {students.map((s, i) => <span key={i} className={styles.chip}>{s}</span>)}
              </div>
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Close</button>
          <button className={styles.saveBtn} onClick={onEdit}>
            <Edit fontSize="small" /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}