import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import EditGroupModal from "./EditGroupModal";
import styles from "./SupervisorGroups.module.css";
import { Add, Search, Delete, People, Close, Edit } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function SupervisorGroups() {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupModal, setGroupModal] = useState(null);
  const [editGroupModal, setEditGroupModal] = useState(null);
  const [search, setSearch] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, studentsRes] = await Promise.all([
        api.get("/Group/groups-supervisor"),
        api.get("/Group/students-supervisor"),
      ]);
      setGroups(groupsRes.data?.groups || []);
      setStudents(studentsRes.data?.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.groupName?.toLowerCase().includes(search.toLowerCase()),
  );

  // نجيب كل الـ studentNumbers الموجودة في أي group
  const assignedStudentNumbers = groups.flatMap(
    (g) => g.students?.map((s) => String(s.studentNumber).trim()) || [],
  );

  const handleSaveGroup = async (formData) => {
    setSaveLoading(true);
    setSaveError("");
    try {
      await api.post("/Group/create-group", {
        GroupName: formData.GroupName,
        ProjectIdea: formData.ProjectIdea,
        ProjectName: formData.ProjectName,
        Description: formData.Description || "",
        StudentIds: formData.StudentIds,
      });
      await fetchData();
      setGroupModal(null);
    } catch (err) {
      const data = err.response?.data;
      if (data?.message) {
        setSaveError(data.message);
      } else if (data?.errors) {
        setSaveError(Object.values(data.errors).flat().join(" "));
      } else {
        setSaveError("Something went wrong. Please try again.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  //==================================================================
  //  Handle Updating an existing group:
  const handleUpdateGroup = async (formData) => {
    setSaveLoading(true);
    setSaveError("");
    try {
      await api.patch(`/Group/update-group/${formData.groupId}`, {
        GroupName: formData.GroupName,
        ProjectIdea: formData.ProjectIdea,
        ProjectName: formData.ProjectName,
        Description: formData.Description || "",
        StudentIds: formData.StudentIds,
      });
      await fetchData(); //Refreshes groups list after successful update
      setEditGroupModal(null); //Closes the edit modal
    } catch (err) {
      //Handles errors from the API
      const data = err.response?.data;
      if (data?.message) {
        setSaveError(data.message);
      } else if (data?.errors) {
        setSaveError(Object.values(data.errors).flat().join(" "));
      } else {
        //Fallback error message for unexpected errors
        setSaveError("Something went wrong. Please try again.");
      }
    } finally {
      setSaveLoading(false);
    }
  };
  //==================================================================

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>My Groups</h1>
          <p className={styles.pageSubtitle}>
            Manage your graduation project groups
          </p>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => {
            setSaveError("");
            setGroupModal({
              GroupName: "",
              ProjectIdea: "",
              ProjectName: "",
              Description: "",
              StudentIds: [],
            });
          }}
        >
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
          <button
            className={styles.addBtn}
            onClick={() => {
              setSaveError("");
              setGroupModal({
                GroupName: "",
                ProjectIdea: "",
                ProjectName: "",
                Description: "",
                StudentIds: [],
              });
            }}
          >
            <Add fontSize="small" /> Add Group
          </button>
        </div>
      ) : (
        <div className={styles.groupsGrid}>
          {filteredGroups.map((g) => (
            <div key={g.groupId} className={styles.groupCard}>
              <div className={styles.groupCardHeader}>
                <h3 className={styles.groupName}>{g.groupName}</h3>
                <div className={styles.groupCardActions}>
                  {/*Edit button to open the EditGroupModal with the selected group's data*/}
                  <button
                    className={styles.editBtn}
                    onClick={async () => {
                      try {
                        setSaveError("");

                        const res = await api.get(`/Groups/group/${g.groupId}`);
                        const groupData = res.data?.group;

                        // نجيب أرقام الطلاب الموجودين اصلا في الجروب الحالي
                        const currentStudentNumbers =
                          groupData.students?.map((s) =>
                            String(s.studentNumber).trim(),
                          ) || [];

                        // نحولهم إلى ids من قائمة students الأساسية
                        const currentStudentIds = currentStudentNumbers
                          .map((studentNumber) => {
                            //
                            const matchedStudent = students.find(
                              (student) =>
                                String(student.studentNumber).trim() ===
                                studentNumber,
                            );
                            return matchedStudent?.id;
                          })
                          .filter(Boolean);

                        // نفتح المودال مع بيانات الجروب المختار
                        setEditGroupModal({
                          groupId: groupData.groupId,
                          GroupName: groupData.groupName,
                          ProjectIdea: groupData.projectIdea,
                          ProjectName: groupData.projectName,
                          Description: groupData.description || "",
                          StudentIds: currentStudentIds,
                          CurrentStudentNumbers: currentStudentNumbers,
                        });
                      } catch (err) {
                        console.error("Error fetching group:", err);
                        setSaveError("Failed to load group data.");
                      }
                    }}
                    title="Edit"
                  >
                    <Edit fontSize="small" />
                  </button>

                  <button
                    onClick={() => navigate(`${g.groupId}`)}
                    className={styles.detailsBtn}
                  >
                    Details
                  </button>
                </div>
              </div>
              <div className={styles.groupInfo}>
                <div className={styles.groupInfoRow}>
                  <span className={styles.groupInfoLabel}>Project</span>
                  <span className={styles.groupInfoValue}>
                    {g.projectName || "-"}
                  </span>
                </div>
                <div className={styles.groupInfoRow}>
                  <span className={styles.groupInfoLabel}>Idea</span>
                  <span className={styles.groupInfoValue}>
                    {g.projectIdea || "-"}
                  </span>
                </div>
                {g.description && (
                  <div className={styles.groupInfoRow}>
                    <span className={styles.groupInfoLabel}>Description</span>
                    <span className={styles.groupInfoValue}>
                      {g.description}
                    </span>
                  </div>
                )}
                <div className={styles.groupInfoRow}>
                  <span className={styles.groupInfoLabel}>Students</span>
                  <div className={styles.studentsList}>
                    {g.students?.length > 0 ? (
                      g.students.map((s, i) => (
                        <span key={i} className={styles.studentChip}>
                          {s.fullName}
                        </span>
                      ))
                    ) : (
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

      {groupModal && (
        <GroupModal
          group={groupModal}
          students={students}
          assignedStudentNumbers={assignedStudentNumbers}
          saveLoading={saveLoading}
          saveError={saveError}
          onClose={() => {
            setGroupModal(null);
            setSaveError("");
          }}
          onSave={handleSaveGroup}
          onClearError={() => setSaveError("")}
        />
      )}

      {/* Open and Close Edit Group Modal [null => Modal hidden , Object => Modal shown with data ] */}
      {editGroupModal && (
        <EditGroupModal
          group={editGroupModal} //  تمرير بيانات الجروب المختار لمودال
          students={students} // تمرير كل الطلاب للمودال
          assignedStudentNumbers={assignedStudentNumbers} // تمرير أرقام الطلاب الموجودين في أي جروب (بما فيهم الجروب الحالي) عشان نقدر نمنع اختيارهم في المودال
          saveLoading={saveLoading}
          saveError={saveError}
          onClose={() => {
            setEditGroupModal(null);
            setSaveError("");
          }}
          onSave={handleUpdateGroup} // handleUpdateGroup بنفذ Update لما المستخدم يضغط
          onClearError={() => setSaveError("")}
        />
      )}
    </div>
  );
}

function GroupModal({
  group,
  students,
  assignedStudentNumbers,
  saveLoading,
  saveError,
  onClose,
  onSave,
  onClearError,
}) {
  const [form, setForm] = useState({ ...group });
  const [localError, setLocalError] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const displayError = saveError || localError;

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.studentNumber || "").includes(studentSearch),
  );

  // نتحقق بالـ studentNumber بدل الـ id
  const isStudentAssigned = (studentNumber) =>
    assignedStudentNumbers.includes(studentNumber);

  // لطالب , بفحص اذا هو مرتبط بجروب او لاcheckbox  عند الضغط على
  const handleStudentToggle = (student) => {
    if (isStudentAssigned(student.studentNumber)) return;
    setForm((prev) => ({
      ...prev,
      StudentIds: prev.StudentIds.includes(student.id)
        ? prev.StudentIds.filter((s) => s !== student.id)
        : [...prev.StudentIds, student.id],
    }));
    onClearError();
    setLocalError("");
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setLocalError("");
    onClearError();
  };

  const handleSave = () => {
    if (!form.GroupName.trim()) {
      setLocalError("Group name is required.");
      return;
    }
    if (!form.ProjectName.trim()) {
      setLocalError("Project name is required.");
      return;
    }
    if (!form.ProjectIdea.trim()) {
      setLocalError("Project idea is required.");
      return;
    }
    if (form.StudentIds.length === 0) {
      setLocalError("At least one student is required.");
      return;
    }
    setLocalError("");
    onSave(form);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Add Group</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <Close fontSize="small" />
          </button>
        </div>
        <div className={styles.modalBody}>
          {displayError && <p className={styles.errorMsg}>{displayError}</p>}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Group Name <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              value={form.GroupName}
              onChange={(e) => handleChange("GroupName", e.target.value)}
              placeholder="e.g. Group A"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Project Name <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              value={form.ProjectName}
              onChange={(e) => handleChange("ProjectName", e.target.value)}
              placeholder="e.g. RSR Platform"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Project Idea <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              value={form.ProjectIdea}
              onChange={(e) => handleChange("ProjectIdea", e.target.value)}
              placeholder="e.g. Graduation Project Management System"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Description <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              className={styles.textarea}
              value={form.Description}
              onChange={(e) => handleChange("Description", e.target.value)}
              placeholder="e.g. A system to manage graduation projects..."
              rows={3}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Students <span className={styles.required}>*</span>
            </label>
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
              {filteredStudents.map((s) => {
                const assigned = isStudentAssigned(s.studentNumber);
                return (
                  <label
                    key={s.id}
                    className={`${styles.checkLabel} ${assigned ? styles.checkLabelDisabled : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={form.StudentIds.includes(s.id)}
                      onChange={() => handleStudentToggle(s)}
                      disabled={assigned}
                    />
                    <span>{s.fullName}</span>
                    {s.studentNumber && (
                      <span className={styles.studentId}>
                        #{s.studentNumber}
                      </span>
                    )}
                    {assigned && (
                      <span className={styles.assignedBadge}>
                        Already in a group
                      </span>
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
            {saveLoading ? "Saving..." : "Add Group"}
          </button>
        </div>
      </div>
    </div>
  );
}
