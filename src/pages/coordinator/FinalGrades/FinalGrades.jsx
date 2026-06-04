import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import styles from "./FinalGrades.module.css";
import {
  Search, CheckCircle, HourglassEmpty,
  Publish, SaveAlt, Grade
} from "@mui/icons-material";

const STATUS_OPTIONS = ["All", "Draft", "Published"];

export default function FinalGrades() {
  const [groups, setGroups] = useState([]);
  const [finalGrades, setFinalGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [generatingId, setGeneratingId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, finalGradesRes] = await Promise.all([
        api.get("/Groups/groups-coordinater"),
        api.get("/Coordinator/EvaluationForms/final-results"),
      ]);

      const allSupervisors = groupsRes.data?.allSupervisorsWithGroups || [];
      const flatGroups = [];
      allSupervisors.forEach(supervisor => {
        (supervisor.groups || []).forEach(group => {
          flatGroups.push({ ...group, supervisorName: supervisor.supervisorName });
        });
      });
      setGroups(flatGroups);
      setFinalGrades(finalGradesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFinalGrade = (groupId) =>
    finalGrades.find(f => String(f.groupId) === String(groupId)) || null;

  const handleGenerate = async (groupId) => {
    setGeneratingId(groupId);
    try {
      await api.post(`/Coordinator/EvaluationForms/final-grade/${groupId}`);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePublish = async (groupId) => {
    const fg = getFinalGrade(groupId);
    if (!fg) return;
    try {
      await api.post(`/Coordinator/EvaluationForms/final-grade/publish/${groupId}`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDraft = async (groupId) => {
    const fg = getFinalGrade(groupId);
    if (!fg) return;
    try {
      await api.post(`/Coordinator/EvaluationForms/final-grade/draft/${groupId}`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = groups.filter(g => {
    const fg = getFinalGrade(g.groupId);
    const matchSearch = g.groupName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" ||
      (fg?.status?.toLowerCase() === statusFilter.toLowerCase()) ||
      (!fg && statusFilter === "Draft");
    return matchSearch && matchStatus;
  });

  const publishedCount = finalGrades.filter(f => f.status?.toLowerCase() === "published").length;
  const draftCount = finalGrades.filter(f => f.status?.toLowerCase() === "draft").length;

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
              {s === "All" ? "All Status" : s}
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
                const fg = getFinalGrade(group.groupId);
                const isPublished = fg?.status?.toLowerCase() === "published";
                const isDraft = fg?.status?.toLowerCase() === "draft";

                return (
                  <tr key={group.groupId} className={isPublished ? styles.publishedRow : ""}>
                    <td className={styles.num}>{i + 1}</td>
                    <td>
                      <div className={styles.groupCell}>
                        <div className={styles.groupAvatar}>
                          {group.groupName?.charAt(0).toUpperCase()}
                        </div>
                        <span className={styles.groupName}>{group.groupName}</span>
                      </div>
                    </td>
                    <td className={styles.supervisorCell}>
                      {fg?.supervisorName || group.supervisorName || "-"}
                    </td>
                    <td>
                      {fg ? (
                        <span className={styles.gradeValue}>{fg.supervisorGrade}</span>
                      ) : (
                        <span className={styles.noGrade}>Not submitted</span>
                      )}
                    </td>
                    <td>
                      {fg ? (
                        <span className={styles.gradeValue}>{fg.examinerGrade}</span>
                      ) : (
                        <span className={styles.noGrade}>Not submitted</span>
                      )}
                    </td>
                    <td>
                      {fg ? (
                        <span className={`${styles.finalGrade} ${styles.finalGradeActive}`}>
                          {fg.finalGrade} pts
                        </span>
                      ) : (
                        <span className={styles.noGrade}>-</span>
                      )}
                    </td>
                    <td>
                      {fg ? (
                        <span className={`${styles.statusBadge} ${isPublished ? styles.published : styles.draft}`}>
                          {isPublished ? (
                            <><CheckCircle fontSize="small" /> Published</>
                          ) : (
                            <><HourglassEmpty fontSize="small" /> Draft</>
                          )}
                        </span>
                      ) : (
                        <span className={`${styles.statusBadge} ${styles.draft}`}>
                          <HourglassEmpty fontSize="small" /> No Grade
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {!fg ? (
                          <button
                            className={styles.publishBtn}
                            onClick={() => handleGenerate(group.groupId)}
                            disabled={generatingId === group.groupId}
                          >
                            {generatingId === group.groupId ? "Generating..." : "Generate"}
                          </button>
                        ) : (
                          <>
                            <button
                              className={styles.draftBtn}
                              onClick={() => handleDraft(group.groupId)}
                              disabled={isDraft}
                            >
                              <SaveAlt fontSize="small" /> Draft
                            </button>
                            <button
                              className={styles.publishBtn}
                              onClick={() => handlePublish(group.groupId)}
                              disabled={isPublished}
                            >
                              <Publish fontSize="small" /> Publish
                            </button>
                          </>
                        )}
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