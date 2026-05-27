import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockApi as api } from "../../api/axiosInstance.jsx";
import styles from "./SupervisorHome.module.css";

import {
  RateReview,
  AssignmentTurnedIn,
  Description,
  EventAvailable,
  ArrowForward,
  AccessTime,
  CheckCircle,
  UploadFile,
} from "@mui/icons-material";

const formatDate = (dateString) => {
  if (!dateString) return "No date";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getExamDay = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "--";
  return date.getDate();
};

const getExamMonth = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en", { month: "short" });
};

export default function SupervisorHome() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [thesis, setThesis] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const supervisorId = localStorage.getItem("id");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          groupsRes,
          tasksRes,
          thesisRes,
          timetableRes,
          activitiesRes,
        ] = await Promise.all([
          api.get("/groups"),
          api.get("/tasks"),
          api.get("/thesis"),
          api.get("/examinationTimetable"),
          api.get("/recentActivities"),
        ]);

        const allGroups = groupsRes.data || [];
        const allTasks = tasksRes.data || [];
        const allThesis = thesisRes.data || [];
        const allTimetable = timetableRes.data || [];
        const allActivities = activitiesRes.data || [];

        /*
          الفكرة:
          بنجيب جروبات المشرف الحالي، وبعدها بنجيب أي task/thesis/exam متعلق بهاي الجروبات.
          إذا ما لقى supervisorId بسبب اختلاف بيانات db.json، بنعرض كل البيانات عشان الصفحة ما تطلع فاضية.
        */

        const myGroups = allGroups.filter(
          (group) => String(group.supervisorId) === String(supervisorId)
        );

        const visibleGroups = myGroups.length > 0 ? myGroups : allGroups;

        const groupIds = visibleGroups.map((group) => String(group.id));

        const myTasks = allTasks.filter((task) =>
          groupIds.includes(String(task.groupId))
        );

        const myThesis = allThesis.filter((item) =>
          groupIds.includes(String(item.groupId))
        );

        const myTimetable = allTimetable.filter((exam) =>
          groupIds.includes(String(exam.groupId))
        );

        setTasks(myTasks);
        setThesis(myThesis);
        setTimetable(myTimetable);
        setActivities(allActivities);
      } catch (err) {
        console.error("Supervisor dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supervisorId]);

  const pendingTaskReviews = useMemo(() => {
    return tasks.filter((task) => {
      const status = String(task.status || "").toLowerCase();

      return (
        status.includes("submitted") ||
        status.includes("pending") ||
        status.includes("review")
      );
    });
  }, [tasks]);

  const pendingThesis = useMemo(() => {
    return thesis.filter((item) => {
      const status = String(item.status || "").toLowerCase();
      return status !== "approved" && status !== "completed";
    });
  }, [thesis]);

  const upcomingExams = useMemo(() => {
    return timetable.slice(0, 3);
  }, [timetable]);

  const needsReview = useMemo(() => {
    const taskItems = pendingTaskReviews.slice(0, 3).map((task) => ({
      id: `task-${task.id}`,
      type: "Task Submission",
      title: task.title || task.taskTitle || "Task Submission",
      groupName: task.groupName || "Student Group",
      date: task.dueDate || task.submissionDate,
      status: task.status || "Waiting for review",
      actionText: "Review",
      path: "/supervisor/submissions",
    }));

    const thesisItems = pendingThesis.slice(0, 3).map((item) => ({
      id: `thesis-${item.id}`,
      type: "Thesis File",
      title: item.title || "Thesis Submission",
      groupName: item.groupName || "Student Group",
      date: item.submissionDate || item.date,
      status: item.status || "In progress",
      actionText: "Open",
      path: "/supervisor/thesis-review",
    }));

    return [...taskItems, ...thesisItems].slice(0, 4);
  }, [pendingTaskReviews, pendingThesis]);

const dashboardCards = [
  {
    label: "Total Pending Reviews",
    value: pendingTaskReviews.length + pendingThesis.length,
    icon: <RateReview />,
  },
  {
    label: "Task Submissions",
    value: pendingTaskReviews.length,
    icon: <AssignmentTurnedIn />,
  },
  {
    label: "Thesis Pending",
    value: pendingThesis.length,
    icon: <Description />,
  },
  {
    label: "Upcoming Exams",
    value: upcomingExams.length,
    icon: <EventAvailable />,
  },
];

  if (loading) {
    return (
      <div className={styles.loading}>
        Loading supervisor dashboard...
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Welcome back! Here's what needs your attention today.
          </p>
        </div>
      </div>

      <div className={styles.cards}>
        {dashboardCards.map((card, index) => (
          <div key={index} className={styles.card}>
            <div>
              <p className={styles.cardLabel}>{card.label}</p>
              <p className={styles.cardValue}>{card.value}</p>
            </div>

            <div className={styles.cardIcon}>{card.icon}</div>
          </div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <section className={styles.box}>
          <div className={styles.boxHeader}>
            <div>
              <h2 className={styles.boxTitle}>Needs Your Review</h2>
              <p className={styles.boxSubtitle}>
                Submissions and thesis files waiting for your feedback.
              </p>
            </div>
          </div>

          <div className={styles.list}>
            {needsReview.length === 0 ? (
              <div className={styles.emptyState}>
                <CheckCircle className={styles.emptyIcon} />
                <p>No pending reviews right now.</p>
              </div>
            ) : (
              needsReview.map((item) => (
                <div key={item.id} className={styles.reviewItem}>
                  <div className={styles.reviewIcon}>
                    {item.type === "Task Submission" ? (
                      <AssignmentTurnedIn />
                    ) : (
                      <UploadFile />
                    )}
                  </div>

                  <div className={styles.reviewContent}>
                    <p className={styles.itemTitle}>{item.title}</p>
                    <p className={styles.itemMeta}>
                      {item.type} · {item.groupName}
                    </p>
                    <p className={styles.itemDate}>
                      {formatDate(item.date)}
                    </p>
                  </div>

                  <div className={styles.reviewRight}>
                    <span className={styles.statusBadge}>{item.status}</span>

                    <button
                      className={styles.actionBtn}
                      onClick={() => navigate(item.path)}
                    >
                      {item.actionText}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={styles.box}>
          <div className={styles.boxHeader}>
            <div>
              <h2 className={styles.boxTitle}>Upcoming Examinations</h2>
              <p className={styles.boxSubtitle}>
                Closest scheduled examinations.
              </p>
            </div>

            <button
              className={styles.viewAllBtn}
              onClick={() => navigate("/supervisor/examination-timetable")}
            >
              View All <ArrowForward fontSize="small" />
            </button>
          </div>

          <div className={styles.list}>
            {upcomingExams.length === 0 ? (
              <div className={styles.emptyState}>
                <EventAvailable className={styles.emptyIcon} />
                <p>No upcoming examinations.</p>
              </div>
            ) : (
              upcomingExams.map((exam) => (
                <div key={exam.id} className={styles.examItem}>
                  <div className={styles.dateBox}>
                    <span className={styles.dateDay}>
                      {getExamDay(exam.date)}
                    </span>
                    <span className={styles.dateMonth}>
                      {getExamMonth(exam.date)}
                    </span>
                  </div>

                  <div className={styles.examContent}>
                    <p className={styles.itemTitle}>
                      {exam.projectTitle || exam.title || "Project Examination"}
                    </p>
                    <p className={styles.itemMeta}>
                      {exam.time || "No time"} · {exam.room || "No room"}
                    </p>
                    <p className={styles.itemDate}>
                      {exam.building || exam.location || "No location"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className={styles.box}>
        <div className={styles.boxHeader}>
          <div>
            <h2 className={styles.boxTitle}>Recent Activity</h2>
            <p className={styles.boxSubtitle}>
              Latest updates from supervised projects.
            </p>
          </div>
        </div>

        <div className={styles.activityList}>
          {activities.length === 0 ? (
            <div className={styles.emptyState}>
              <AccessTime className={styles.emptyIcon} />
              <p>No recent activities yet.</p>
            </div>
          ) : (
            activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={styles.activityDot}></div>

                <div>
                  <p className={styles.itemTitle}>
                    {activity.title || activity.message || "New activity"}
                  </p>
                  <p className={styles.itemMeta}>
                    {activity.description || activity.type || "Project update"}
                  </p>
                </div>

                <span className={styles.activityTime}>
                  {activity.time || formatDate(activity.date)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}