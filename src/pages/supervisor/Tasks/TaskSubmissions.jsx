import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import SubmissionDiscussion from "../../../components/SubmissionDiscussion/SubmissionDiscussion";
import styles from "./TaskSubmission.module.css";
import DescriptionIcon from "@mui/icons-material/Description";

export default function TaskSubmissions() {
  const { groupId, taskId } = useParams(); //  من الرابط عشان نعرف لاي صفحة تسليمات نروحTaskId AND GroupId  بنجيب
  const navigate = useNavigate();

  const [task, setTask] = useState(null); // لتخزين بيانات التاسك
  const [submissions, setSubmissions] = useState([]); // لتخزين التسليمات الخاصة بالتاسك
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviewBox, setReviewBox] = useState(null); //
  const [reviewComment, setReviewComment] = useState(""); // لتخزين التعليق اللي بيكتبه المشرف لما يراجع التسليم
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get(`/Task/task-id/${taskId}`); // جلب بيانات التاسك عشان نعرض اسم التاسك في الصفحة
        const taskData = res.data?.task; // responce جلب بيانات التاسك من ال
        const taskSubmissions = taskData?.taskSubmissions || []; // جلب التسليمات الخاصة بالتاسك من بيانات التاسك ولو ما في خليها فاضية
        setTask(taskData); // تخزين بيانات التاسك في ال state
        setSubmissions(taskSubmissions); // تخزين التسليمات في ال state
      } catch (err) {
        setError("Failed to load submissions.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [taskId]); // برجع بجيب البيانات الجديدة من الرابط taskId اذا تغير ال

  //======================================================================================================
  // لما المشرف يضغط على زر مراجعة التسليم بيفتح صندوق المراجعة اللي فيه خيارات الموافقة او الرفض والتعليق
  const handleOpenReviewBox = (submissionId, status) => {
    setReviewBox({
      submissionId,
      status,
    });

    setReviewComment("");
    setReviewError("");
  };
  //======================================================================================================
  // لما المشرف يضغط على زر الموافقة او الرفض في صندوق المراجعة بيتم ارسال الطلب للسيرفر لتحديث حالة التسليم وتعليق المراجعة اذا في
  const handleSubmitReview = async () => {
    if (!reviewBox) return;

    if (reviewBox.status === "Rejected" && !reviewComment.trim()) {
      setReviewError("Comment is required when rejecting a submission.");
      return;
    }

    try {
      setReviewLoading(true);
      setReviewError("");

      await api.post(
        `/TaskSubmission/Review/submissionId/${reviewBox.submissionId}`,
        {
          status: reviewBox.status,
          comment: reviewComment.trim(),
        },
      );

      setReviewBox(null);
      setReviewComment("");

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
  //======================================================================================================

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>{error}</div>;
  }
  {
    /* <h2 className={styles.taskTitle}>Submissions for {task?.title || "Task"} Task</h2>*/
  }
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };
  const sortedSubmissions = [...submissions].sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt),
  );
  const latestSubmission = sortedSubmissions[0];
  return (
    <div className={styles.submissionsPage}>
      <div className={styles.submissionsHeader}>
        <h2 className={styles.submissionsTitle}>Task Submissions</h2>
        <p className={styles.submissionsSubtitle}>
          Review students submissions for this task
        </p>
      </div>

      <div className={styles.taskSubmissionCard}>
        {task && (
          <div className={styles.taskInfoSection}>
            <div className={styles.taskNameLine}>
              <span className={styles.taskTitleValue}>{task.title}</span>
            </div>

            <span className={styles.taskDescValue}>{task.description}</span>
          </div>
        )}

        <div className={styles.divider}></div>

        {submissions.length === 0 ? (
          <div className={styles.noSubmissionsBox}>No submissions yet.</div>
        ) : (
          <div className={styles.submissionsList}>
            {sortedSubmissions.map((submission, index) => {
              const displayVersion = sortedSubmissions.length - index;
              const submissionStatus = submission.status?.trim();

              const isReviewed =
                submissionStatus === "Approved" ||
                submissionStatus === "Rejected";

              const isPending = !isReviewed;

              const isLatestSubmission =
                submission.taskSubmissionId ===
                latestSubmission?.taskSubmissionId;

              return (
                <div
                  className={`${styles.submissionBox} ${
                    isPending ? styles.pendingVersionBox : styles.oldVersionBox
                  }`}
                  key={submission.taskSubmissionId}
                >
                  <div className={styles.submissionVersionRow}>
                    <span className={styles.versionBadge}>
                      Version {displayVersion}
                    </span>

                    {isLatestSubmission && (
                      <span className={styles.latestBadge}>Latest Version</span>
                    )}

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
                  <div className={styles.submissionTop}>
                    <div className={styles.submissionLeft}>
                      <div className={styles.fileIcon}>
                        <DescriptionIcon />
                      </div>

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

                        {isReviewed && submission.reviewedAt && (
                          <p className={styles.submissionMeta}>
                            <span>Reviewed At:</span>{" "}
                            {new Date(submission.reviewedAt).toLocaleString()}
                          </p>
                        )}

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
                        {submission.comment && (
                          <div className={styles.feedbackBox}>
                            <p className={styles.feedbackTitle}>
                              Supervisor Feedback
                            </p>
                            <p className={styles.feedbackText}>
                              {submission.comment}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

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
                  </div>

                  {reviewBox?.submissionId === submission.taskSubmissionId && (
                    <div className={styles.reviewBox}>
                      <label className={styles.reviewLabel}>
                        Supervisor Comment{" "}
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
