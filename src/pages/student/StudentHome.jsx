import { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import styles from "./StudentHome.module.css";
import {
  TrendingUp,
  TaskAlt,
  CalendarMonth,
  AccessTime,
} from "@mui/icons-material";

function StudentHome() {
  const [stats, setStats] = useState(null);
  const [deadlines, setDeadlines] = useState([]);

  const [projectStatus, setProjectStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const fetchStudentDashboard = async () => {
      try {
        const [dashboardRes, deadlinesRes] = await Promise.all([
          api.get("/Dashboard/dashboard-student"),
          api.get("/Dashboard/dashboard-deadlines"),
        ]);

        const statistics = dashboardRes.data?.statistics;

        setStats({
          totalTasks: statistics?.totalTask || 0,
          tasksCompleted: statistics?.completedTask || 0,
        });

        setProjectStatus(statistics?.projectStatus || "No Status");

        setDeadlines(deadlinesRes.data?.deadlines || []);
      } catch (err) {
        console.error("Error fetching student dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDashboard();
  }, []);

  // Animate progressBar on projectStatus change
  useEffect(() => {
    if (!stats) return;

    const progress =
      stats.totalTasks > 0
        ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100)
        : 0;

    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);

    return () => clearTimeout(timer);
  }, [stats]); //  Animation تتغير شغل ال projectStatus لما ال

  if (loading) return <div className={styles.loading}>Loading...</div>;

  const formatDate = (date) => {
    if (!date) return "No deadline";

    return new Date(date).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;

    const today = new Date();
    const deadlineDate = new Date(deadline);

    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // حساب نسبة الانجاز الحالي بناء على عدد المهام المكتملو وعدد المهام الكلي
  const progress =
    stats?.totalTasks > 0
      ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100)
      : 0;

  const cards = [
    {
      label: "Tasks Completed",
      value: `${stats?.tasksCompleted}/${stats?.totalTasks}`,
      icon: <TaskAlt />,
    },
    {
      label: "Total Tasks",
      value: stats?.totalTasks,
      icon: <CalendarMonth />,
    },
    {
      label: "Project Progress",
      value: `${progress}%`,
      icon: <TrendingUp />,
    },
  ];

  return (
    <div className={styles.page}>
      {/* Header part*/}
      <div className={styles.PageHeader}>
        <div>
          <h1 className={styles.PageTitle}>Dashboard</h1>
          <p className={styles.PageSubtitle}>
            Welcome back! Here's your project overview.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className={styles.cards}>
        {cards.map((card, i) => (
          <div key={i} className={styles.card}>
            <div>
              <p className={styles.cardLabel}>{card.label}</p>
              <p className={styles.cardValue}>{card.value}</p>
            </div>
            <div className={styles.cardIcon} style={{ background: "#f4ebe7" }}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className={styles.bottom}>
        {/* Project Status */}
        <div className={styles.box}>
          <div className={styles.boxHeader}>
            <h2 className={styles.boxTitle}>Project Status</h2>
          </div>

          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Overall Progress</span>
            <span className={styles.progressValue}>{progress}%</span>
          </div>

          {/*شريط التقدم*/}
          <div className={styles.progressBar}>
            {/*progressBar هو الشريط الكامل */}
            <div
              className={styles.progressFill}
              style={{ width: `${animatedProgress}%` }}
            ></div>
            {/** progressFill هو الجزء المملوء من الشريط اللي يعبر عن نسبة الانجاز*/}
          </div>
          <div className={styles.phaseList}>
            <div className={styles.phaseItem}>
              <span className={styles.phaseName}>Current Status</span>
              <span
                className={`${styles.statusBadge} ${
                  projectStatus === "Completed"
                    ? styles.completed
                    : projectStatus === "InProgress"
                      ? styles.inProgress
                      : styles.pending
                }`}
              >
                {projectStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        {/* Upcoming Deadlines */}
        <div className={styles.box}>
          <div className={styles.boxHeader}>
            <h2 className={styles.boxTitle}>Upcoming Deadlines</h2>
          </div>

          <div className={styles.deadlineList}>
            {deadlines.length > 0 ? (
              deadlines.map((item) => {
                const daysLeft = getDaysLeft(item.deadline);

                return (
                  <div key={item.id} className={styles.deadlineItem}>
                    <div>
                      <p className={styles.deadlineTitle}>{item.title}</p>
                      <p className={styles.deadlineDate}>
                        {item.type} • {formatDate(item.deadline)}
                      </p>
                    </div>

                    <div className={styles.deadlineRight}>
                      <AccessTime fontSize="small" />

                      <span
                        className={
                          daysLeft !== null && daysLeft <= 5
                            ? styles.deadlineUrgent
                            : styles.deadlineNormal
                        }
                      >
                        {daysLeft < 0
                          ? "Overdue"
                          : daysLeft === 0
                            ? "Today"
                            : `${daysLeft} days`}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className={styles.emptyText}>No upcoming deadlines.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentHome;
