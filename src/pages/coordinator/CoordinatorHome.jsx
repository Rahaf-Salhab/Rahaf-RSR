import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import styles from "./CoordinatorHome.module.css";
import {
  People,
  FolderOpen,
  EventNote,
  HourglassEmpty,
  Add,
  CalendarMonth,
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

function StartSemesterScreen({ onStart, loading }) {
  const [form, setForm] = useState({ Name: "", StartDate: "", EndDate: "" });
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!form.Name.trim()) {
      setError("Semester name is required.");
      return;
    }
    if (!form.StartDate) {
      setError("Start date is required.");
      return;
    }
    if (!form.EndDate) {
      setError("End date is required.");
      return;
    }
    if (new Date(form.EndDate) <= new Date(form.StartDate)) {
      setError("End date must be after start date.");
      return;
    }
    setError("");
    onStart(form);
  };

  return (
    <div className={styles.semesterScreen}>
      <div className={styles.semesterCard}>
        <div className={styles.semesterIcon}>
          <CalendarMonth style={{ fontSize: 48, color: "#C0441A" }} />
        </div>
        <h1 className={styles.semesterTitle}>Start New Semester</h1>
        <p className={styles.semesterSubtitle}>
          Please fill in the semester details to get started.
        </p>

        {error && <p className={styles.semesterError}>{error}</p>}

        <div className={styles.semesterForm}>
          <div className={styles.semesterFieldGroup}>
            <label className={styles.semesterLabel}>
              Semester Name <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.semesterInput}
              value={form.Name}
              onChange={(e) => {
                setForm((p) => ({ ...p, Name: e.target.value }));
                setError("");
              }}
              placeholder="e.g. 2025/2026"
            />
          </div>
          <div className={styles.semesterFieldGroup}>
            <label className={styles.semesterLabel}>
              Start Date <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.semesterInput}
              type="date"
              value={form.StartDate}
              onChange={(e) => {
                setForm((p) => ({ ...p, StartDate: e.target.value }));
                setError("");
              }}
            />
          </div>
          <div className={styles.semesterFieldGroup}>
            <label className={styles.semesterLabel}>
              End Date <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.semesterInput}
              type="date"
              value={form.EndDate}
              onChange={(e) => {
                setForm((p) => ({ ...p, EndDate: e.target.value }));
                setError("");
              }}
            />
          </div>
        </div>

        <button
          className={styles.semesterBtn}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Starting..." : "Start New Semester"}
        </button>
      </div>
    </div>
  );
}

export default function CoordinatorHome() {
  const navigate = useNavigate();

  const [checkingSemester, setCheckingSemester] = useState(true);
  const [semesterState, setSemesterState] = useState(null);
  const [startingSemester, setStartingSemester] = useState(false);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [systemStatus, setSystemStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const endDateRef = useRef(null);

  useEffect(() => {
    checkActiveSemester();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // بيشوف إذا انتهى الفصل كل دقيقة
  const startEndDateWatcher = (endDate) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    endDateRef.current = endDate;
    intervalRef.current = setInterval(() => {
      const now = new Date();
      const end = new Date(endDateRef.current);
      if (now >= end) {
        setSemesterState("ended");
        clearInterval(intervalRef.current);
      }
    }, 60000); // كل دقيقة
  };

  const checkActiveSemester = async () => {
    setCheckingSemester(true);
    try {
      const res = await api.get("/Semester/ActiveSemester");
      const semester = res.data?.semester;

      if (semester) {
        const now = new Date();
        const endDate = new Date(semester.endDate);

        if (now >= endDate) {
          setSemesterState("ended");
          setLoading(false);
        } else {
          setSemesterState("active");
          startEndDateWatcher(semester.endDate);
          fetchDashboardData();
        }
      } else {
        setSemesterState("none");
        setLoading(false);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setSemesterState("none");
      } else {
        setSemesterState("active");
        fetchDashboardData();
      }
      setLoading(false);
    } finally {
      setCheckingSemester(false);
    }
  };

  const handleStartSemester = async (form) => {
    setStartingSemester(true);
    try {
      await api.post("/Semester/CreateSemester", {
        Name: form.Name,
        StartDate: new Date(form.StartDate).toISOString(),
        EndDate: new Date(form.EndDate).toISOString(),
      });
      setSemesterState("active");
      startEndDateWatcher(form.EndDate);
      fetchDashboardData();
    } catch (err) {
      console.error("createSemester error:", err);
    } finally {
      setStartingSemester(false);
    }
  };
  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const res = await api.get("/Dashboard/dashboard-coordinator");

      const statistics = res.data?.statistics;

      setStats({
        totalUsers: statistics?.totalUsers ?? 0,
        totalProjects: statistics?.totalProjects ?? 0,
        activeProjects: statistics?.activeProjects ?? 0,
        examinations: statistics?.examinations ?? 0,
      });

      // مؤقتًا لحد ما يصير في endpoint خاصة للأنشطة والـ system status
      setActivities([]);
      setSystemStatus([]);
    } catch (err) {
      console.error("dashboard coordinator error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSemester) return <div className={styles.loading}>Loading...</div>;

  if (semesterState === "none" || semesterState === "ended") {
    return (
      <StartSemesterScreen
        onStart={handleStartSemester}
        loading={startingSemester}
      />
    );
  }

  if (loading) return <div className={styles.loading}>Loading...</div>;

  const cards = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: <People />,
      color: "#e8f4fd",
    },
    {
      label: "Total Projects",
      value: stats?.totalProjects ?? 0,
      icon: <FolderOpen />,
      color: "#fef3e2",
    },
    {
      label: "Active Projects",
      value: stats?.activeProjects ?? 0,
      icon: <HourglassEmpty />,
      color: "#e8fdf0",
    },
    {
      label: "Examinations",
      value: stats?.examinations ?? 0,
      icon: <EventNote />,
      color: "#fde8e8",
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>
            System administration and coordination overview
          </p>
        </div>
        <button
          className={styles.startBtn}
          onClick={() => navigate("/coordinator/create-evaluation-form")}
        >
          <Add fontSize="small" />
          Create Evaluation Form
        </button>
      </div>

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

      <div className={styles.bottom}>
        <div className={styles.box}>
          <h2 className={styles.boxTitle}>Recent Activities</h2>
          {activities.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: 14, padding: "12px 0" }}>
              No recent activities yet.
            </p>
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

        <div className={styles.box}>
          <h2 className={styles.boxTitle}>System Status</h2>
          <div className={styles.statusList}>
            {systemStatus.map((s) => (
              <div key={s.id} className={styles.statusItem}>
                <div className={styles.statusHeader}>
                  <span className={styles.statusLabel}>{s.label}</span>
                  <span className={styles.statusValue}>
                    {s.value}/{s.max}
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width:
                        s.max > 0
                          ? `${Math.min((s.value / s.max) * 100, 100)}%`
                          : "0%",
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
