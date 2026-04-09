import { useEffect, useState } from "react";
import { mockApi as api } from "../../api/axiosInstance";
import styles from "./StudentHome.module.css";
import {
  TrendingUp,
  TaskAlt,
  CalendarMonth,
  AccessTime,
} from "@mui/icons-material";

function StudentHome() {
  const [stats, setStats] = useState(null);
  const [projectStatus, setProjectStatus] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const fetchStudentDashboard = async () => {
      try {
        const gradesRes = await api.get("/finalGrades");
        const finalGrade = gradesRes.data?.[0];

        setStats({
          tasksCompleted: 12,
          totalTasks: 18,
          submissions: 8,
          currentGrade: finalGrade?.finalGrade || 0,
        });

        setProjectStatus({
          progress: 75,
          phases: [
            { name: "Research Phase", status: "Completed" },
            { name: "Writing Phase", status: "In Progress" },
            { name: "Review Phase", status: "Pending" },
          ],
        });

        setDeadlines([
          {
            id: 1,
            title: "Chapter 3 Submission",
            date: "2026-02-20",
            daysLeft: 5,
          },
          {
            id: 2,
            title: "Presentation Review",
            date: "2026-02-25",
            daysLeft: 10,
          },
          {
            id: 3,
            title: "Final Thesis Draft",
            date: "2026-03-05",
            daysLeft: 18,
          },
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDashboard();
  }, []);

  // Animate progressBar on projectStatus change
  useEffect(() => {
    if (!projectStatus) return;

    const timer = setTimeout(() => {
      setAnimatedProgress(projectStatus.progress);
    }, 100); //  progress بعد 100 ثانية بتتغير القيمية من 0 الى قيمة ال

    return () => clearTimeout(timer);
  }, [projectStatus]); //  Animation تتغير شغل ال projectStatus لما ال

  if (loading) return <div className={styles.loading}>Loading...</div>;

  const cards = [
    {
      label: "Tasks Completed",
      value: `${stats?.tasksCompleted}/${stats?.totalTasks}`,
      icon: <TaskAlt />,
    },
    {
      label: "Submissions",
      value: stats?.submissions,
      icon: <CalendarMonth />,
    },
    {
      label: "Current Grade",
      value: `${stats?.currentGrade}%`,
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

      {/* Stats Cards */}

      <div className={styles.cards}></div>
      {/*+++++++++++*/}
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
            <span className={styles.progressValue}>
              {projectStatus?.progress}% {/*  نسبة الانجاز مثلا 75*/}
            </span>
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

          {/* Phases List */}
          <div className={styles.phaseList}>
            {projectStatus?.phases.map((phase, index) => (
              <div key={index} className={styles.phaseItem}>
                <span className={styles.phaseName}>{phase.name}</span>
                <span
                  className={`${styles.statusBadge} ${
                    phase.status === "Completed"
                      ? styles.completed
                      : phase.status === "In Progress"
                        ? styles.inProgress
                        : styles.pending
                  }`}
                >
                  {phase.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className={styles.box}>
          <div className={styles.boxHeader}>
            <h2 className={styles.boxTitle}>Upcoming Deadlines</h2>
          </div>

          <div className={styles.deadlineList}>
            {deadlines.map((item) => (
              <div key={item.id} className={styles.deadlineItem}>
                <div>
                  <p className={styles.deadlineTitle}>{item.title}</p>
                  <p className={styles.deadlineDate}>{item.date}</p>
                </div>

                <div className={styles.deadlineRight}>
                  <AccessTime fontSize="small" />
                  <span
                    className={
                      item.daysLeft <= 5
                        ? styles.deadlineUrgent
                        : styles.deadlineNormal
                    }
                  >
                    {item.daysLeft} days
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentHome;
