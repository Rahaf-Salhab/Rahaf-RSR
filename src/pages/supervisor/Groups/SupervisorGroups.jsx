import { useEffect, useState } from "react";
import { mockApi as api } from "../../../api/axiosInstance";
import styles from "./SupervisorGroups.module.css";
import { Add, Search, Edit, Delete, People, Close } from "@mui/icons-material";

export default function SupervisorGroups() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupModal, setGroupModal] = useState(null);
  const [deleteGroupId, setDeleteGroupId] = useState(null);
  const [search, setSearch] = useState("");

  const supervisorId = localStorage.getItem("id");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, usersRes] = await Promise.all([
        api.get("/groups"),
        api.get("/users"),
      ]);
      // بس الجروبات الي هاد السوبرفايزر مسؤول عنها
      const myGroups = groupsRes.data.filter(g => g.supervisorId === supervisorId);
      setGroups(myGroups);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (id) => users.find(u => u.id === id)?.name || "-";

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveGroup = async (groupData) => {
    try {
      const dataWithSupervisor = { ...groupData, supervisorId };
      if (groupData.id) {
        await api.put(`/groups/${groupData.id}`, dataWithSupervisor);
        setGroups(prev => prev.map(g => g.id === groupData.id ? dataWithSupervisor : g));
      } else {
        const newGroup = { ...dataWithSupervisor, id: Date.now().toString() };
        const res = await api.post("/groups", newGroup);
        setGroups(prev => [...prev, res.data]);
      }
      setGroupModal(null);
    } catch (err) { console.error(err); }
  };

  const handleDeleteGroup = async (id) => {
    try {
      await api.delete(`/groups/${id}`);
      setGroups(prev => prev.filter(g => g.id !== id));
      setDeleteGroupId(null);
    } catch (err) { console.error(err); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>My Groups</h1>
          <p className={styles.pageSubtitle}>Manage your graduation project groups</p>
        </div>
        <button className={styles.addBtn} onClick={() => setGroupModal({ name: "", students: [], examinerId: "" })}>
          <Add fontSize="small" /> Add Group
        </button>
      </div>

      <div className={styles.filtersBox}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} fontSize="small" />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : filteredGroups.length === 0 ? (
        <div className={styles.emptyBox}>
          <People style={{ fontSize: 48, color: "#ddd" }} />
          <p>No groups yet.</p>
          <button className={styles.addBtn} onClick={() => setGroupModal({ name: "", students: [], examinerId: "" })}>
            <Add fontSize="small" /> Add Group
          </button>
        </div>
      ) : (
        <div className={styles.groupsGrid}>
          {filteredGroups.map((g) => (
            <div key={g.id} className={styles.groupCard}>
              <div className={styles.groupCardHeader}>
                <h3 className={styles.groupName}>{g.name}</h3>
                <div className={styles.actions}>
                  <button className={styles.editBtn} onClick={() => setGroupModal(g)} title="Edit">
                    <Edit fontSize="small" />
                  </button>
                  <button className={styles.deleteBtn} onClick={() => setDeleteGroupId(g.id)} title="Delete">
                    <Delete fontSize="small" />
                  </button>
                </div>
              </div>
              <div className={styles.groupInfo}>
                <div className={styles.groupInfoRow}>
                  <span className={styles.groupInfoLabel}>Examiner</span>
                  <span className={styles.groupInfoValue}>{getUserName(g.examinerId)}</span>
                </div>
                <div className={styles.groupInfoRow}>
                  <span className={styles.groupInfoLabel}>Students</span>
                  <div className={styles.studentsList}>
                    {g.students?.filter(sid => getUserName(sid) !== null).map(sid => (
                      <span key={sid} className={styles.studentChip}>{getUserName(sid)}</span>
                    ))}
                    {(!g.students || g.students.length === 0) && (
                      <span className={styles.noStudents}>No students assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {groupModal && (
        <GroupModal
          group={groupModal}
          users={users}
          groups={groups}
          onClose={() => setGroupModal(null)}
          onSave={handleSaveGroup}
        />
      )}

      {deleteGroupId && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <h3 className={styles.modalTitle}>Delete Group</h3>
            <p className={styles.modalText}>Are you sure you want to delete this group?</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteGroupId(null)}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={() => handleDeleteGroup(deleteGroupId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupModal({ group, users, groups, onClose, onSave }) {
  const [form, setForm] = useState({ ...group });
  const [error, setError] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const students = users.filter(u => u.role === "student");
  const examiners = users.filter(u => u.role === "examiner");

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.userId || "").includes(studentSearch)
  );

  const isStudentInAnotherGroup = (studentId) =>
    groups.some(g => g.id !== form.id && g.students?.includes(studentId));

  const handleStudentToggle = (id) => {
    if (isStudentInAnotherGroup(id)) return;
    setForm(prev => ({
      ...prev,
      students: prev.students.includes(id)
        ? prev.students.filter(s => s !== id)
        : [...prev.students, id],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim() || form.students.length === 0) {
      setError("Group name and at least one student are required.");
      return;
    }
    setError("");
    onSave(form);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{group.id ? "Edit Group" : "Add Group"}</h3>
          <button className={styles.closeBtn} onClick={onClose}><Close fontSize="small" /></button>
        </div>
        <div className={styles.modalBody}>
          {error && <p className={styles.errorMsg}>{error}</p>}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Group Name <span className={styles.required}>*</span></label>
            <input
              className={styles.input}
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(""); }}
              placeholder="e.g. Group A"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Examiner <span className={styles.optional}>(optional)</span></label>
            <select
              className={styles.select}
              value={form.examinerId}
              onChange={(e) => setForm({ ...form, examinerId: e.target.value })}
            >
              <option value="">Select Examiner</option>
              {examiners.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Students <span className={styles.required}>*</span></label>
            <div className={styles.studentSearchWrapper}>
              <Search className={styles.studentSearchIcon} fontSize="small" />
              <input
                className={styles.studentSearchInput}
                placeholder="Search by name or ID..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
            <div className={styles.studentsCheckList}>
              {filteredStudents.map(s => {
                const inAnotherGroup = isStudentInAnotherGroup(s.id);
                return (
                  <label
                    key={s.id}
                    className={`${styles.checkLabel} ${inAnotherGroup ? styles.checkLabelDisabled : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={form.students.includes(s.id)}
                      onChange={() => handleStudentToggle(s.id)}
                      disabled={inAnotherGroup}
                    />
                    <span>{s.name}</span>
                    {s.userId && <span className={styles.studentId}>#{s.userId}</span>}
                    {inAnotherGroup && <span className={styles.assignedBadge}>Already in a group</span>}
                  </label>
                );
              })}
              {filteredStudents.length === 0 && (
                <p className={styles.noStudents}>No students found.</p>
              )}
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave}>
            {group.id ? "Save Changes" : "Add Group"}
          </button>
        </div>
      </div>
    </div>
  );
}