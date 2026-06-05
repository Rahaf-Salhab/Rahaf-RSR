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
  const [activeSemester, setActiveSemester] = useState(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const endDateRef = useRef(null);
useEffect(() => {
  if (!activeSemester) return;

  const start = new Date(activeSemester.startDate);
  const end = new Date(activeSemester.endDate);
  const now = new Date();

  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  const daysRemaining = Math.max(
    Math.ceil((end - now) / (1000 * 60 * 60 * 24)),
    0
  );

  const passedDays = Math.max(totalDays - daysRemaining, 0);

  const progress =
    totalDays > 0
      ? Math.min(Math.round((passedDays / totalDays) * 100), 100)
      : 0;

  const timer = setTimeout(() => {
    setAnimatedProgress(progress);
  }, 200);

  return () => clearTimeout(timer);
}, [activeSemester]);
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
        setActiveSemester(semester);
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

  const formatDate = (dateString) => {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getSemesterInfo = () => {
  if (!activeSemester) {
    return {
      totalDays: 0,
      daysRemaining: 0,
      progress: 0,
    };
  }

  const start = new Date(activeSemester.startDate);
  const end = new Date(activeSemester.endDate);
  const now = new Date();

  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  const daysRemaining = Math.max(
    Math.ceil((end - now) / (1000 * 60 * 60 * 24)),
    0
  );

  const passedDays = Math.max(totalDays - daysRemaining, 0);

  const progress =
    totalDays > 0
      ? Math.min(Math.round((passedDays / totalDays) * 100), 100)
      : 0;

  return {
    totalDays,
    daysRemaining,
    progress,
  };
};

const semesterInfo = getSemesterInfo();

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

    {activeSemester && (
  <div className={styles.semesterStatusCard}>
    <div className={styles.semesterStatusHeader}>
      <div>
        <h2 className={styles.semesterStatusTitle}>Current Semester</h2>
        <p className={styles.semesterStatusName}>
          {activeSemester.name}
        </p>
      </div>

      <span className={styles.activeBadge}>Active</span>
    </div>

    <div className={styles.semesterDatesRow}>
      <div>
        <span>Start Date</span>
        <strong>{formatDate(activeSemester.startDate)}</strong>
      </div>

      <div>
        <span>End Date</span>
        <strong>{formatDate(activeSemester.endDate)}</strong>
      </div>
    </div>

    <div className={styles.semesterProgressHeader}>
      <span>Semester Progress</span>
      <strong>{animatedProgress}%</strong>
    </div>

    <div className={styles.semesterBar}>
      <div
        className={styles.semesterBarFill}
        style={{ width: `${animatedProgress}%` }}
      />
    </div>

    <div className={styles.semesterFooter}>
      <span>Days Remaining</span>
      <strong>
        {semesterInfo.daysRemaining} days
      </strong>
    </div>
  </div>
)}
    </div>
  );
}
