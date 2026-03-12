import { useEffect, useState } from "react";
import { mockApi as api } from "../../../api/axiosInstance";
import styles from "./Users.module.css";
import { Add, Search, Edit, Delete, People, Close } from "@mui/icons-material";

const ROLE_COLORS = {
  student: { bg: "#e8f4fd", color: "#1e40af" },
  supervisor: { bg: "#f0fdf4", color: "#166534" },
  examiner: { bg: "#fef3e2", color: "#92400e" },
};

const TABS = [
  { key: "students", label: "Students", role: "student" },
  { key: "supervisors", label: "Supervisors", role: "supervisor" },
  { key: "examiners", label: "Examiners", role: "examiner" },
  { key: "groups", label: "Groups", role: null },
];

const ID_LABEL = {
  student: "Student ID",
  supervisor: "ID",
  examiner: "ID",
};

export default function Users() {
  const [tab, setTab] = useState("students");
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteGroupId, setDeleteGroupId] = useState(null);
  const [userModal, setUserModal] = useState(null);
  const [groupModal, setGroupModal] = useState(null);
  const [userModalError, setUserModalError] = useState("");

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setSearch(""); }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 🔴 MOCK
      const [usersRes, groupsRes] = await Promise.all([
        api.get("/users"),
        api.get("/groups"),
      ]);
      setUsers(usersRes.data);
      setGroups(groupsRes.data);
      // ✅ REAL
      // const [usersRes, groupsRes] = await Promise.all([
      //   api.get("/admin/users"),
      //   api.get("/admin/groups"),
      // ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentRole = TABS.find(t => t.key === tab)?.role;

  const filteredUsers = users.filter(u => {
    const matchRole = u.role === currentRole;
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.userId || "").toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      setDeleteUserId(null);
    } catch (err) { console.error(err); }
  };

  const handleSaveUser = async (userData) => {
    const isDuplicateEmail = users.some(u =>
      u.email.toLowerCase() === userData.email.toLowerCase() && u.id !== userData.id
    );
    if (isDuplicateEmail) {
      setUserModalError("This email is already used by another user.");
      return;
    }

    const isDuplicateUserId = users.some(u =>
      u.userId && u.userId === userData.userId && u.id !== userData.id
    );
    if (isDuplicateUserId) {
      setUserModalError("This ID is already used by another user.");
      return;
    }

    try {
      if (userData.id) {
        await api.put(`/users/${userData.id}`, userData);
        setUsers(prev => prev.map(u => u.id === userData.id ? userData : u));
      } else {
        const newUser = {
          ...userData,
          id: Date.now().toString(),
          accessToken: "fake-token",
          refreshToken: "fake-refresh",
          password: "Abc@12345",
        };
        const res = await api.post("/users", newUser);
        setUsers(prev => [...prev, res.data]);
      }
      setUserModalError("");
      setUserModal(null);
    } catch (err) { console.error(err); }
  };

  const handleDeleteGroup = async (id) => {
    try {
      await api.delete(`/groups/${id}`);
      setGroups(prev => prev.filter(g => g.id !== id));
      setDeleteGroupId(null);
    } catch (err) { console.error(err); }
  };

  const handleSaveGroup = async (groupData) => {
    try {
      if (groupData.id) {
        await api.put(`/groups/${groupData.id}`, groupData);
        setGroups(prev => prev.map(g => g.id === groupData.id ? groupData : g));
      } else {
        const newGroup = { ...groupData, id: Date.now().toString() };
        const res = await api.post("/groups", newGroup);
        setGroups(prev => [...prev, res.data]);
      }
      setGroupModal(null);
    } catch (err) { console.error(err); }
  };

  const getUserName = (id) => users.find(u => u.id === id)?.name || null;

  const getAddLabel = () => {
    if (tab === "students") return "Add Student";
    if (tab === "supervisors") return "Add Supervisor";
    if (tab === "examiners") return "Add Examiner";
    return "Add Group";
  };

  const handleAddClick = () => {
    setUserModalError("");
    if (tab === "groups") {
      setGroupModal({ name: "", students: [], supervisorId: "", examinerId: "" });
    } else {
      setUserModal({ name: "", email: "", role: currentRole, userId: "" });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Users</h1>
          <p className={styles.pageSubtitle}>Manage users and groups</p>
        </div>
        <button className={styles.addBtn} onClick={handleAddClick}>
          <Add fontSize="small" /> {getAddLabel()}
        </button>
      </div>

      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <span className={styles.tabCount}>
              {t.role ? users.filter(u => u.role === t.role).length : groups.length}
            </span>
          </button>
        ))}
      </div>

      {tab !== "groups" && (
        <>
          <div className={styles.filtersBox}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} fontSize="small" />
              <input
                type="text"
                placeholder={`Search ${tab} by name, email or ID...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>{ID_LABEL[currentRole] || "ID"}</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr key={u.id}>
                      <td className={styles.num}>{i + 1}</td>
                      <td className={styles.nameCell}>
                        <div className={styles.avatar}>{u.name.charAt(0)}</div>
                        {u.name}
                      </td>
                      <td className={styles.emailCell}>{u.email}</td>
                      <td className={styles.idCell}>{u.userId || "-"}</td>
                      <td>
                        <span className={styles.roleBadge} style={{
                          background: ROLE_COLORS[u.role]?.bg,
                          color: ROLE_COLORS[u.role]?.color
                        }}>
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.editBtn}
                            onClick={() => { setUserModalError(""); setUserModal(u); }}
                            title="Edit"
                          >
                            <Edit fontSize="small" />
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => setDeleteUserId(u.id)}
                            title="Delete"
                          >
                            <Delete fontSize="small" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className={styles.empty}>No {tab} found.</div>
              )}
            </div>
          )}
        </>
      )}

      {tab === "groups" && (
        <>
          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : groups.length === 0 ? (
            <div className={styles.emptyBox}>
              <People style={{ fontSize: 48, color: "#ddd" }} />
              <p>No groups yet.</p>
              <button className={styles.addBtn} onClick={() => setGroupModal({ name: "", students: [], supervisorId: "", examinerId: "" })}>
                <Add fontSize="small" /> Add Group
              </button>
            </div>
          ) : (
            <div className={styles.groupsGrid}>
              {groups.map((g) => (
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
                      <span className={styles.groupInfoLabel}>Supervisor</span>
                      <span className={styles.groupInfoValue}>{getUserName(g.supervisorId) || "-"}</span>
                    </div>
                    <div className={styles.groupInfoRow}>
                      <span className={styles.groupInfoLabel}>Examiner</span>
                      <span className={styles.groupInfoValue}>{getUserName(g.examinerId) || "-"}</span>
                    </div>
                    <div className={styles.groupInfoRow}>
                      <span className={styles.groupInfoLabel}>Students</span>
                      <div className={styles.studentsList}>
                        {g.students
                          .filter(sid => getUserName(sid) !== null)
                          .map(sid => (
                            <span key={sid} className={styles.studentChip}>
                              {getUserName(sid)}
                            </span>
                          ))}
                        {g.students.filter(sid => getUserName(sid) !== null).length === 0 && (
                          <span className={styles.noStudents}>No students assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {userModal && (
        <UserModal
          user={userModal}
          externalError={userModalError}
          onClose={() => { setUserModal(null); setUserModalError(""); }}
          onSave={handleSaveUser}
          onClearError={() => setUserModalError("")}
        />
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

      {deleteUserId && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <h3 className={styles.modalTitle}>Delete User</h3>
            <p className={styles.modalText}>Are you sure you want to delete this user?</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteUserId(null)}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={() => handleDeleteUser(deleteUserId)}>Delete</button>
            </div>
          </div>
        </div>
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

// ── User Modal ──────────────────────────────────────────────────────
function UserModal({ user, externalError, onClose, onSave, onClearError }) {
  const [form, setForm] = useState({ ...user });
  const [error, setError] = useState("");

  const idLabel = ID_LABEL[form.role] || "ID";
  const combinedError = externalError || error;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError("");
    onClearError();
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim() || !form.userId?.trim()) {
      setError("All fields are required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    onSave(form);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{user.id ? "Edit User" : "Add User"}</h3>
          <button className={styles.closeBtn} onClick={onClose}><Close fontSize="small" /></button>
        </div>
        <div className={styles.modalBody}>
          {combinedError && <p className={styles.errorMsg}>{combinedError}</p>}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Full Name <span className={styles.required}>*</span></label>
            <input
              className={styles.input}
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Rahaf Salhab"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Email <span className={styles.required}>*</span></label>
            <input
              className={styles.input}
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="e.g. user@ptuk.edu.ps"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>{idLabel} <span className={styles.required}>*</span></label>
            <input
              className={styles.input}
              value={form.userId || ""}
              onChange={(e) => handleChange("userId", e.target.value)}
              placeholder={form.role === "student" ? "e.g. 1201234" : "e.g. EMP001"}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Role <span className={styles.required}>*</span></label>
            <select
              className={styles.select}
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
            >
              <option value="student">Student</option>
              <option value="supervisor">Supervisor</option>
              <option value="examiner">Examiner</option>
            </select>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave}>
            {user.id ? "Save Changes" : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Group Modal ─────────────────────────────────────────────────────
function GroupModal({ group, users, groups, onClose, onSave }) {
  const [form, setForm] = useState({ ...group });
  const [error, setError] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const students = users.filter(u => u.role === "student");
  const supervisors = users.filter(u => u.role === "supervisor");
  const examiners = users.filter(u => u.role === "examiner");

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.userId || "").includes(studentSearch)
  );

  const isStudentInAnotherGroup = (studentId) => {
    return groups.some(g => g.id !== form.id && g.students.includes(studentId));
  };

  const handleStudentToggle = (id) => {
    if (isStudentInAnotherGroup(id)) return;
    setForm(prev => ({
      ...prev,
      students: prev.students.includes(id)
        ? prev.students.filter(s => s !== id)
        : [...prev.students, id]
    }));
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.supervisorId || !form.examinerId || form.students.length === 0) {
      setError("All fields are required and at least one student must be selected.");
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
            <label className={styles.label}>Assign Supervisor <span className={styles.required}>*</span></label>
            <select className={styles.select} value={form.supervisorId} onChange={(e) => { setForm({ ...form, supervisorId: e.target.value }); setError(""); }}>
              <option value="">Select Supervisor</option>
              {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Assign Examiner <span className={styles.required}>*</span></label>
            <select className={styles.select} value={form.examinerId} onChange={(e) => { setForm({ ...form, examinerId: e.target.value }); setError(""); }}>
              <option value="">Select Examiner</option>
              {examiners.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Select Students <span className={styles.required}>*</span></label>
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
                    title={inAnotherGroup ? "Already assigned to another group" : ""}
                  >
                    <input
                      type="checkbox"
                      checked={form.students.includes(s.id)}
                      onChange={() => handleStudentToggle(s.id)}
                      disabled={inAnotherGroup}
                    />
                    <span>{s.name}</span>
                    {s.userId && <span className={styles.studentId}>#{s.userId}</span>}
                    {inAnotherGroup && (
                      <span className={styles.assignedBadge}>Already in a group</span>
                    )}
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