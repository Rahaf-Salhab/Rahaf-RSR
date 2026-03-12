import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockApi as api } from "../../api/axiosInstance";
import styles from "./ExaminerHome.module.css";
import {
  Folder,
  CheckCircle,
  HourglassEmpty,
  CalendarMonth,
} from "@mui/icons-material";

const timeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

export default function ExaminerHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔴 MOCK
        const [statsRes, projectsRes, scheduleRes] = await Promise.all([
          api.get("/examinerStats"),
          api.get("/examinerProjects"),
          api.get("/examinerSchedule"),
        ]);
        setStats(statsRes.data);
        setProjects(projectsRes.data.slice(0, 4));
        setSchedule(scheduleRes.data);

        // ✅ REAL
        // const [statsRes, projectsRes, scheduleRes] = await Promise.all([
        //   api.get("/examiner/stats"),
        //   api.get("/examiner/projects"),
        //   api.get("/examiner/schedule"),
        // ]);
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
    { label: "Total Projects", value: stats?.totalProjects, icon: <Folder />, color: "#e8f4fd" },
    { label: "Completed Evaluations", value: stats?.completedEvaluations, icon: <CheckCircle />, color: "#f0fdf4" },
    { label: "Pending Evaluations", value: stats?.pendingEvaluations, icon: <HourglassEmpty />, color: "#fef3e2" },
    { label: "Upcoming Examinations", value: stats?.upcomingExaminations, icon: <CalendarMonth />, color: "#fde8e8" },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>Welcome back! Here's your examination overview.</p>
        </div>
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

      {/* Bottom */}
      <div className={styles.bottom}>
        {/* Recent Projects */}
        <div className={styles.box}>
          <div className={styles.boxHeader}>
            <h2 className={styles.boxTitle}>My Projects</h2>
            <button className={styles.viewAllBtn} onClick={() => navigate("/examiner/projects")}>
              View All
            </button>
          </div>
          <div className={styles.projectsList}>
            {projects.map((p) => (
              <div key={p.id} className={styles.projectItem}>
                <div className={styles.projectInfo}>
                  <p className={styles.projectTitle}>{p.title}</p>
                  <p className={styles.projectMeta}>{p.studentName} · {p.supervisorName}</p>
                </div>
                <div className={styles.projectRight}>
                  <span className={`${styles.statusBadge} ${p.status === "evaluated" ? styles.evaluated : styles.pending}`}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                  <p className={styles.projectDate}>{formatDate(p.submissionDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className={styles.box}>
          <div className={styles.boxHeader}>
            <h2 className={styles.boxTitle}>Upcoming Examinations</h2>
            <button className={styles.viewAllBtn} onClick={() => navigate("/examiner/schedule")}>
              View All
            </button>
          </div>
          <div className={styles.scheduleList}>
            {schedule.length === 0 ? (
              <p className={styles.empty}>No upcoming examinations.</p>
            ) : (
              schedule.map((s) => (
                <div key={s.id} className={styles.scheduleItem}>
                  <div className={styles.scheduleDate}>
                    <p className={styles.scheduleDay}>{new Date(s.date).getDate()}</p>
                    <p className={styles.scheduleMonth}>
                      {new Date(s.date).toLocaleString("en", { month: "short" })}
                    </p>
                  </div>
                  <div className={styles.scheduleInfo}>
                    <p className={styles.scheduleTitle}>{s.projectTitle}</p>
                    <p className={styles.scheduleMeta}>{s.studentName}</p>
                    <p className={styles.scheduleMeta}>{formatTime(s.date)} · {s.location}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}