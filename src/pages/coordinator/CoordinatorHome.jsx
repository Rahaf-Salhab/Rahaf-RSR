import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockApi as api } from "../../api/axiosInstance";
import styles from "./CoordinatorHome.module.css";
import {
  People,
  FolderOpen,
  EventNote,
  HourglassEmpty,
  Add,
} from "@mui/icons-material";

const timeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 0) return "just now";
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
};

export default function CoordinatorHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [systemStatus, setSystemStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔴 MOCK
        const [
          statsRes, usersRes, timetableRes,
          thesisRes, groupsRes, gradesRes
        ] = await Promise.all([
          api.get("/coordinatorStats"),
          api.get("/users"),
          api.get("/examinationTimetable"),
          api.get("/thesis"),
          api.get("/groups"),
          api.get("/grades"),
        ]);

        // ✅ REAL
        // const [
        //   statsRes, usersRes, timetableRes,
        //   thesisRes, groupsRes, gradesRes
        // ] = await Promise.all([
        //   api.get("/coordinator/stats"),
        //   api.get("/admin/users"),
        //   api.get("/examination-timetable"),
        //   api.get("/thesis"),
        //   api.get("/admin/groups"),
        //   api.get("/admin/grades"),
        // ]);

        // Stats
        const realUsers = usersRes.data.filter(u => u.role !== "coordinator");
        const activeProjects = thesisRes.data.filter(t => t.status === "in-progress").length;
        const pendingGrades = groupsRes.data.reduce((count, group) => {
          const hasSupervisor = gradesRes.data.some(g => g.groupId === group.id && g.role === "supervisor");
          const hasExaminer = gradesRes.data.some(g => g.groupId === group.id && g.role === "examiner");
          if (!hasSupervisor) count++;
          if (!hasExaminer) count++;
          return count;
        }, 0);

        setStats({
          ...statsRes.data,
          totalUsers: realUsers.length,
          examinations: timetableRes.data.length,
          activeProjects,
          pendingGrades,
        });

        // Recent Activities - من مصادر متعددة بدون duplicates
        const gradeActivities = gradesRes.data.map(g => ({
          id: `grade-${g.id}`,
          text: `Grades submitted for ${g.groupName} by ${g.role}`,
          createdAt: g.createdAt,
        }));

        const userActivities = usersRes.data
          .filter(u => u.role !== "coordinator" && u.createdAt)
          .map(u => ({
            id: `user-${u.id}`,
            text: `New ${u.role} registered: ${u.name}`,
            createdAt: u.createdAt,
          }));

        const thesisActivities = thesisRes.data
          .filter(t => t.createdAt)
          .map(t => ({
            id: `thesis-${t.id}`,
            text: `Thesis "${t.title}" added with status ${t.status}`,
            createdAt: t.createdAt,
          }));

        const timetableActivities = timetableRes.data
          .filter(t => t.createdAt)
          .map(t => ({
            id: `timetable-${t.id}`,
            text: `Examination scheduled for ${t.groupName}`,
            createdAt: t.createdAt,
          }));

        const seen = new Set();
        const allActivities = [
          ...gradeActivities,
          ...userActivities,
          ...thesisActivities,
          ...timetableActivities,
        ]
          .filter(a => a.createdAt)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .filter(a => {
            if (seen.has(a.text)) return false;
            seen.add(a.text);
            return true;
          })
          .slice(0, 5);

        setActivities(allActivities);

        // System Status
        const allSupervisors = usersRes.data.filter(u => u.role === "supervisor");
        const allStudents = usersRes.data.filter(u => u.role === "student");
        const allExaminers = usersRes.data.filter(u => u.role === "examiner");

        const activeSupervisors = allSupervisors.filter(u =>
          groupsRes.data.some(g => g.supervisorId === u.id)
        ).length;

        const activeStudents = allStudents.filter(u =>
          groupsRes.data.some(g => g.students.includes(u.id))
        ).length;

        const activeExaminers = allExaminers.filter(u =>
          groupsRes.data.some(g => g.examinerId === u.id)
        ).length;

        // ✅ REAL
        // const { activeSupervisors, activeStudents, activeExaminers,
        //         totalSupervisors, totalStudents, totalExaminers } = statsRes.data;

        setSystemStatus([
          {
            id: 1,
            label: "Active Supervisors",
            value: activeSupervisors,
            max: allSupervisors.length,
            color: "#22c55e",
          },
          {
            id: 2,
            label: "Active Students",
            value: activeStudents,
            max: allStudents.length,
            color: "#3b82f6",
          },
          {
            id: 3,
            label: "Active Examiners",
            value: activeExaminers,
            max: allExaminers.length,
            color: "#a855f7",
          },
        ]);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  const cards = [
    { label: "Total Users", value: stats?.totalUsers, icon: <People />, color: "#e8f4fd" },
    { label: "Active Projects", value: stats?.activeProjects, icon: <FolderOpen />, color: "#fef3e2" },
    { label: "Examinations", value: stats?.examinations, icon: <EventNote />, color: "#fde8e8" },
    { label: "Pending Grades", value: stats?.pendingGrades, icon: <HourglassEmpty />, color: "#e8fdf0" },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>System administration and coordination overview</p>
        </div>
        <button
          className={styles.startBtn}
          onClick={() => navigate("/coordinator/create-evaluation-form")}
        >
          <Add fontSize="small" />
          Create Evaluation Form
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.cards}>
        {cards.map((card, i) => (
          <div key={i} className={styles.card}>
            <div>
              <p className={styles.cardLabel}>{card.label}</p>
              <p className={styles.cardValue}>{card.value}</p>
            </div>
            <div className={styles.cardIcon} style={{ background: card.color }}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className={styles.bottom}>
        {/* Recent Activities */}
        <div className={styles.box}>
          <h2 className={styles.boxTitle}>Recent Activities</h2>
          {activities.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: 14, padding: "12px 0" }}>No recent activities yet.</p>
          ) : (
            <div className={styles.activities}>
              {activities.map((a) => (
                <div key={a.id} className={styles.activityItem}>
                  <p className={styles.activityText}>{a.text}</p>
                  <p className={styles.activityTime}>{timeAgo(a.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Status */}
        <div className={styles.box}>
          <h2 className={styles.boxTitle}>System Status</h2>
          <div className={styles.statusList}>
            {systemStatus.map((s) => (
              <div key={s.id} className={styles.statusItem}>
                <div className={styles.statusHeader}>
                  <span className={styles.statusLabel}>{s.label}</span>
                  <span className={styles.statusValue}>{s.value}/{s.max}</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: s.max > 0 ? `${Math.min((s.value / s.max) * 100, 100)}%` : "0%",
                      background: s.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}