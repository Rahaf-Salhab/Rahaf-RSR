import { useEffect, useState } from "react";
import { mockApi as api } from "../../../api/axiosInstance";
import styles from "./FinalGrades.module.css";
import {
  Search, CheckCircle, HourglassEmpty,
  Publish, SaveAlt, Grade
} from "@mui/icons-material";

const STATUS_OPTIONS = ["All", "draft", "published"];

export default function FinalGrades() {
  const [groups, setGroups] = useState([]);
  const [grades, setGrades] = useState([]);
  const [finalGrades, setFinalGrades] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 🔴 MOCK
      const [groupsRes, gradesRes, finalGradesRes, usersRes] = await Promise.all([
        api.get("/groups"),
        api.get("/grades"),
        api.get("/finalGrades"),
        api.get("/users"),
      ]);
      setGroups(groupsRes.data);
      setGrades(gradesRes.data);
      setFinalGrades(finalGradesRes.data);
      setUsers(usersRes.data);
      // ✅ REAL
      // const [groupsRes, gradesRes, finalGradesRes, usersRes] = await Promise.all([
      //   api.get("/admin/groups"),
      //   api.get("/admin/grades"),
      //   api.get("/admin/final-grades"),
      //   api.get("/admin/users"),
      // ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (id) => users.find(u => String(u.id) === String(id))?.name || "-";

  const getGroupGrades = (groupId) => {
    const supervisorGrades = grades.filter(g =>
      String(g.groupId) === String(groupId) && g.role === "supervisor"
    );
    const examinerGrades = grades.filter(g =>
      String(g.groupId) === String(groupId) && g.role === "examiner"
    );
    const supervisorTotal = supervisorGrades.reduce((sum, g) => sum + (g.total || 0), 0);
    const examinerTotal = examinerGrades.reduce((sum, g) => sum + (g.total || 0), 0);
    return { supervisorTotal, examinerTotal, finalGrade: supervisorTotal + examinerTotal };
  };

  const hasAllGrades = (groupId) => {
    const supervisorGrades = grades.filter(g =>
      String(g.groupId) === String(groupId) && g.role === "supervisor"
    );
    const examinerGrades = grades.filter(g =>
      String(g.groupId) === String(groupId) && g.role === "examiner"
    );
    return supervisorGrades.length > 0 && examinerGrades.length > 0;
  };

  const getFinalGradeStatus = (groupId) => {
    const fg = finalGrades.find(f => String(f.groupId) === String(groupId));
    return fg?.status || "draft";
  };

  const getFinalGradeId = (groupId) => {
    return finalGrades.find(f => String(f.groupId) === String(groupId))?.id;
  };

  const handleStatusChange = async (group, newStatus) => {
    const { supervisorTotal, examinerTotal, finalGrade } = getGroupGrades(group.id);
    const existingId = getFinalGradeId(group.id);

    const data = {
      groupId: group.id,
      groupName: group.name,
      supervisorTotal,
      examinerTotal,
      finalGrade,
      status: newStatus,
    };

    try {
      // 🔴 MOCK
      if (existingId) {
        await api.put(`/finalGrades/${existingId}`, { ...data, id: existingId });
        setFinalGrades(prev => prev.map(f =>
          String(f.id) === String(existingId) ? { ...data, id: existingId } : f
        ));
      } else {
        const newItem = { ...data, id: Date.now().toString() };
        await api.post("/finalGrades", newItem);
        setFinalGrades(prev => [...prev, newItem]);
      }
      // ✅ REAL
      // if (existingId) await api.put(`/admin/final-grades/${existingId}`, data);
      // else await api.post("/admin/final-grades", data);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = groups.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || getFinalGradeStatus(g.id) === statusFilter;
    return matchSearch && matchStatus;
  });

  const publishedCount = groups.filter(g => getFinalGradeStatus(g.id) === "published").length;
  const draftCount = groups.filter(g => getFinalGradeStatus(g.id) === "draft").length;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Final Grades</h1>
          <p className={styles.pageSubtitle}>Review and publish final grades for all groups</p>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard} style={{ borderLeft: "4px solid #6366f1" }}>
          <p className={styles.statValue} style={{ color: "#6366f1" }}>{groups.length}</p>
          <p className={styles.statLabel}>Total Groups</p>
        </div>
        <div className={styles.statCard} style={{ borderLeft: "4px solid #22c55e" }}>
          <p className={styles.statValue} style={{ color: "#22c55e" }}>{publishedCount}</p>
          <p className={styles.statLabel}>Published</p>
        </div>
        <div className={styles.statCard} style={{ borderLeft: "4px solid #f59e0b" }}>
          <p className={styles.statValue} style={{ color: "#f59e0b" }}>{draftCount}</p>
          <p className={styles.statLabel}>Draft</p>
        </div>
      </div>

      <div className={styles.filtersBox}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} fontSize="small" />
          <input
            type="text"
            placeholder="Search by group name..."
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

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyBox}>
          <Grade style={{ fontSize: 56, color: "#ddd" }} />
          <p>No groups found.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Group</th>
                <th>Supervisor</th>
                <th>Supervisor Grade</th>
                <th>Examiner Grade</th>
                <th>Final Grade</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((group, i) => {
                const { supervisorTotal, examinerTotal, finalGrade } = getGroupGrades(group.id);
                const status = getFinalGradeStatus(group.id);
                const hasGrades = supervisorTotal > 0 || examinerTotal > 0;
                const canPublish = hasAllGrades(group.id);
                const isPublished = status === "published";
                const canDraft = canPublish && !isPublished;

                return (
                  <tr key={group.id} className={isPublished ? styles.publishedRow : ""}>
                    <td className={styles.num}>{i + 1}</td>
                    <td>
                      <div className={styles.groupCell}>
                        <div className={styles.groupAvatar}>{group.name.charAt(0)}</div>
                        <span className={styles.groupName}>{group.name}</span>
                      </div>
                    </td>
                    <td className={styles.supervisorCell}>{getUserName(group.supervisorId)}</td>
                    <td>
                      {supervisorTotal > 0 ? (
                        <span className={styles.gradeValue}>{supervisorTotal}</span>
                      ) : (
                        <span className={styles.noGrade}>Not submitted</span>
                      )}
                    </td>
                    <td>
                      {examinerTotal > 0 ? (
                        <span className={styles.gradeValue}>{examinerTotal}</span>
                      ) : (
                        <span className={styles.noGrade}>Not submitted</span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.finalGrade} ${hasGrades ? styles.finalGradeActive : ""}`}>
                        {finalGrade} pts
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${isPublished ? styles.published : styles.draft}`}>
                        {isPublished ? (
                          <><CheckCircle fontSize="small" /> Published</>
                        ) : (
                          <><HourglassEmpty fontSize="small" /> Draft</>
                        )}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.draftBtn}
                          onClick={() => handleStatusChange(group, "draft")}
                          disabled={!canDraft}
                          title={
                            isPublished ? "Already published" :
                            !canPublish ? "Waiting for supervisor and examiner grades" :
                            "Save as Draft"
                          }
                        >
                          <SaveAlt fontSize="small" /> Draft
                        </button>
                        <button
                          className={styles.publishBtn}
                          onClick={() => handleStatusChange(group, "published")}
                          disabled={isPublished || !canPublish}
                          title={
                            isPublished ? "Already published" :
                            !canPublish ? "Waiting for supervisor and examiner grades" :
                            "Publish"
                          }
                        >
                          <Publish fontSize="small" /> Publish
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}