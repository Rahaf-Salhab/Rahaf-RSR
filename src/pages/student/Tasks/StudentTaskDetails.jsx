import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import SubmissionDiscussion from "../../../components/SubmissionDiscussion/SubmissionDiscussion";
import DescriptionIcon from "@mui/icons-material/Description";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import NotesIcon from "@mui/icons-material/Notes";
import PersonIcon from "@mui/icons-material/Person";
import NumbersIcon from "@mui/icons-material/Numbers";
import CommentIcon from "@mui/icons-material/Comment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import StudentSubmissionActions from "./StudentSubmissionActions";
import styles from "./StudentTaskDetails.module.css";

export default function StudentTaskDetails() {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingSubmissionId, setEditingSubmissionId] = useState(null);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/Task/task-id/${taskId}`);
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
    //To format the date
    if (!data) return "-";
    return new Date(data).toLocaleDateString();
  };
  const getTaskFileUrl = (fileName) => {
    if (!fileName) return "";

    // لو الرابط راجع كامل من الباك
    if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
      return fileName;
    }

    // حسب رابط التسليم عندك، الملفات موجودة داخل /files/Tasks
    return `http://rsr.tryasp.net/files/Tasks/${fileName.replace(/^\/+/, "")}`;
  };

  const submissions = task?.taskSubmissions || []; // كل النسخ الراجعة من الباك

  const sortedSubmissions = [...submissions].sort((a, b) => {
    const versionDiff = (b.versionNumber || 0) - (a.versionNumber || 0);

    if (versionDiff !== 0) {
      return versionDiff;
    }

    return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
  });

  const latestSubmission = sortedSubmissions[0];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }
  if (!task) {
    //if there's no task
    return <div>Task notfound.</div>;
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
            <span>{formatDate(task.deadLine || task.deadline)}</span>
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
          {task.taskSubmissions && task.taskSubmissions.length > 0 ? (
            <div className={styles.submissionsList}>
              {sortedSubmissions.map((submission, index) => {
                const displayVersion = sortedSubmissions.length - index;
                const isLatestSubmission =
                  submission.taskSubmissionId ===
                  latestSubmission?.taskSubmissionId;

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
                              {isLatestSubmission && (
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
                                {submission.status || "Submitted"}
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
                          <span>{submission.studentName || "-"}</span>
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
                      {/*  هنا بنعرض الملف اللي تم تسليمه لو في ملف، وبنمرر له الارسال الحالي والدوال اللي بتتحكم في حالة تحرير الارسال عشان يقدر يعرض نموذج التحرير لما يضغط على زر التحرير  */}
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

                      {/* لما يكون الارسال في حالة تحرير بنعرض نموذج التحرير اللي هو نفس نموذج الارسال بس مع بيانات الارسال الحالي  */}
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
                      {/* هنا بنعرض نموذج النقاش الخاص بالتسليم، بنمرر له التسليم والدالة اللي بتحدث تفاصيل المهمة بعد اي تغيير بالارسال او الحذف  */}
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
              {/*Submit New Version يظهر زر تسليم Rejected  اذا الحالة  */}
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
