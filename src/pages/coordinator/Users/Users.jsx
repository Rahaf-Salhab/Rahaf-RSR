import { useEffect, useState } from "react";
import api, { mockApi } from "../../../api/axiosInstance";
import styles from "./Users.module.css";
import {
  Add,
  Search,
  People,
  Close,
  Visibility,
  VisibilityOff,
  Delete,
  LockOpen,
  Edit,
} from "@mui/icons-material";
import EditUserModal from "./EditUserModal";

const ROLE_COLORS = {
  student: { bg: "#e8f4fd", color: "#1e40af" },
  supervisor: { bg: "#f0fdf4", color: "#166534" },
  examiner: { bg: "#fef3e2", color: "#92400e" },
  coordinator: { bg: "#fdf4ff", color: "#6b21a8" },
};

const TABS = [
  { key: "students", label: "Students", role: "student" },
  { key: "supervisors", label: "Supervisors", role: "supervisor" },
  { key: "examiners", label: "Examiners", role: "examiner" },
  { key: "coordinators", label: "Coordinators", role: "coordinator" },
  { key: "groups", label: "Groups", role: null },
];

const ID_LABEL = {
  student: "Student Number",
  supervisor: "Supervisor Number",
  examiner: "Examiner Number",
  coordinator: "Coordinator Number",
};

const ENDPOINT_MAP = {
  student: "/User/AssignStudent",
  supervisor: "/User/AssignSupervisor",
  examiner: "/User/AssignExaminer",
  coordinator: "/User/AssignCoordinater",
};

const UPDATE_ENDPOINT_MAP = {
  student: "/User/update-student/{id}",
  supervisor: "/User/update-supervisor/{id}",
  coordinator: "/User/update-coordinater/{id}",
};

const buildPayload = (form) => {
  const base = {
    FullName: form.fullName.trim(),
    UserName: form.userName.trim(),
    Email: form.email.trim(),
    Password: form.password,
  };
  if (form.role === "supervisor")
    return {
      ...base,
      SupervisorNumber: form.number.trim(),
      Department: form.department.trim(),
      MainImage: form.mainImage?.trim() || "",
    };
  if (form.role === "examiner")
    return {
      ...base,
      ExaminerNumber: form.number.trim(),
      Department: form.department.trim(),
      MainImage: form.mainImage?.trim() || "",
    };
  if (form.role === "coordinator")
    return {
      ...base,
      CoordinatorNumber: form.number.trim(),
      Department: form.department.trim(),
      MainImage: form.mainImage?.trim() || "",
    };
  if (form.role === "student")
    return {
      ...base,
      StudentNumber: form.number.trim(),
      College: form.college.trim(),
      Major: form.major.trim(),
    };
  return base;
};

//=======================================================================================================================================

const buildUpdatePayload = (form) => {
  const base = {
    FullName: form.fullName.trim(),
    UserName: form.userName.trim(),
    Email: form.email.trim(),
  };

  if (form.role === "student") {
    return {
      ...base,
      StudentNumber: form.number.trim(),
      College: form.college.trim(),
      Major: form.major.trim(),
    };
  }

  if (form.role === "supervisor") {
    return {
      ...base,
      SupervisorNumber: form.number.trim(),
      Department: form.department.trim(),
    };
  }

  if (form.role === "coordinator") {
    return {
      ...base,
      CoordinatorNumber: form.number.trim(),
      Department: form.department.trim(),
    };
  }

  if (form.role === "examiner") {
    return {
      ...base,
      ExaminerNumber: form.number.trim(),
      Department: form.department.trim(),
    };
  }

  return base;
};

const EMPTY_USER_FORM = (role) => ({
  fullName: "",
  userName: "",
  email: "",
  password: "",
  role,
  number: "",
  department: "",
  college: "",
  major: "",
  mainImage: "",
});

function UserAvatar({ user }) {
  const [imgError, setImgError] = useState(false);
  if (user.pictureProfileURL && !imgError) {
    return (
      <img
        src={user.pictureProfileURL}
        alt={user.name}
        className={styles.avatarImg}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className={styles.avatar}>{user.name?.charAt(0)?.toUpperCase()}</div>
  );
}

export default function Users() {
  const [tab, setTab] = useState("students");
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [blockUserId, setBlockUserId] = useState(null);
  const [unblockUserId, setUnblockUserId] = useState(null);
  const [userModal, setUserModal] = useState(null);
  const [userModalError, setUserModalError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  //==============================================================================================================
  const [editModalUser, setEditModalUser] = useState(null);
  const [editModalError, setEditModalError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    setSearch("");
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        studentsRes,
        supervisorsRes,
        examinersRes,
        coordinatorsRes,
        groupsRes,
      ] = await Promise.all([
        api.get("/User/students"),
        api.get("/User/supervisors"),
        api.get("/User/examiners"),
        api.get("/User/coordinaters"),
        mockApi.get("/groups"),
      ]);

      const students = (studentsRes.data.students || []).map((u) => ({
        id: u.id,
        name: u.fullName,
        userName: u.userName,
        email: u.email,
        userId: u.studentNumber,
        role: "student",
        college: u.college,
        major: u.major,
        pictureProfileURL: u.pictureProfileURL || "",
        isBlocked: u.isBlocked || false,
      }));

      const supervisors = (supervisorsRes.data.supervisors || []).map((u) => ({
        id: u.id,
        name: u.fullName,
        userName: u.userName,
        email: u.email,
        userId: u.supervisorNumber,
        role: "supervisor",
        department: u.department,
        pictureProfileURL: u.pictureProfileURL || "",
        isBlocked: u.isBlocked || false,
      }));

      const examiners = (examinersRes.data.examiners || []).map((u) => ({
        id: u.id,
        name: u.fullName,
        userName: u.userName,
        email: u.email,
        userId: u.examinerNumber,
        role: "examiner",
        department: u.department,
        pictureProfileURL: u.pictureProfileURL || "",
        isBlocked: u.isBlocked || false,
      }));

      const coordinators = (coordinatorsRes.data.coordinaters || []).map(
        (u) => ({
          id: u.id,
          name: u.fullName,
          userName: u.userName,
          email: u.email,
          userId: u.coordinatorNumber,
          role: "coordinator",
          department: u.department,
          pictureProfileURL: u.pictureProfileURL || "",
          isBlocked: u.isBlocked || false,
        }),
      );

      setUsers([...students, ...supervisors, ...examiners, ...coordinators]);
      setGroups(groupsRes.data);
    } catch (err) {
      console.error("fetchData error:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentRole = TABS.find((t) => t.key === tab)?.role;

  const filteredUsers = users.filter((u) => {
    if (u.role !== currentRole) return false;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      (u.userId || "").toLowerCase().includes(q)
    );
  });

  const handleBlockUser = async (id) => {
    try {
      await api.patch(`/User/block/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setBlockUserId(null);
    } catch (err) {
      console.error("blockUser error:", err);
    }
  };

  const handleUnblockUser = async (id) => {
    try {
      await api.patch(`/User/unblock/${id}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isBlocked: false } : u)),
      );
      setUnblockUserId(null);
    } catch (err) {
      console.error("unblockUser error:", err);
    }
  };


  const handleUpdateUser = async (form) => {
    const endpointTemplate = UPDATE_ENDPOINT_MAP[form.role];//role الحال من خلال ال EndPoint تحديد ال  

    if (!endpointTemplate) {
      setEditModalError("Update API is not available for this role yet.");
      return;
    }

    setEditLoading(true);
    setEditModalError("");

    try {
      const endpoint = endpointTemplate.replace("{id}", form.id);
      const payload = buildUpdatePayload(form);

      const res = await api.patch(endpoint, payload);

      if (res.data?.success === false) {
        setEditModalError(res.data.message || "User update failed.");
        return;
      }

      await fetchData();
      setEditModalUser(null);
      setEditModalError("");
    } catch (err) {
      const data = err.response?.data;

      if (data?.errors) {
        const messages = Object.values(data.errors).flat().join(" ");
        setEditModalError(messages);
      } else if (data?.message) {
        setEditModalError(data.message);
      } else if (data?.title) {
        setEditModalError(data.title);
      } else {
        setEditModalError("Something went wrong. Please try again.");
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveUser = async (form) => {
    setSaveLoading(true);
    setUserModalError("");
    try {
      const endpoint = ENDPOINT_MAP[form.role];
      const payload = buildPayload(form);

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      const res = await api.post(endpoint, formData);

      if (res.data?.success === false) {
        setUserModalError(res.data.message || "User creation failed.");
        return;
      }

      await fetchData();
      setUserModal(null);
      setUserModalError("");
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const messages = Object.values(data.errors).flat().join(" ");
        setUserModalError(messages);
      } else if (data?.message) {
        setUserModalError(data.message);
      } else if (data?.title) {
        setUserModalError(data.title);
      } else {
        setUserModalError("Something went wrong. Please try again.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const getUserName = (id) => users.find((u) => u.id === id)?.name || null;

  const handleAddClick = () => {
    setUserModalError("");
    setUserModal(EMPTY_USER_FORM(currentRole));
  };

  const handleEditClick = (user) => {
    if (user.role === "examiner") return;

    setEditModalError("");

    setEditModalUser({
      id: user.id,
      fullName: user.name || "",
      userName: user.userName || "",
      email: user.email || "",
      role: user.role,
      number: user.userId || "",
      department: user.department || "",
      college: user.college || "",
      major: user.major || "",
    });
  };

  const getAddLabel = () => {
    if (tab === "students") return "Add Student";
    if (tab === "supervisors") return "Add Supervisor";
    if (tab === "examiners") return "Add Examiner";
    if (tab === "coordinators") return "Add Coordinator";
    return "";
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Users</h1>
          <p className={styles.pageSubtitle}>Manage users and groups</p>
        </div>
        {tab !== "groups" && (
          <button className={styles.addBtn} onClick={handleAddClick}>
            <Add fontSize="small" /> {getAddLabel()}
          </button>
        )}
      </div>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <span className={styles.tabCount}>
              {t.role
                ? users.filter((u) => u.role === t.role).length
                : groups.length}
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
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr key={u.id}>
                      <td className={styles.num}>{i + 1}</td>
                      <td className={styles.nameCell}>
                        <UserAvatar user={u} />
                        <span>{u.name}</span>
                      </td>
                      <td className={styles.emailCell}>{u.email}</td>
                      <td className={styles.idCell}>{u.userId || "-"}</td>
                      <td>
                        <span
                          className={styles.roleBadge}
                          style={{
                            background: ROLE_COLORS[u.role]?.bg,
                            color: ROLE_COLORS[u.role]?.color,
                          }}
                        >
                          {u.role?.charAt(0).toUpperCase() + u.role?.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={styles.statusBadge}
                          style={{
                            background: u.isBlocked ? "#fff0ed" : "#f0fdf4",
                            color: u.isBlocked ? "#C0441A" : "#166534",
                          }}
                        >
                          {u.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {u.role !== "examiner" && (
                            <button
                              className={styles.editBtn}
                              onClick={() => handleEditClick(u)}
                              title="Edit"
                            >
                              <Edit fontSize="small" />
                            </button>
                          )}
                          {u.isBlocked ? (
                            <button
                              className={styles.unblockBtn}
                              onClick={() => setUnblockUserId(u.id)}
                              title="Unblock"
                            >
                              <LockOpen fontSize="small" />
                            </button>
                          ) : (
                            <button
                              className={styles.blockBtn}
                              onClick={() => setBlockUserId(u.id)}
                              title=""
                            >
                              <Delete fontSize="small" />
                            </button>
                          )}
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
              <p>No groups yet. Groups are created by supervisors.</p>
            </div>
          ) : (
            <div className={styles.groupsGrid}>
              {groups.map((g) => (
                <div key={g.id} className={styles.groupCard}>
                  <div className={styles.groupCardHeader}>
                    <h3 className={styles.groupName}>{g.name}</h3>
                  </div>
                  <div className={styles.groupInfo}>
                    <div className={styles.groupInfoRow}>
                      <span className={styles.groupInfoLabel}>Supervisor</span>
                      <span className={styles.groupInfoValue}>
                        {getUserName(g.supervisorId) || "-"}
                      </span>
                    </div>
                    <div className={styles.groupInfoRow}>
                      <span className={styles.groupInfoLabel}>Examiner</span>
                      <span className={styles.groupInfoValue}>
                        {getUserName(g.examinerId) || "-"}
                      </span>
                    </div>
                    <div className={styles.groupInfoRow}>
                      <span className={styles.groupInfoLabel}>Students</span>
                      <div className={styles.studentsList}>
                        {g.students
                          ?.filter((sid) => getUserName(sid))
                          .map((sid) => (
                            <span key={sid} className={styles.studentChip}>
                              {getUserName(sid)}
                            </span>
                          ))}
                        {(!g.students ||
                          g.students.filter((sid) => getUserName(sid))
                            .length === 0) && (
                          <span className={styles.noStudents}>
                            No students assigned
                          </span>
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
          saveLoading={saveLoading}
          onClose={() => {
            setUserModal(null);
            setUserModalError("");
          }}
          onSave={handleSaveUser}
          onClearError={() => setUserModalError("")}
        />
      )}

      {editModalUser && (
        <EditUserModal
          user={editModalUser}
          externalError={editModalError}
          saveLoading={editLoading}
          onClose={() => {
            setEditModalUser(null);
            setEditModalError("");
          }}
          onSave={handleUpdateUser}
          onClearError={() => setEditModalError("")}
        />
      )}

      {blockUserId && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <h3 className={styles.modalTitle}>Block User</h3>
            <p className={styles.modalText}>
              Are you sure you want to block this user?
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setBlockUserId(null)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBlockBtn}
                onClick={() => handleBlockUser(blockUserId)}
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}

      {unblockUserId && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <h3 className={styles.modalTitle}>Unblock User</h3>
            <p className={styles.modalText}>
              Are you sure you want to unblock this user?
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setUnblockUserId(null)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmUnblockBtn}
                onClick={() => handleUnblockUser(unblockUserId)}
              >
                Unblock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserModal({
  user,
  externalError,
  saveLoading,
  onClose,
  onSave,
  onClearError,
}) {
  const [form, setForm] = useState({ ...user });
  const [localError, setLocalError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const displayError = externalError || localError;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setLocalError("");
    onClearError();
  };

  const validate = () => {
    if (!form.fullName.trim()) return "Full Name is required.";
    if (!form.userName.trim()) return "Username is required.";
    if (!form.email.trim()) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email))
      return "Please enter a valid email address.";
    if (!form.password) return "Password is required.";
    if (form.password.length < 8)
      return "Password must be at least 8 characters.";
    if (!form.number.trim())
      return `${ID_LABEL[form.role] || "ID"} is required.`;
    if (form.role === "student") {
      if (!form.college.trim()) return "College is required.";
      if (!form.major.trim()) return "Major is required.";
    }
    if (["supervisor", "examiner", "coordinator"].includes(form.role)) {
      if (!form.department.trim()) return "Department is required.";
    }
    return null;
  };

  const handleSave = () => {
    const err = validate();
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError("");
    onSave(form);
  };

  const roleLabel = form.role?.charAt(0).toUpperCase() + form.role?.slice(1);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Add {roleLabel}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <Close fontSize="small" />
          </button>
        </div>
        <div className={styles.modalBody}>
          {displayError && <p className={styles.errorMsg}>{displayError}</p>}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Full Name <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              placeholder="e.g. Ahmad Khalil"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Username <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              value={form.userName}
              onChange={(e) => handleChange("userName", e.target.value)}
              placeholder="e.g. ahmad.khalil"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Email <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="e.g. ahmad@ptuk.edu.ps"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Password <span className={styles.required}>*</span>
            </label>
            <div className={styles.passwordWrapper}>
              <input
                className={styles.input}
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Min 8 characters"
                style={{ paddingRight: "42px" }}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass((p) => !p)}
              >
                {showPass ? (
                  <Visibility fontSize="small" sx={{ color: "#888" }} />
                ) : (
                  <VisibilityOff fontSize="small" sx={{ color: "#888" }} />
                )}
              </button>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              {ID_LABEL[form.role] || "ID"}{" "}
              <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              value={form.number}
              onChange={(e) => handleChange("number", e.target.value)}
              placeholder="e.g. 1201234"
            />
          </div>

          {["supervisor", "examiner", "coordinator"].includes(form.role) && (
            <>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Department <span className={styles.required}>*</span>
                </label>
                <input
                  className={styles.input}
                  value={form.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Main Image URL{" "}
                  <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  className={styles.input}
                  value={form.mainImage}
                  onChange={(e) => handleChange("mainImage", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          {form.role === "student" && (
            <>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  College <span className={styles.required}>*</span>
                </label>
                <input
                  className={styles.input}
                  value={form.college}
                  onChange={(e) => handleChange("college", e.target.value)}
                  placeholder="e.g. Engineering"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Major <span className={styles.required}>*</span>
                </label>
                <input
                  className={styles.input}
                  value={form.major}
                  onChange={(e) => handleChange("major", e.target.value)}
                  placeholder="e.g. Computer Science"
                />
              </div>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={saveLoading}
          >
            Cancel
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saveLoading}
          >
            {saveLoading ? "Saving..." : `Add ${roleLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}
