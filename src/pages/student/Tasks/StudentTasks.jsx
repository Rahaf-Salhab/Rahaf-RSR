import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import styles from "./StudentTasks.module.css";
import { useNavigate } from "react-router-dom";
import {
  CalendarTodayOutlined,
  AccessTimeOutlined,
  DescriptionOutlined,
} from "@mui/icons-material";

export default function StudentTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All Tasks");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    fetchGroupTasks();
  }, []);

  const fetchGroupTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const studentId = localStorage.getItem("id");
      if (!studentId) {
        setError("Student id not found. Please login again.");
        return;
      }

      const groupRes = await api.get(`/Group/my-group/${studentId}`);

      const groupData = groupRes.data;

      const groupId = groupData.groupId;

      if (!groupId) {
        setError("No group found for this student.");
        return;
      }

      // بنجيب التاسكات الخاصة بهذا الجروب
      const tasksRes = await api.get(`/Task/tasks-group/${groupId}`);

      const tasksData = tasksRes.data.tasks || [];
      setTasks(tasksData);
    } catch {

      setError("Failed to load tasks.");
    } finally {

      setLoading(false);
    }
  };

  const getStatus = (task) => {
    if (task.status === 0) return "Pending";
    return task.status;
  };

  const filteredTasks =
    activeFilter === "All Tasks"
      ? tasks
      : tasks.filter((task) => getStatus(task) === activeFilter);

  const formatDate = (date) => {
    if (!date) return "-";

    const dateOnly = date.split("T")[0];

    const [year, month, day] = dateOnly.split("-");

    return `${month}/${day}/${year}`;
  };

  //  هاي الفنكشن بتحسب كم يوم باقي على deadline
  const getDaysText = (date, status) => {
    if (!date) return "";

    if (status === "Completed") return "Completed";

    const today = new Date();
    const deadline = new Date(date);

    // بنصفر الوقت عشان المقارنة تكون حسب اليوم فقط، مش الساعة
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = deadline - today;

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // لو الفرق أقل من صفر، معناها التاسك متأخر
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;

    // لو الفرق صفر، معناها التسليم اليوم
    if (diffDays === 0) return "Due today";

    // غير هيك بنعرض عدد الأيام المتبقية
    return `${diffDays} days left`;
  };

  if (loading) {
    return <div className={styles.loading}>Loading tasks...</div>;
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyBox}>{error}</div>
      </div>
    );
  }


  const statusFilters = [
    "All Tasks",
    ...new Set(tasks.map((task) => getStatus(task)).filter(Boolean)),
  ];


  const getStatusBadgeClass = (status) => {
    switch (String(status).toLowerCase()) {
      case "overdue":
        return styles.overdueBadge;
      case "pending":
        return styles.pendingBadge;
      case "submitted":
        return styles.submittedBadge;
      case "rejected":
        return styles.rejectedBadge;
      case "approved":
        return styles.approvedBadge;
      default:

        return styles.pendingBadge;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Tasks</h1>
        <p>Manage your project tasks and deadlines</p>
      </div>

      <div className={styles.filters}>
        {statusFilters.map((filter) => (
          <button
            key={filter}
            className={`${styles.filterBtn} ${
              activeFilter === filter ? styles.activeFilter : ""
            }`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className={styles.emptyBox}>No tasks found for this group.</div>
      ) : (
        <div className={styles.tasksList}>
          {filteredTasks.map((task) => {
            const status = getStatus(task);

            const deadline = task.deadLine;

            const daysText = getDaysText(deadline, status);

            return (
              <div className={styles.taskCard} key={task.taskId}>
                <div className={styles.cardTop}>
                  <div className={styles.cardLeft}>
                    <div className={styles.taskIconBox}>
                      <DescriptionOutlined />
                    </div>

                    <div className={styles.taskMain}>
                      <div className={styles.titleRow}>
                        <h3>{task.title}</h3>
                        <span
                          className={`${styles.badge} ${getStatusBadgeClass(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </div>

                      <p className={styles.description}>{task.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.viewBtn}
                    onClick={() => {
                      navigate(`/student/tasks/${task.taskId}`);
                    }}
                  >
                    View
                  </button>
                </div>

                <div className={styles.footerRow}>
                  <div className={styles.leftFooter}>
                    <span className={styles.dateItem}>
                      <CalendarTodayOutlined fontSize="small" />
                      {formatDate(deadline)}
                    </span>

                    <span
                      className={`${styles.timeItem} ${
                        daysText.includes("overdue")
                          ? styles.overdueText
                          : styles.leftText
                      }`}
                    >
                      <AccessTimeOutlined fontSize="small" />
                      {daysText}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}