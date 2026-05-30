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
  // بنستخدمه عشان ننتقل لصفحة تفاصيل التاسك لما نضغط View
  const navigate = useNavigate();

  // هون بنخزن كل التاسكات اللي راجعة من الباك
  const [tasks, setTasks] = useState([]);

  // هون بنخزن الفلتر المختار حاليًا، بالبداية بنعرض كل التاسكات
  const [activeFilter, setActiveFilter] = useState("All Tasks");

  // loading عشان نعرف إذا البيانات لسا عم تتحمل
  const [loading, setLoading] = useState(true);

  // error عشان نخزن رسالة الخطأ لو صار مشكلة بالتحميل
  const [error, setError] = useState("");

  // أول ما الصفحة تفتح، بنجيب التاسكات الخاصة بجروب الطالب
  useEffect(() => {
    fetchGroupTasks();
  }, []);

  // هاي الفنكشن مسؤولة عن:
  // 1) تجيب id الطالب
  // 2) تجيب الجروب اللي الطالب موجود فيه
  // 3) تجيب التاسكات الخاصة بهذا الجروب
  const fetchGroupTasks = async () => {
    try {
      // قبل ما نبدأ الطلبات، بنفعل حالة التحميل ونفضي أي خطأ قديم
      setLoading(true);
      setError("");

      // بنجيب id الطالب من localStorage بعد تسجيل الدخول
      const studentId = localStorage.getItem("id");

      // إذا ما لقينا id، معناها في مشكلة بالتسجيل أو التخزين
      if (!studentId) {
        setError("Student id not found. Please login again.");
        return;
      }

      // بنجيب بيانات الجروب اللي الطالب موجود فيه
      const groupRes = await api.get(`/Group/my-group/${studentId}`);

      // الداتا الراجعة من endpoint الجروب
      const groupData = groupRes.data;

      // بنطلع groupId من الداتا الراجعة
      const groupId = groupData.groupId;

      // إذا ما في groupId، معناها الطالب مش مربوط بجروب
      if (!groupId) {
        setError("No group found for this student.");
        return;
      }

      // بنجيب التاسكات الخاصة بهذا الجروب
      const tasksRes = await api.get(`/Task/tasks-group/${groupId}`);

      // بنخزن التاسكات، ولو ما رجع tasks بنحط array فاضية عشان ما يصير error
      const tasksData = tasksRes.data.tasks || [];
      setTasks(tasksData);
    } catch {
      // لو صار أي خطأ بالطلبات، بنعرض رسالة خطأ عامة
      setError("Failed to load tasks.");
    } finally {
      // بالنهاية، سواء نجح أو فشل الطلب، بنوقف التحميل
      setLoading(false);
    }
  };

  // هاي الفنكشن بترجع حالة التاسك
  // إذا كانت status = 0 بنعرضها Pending
  // غير هيك بنرجع الحالة زي ما هي جاية من الباك
  const getStatus = (task) => {
    if (task.status === 0) return "Pending";
    return task.status;
  };

  // هون بنفلتر التاسكات حسب الزر المختار
  // إذا الفلتر All Tasks بنعرض كل التاسكات
  // غير هيك بنعرض التاسكات اللي حالتها نفس الفلتر المختار
  const filteredTasks =
    activeFilter === "All Tasks"
      ? tasks
      : tasks.filter((task) => getStatus(task) === activeFilter);

  // هاي الفنكشن بتنسق التاريخ عشان يظهر بشكل MM/DD/YYYY
  const formatDate = (date) => {
    if (!date) return "-";

    // بنفصل التاريخ عن الوقت إذا كان التاريخ جاي بصيغة فيها T
    const dateOnly = date.split("T")[0];

    // بنقسم التاريخ إلى سنة وشهر ويوم
    const [year, month, day] = dateOnly.split("-");

    // بنرجعه بالشكل المطلوب
    return `${month}/${day}/${year}`;
  };

  // هاي الفنكشن بتحسب كم يوم باقي على deadline
  // أو إذا التاسك متأخر، أو إذا موعده اليوم
  const getDaysText = (date, status) => {
    if (!date) return "";

    // إذا التاسك مكتمل، ما بنحسب الأيام وبنرجع Completed
    if (status === "Completed") return "Completed";

    const today = new Date();
    const deadline = new Date(date);

    // بنصفر الوقت عشان المقارنة تكون حسب اليوم فقط، مش الساعة
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    // الفرق بين تاريخ التسليم واليوم
    const diffTime = deadline - today;

    // بنحول الفرق من milliseconds إلى أيام
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // لو الفرق أقل من صفر، معناها التاسك متأخر
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;

    // لو الفرق صفر، معناها التسليم اليوم
    if (diffDays === 0) return "Due today";

    // غير هيك بنعرض عدد الأيام المتبقية
    return `${diffDays} days left`;
  };

  // إذا البيانات لسا بتتحمل، بنعرض loading
  if (loading) {
    return <div className={styles.loading}>Loading tasks...</div>;
  }

  // إذا صار خطأ، بنعرض رسالة الخطأ بدل الصفحة
  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyBox}>{error}</div>
      </div>
    );
  }

  // بنجهز أزرار الفلترة
  // أول زر ثابت: All Tasks
  // والباقي بنجيبه من الحالات الموجودة فعليًا داخل التاسكات بدون تكرار
  const statusFilters = [
    "All Tasks",
    ...new Set(tasks.map((task) => getStatus(task)).filter(Boolean)),
  ];

  // هاي الفنكشن بترجع class المناسب للـ badge حسب حالة التاسك
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
        // لو الحالة مش معروفة، بنعطيها شكل pending كـ default
        return styles.pendingBadge;
    }
  };

  return (
    <div className={styles.page}>
      {/* عنوان الصفحة والوصف */}
      <div className={styles.header}>
        <h1>Tasks</h1>
        <p>Manage your project tasks and deadlines</p>
      </div>

      {/* أزرار الفلترة حسب حالة التاسك */}
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

      {/* إذا ما في تاسكات بعد الفلترة، بنعرض رسالة فارغة */}
      {filteredTasks.length === 0 ? (
        <div className={styles.emptyBox}>No tasks found for this group.</div>
      ) : (
        // إذا في تاسكات، بنعرضها على شكل cards
        <div className={styles.tasksList}>
          {filteredTasks.map((task) => {
            // بنجيب حالة التاسك
            const status = getStatus(task);

            // deadline جاي من الباك باسم deadLine
            const deadline = task.deadLine;

            // النص اللي بوضح كم يوم باقي أو إذا التاسك متأخر
            const daysText = getDaysText(deadline, status);

            return (
              <div className={styles.taskCard} key={task.taskId}>
                <div className={styles.cardTop}>
                  <div className={styles.cardLeft}>
                    {/* أيقونة التاسك */}
                    <div className={styles.taskIconBox}>
                      <DescriptionOutlined />
                    </div>

                    {/* بيانات التاسك الأساسية */}
                    <div className={styles.taskMain}>
                      <div className={styles.titleRow}>
                        <h3>{task.title}</h3>

                        {/* badge الحالة */}
                        <span
                          className={`${styles.badge} ${getStatusBadgeClass(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </div>

                      {/* وصف التاسك */}
                      <p className={styles.description}>{task.description}</p>
                    </div>
                  </div>

                  {/* زر الانتقال لتفاصيل التاسك */}
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

                {/* أسفل الكارد: deadline وعدد الأيام المتبقية */}
                <div className={styles.footerRow}>
                  <div className={styles.leftFooter}>
                    {/* تاريخ التسليم */}
                    <span className={styles.dateItem}>
                      <CalendarTodayOutlined fontSize="small" />
                      {formatDate(deadline)}
                    </span>

                    {/* حالة الوقت: متأخر أو باقي أيام */}
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