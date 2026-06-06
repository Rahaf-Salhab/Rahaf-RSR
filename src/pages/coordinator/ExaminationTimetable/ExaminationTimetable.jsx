import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import styles from "./ExaminationTimetable.module.css";
import {
  Add, Search, Edit, Delete, Close,
  CalendarMonth, Room, People, SaveAlt
} from "@mui/icons-material";

export default function ExaminationTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [examiners, setExaminers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schedulesRes, examinersRes, groupsRes] = await Promise.all([
        api.get("/Schedule/all-schedules"),
        api.get("/User/examiners"),
        api.get("/Groups/groups-coordinater"),
      ]);

      const schedules = (schedulesRes.data?.result || []).map(s => ({
        id: s.scheduleId,
        groupId: s.groupId,
        groupName: s.groupName,
        projectName: s.projectName,
        supervisorName: s.supervisorName,
        date: s.date,
        location: s.location,
        notes: s.notes,
        examiners: s.examiners || [],
        students: s.students || [],
        thesisURL: s.thesisURL,
      }));
      setTimetable(schedules);

      setExaminers(examinersRes.data?.examiners || []);

      const allSupervisors = groupsRes.data?.allSupervisorsWithGroups || [];
      const flatGroups = [];
      allSupervisors.forEach(supervisor => {
        (supervisor.groups || []).forEach(group => {
          flatGroups.push({ ...group, supervisorName: supervisor.supervisorName });
        });
      });
      setGroups(flatGroups);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/Schedule/remove-schedule/scheduleId/${id}`);
      setTimetable(prev => prev.filter(t => t.id !== id));
      setDeleteId(null);
    } catch (err) { console.error(err); }
  };

  const handleSave = async (data) => {
    try {
      if (data.id) {
        const updatePayload = {
          Date: data.date ? new Date(data.date).toISOString() : "",
          Location: data.location,
          Notes: data.notes || "",
          ExaminersIds: data.examiners,
        };
        await api.patch(`/Schedule/update-schedule/${data.id}`, updatePayload);
      } else {
        const payload = {
          GroupId: data.groupId,
          Date: data.date ? new Date(data.date).toISOString() : "",
          Location: data.location,
          Notes: data.notes || "",
          ExaminersIds: data.examiners,
        };
        await api.post("/Schedule/create-schedule", payload);
      }
      setModal(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = timetable.filter(t =>
    t.groupName?.toLowerCase().includes(search.toLowerCase()) ||
    t.projectName?.toLowerCase().includes(search.toLowerCase()) ||
    t.location?.toLowerCase().includes(search.toLowerCase())
  );

  const emptyForm = {
    groupId: "", groupName: "", supervisorName: "",
    date: "", location: "", notes: "",
    examiners: [],
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Examination Timetable</h1>
          <p className={styles.pageSubtitle}>Schedule and manage group defense sessions</p>
        </div>
        <button className={styles.addBtn} onClick={() => setModal(emptyForm)}>
          <Add fontSize="small" /> Add Schedule
        </button>
      </div>

      <div className={styles.filtersBox}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} fontSize="small" />
          <input
            type="text"
            placeholder="Search by group or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

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
                  <p className={styles.projectTitle}>{t.projectName}</p>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <CalendarMonth fontSize="small" className={styles.infoIcon} />
                    <div>
                      <p className={styles.infoLabel}>Date</p>
                      <p className={styles.infoValue}>
                        {t.date ? new Date(t.date).toLocaleString() : "-"}
                      </p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <Room fontSize="small" className={styles.infoIcon} />
                    <div>
                      <p className={styles.infoLabel}>Location</p>
                      <p className={styles.infoValue}>{t.location || "-"}</p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <People fontSize="small" className={styles.infoIcon} />
                    <div>
                      <p className={styles.infoLabel}>Supervisor</p>
                      <p className={styles.infoValue}>{t.supervisorName || "-"}</p>
                    </div>
                  </div>

                  {t.students?.length > 0 && (
                    <div className={styles.infoItem}>
                      <People fontSize="small" className={styles.infoIcon} />
                      <div>
                        <p className={styles.infoLabel}>Students</p>
                        <p className={styles.infoValue}>{t.students.join(", ")}</p>
                      </div>
                    </div>
                  )}

                  {t.notes && (
                    <div className={styles.infoItem}>
                      <div>
                        <p className={styles.infoLabel}>Notes</p>
                        <p className={styles.infoValue}>{t.notes}</p>
                      </div>
                    </div>
                  )}

                  {t.thesisURL && (
                    <div className={styles.infoItem}>
                      <div>
                        <p className={styles.infoLabel}>Thesis</p>
                        <a
                          href={t.thesisURL}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 13, color: "#C0441A" }}
                        >
                          View Thesis
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.examinersSection}>
                  <p className={styles.examinersLabel}>Examination Committee</p>
                  <div className={styles.examinersList}>
                    {(t.examiners || []).map((name, i) => (
                      <span key={i} className={styles.examinerChip}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button
                  className={styles.editActionBtn}
                  onClick={() => {
                    const examinerIds = (t.examiners || [])
                      .map(name => examiners.find(e => e.fullName === name)?.id)
                      .filter(Boolean);

                    setModal({
                      id: t.id,
                      groupId: t.groupId || "existing",
                      groupName: t.groupName,
                      supervisorName: t.supervisorName,
                      date: t.date ? t.date.slice(0, 16) : "",
                      location: t.location || "",
                      notes: t.notes || "",
                      examiners: examinerIds,
                    });
                  }}
                >
                  <Edit fontSize="small" /> Edit
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => setDeleteId(t.id)}
                >
                  <Delete fontSize="small" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <TimetableModal
          data={modal}
          examiners={examiners}
          groups={groups}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

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

function TimetableModal({ data, examiners, groups, onClose, onSave }) {
  const [form, setForm] = useState({ ...data });
  const [error, setError] = useState("");
  const isEdit = !!data.id;

  const handleGroupChange = (groupId) => {
    const group = groups.find(g => g.groupId === groupId);
    if (group) {
      setForm(prev => ({
        ...prev,
        groupId: group.groupId,
        groupName: group.groupName,
        supervisorName: group.supervisorName || "",
      }));
    } else {
      setForm(prev => ({ ...prev, groupId: "", groupName: "", supervisorName: "" }));
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
    if (!isEdit && !form.groupId) {
      setError("Group, Date, Location, and at least one examiner are required.");
      return false;
    }
    if (!form.date || !form.location?.trim() || form.examiners.length === 0) {
      setError("Date, Location, and at least one examiner are required.");
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(form);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{isEdit ? "Edit Schedule" : "Add Schedule"}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <Close fontSize="small" />
          </button>
        </div>
        <div className={styles.modalBody}>
          {error && <p className={styles.errorMsg}>{error}</p>}

          {!isEdit && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Group <span className={styles.required}>*</span></label>
              <select
                className={styles.select}
                value={form.groupId}
                onChange={(e) => handleGroupChange(e.target.value)}
              >
                <option value="">Select Group</option>
                {groups.map(g => (
                  <option key={g.groupId} value={g.groupId}>
                    {g.groupName} — {g.supervisorName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isEdit && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Group</label>
              <input
                className={styles.input}
                value={form.groupName}
                disabled
                style={{ background: "#f5f5f5", color: "#888" }}
              />
            </div>
          )}

          {form.supervisorName && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Supervisor</label>
              <input
                className={styles.input}
                value={form.supervisorName}
                disabled
                style={{ background: "#f5f5f5", color: "#888" }}
              />
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Date & Time <span className={styles.required}>*</span></label>
            <input
              type="datetime-local"
              className={styles.input}
              value={form.date}
              onChange={(e) => { setForm({ ...form, date: e.target.value }); setError(""); }}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Location <span className={styles.required}>*</span></label>
            <input
              className={styles.input}
              value={form.location}
              onChange={(e) => { setForm({ ...form, location: e.target.value }); setError(""); }}
              placeholder="e.g. H002"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Notes</label>
            <textarea
              className={styles.textarea}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes..."
              rows={3}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Examination Committee <span className={styles.required}>*</span>
            </label>
            <div className={styles.checkList}>
              {examiners.map(e => (
                <label key={e.id} className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={form.examiners.includes(e.id)}
                    onChange={() => handleExaminerToggle(e.id)}
                  />
                  <span>{e.fullName}</span>
                  <span style={{ fontSize: 12, color: "#888", marginLeft: 6 }}>
                    — {e.department}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.modalPublishBtn} onClick={handleSubmit}>
            <SaveAlt fontSize="small" /> {isEdit ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}