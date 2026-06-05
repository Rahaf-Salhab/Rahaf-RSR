import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
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
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ExaminerHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProjects: 0,
    upComingExaminations: 0,
  });

  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, scheduleRes] = await Promise.all([
          api.get("/Dashboard/dashboard-examiner"),
          api.get("/Dashboard/dashboard-UpComingExamination"),
        ]);

        setStats(
          statsRes.data.statistics || {
            totalProjects: 0,
            upComingExaminations: 0,
          },
        );

        setSchedule(scheduleRes.data.examinations || []);
      } catch (err) {
        console.error("Failed to fetch examiner dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  const cards = [
    {
      label: "Total Projects",
      value: stats?.totalProjects ?? 0,
      icon: <Folder />,
      color: "#e8f4fd",
    },
    {
      label: "Upcoming Examinations",
      value: stats?.upComingExaminations ?? 0,
      icon: <CalendarMonth />,
      color: "#fde8e8",
    },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Welcome back! Here's your examination overview.
          </p>
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
        {/* Upcoming Schedule */}
        <div className={styles.box}>
          <div className={styles.boxHeader}>
            <h2 className={styles.boxTitle}>Upcoming Examinations</h2>
            <button
              className={styles.viewAllBtn}
              onClick={() => navigate("/examiner/schedule")}
            >
              View All
            </button>
          </div>
          <div className={styles.scheduleList}>
            {schedule.length === 0 ? (
              <p className={styles.empty}>No upcoming examinations.</p>
            ) : (
              schedule.map((s) => (
                <div key={s.scheduleId} className={styles.scheduleItem}>
                  <div className={styles.scheduleDate}>
                    <p className={styles.scheduleDay}>
                      {new Date(s.date).getDate()}
                    </p>
                    <p className={styles.scheduleMonth}>
                      {new Date(s.date).toLocaleString("en", {
                        month: "short",
                      })}
                    </p>
                  </div>

                  <div className={styles.scheduleInfo}>
                    <p className={styles.scheduleTitle}>{s.projectName}</p>
                    <p className={styles.scheduleMeta}>{s.groupName}</p>
                    <p className={styles.scheduleMeta}>
                      {formatTime(s.date)} · {s.location}
                    </p>
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
