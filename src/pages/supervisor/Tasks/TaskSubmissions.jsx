import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../api/axiosInstance";
import SubmissionDiscussion from "../../../components/SubmissionDiscussion/SubmissionDiscussion";
import styles from "./TaskSubmission.module.css";
import DescriptionIcon from "@mui/icons-material/Description";

export default function TaskSubmissions() {
  // جلب taskId من الرابط
  // بنستخدمه عشان نجيب بيانات التاسك وتسليماته
  const { taskId } = useParams();

  // تخزين بيانات التاسك مثل العنوان والوصف
  const [task, setTask] = useState(null);

  // تخزين كل التسليمات الخاصة بهذا التاسك
  const [submissions, setSubmissions] = useState([]);

  // حالات التحميل والخطأ الخاصة بالصفحة
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // تخزين صندوق التقييم المفتوح حاليًا
  // يحتوي على رقم التسليم والحالة المختارة Approved أو Rejected
  const [reviewBox, setReviewBox] = useState(null);

  // تخزين تعليق المشرف عند التقييم
  const [reviewComment, setReviewComment] = useState("");

  // حالات التحميل والخطأ الخاصة بعملية التقييم
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    // جلب بيانات التاسك مع كل التسليمات التابعة له
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError("");

        // طلب بيانات التاسك من الباك باستخدام taskId
        const res = await api.get(`/Task/task-id/${taskId}`);

        // الباك برجع بيانات التاسك داخل res.data.task
        const taskData = res.data?.task;

        // أخذ التسليمات من بيانات التاسك
        // إذا ما في تسليمات بنخليها مصفوفة فاضية
        const taskSubmissions = taskData?.taskSubmissions || [];

        // تخزين بيانات التاسك والتسليمات في الـ state
        setTask(taskData);
        setSubmissions(taskSubmissions);
      } catch{
        setError("Failed to load submissions.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [taskId]); // إعادة الجلب إذا تغير taskId

  // فتح صندوق التقييم لتسليم معيّن
  // status بتكون Approved أو Rejected حسب الزر الذي ضغط عليه المشرف
  const handleOpenReviewBox = (submissionId, status) => {
    setReviewBox({
      submissionId,
      status,
    });

    // تصفير التعليق والخطأ عند فتح صندوق تقييم جديد
    setReviewComment("");
    setReviewError("");
  };

  // إرسال تقييم المشرف إلى الباك
  const handleSubmitReview = async () => {
    if (!reviewBox) return;

    // في حالة الرفض، التعليق إجباري
    if (reviewBox.status === "Rejected" && !reviewComment.trim()) {
      setReviewError("Comment is required when rejecting a submission.");
      return;
    }

    try {
      setReviewLoading(true);
      setReviewError("");

      // إرسال حالة التقييم والتعليق إلى الباك
      await api.post(
        `/TaskSubmission/Review/submissionId/${reviewBox.submissionId}`,
        {
          status: reviewBox.status,
          comment: reviewComment.trim(),
        },
      );

      // إغلاق صندوق التقييم بعد نجاح العملية
      setReviewBox(null);
      setReviewComment("");

      // إعادة جلب بيانات التاسك حتى تظهر الحالة الجديدة مباشرة
      const res = await api.get(`/Task/task-id/${taskId}`);
      const taskData = res.data?.task;

      setTask(taskData);
      setSubmissions(taskData?.taskSubmissions || []);
    } catch (err) {
      console.error("Failed to submit review:", err);
      setReviewError("Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

  // عرض رسالة تحميل أثناء جلب البيانات
  if (loading) {
    return <div>Loading...</div>;
  }

  // عرض رسالة خطأ إذا فشل جلب البيانات
  if (error) {
    return <div>{error}</div>;
  }

  // تنسيق التاريخ قبل تمريره لكمبوننت المناقشة
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  // ترتيب التسليمات من الأحدث إلى الأقدم
  // عشان أحدث نسخة تظهر بالأعلى
  const sortedSubmissions = [...submissions].sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt),
  );

  // أخذ أحدث تسليم
  // بنستخدمه عشان نعرض شارة Latest Version
  const latestSubmission = sortedSubmissions[0];

  // فحص إذا كان يوجد تسليم غير مقيم
  // بنستخدمه عشان نخلي النسخة غير المقيمة أوضح
  // ونخلي النسخ المقيمة أفتح فقط إذا كان في نسخة بانتظار التقييم
  const hasPendingSubmission = sortedSubmissions.some((submission) => {
    const status = submission.status?.trim();
    return status !== "Approved" && status !== "Rejected";
  });

  return (
    <div className={styles.submissionsPage}>
      {/* رأس الصفحة */}
      <div className={styles.submissionsHeader}>
        <h2 className={styles.submissionsTitle}>Task Submissions</h2>
        <p className={styles.submissionsSubtitle}>
          Review students submissions for this task
        </p>
      </div>

      <div className={styles.taskSubmissionCard}>
        {/* عرض عنوان التاسك ووصفه */}
        {task && (
          <div className={styles.taskInfoSection}>
            <div className={styles.taskNameLine}>
              <span className={styles.taskTitleValue}>{task.title}</span>
            </div>

            <span className={styles.taskDescValue}>{task.description}</span>
          </div>
        )}

        <div className={styles.divider}></div>

        {/* إذا ما في تسليمات، نعرض رسالة فارغة */}
        {submissions.length === 0 ? (
          <div className={styles.noSubmissionsBox}>No submissions yet.</div>
        ) : (
          <div className={styles.submissionsList}>
            {sortedSubmissions.map((submission, index) => {
              // حساب رقم النسخة حسب ترتيب التسليمات
              // الأحدث يأخذ أعلى رقم نسخة
              const displayVersion = sortedSubmissions.length - index;

              // تنظيف قيمة الحالة القادمة من الباك
              const submissionStatus = submission.status?.trim();

              // التسليم يعتبر مقيم فقط إذا كانت حالته Approved أو Rejected
              const isReviewed =
                submissionStatus === "Approved" ||
                submissionStatus === "Rejected";

              // التسليم غير المقيم هو الذي ما زال يحتاج تقييم من المشرف
              const isPending = !isReviewed;

              // فحص هل هذا التسليم هو أحدث تسليم
              const isLatestSubmission =
                submission.taskSubmissionId ===
                latestSubmission?.taskSubmissionId;

              return (
                <div
                  className={`${styles.submissionBox} ${
                    // إذا في تسليم غير مقيم:
                    // نخلي التسليم غير المقيم واضح
                    // ونخلي التسليمات المقيمة أفتح
                    // أما إذا كل التسليمات مقيمة، نخليها بشكل طبيعي
                    hasPendingSubmission && isPending
                      ? styles.pendingVersionBox
                      : hasPendingSubmission && isReviewed
                        ? styles.oldVersionBox
                        : ""
                  }`}
                  key={submission.taskSubmissionId}
                >
                  {/* صف الشارات: الحالة، أحدث نسخة، ورقم النسخة */}
                  <div className={styles.submissionVersionRow}>
                    <div className={styles.submissionBadgesLeft}>
                      {/* إظهار Latest Version فقط إذا كان في أكثر من نسخة */}
                      {sortedSubmissions.length > 1 && isLatestSubmission && (
                        <span className={styles.latestBadge}>
                          Latest Version
                        </span>
                      )}

                      {/* شارة حالة التسليم */}
                      <span
                        className={`${styles.statusBadge} ${
                          submissionStatus === "Approved"
                            ? styles.approvedStatus
                            : submissionStatus === "Rejected"
                              ? styles.rejectedStatus
                              : styles.pendingStatus
                        }`}
                      >
                        {submissionStatus || "Submitted"}
                      </span>
                    </div>

                    {/* رقم النسخة */}
                    <span className={styles.versionBadge}>
                      Version {displayVersion}
                    </span>
                  </div>

                  <div className={styles.submissionTop}>
                    <div className={styles.submissionLeft}>
                      {/* أيقونة الملف */}
                      <div className={styles.fileIcon}>
                        <DescriptionIcon />
                      </div>

                      {/* معلومات التسليم */}
                      <div className={styles.submissionInfo}>
                        <span className={styles.submissionMeta}>
                          Student Name:{" "}
                          {submission.studentName
                            ? submission.studentName
                            : "Student"}
                        </span>

                        <p className={styles.submissionMeta}>
                          <span>Submitted At:</span>{" "}
                          {submission.submittedAt
                            ? new Date(submission.submittedAt).toLocaleString()
                            : "-"}
                        </p>

                        {/* عرض تاريخ التقييم فقط إذا كان التسليم مقيم */}
                        {isReviewed && submission.reviewedAt && (
                          <p className={styles.submissionMeta}>
                            <span>Reviewed At:</span>{" "}
                            {new Date(submission.reviewedAt).toLocaleString()}
                          </p>
                        )}

                        {/* رابط ملف التسليم */}
                        {submission.taskSubmissionURL && (
                          <p className={styles.submissionMeta}>
                            <span>Submitted File:</span>{" "}
                            <a
                              href={submission.taskSubmissionURL}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.fileLink}
                            >
                              View submitted file
                            </a>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* أزرار التقييم تظهر فقط للتسليمات غير المقيمة */}
                    {isPending && (
                      <div className={styles.submissionActions}>
                        <button
                          type="button"
                          className={styles.rejectBtn}
                          onClick={() =>
                            handleOpenReviewBox(
                              submission.taskSubmissionId,
                              "Rejected",
                            )
                          }
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          className={styles.approveBtn}
                          onClick={() =>
                            handleOpenReviewBox(
                              submission.taskSubmissionId,
                              "Approved",
                            )
                          }
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </div>

                  {/* صندوق كتابة تعليق التقييم */}
                  {reviewBox?.submissionId === submission.taskSubmissionId && (
                    <div className={styles.reviewBox}>
                      <label className={styles.reviewLabel}>
                        Supervisor Comment{" "}
                        {/* النجمة تظهر فقط عند الرفض لأن التعليق إجباري */}
                        {reviewBox.status === "Rejected" && (
                          <span className={styles.required}>*</span>
                        )}
                      </label>

                      <textarea
                        className={styles.reviewTextarea}
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => {
                          setReviewComment(e.target.value);
                          setReviewError("");
                        }}
                        placeholder={
                          reviewBox.status === "Rejected"
                            ? "Write the rejection reason..."
                            : "Optional comment..."
                        }
                      />

                      {/* عرض خطأ التقييم إذا وجد */}
                      {reviewError && (
                        <p className={styles.reviewError}>{reviewError}</p>
                      )}

                      <div className={styles.reviewActions}>
                        <button
                          type="button"
                          className={styles.cancelReviewBtn}
                          onClick={() => {
                            setReviewBox(null);
                            setReviewComment("");
                            setReviewError("");
                          }}
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          className={styles.submitReviewBtn}
                          onClick={handleSubmitReview}
                          disabled={reviewLoading}
                        >
                          {reviewLoading
                            ? "Submitting..."
                            : `Submit ${reviewBox.status}`}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* عرض المناقشة فقط إذا كان لهذا التسليم تعليقات */}
                  {submission.taskSubmissionComments?.length > 0 && (
                    <div className={styles.discussionInsideBox}>
                      <SubmissionDiscussion
                        submission={submission}
                        formatDate={formatDate}
                        currentRole="Supervisor"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}