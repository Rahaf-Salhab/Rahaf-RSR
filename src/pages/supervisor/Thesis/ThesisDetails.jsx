import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../../api/axiosInstance";
import {
  AttachFile,
  Edit,
  DescriptionOutlined,
  VisibilityOutlined,
  RateReviewOutlined,
  CheckCircleOutline,
  CancelOutlined,
} from "@mui/icons-material";
import AlertMessage from "../../../components/AlertMessage/AlertMessage";
import styles from "./ThesisDetails.module.css";
export default function ThesisDetails() {
  const { groupId } = useParams();
  const [thesis, setThesis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateFile, setUpdateFile] = useState(null);
  const [updateDeadline, setUpdateDeadline] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [reviewingVersionId, setReviewingVersionId] = useState(null); // بنخزن فيها رقم النسخة الي المشرف بده يراجعها
  const [reviewDecision, setReviewDecision] = useState("Approved");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewing, setReviewing] = useState(false); // عشان نمنع الضغط اكثر من مرة اثناء الارسال
  const [freezingVersionId, setFreezingVersionId] = useState(null);
  const [freezeError, setFreezeError] = useState("");
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState("");
  const [freezeSuccessMessage, setFreezeSuccessMessage] = useState("");
  useEffect(() => {
    fetchThesisDetails();
  }, [groupId]);

  const fetchThesisDetails = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await api.get(`/Thesis/get-thesis/group-id/${groupId}`);
      setThesis(res.data?.result || null);
    } catch (err) {
      setErrorMessage("No thesis found for this group.");
    } finally {
      setLoading(false);
    }
  };
  const openUpdateModal = () => {
    setUpdateFile(null);
    setUpdateError("");
    setUpdateSuccessMessage("");
    setFreezeError("");
    setFreezeSuccessMessage("");

    if (thesis?.deadLine) {
      setUpdateDeadline(thesis.deadLine.slice(0, 16));
    } else {
      setUpdateDeadline("");
    }

    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setUpdateFile(null);
    setUpdateDeadline("");
    setUpdateError("");
  };

  const handleUpdateThesis = async (e) => {
    e.preventDefault();
    setUpdateError("");

    if (!updateDeadline) {
      setUpdateError("Deadline is required.");
      return;
    }

    const formData = new FormData();

    if (updateFile) {
      formData.append("ThesisFile", updateFile);
    }

    formData.append("DeadLine", `${updateDeadline}:00`);

    setUpdating(true);

    try {
      await api.patch(
        `/Thesis/update-thesis/Thesis-Id/${thesis.thesisId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      closeUpdateModal();
      setUpdateSuccessMessage("Thesis updated successfully.");
      setFreezeSuccessMessage("");
      setFreezeError("");
      fetchThesisDetails();
    } catch (err) {
      setUpdateSuccessMessage("");
      setUpdateError("Failed to update thesis. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const openReviewBox = (version) => {
    setReviewingVersionId(version.versionId);
    setReviewDecision("Approved");
    setReviewFeedback("");
    setReviewError("");
  };

  const closeReviewBox = () => {
    setReviewingVersionId(null);
    setReviewDecision("Approved");
    setReviewFeedback("");
    setReviewError("");
  };

  const handleReviewVersion = async (e) => {
    e.preventDefault();
    setReviewError("");

    if (!reviewingVersionId) {
      setReviewError("Version id not found.");
      return;
    }

    if (reviewDecision === "Rejected" && !reviewFeedback.trim()) {
      setReviewError("Feedback is required when rejecting a thesis version.");
      return;
    }

    setReviewing(true);

    try {
      await api.post(
        `/Thesis/Review-version/versionId/${reviewingVersionId}`,
        {
          Decision: reviewDecision,
          Feedback: reviewFeedback,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      closeReviewBox();
      fetchThesisDetails();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        "Failed to review thesis version. Please try again.";

      setReviewError(backendMessage);
    } finally {
      setReviewing(false);
    }
  };

  const handleFreezeVersion = async (versionId) => {
    if (!versionId) return;

    setFreezeError("");
    setFreezeSuccessMessage("");
    setFreezingVersionId(versionId);

    try {
      await api.post(`/Thesis/freeze-thesis/versionId/${versionId}`);

      setFreezeError("");
      setFreezeSuccessMessage("Thesis version frozen successfully.");
      setUpdateSuccessMessage("");
      fetchThesisDetails();
    } catch (err) {
      console.error("Error freezing thesis version:", err);

      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        "Failed to freeze thesis version. Please try again.";

      setFreezeError(backendMessage);
      setFreezeSuccessMessage("");
    } finally {
      setFreezingVersionId(null);
    }
  };

  if (loading) {
    return <div className={styles.detailsPage}>Loading thesis...</div>;
  }

  if (errorMessage) {
    return (
      <div className={styles.detailsPage}>
        <div className={styles.errorMessage}>{errorMessage}</div>
      </div>
    );
  }
  const getFileName = (fileUrl) => {
    if (!fileUrl) return "Thesis file";
    return fileUrl.split("/").pop();
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  //  عشان نجيب الفيدباك الخاص بكل نسخة بسهولة بدل ما نكرر الكود في كل مكان
  const getVersionFeedback = (version) => {
    return version.thesisFeedbacks?.[0] || null;
  };

  const getDecisionClassName = (decision) => {
    if (decision === "Approved") return styles.approvedBadge;
    if (decision === "Rejected") return styles.rejectedBadge;
    return styles.reviewedBadge;
  };

  const sortedThesisVersions = [...(thesis.thesisVersions || [])].sort(
    (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt),
  );

  return (
    <div className={styles.detailsPage}>
      <div className={styles.detailsHeader}>
        <h1>Thesis Details</h1>
        <p>View supervisor thesis file and student thesis versions.</p>
      </div>
      <AlertMessage type="success" message={updateSuccessMessage} onClose={() => setUpdateSuccessMessage("")} />
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2>Supervisor Thesis</h2>
          <p>View the thesis file uploaded by the supervisor.</p>
        </div>

        <div className={styles.innerBox}>
          <div className={styles.fileInfo}>
            <div className={styles.fileIcon}>
              <DescriptionOutlined fontSize="small" />
            </div>

            <div className={styles.infoContent}>
              <p>
                <span>Supervisor Name:</span> {thesis.supervisorName}
              </p>

              <p>
                <span>Uploaded At:</span>{" "}
                {new Date(thesis.createdAt).toLocaleString()}
              </p>

              <p>
                <span>Deadline:</span>{" "}
                {thesis.deadLine
                  ? new Date(thesis.deadLine).toLocaleString()
                  : "No deadline"}
              </p>

              <p>
                <span>Thesis File:</span>{" "}
                <a
                  href={thesis.thesisFile}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.fileLinkText}
                >
                  {getFileName(thesis.thesisFile)}
                </a>
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.updateBtn}
            onClick={openUpdateModal}
          >
            <Edit fontSize="small" />
            Update Thesis
          </button>
        </div>
      </div>
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Student Thesis Versions</h2>
        <AlertMessage type="success" message={freezeSuccessMessage} onClose={() => setFreezeSuccessMessage("")} />
        <AlertMessage type="error" message={freezeError} onClose={() => setFreezeError("")} />
        {sortedThesisVersions.length > 0 ? (
          <div className={styles.versionsList}>
            {sortedThesisVersions.map((version) => {
              const feedback = getVersionFeedback(version);
              const isApproved = feedback?.decision === "Approved";
              return (
                <div key={version.versionId} className={styles.fileCard}>
                  <div className={styles.fileTop}>
                    <div className={styles.fileInfo}>
                      <div className={styles.studentVersionIcon}>
                        <DescriptionOutlined fontSize="small" />
                      </div>

                      <div>
                        <div className={styles.versionTitleRow}>
                          <h3 className={styles.fileName}>
                            {getFileName(version.fileURL)}
                          </h3>

                          {getVersionFeedback(version) && (
                            <span
                              className={getDecisionClassName(
                                getVersionFeedback(version).decision,
                              )}
                            >
                              {getVersionFeedback(version).decision}
                            </span>
                          )}
                        </div>

                        <p className={styles.fileMeta}>
                          Version {version.versionNumber}.0
                          <span className={styles.metaDot}>•</span>
                          {formatDate(version.uploadedAt)}
                        </p>
                      </div>
                    </div>

                    <div className={styles.versionActions}>
                      {version.fileURL && (
                        <a
                          href={version.fileURL}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.actionBtn}
                        >
                          <VisibilityOutlined fontSize="small" />
                          View
                        </a>
                      )}
                      {isApproved && (
                        <button
                          type="button"
                          className={styles.freezeBtn}
                          onClick={() => handleFreezeVersion(version.versionId)}
                          disabled={freezingVersionId === version.versionId}
                        >
                          {freezingVersionId === version.versionId
                            ? "Freezing..."
                            : "Freeze"}
                        </button>
                      )}

                      {!feedback && (
                        <button
                          type="button"
                          className={styles.reviewBtn}
                          onClick={() => openReviewBox(version)}
                        >
                          <RateReviewOutlined fontSize="small" />
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                  {reviewingVersionId === version.versionId && (
                    <form
                      className={styles.reviewBox}
                      onSubmit={handleReviewVersion}
                    >
                      <div className={styles.reviewHeader}>
                        <h4>Review Thesis Version</h4>

                        <button
                          type="button"
                          className={styles.closeReviewBtn}
                          onClick={closeReviewBox}
                        >
                          ×
                        </button>
                      </div>

                      {reviewError && (
                        <div className={styles.reviewError}>{reviewError}</div>
                      )}

                      <div className={styles.decisionBtns}>
                        <button
                          type="button"
                          className={`${styles.decisionBtn} ${
                            reviewDecision === "Approved"
                              ? styles.approvedActive
                              : ""
                          }`}
                          onClick={() => setReviewDecision("Approved")}
                        >
                          <CheckCircleOutline fontSize="small" />
                          Approved
                        </button>

                        <button
                          type="button"
                          className={`${styles.decisionBtn} ${
                            reviewDecision === "Rejected"
                              ? styles.rejectedActive
                              : ""
                          }`}
                          onClick={() => setReviewDecision("Rejected")}
                        >
                          <CancelOutlined fontSize="small" />
                          Rejected
                        </button>
                      </div>

                      <label className={styles.feedbackLabel}>
                        Feedback{" "}
                        {reviewDecision === "Rejected" ? (
                          <span className={styles.requiredMark}>*</span>
                        ) : (
                          <span className={styles.optionalText}>
                            (optional)
                          </span>
                        )}
                      </label>

                      <textarea
                        className={styles.feedbackInput}
                        placeholder={
                          reviewDecision === "Rejected"
                            ? "Feedback is required when rejecting..."
                            : "Write your feedback (optional)..."
                        }
                        value={reviewFeedback}
                        onChange={(e) => setReviewFeedback(e.target.value)}
                        rows="4"
                      />

                      <div className={styles.reviewActions}>
                        <button
                          type="button"
                          className={styles.cancelReviewBtn}
                          onClick={closeReviewBox}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className={styles.submitReviewBtn}
                          disabled={reviewing}
                        >
                          {reviewing ? "Submitting..." : "Submit Review"}
                        </button>
                      </div>
                    </form>
                  )}

                  {getVersionFeedback(version) && (
                    <div className={styles.feedbackBox}>
                      <div className={styles.feedbackTop}>
                        <h4 className={styles.feedbackTitle}>
                          Supervisor Feedback
                        </h4>

                        <div className={styles.feedbackMeta}>
                          <span>{getVersionFeedback(version).reviwerName}</span>

                          {getVersionFeedback(version).createAt && (
                            <>
                              <span className={styles.metaDot}>•</span>
                              <span>
                                {formatDate(
                                  getVersionFeedback(version).createAt,
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {getVersionFeedback(version).feedback && (
                        <p className={styles.feedbackText}>
                          {getVersionFeedback(version).feedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.emptyText}>
            No student thesis versions submitted yet.
          </p>
        )}
      </div>
      {showUpdateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h2>Update Thesis</h2>

              <button
                type="button"
                className={styles.closeBtn}
                onClick={closeUpdateModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateThesis} className={styles.modalForm}>
              {updateError && (
                <div className={styles.errorMessage}>{updateError}</div>
              )}

              <div className={styles.formGroup}>
                <label>Thesis File <span className={styles.optional}>(optional)</span></label>

                <div className={styles.currentFileBox}>
                  <label className={styles.fileNameBox}>
                    <input
                      type="file"
                      accept=".pdf"
                      hidden
                      onChange={(e) => setUpdateFile(e.target.files[0])}
                    />

                    <AttachFile
                      fontSize="small"
                      className={styles.fileSmallIcon}
                    />

                    <span>
                      {updateFile
                        ? updateFile.name
                        : getFileName(thesis.thesisFile)}
                    </span>
                  </label>

                  {updateFile && (
                    <button
                      type="button"
                      className={styles.removeFileBtn}
                      onClick={() => setUpdateFile(null)}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>
                  Deadline <span className={styles.optional}>(optional)</span>
                </label>

                <input
                  type="datetime-local"
                  value={updateDeadline}
                  onChange={(e) => setUpdateDeadline(e.target.value)}
                  className={styles.dateInput}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={closeUpdateModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={updating}
                >
                  {updating ? "Updating..." : "Update Thesis"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
