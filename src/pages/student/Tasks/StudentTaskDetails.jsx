import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import SubmissionDiscussion from "../../../components/SubmissionDiscussion/SubmissionDiscussion";
import DescriptionIcon from "@mui/icons-material/Description";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import NotesIcon from "@mui/icons-material/Notes";
import PersonIcon from "@mui/icons-material/Person";
import CommentIcon from "@mui/icons-material/Comment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import StudentSubmissionActions from "./StudentSubmissionActions";
import styles from "./StudentTaskDetails.module.css";

export default function StudentTaskDetails() {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // نخزن id التسليم اللي الطالب فاتح عليه وضع التعديل
  // إذا null يعني ما في أي نسخة مفتوحة للتعديل
  const [editingSubmissionId, setEditingSubmissionId] = useState(null);


  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/Task/task-id/${taskId}`);

      // الباك برجع بيانات التاسك داخل res.data.task
      setTask(res.data.task);
    } catch (err) {
      setError("Failed to load task details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const formatDate = (data) => {
    if (!data) return "-";
    return new Date(data).toLocaleDateString();
  };

  // دالة تجهيز رابط ملف التاسك
  const getTaskFileUrl = (fileName) => {
    if (!fileName) return "";

    // إذا الرابط كامل، نرجعه زي ما هو
    if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
      return fileName;
    }

    // إذا الراجع اسم ملف فقط، نركب عليه مسار الملفات من السيرفر
    return `http://rsr.tryasp.net/files/Tasks/${fileName.replace(/^\/+/, "")}`;
  };

  // كل نسخ التسليم الراجعة من الباك
  const submissions = task?.taskSubmissions || [];

  const sortedSubmissions = [...submissions].sort(
    (a, b) => b.versionNumber - a.versionNumber,
  );

  const latestSubmission = sortedSubmissions[0];

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>{error}</div>;
  }

  if (!task) {
    return <div>Task not found.</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.detailsCard}>
        <div className={styles.taskHeader}>
          <div className={styles.taskTitleRow}>
            <div className={styles.fileIcon}>
              <DescriptionIcon />
            </div>

            <div>
              <div className={styles.taskTitleWithStatus}>
                <h1 className={styles.taskTitle}>{task.title}</h1>
              </div>

              <p className={styles.description}>{task.description}</p>
            </div>
          </div>
        </div>
        <div className={styles.taskMetaList}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>
              <CalendarTodayIcon className={styles.metaIcon} />
              Assigned:
            </span>
            <span>{formatDate(task.createdAt)}</span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>
              <CalendarTodayIcon className={styles.metaIcon} />
              Due:
            </span>
            <span>{formatDate(task.deadLine)}</span>
          </div>

          {task.supervisorNotes && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>
                <NotesIcon className={styles.metaIcon} />
                Notes:
              </span>
              <span>{task.supervisorNotes}</span>
            </div>
          )}
        </div>

        {task.taskFileURL && (
          <div className={styles.taskFile}>
            <span className={styles.taskFileSmallIcon}>
              <AttachFileIcon fontSize="small" />
              <span className={styles.taskFileLabel}>Task File:</span>
            </span>

            <a
              href={getTaskFileUrl(task.taskFileURL)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.taskFileSimpleLink}
            >
              {task.taskFileURL.split("/").pop()}
            </a>
          </div>
        )}
      </div>

      {/* كارد نسخ التسليم */}
      <div className={styles.versionsCard}>
        <div className={styles.versionsHeader}>
          <div>
            <h2>Submission Versions</h2>
            <p>Review your submitted versions and supervisor feedback.</p>
          </div>

          <span className={styles.versionsCount}>
            {sortedSubmissions.length}{" "}
            {sortedSubmissions.length === 1 ? "Version" : "Versions"}
          </span>
        </div>

        <div className={styles.submissionSection}>
          {/* إذا في تسليمات، نعرض النسخ */}
          {task.taskSubmissions && task.taskSubmissions.length > 0 ? (
            <div className={styles.submissionsList}>
              {sortedSubmissions.map((submission, index) => {
                const displayVersion = sortedSubmissions.length - index;

                // نحدد هل هاي أحدث نسخة أم لا
                const isLatestSubmission = submission.taskSubmissionId === latestSubmission?.taskSubmissionId;

                return (
                  <div
                    key={submission.taskSubmissionId}
                    className={styles.submissionItem}
                  >
                    <div
                      className={`${styles.submissionBox} ${
                        !isLatestSubmission ? styles.oldVersionBox : ""
                      }`}
                    >
                      {/* Header النسخة: رقم النسخة، latest badge، status */}
                      <div className={styles.taskHeader}>
                        <div className={styles.taskTitleRow}>
                          <div className={styles.fileIcon}>
                            <DescriptionIcon />
                          </div>

                          <div className={styles.submissionHeaderContent}>
                            <div className={styles.taskTitleWithStatus}>
                              <h3 className={styles.taskTitle}>
                                Version {displayVersion}
                              </h3>

                              {isLatestSubmission &&
                                sortedSubmissions.length > 1 && (
                                  <span className={styles.latestBadge}>
                                    Latest Version
                                  </span>
                                )}
                              <span
                                className={`${styles.statusBadge} ${
                                  submission.status === "Approved"
                                    ? styles.approvedStatus
                                    : submission.status === "Rejected"
                                      ? styles.rejectedStatus
                                      : styles.pendingStatus
                                }`}
                              >
                                {submission.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.submissionInfo}>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>
                            <PersonIcon className={styles.metaIcon} />
                            Submitted by:
                          </span>
                          <span>{submission.studentName}</span>
                        </div>

                        {submission.studentNotes && (
                          <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>
                              <CommentIcon className={styles.metaIcon} />
                              Student Notes:
                            </span>
                            <span>{submission.studentNotes}</span>
                          </div>
                        )}

                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>
                            <CalendarTodayIcon className={styles.metaIcon} />
                            Submitted At:
                          </span>
                          <span>{formatDate(submission.submittedAt)}</span>
                        </div>

                        {submission.reviewedAt && (
                          <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>
                              <CheckCircleIcon className={styles.metaIcon} />
                              Reviewed At:
                            </span>
                            <span>{formatDate(submission.reviewedAt)}</span>
                          </div>
                        )}
                      </div>

    
                      {editingSubmissionId !== submission.taskSubmissionId && (
                        <div className={styles.submittedFileRow}>
                          {submission.taskSubmissionURL && (
                            <div className={styles.taskSubmissionFile}>
                              <span className={styles.taskFileSmallIcon}>
                                <AttachFileIcon fontSize="small" />
                                <span className={styles.taskFileLabel}>
                                  Submitted File:
                                </span>
                              </span>

                              <a
                                href={submission.taskSubmissionURL}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.taskFileSimpleLink}
                              >
                                {submission.taskSubmissionURL.split("/").pop()}
                              </a>
                            </div>
                          )}

                          <StudentSubmissionActions
                            submission={submission}
                            refreshTaskDetails={fetchTaskDetails}
                            isLatestSubmission={isLatestSubmission}
                            onEditStart={() =>
                              setEditingSubmissionId(
                                submission.taskSubmissionId,
                              )
                            }
                            onEditCancel={() => setEditingSubmissionId(null)}
                            onEditDone={() => setEditingSubmissionId(null)}
                          />
                        </div>
                      )}

                      {editingSubmissionId === submission.taskSubmissionId && (
                        <StudentSubmissionActions
                          submission={submission}
                          refreshTaskDetails={fetchTaskDetails}
                          isLatestSubmission={isLatestSubmission}
                          onEditCancel={() => setEditingSubmissionId(null)}
                          onEditDone={() => setEditingSubmissionId(null)}
                          startInEditMode={true}
                        />
                      )}

                      {/* نقاش التسليم الخاص بهذه النسخة */}
                      <SubmissionDiscussion
                        submission={submission}
                        formatDate={formatDate}
                        currentRole="Student"
                        refreshTaskDetails={fetchTaskDetails}
                      />
                    </div>
                  </div>
                );
              })}

              {/*  زر Submit New Version يظهر فقط إذا أحدث نسخة مرفوضة*/}
              {latestSubmission?.status === "Rejected" && (
                <div className={styles.newVersionNotice}>
                  <div className={styles.newVersionText}>
                    <h3>Latest submission rejected</h3>
                    <p>
                      Please review the discussion comments before submitting a
                      new version.
                    </p>
                  </div>

                  <StudentSubmissionActions
                    task={task}
                    refreshTaskDetails={fetchTaskDetails}
                    submitButtonText="Submit New Version"
                    compact={true}
                  />
                </div>
              )}
            </div>
          ) : (
          
            <StudentSubmissionActions
              task={task}
              refreshTaskDetails={fetchTaskDetails}
            />
          )}
        </div>
      </div>
    </div>
  );
}
