import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance.jsx";
import styles from "./SupervisorHome.module.css";

import {
  Groups,
  RateReview,
  AssignmentTurnedIn,
  Description,
  CheckCircle,
  ArrowForward,
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

export default function SupervisorHome() {
  const navigate = useNavigate();

  const [statistics, setStatistics] = useState({
    myGroups: 0,
    totalPendingReviews: 0,
    thesisPending: 0,
    taskSubmissionsPending: 0,
  });

  const [reviewTasks, setReviewTasks] = useState([]);
  const [reviewThesis, setReviewThesis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupervisorDashboard = async () => {
      try {
        const [statisticsRes, tasksRes, thesisRes] = await Promise.all([
          api.get("/Dashboard/dashboard-supervisor"),
          api.get("/Dashboard/dashboard-tasks"),
          api.get("/Dashboard/dashboard-thesis"),
        ]);

        setStatistics({
          myGroups: statisticsRes.data?.statistics?.myGroups ?? 0,
          totalPendingReviews:
            statisticsRes.data?.statistics?.totalPendingReviews ?? 0,
          thesisPending: statisticsRes.data?.statistics?.thesisPending ?? 0,
          taskSubmissionsPending:
            statisticsRes.data?.statistics?.taskSubmissionsPending ?? 0,
        });

        setReviewTasks(tasksRes.data?.tasks ?? []);
        setReviewThesis(thesisRes.data?.thesis ?? []);
      } catch (err) {
        console.error("Supervisor dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSupervisorDashboard();
  }, []);

  const dashboardCards = [
  {
    label: "My Groups",
    value: statistics.myGroups,
    icon: <Groups />,
    color: "#e8f4fd",
    iconColor: "#4A5565",
  },
  {
    label: "Total Pending Reviews",
    value: statistics.totalPendingReviews,
    icon: <RateReview />,
    color: "#fff1eb",
    iconColor: "#4A5565",
  },
  {
    label: "Task Submissions Pending",
    value: statistics.taskSubmissionsPending,
    icon: <AssignmentTurnedIn />,
    color: "#f0fdf4",
    iconColor: "#4A5565",
  },
  {
    label: "Thesis Pending",
    value: statistics.thesisPending,
    icon: <Description />,
    color: "#fef3c7",
    iconColor: "#4A5565",
  },
];
  const latestReviewTasks = reviewTasks.slice(0, 3);
  const latestReviewThesis = reviewThesis.slice(0, 3);
  if (loading) {
    return (
      <div className={styles.loading}>Loading supervisor dashboard...</div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Welcome back! Here is a quick overview of your supervision work.
          </p>
        </div>
      </div>

      <div className={styles.cards}>
        {dashboardCards.map((card, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>{card.label}</p>
              <p className={styles.cardValue}>{card.value}</p>
            </div>

            <div
              className={styles.cardIcon}
              style={{
                backgroundColor: card.color,
                color: card.iconColor,
              }}
            >
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <section className={styles.box}>
        <div className={styles.boxHeader}>
          <div>
            {reviewTasks.length > 3 && (
              <button
                className={styles.viewAllBtn}
                onClick={() => navigate("/supervisor/submissions")}
              >
                View All <ArrowForward fontSize="small" />
              </button>
            )}
            <h2 className={styles.boxTitle}>Task Submissions Need Review</h2>
            <p className={styles.boxSubtitle}>
              Latest task submissions waiting for your feedback.
            </p>
          </div>
        </div>

        <div className={styles.reviewList}>
          {reviewTasks.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle className={styles.emptyIcon} />
              <p>No task submissions need review right now.</p>
            </div>
          ) : (
            latestReviewTasks.map((task) => (
              <div key={task.taskSubmissionId} className={styles.reviewItem}>
                <div className={styles.reviewIcon}>
                  <AssignmentTurnedIn />
                </div>

                <div className={styles.reviewContent}>
                  <p className={styles.itemTitle}>{task.title}</p>

                  <p className={styles.itemMeta}>
                    {task.groupName} · {task.studentName}
                  </p>

                  <p className={styles.itemDate}>
                    Submitted at {formatDate(task.submittedAt)}
                  </p>
                </div>

                <button
                  className={styles.actionBtn}
                  onClick={() =>
                    navigate(`/supervisor/submissions/${task.taskSubmissionId}`)
                  }
                >
                  Review <ArrowForward fontSize="small" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className={styles.box}>
        <div className={styles.boxHeader}>
          <div>
            {reviewThesis.length > 3 && (
              <button
                className={styles.viewAllBtn}
                onClick={() => navigate("/supervisor/thesis-review")}
              >
                View All <ArrowForward fontSize="small" />
              </button>
            )}
            <h2 className={styles.boxTitle}>Thesis Versions Need Feedback</h2>
            <p className={styles.boxSubtitle}>
              Latest thesis versions waiting for your feedback.
            </p>
          </div>
        </div>

        <div className={styles.reviewList}>
          {reviewThesis.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle className={styles.emptyIcon} />
              <p>No thesis versions need feedback right now.</p>
            </div>
          ) : (
            latestReviewThesis.map((thesis) => (
              <div key={thesis.thesisVersionId} className={styles.reviewItem}>
                <div className={styles.reviewIcon}>
                  <Description />
                </div>

                <div className={styles.reviewContent}>
                  <p className={styles.itemTitle}>{thesis.projectName}</p>

                  <p className={styles.itemMeta}>
                    Thesis Version · {thesis.groupName}
                  </p>

                  <p className={styles.itemDate}>
                    Uploaded at {formatDate(thesis.uploadedAt)}
                  </p>
                </div>

                <button
                  className={styles.actionBtn}
                  onClick={() =>
                    navigate(
                      `/supervisor/thesis-review/${thesis.thesisVersionId}`,
                    )
                  }
                >
                  Feedback <ArrowForward fontSize="small" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
