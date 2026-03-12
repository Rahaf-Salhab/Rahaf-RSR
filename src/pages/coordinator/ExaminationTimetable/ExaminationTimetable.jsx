import { useEffect, useState } from "react";
import { mockApi as api } from "../../../api/axiosInstance";
import styles from "./ExaminationTimetable.module.css";
import {
  Add, Search, Edit, Delete, Close,
  CalendarMonth, AccessTime, Room, People,
  Publish, SaveAlt
} from "@mui/icons-material";

const STATUS_OPTIONS = ["All", "draft", "published"];

export default function ExaminationTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 🔴 MOCK
      const [timetableRes, usersRes, groupsRes] = await Promise.all([
        api.get("/examinationTimetable"),
        api.get("/users"),
        api.get("/groups"),
      ]);
      setTimetable(timetableRes.data);
      setUsers(usersRes.data);
      setGroups(groupsRes.data);
      // ✅ REAL
      // const [timetableRes, usersRes, groupsRes] = await Promise.all([
      //   api.get("/examination-timetable"),
      //   api.get("/admin/users"),
      //   api.get("/admin/groups"),
      // ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = timetable.filter(t => {
    const matchSearch =
      t.groupName.toLowerCase().includes(search.toLowerCase()) ||
      t.projectTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getUserName = (id) => users.find(u => u.id === id)?.name || "-";

  const handleDelete = async (id) => {
    try {
      await api.delete(`/examinationTimetable/${id}`);
      setTimetable(prev => prev.filter(t => t.id !== id));
      setDeleteId(null);
    } catch (err) { console.error(err); }
  };

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await api.put(`/examinationTimetable/${data.id}`, data);
        setTimetable(prev => prev.map(t => t.id === data.id ? data : t));
      } else {
        const newItem = { ...data, id: Date.now().toString() };
        const res = await api.post("/examinationTimetable", newItem);
        setTimetable(prev => [...prev, res.data]);
      }
      setModal(null);
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (item, newStatus) => {
    const updated = { ...item, status: newStatus };
    try {
      await api.put(`/examinationTimetable/${item.id}`, updated);
      setTimetable(prev => prev.map(t => t.id === item.id ? updated : t));
    } catch (err) { console.error(err); }
  };

  const emptyForm = {
    groupId: "", groupName: "", projectTitle: "",
    date: "", time: "", duration: 60,
    room: "", building: "", supervisorId: "",
    examiners: [], status: "draft"
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Examination Timetable</h1>
          <p className={styles.pageSubtitle}>Schedule and manage group defense sessions</p>
        </div>
        <button className={styles.addBtn} onClick={() => setModal(emptyForm)}>
          <Add fontSize="small" /> Add Schedule
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filtersBox}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} fontSize="small" />
          <input
            type="text"
            placeholder="Search by group or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>
              {s === "All" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Cards */}
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyBox}>
          <CalendarMonth style={{ fontSize: 48, color: "#ddd" }} />
          <p>No schedules found.</p>
          <button className={styles.addBtn} onClick={() => setModal(emptyForm)}>
            <Add fontSize="small" /> Add Schedule
          </button>
        </div>
      ) : (
        <div className={styles.cardsList}>
          {filtered.map((t) => (
            <div key={t.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <h3 className={styles.groupName}>{t.groupName}</h3>
                  <p className={styles.projectTitle}>{t.projectTitle}</p>
                </div>
                <div className={styles.cardHeaderRight}>
                  <span className={`${styles.statusBadge} ${t.status === "published" ? styles.published : styles.draft}`}>
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <CalendarMonth fontSize="small" className={styles.infoIcon} />
                    <div>
                      <p className={styles.infoLabel}>Date</p>
                      <p className={styles.infoValue}>{t.date}</p>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <AccessTime fontSize="small" className={styles.infoIcon} />
                    <div>
                      <p className={styles.infoLabel}>Time</p>
                      <p className={styles.infoValue}>{t.time} ({t.duration} min)</p>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <Room fontSize="small" className={styles.infoIcon} />
                    <div>
                      <p className={styles.infoLabel}>Room</p>
                      <p className={styles.infoValue}>{t.room}</p>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <Room fontSize="small" className={styles.infoIcon} />
                    <div>
                      <p className={styles.infoLabel}>Building</p>
                      <p className={styles.infoValue}>{t.building}</p>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <People fontSize="small" className={styles.infoIcon} />
                    <div>
                      <p className={styles.infoLabel}>Supervisor</p>
                      <p className={styles.infoValue}>{getUserName(t.supervisorId)}</p>
                    </div>
                  </div>
                </div>

                <div className={styles.examinersSection}>
                  <p className={styles.examinersLabel}>Examination Committee</p>
                  <div className={styles.examinersList}>
                    {t.examiners.map(eid => (
                      <span key={eid} className={styles.examinerChip}>
                        {getUserName(eid)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className={styles.cardFooter}>
                <button
                  className={styles.draftBtn}
                  onClick={() => handleStatusChange(t, "draft")}
                  disabled={t.status === "draft"}
                  title="Save as Draft"
                >
                  <SaveAlt fontSize="small" /> Save as Draft
                </button>
                <button
                  className={styles.editActionBtn}
                  onClick={() => setModal(t)}
                  title="Edit"
                >
                  <Edit fontSize="small" /> Edit
                </button>
                <button
                  className={styles.publishBtn}
                  onClick={() => handleStatusChange(t, "published")}
                  disabled={t.status === "published"}
                  title="Publish"
                >
                  <Publish fontSize="small" /> Publish
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => setDeleteId(t.id)}
                  title="Delete"
                >
                  <Delete fontSize="small" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <TimetableModal
          data={modal}
          users={users}
          groups={groups}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <h3 className={styles.modalTitle}>Delete Schedule</h3>
            <p className={styles.modalText}>Are you sure you want to delete this schedule?</p>
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

// ── Timetable Modal ─────────────────────────────────────────────────
function TimetableModal({ data, users, groups, onClose, onSave }) {
  const [form, setForm] = useState({ ...data });
  const [error, setError] = useState("");

  const supervisors = users.filter(u => u.role === "supervisor");
  const examiners = users.filter(u => u.role === "examiner");

  const handleGroupChange = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setForm(prev => ({
        ...prev,
        groupId: group.id,
        groupName: group.name,
        supervisorId: group.supervisorId || "",
      }));
    } else {
      setForm(prev => ({ ...prev, groupId: "", groupName: "" }));
    }
    setError("");
  };

  const handleExaminerToggle = (id) => {
    setForm(prev => ({
      ...prev,
      examiners: prev.examiners.includes(id)
        ? prev.examiners.filter(e => e !== id)
        : [...prev.examiners, id]
    }));
  };

  const validate = () => {
    if (!form.groupId || !form.projectTitle.trim() || !form.date ||
      !form.time || !form.room.trim() || !form.building.trim() ||
      !form.supervisorId || form.examiners.length === 0) {
      setError("All fields are required and at least one examiner must be selected.");
      return false;
    }
    return true;
  };

  const handleSaveDraft = () => {
    if (!validate()) return;
    onSave({ ...form, status: "draft" });
  };

  const handlePublish = () => {
    if (!validate()) return;
    onSave({ ...form, status: "published" });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{data.id ? "Edit Schedule" : "Add Schedule"}</h3>
          <button className={styles.closeBtn} onClick={onClose}><Close fontSize="small" /></button>
        </div>
        <div className={styles.modalBody}>
          {error && <p className={styles.errorMsg}>{error}</p>}

          <div className={styles.modalRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Group <span className={styles.required}>*</span></label>
              <select
                className={styles.select}
                value={form.groupId}
                onChange={(e) => handleGroupChange(e.target.value)}
              >
                <option value="">Select Group</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Duration (min)</label>
              <input
                type="number"
                className={styles.input}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                min={15}
                step={15}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Project Title <span className={styles.required}>*</span></label>
            <input
              className={styles.input}
              value={form.projectTitle}
              onChange={(e) => { setForm({ ...form, projectTitle: e.target.value }); setError(""); }}
              placeholder="e.g. AI-Powered Learning System"
            />
          </div>

          <div className={styles.modalRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Date <span className={styles.required}>*</span></label>
              <input
                type="date"
                className={styles.input}
                value={form.date}
                onChange={(e) => { setForm({ ...form, date: e.target.value }); setError(""); }}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Time <span className={styles.required}>*</span></label>
              <input
                type="time"
                className={styles.input}
                value={form.time}
                onChange={(e) => { setForm({ ...form, time: e.target.value }); setError(""); }}
              />
            </div>
          </div>

          <div className={styles.modalRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Room <span className={styles.required}>*</span></label>
              <input
                className={styles.input}
                value={form.room}
                onChange={(e) => { setForm({ ...form, room: e.target.value }); setError(""); }}
                placeholder="e.g. A301"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Building <span className={styles.required}>*</span></label>
              <input
                className={styles.input}
                value={form.building}
                onChange={(e) => { setForm({ ...form, building: e.target.value }); setError(""); }}
                placeholder="e.g. Engineering Building"
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Supervisor <span className={styles.required}>*</span></label>
            <select
              className={styles.select}
              value={form.supervisorId}
              onChange={(e) => { setForm({ ...form, supervisorId: e.target.value }); setError(""); }}
            >
              <option value="">Select Supervisor</option>
              {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Examination Committee <span className={styles.required}>*</span></label>
            <div className={styles.checkList}>
              {examiners.map(e => (
                <label key={e.id} className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={form.examiners.includes(e.id)}
                    onChange={() => handleExaminerToggle(e.id)}
                  />
                  <span>{e.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.modalDraftBtn} onClick={handleSaveDraft}>
            <SaveAlt fontSize="small" /> Save as Draft
          </button>
          <button className={styles.modalPublishBtn} onClick={handlePublish}>
            <Publish fontSize="small" /> Publish
          </button>
        </div>
      </div>
    </div>
  );
}