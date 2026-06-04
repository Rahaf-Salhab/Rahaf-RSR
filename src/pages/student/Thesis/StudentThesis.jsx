import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import styles from "./StudentThesis.module.css";
import {
  DescriptionOutlined,
  UploadFileOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";

export default function StudentThesis() {
  const [thesis, setThesis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [addError, setAddError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updatingVersionId, setUpdatingVersionId] = useState(null);
  const [updateError, setUpdateError] = useState("");
  const fetchStudentThesis = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const studentId = localStorage.getItem("id");

      console.log("studentId:", studentId);

      if (!studentId) {
        setErrorMessage("Student id not found. Please login again.");
        return;
      }
      
      const groupRes = await api.get(`/Group/my-group/${studentId}`);
      console.log("FULL GROUP RESPONSE:", groupRes.data);

      console.log("group response:", groupRes.data);

      const groupId = groupRes.data?.groupId;

      console.log("groupId:", groupId);

      if (!groupId) {
        setErrorMessage("No group found for this student.");
        return;
      }

      const thesisRes = await api.get(`/Thesis/get-thesis/group-id/${groupId}`);

      console.log("thesis response:", thesisRes.data);

      console.log("versions:", thesisRes.data?.result?.thesisVersions);
      setThesis(thesisRes.data?.result || null);
    } catch (err) {
      console.error("Error fetching student thesis:", err);
      setErrorMessage("No thesis found for your group yet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentThesis();
  }, []);

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

  if (loading) {
    return (
      <div className={styles.page}>
        <p>Loading thesis...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={styles.page}>
        <p>{errorMessage}</p>
      </div>
    );
  }
  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedFile(file);
    setAddError("");

    await handleAddThesisVersion(file);

    e.target.value = "";
  };
  //
  const handleAddThesisVersion = async (fileToUpload) => {
    setAddError("");

    if (!fileToUpload) {
      setAddError("Please select a thesis file first.");
      return;
    }

    if (!thesis?.thesisId) {
      setAddError("Thesis id not found.");
      return;
    }

    const formData = new FormData();
    formData.append("ThesisVersionFile", fileToUpload);

    setSubmitting(true);

    try {
      await api.post(
        `/ThesisVersions/add-version/thesis-Id/${thesis.thesisId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setSelectedFile(null);
      await fetchStudentThesis();
    } catch (err) {
      console.error("Error adding thesis version:", err);

      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        "Failed to upload thesis version. Please try again.";

      setAddError(backendMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateThesisVersion = async (versionId, fileToUpload) => {
    setUpdateError("");

    if (!versionId) {
      setUpdateError("Version id not found.");
      return;
    }

    if (!fileToUpload) {
      setUpdateError("Please select a thesis file first.");
      return;
    }

    const formData = new FormData();
    formData.append("ThesisVersionFile", fileToUpload);

    setUpdatingVersionId(versionId);

    try {
      await api.put(
        `/ThesisVersions/update-version/thesis-version-Id/${versionId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      await fetchStudentThesis();
    } catch (err) {
      console.error("Error updating thesis version:", err);

      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        "Failed to update thesis version. Please try again.";

      setUpdateError(backendMessage);
    } finally {
      setUpdatingVersionId(null);
    }
  };

  const sortedThesisVersions = [...(thesis.thesisVersions || [])].sort(
    (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt), // Sort by uploaded date, newest first
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Thesis</h1>
        <p>Upload and manage your thesis documents</p>
      </div>

      <div className={styles.supervisorThesisCard}>
        <div className={styles.cardTitle}>
          <span>Supervisor Thesis File</span>
        </div>

        <div className={styles.supervisorContent}>
          <div className={styles.supervisorFileIcon}>
            <DescriptionOutlined fontSize="small" />
          </div>

          <div className={styles.supervisorInfo}>
            <h3>{getFileName(thesis.thesisFile)}</h3>

            <div className={styles.supervisorMeta}>
              <span>Supervisor: Dr. {thesis.supervisorName}</span>
              <span className={styles.metaDot}>•</span>
              <span>Uploaded: {formatDate(thesis.createdAt)}</span>
              <span className={styles.metaDot}>•</span>
              <span>Deadline: {formatDate(thesis.deadLine)}</span>
            </div>
          </div>

          <a
            href={thesis.thesisFile}
            target="_blank"
            rel="noreferrer"
            className={styles.viewBtn}
          >
            <VisibilityOutlined fontSize="small" />
            View
          </a>
        </div>
      </div>

      <div className={styles.uploadCard}>
        <div className={styles.cardTitle}>
          <span>Upload Thesis</span>
        </div>

        <div className={styles.uploadBox}>
          <input
            type="file"
            accept=".pdf"
            id="thesisVersionFile"
            className={styles.hiddenFileInput}
            onChange={handleFileChange}
          />

          <div className={styles.uploadIconCircle}>
            <UploadFileOutlined />
          </div>

          <p>
            <label htmlFor="thesisVersionFile" className={styles.uploadText}>
              Click to upload
            </label>{" "}
          </p>

          <small>PDF files only (max. 20MB)</small>

          <label
            htmlFor={submitting ? undefined : "thesisVersionFile"}
            className={`${styles.selectFileBtn} ${
              submitting ? styles.disabledSelectFileBtn : ""
            }`}
          >
            {submitting ? "Uploading..." : "Select File"}
          </label>

          {selectedFile && (
            <div className={styles.selectedFileName}>
              Selected file: {selectedFile.name}
            </div>
          )}

          {addError && <div className={styles.addError}>{addError}</div>}
        </div>
      </div>

      <div className={styles.versionsCard}>
        <div className={styles.cardTitle}>
          <DescriptionOutlined fontSize="small" />
          <span>Thesis Versions</span>
        </div>
        {updateError && <div className={styles.addError}>{updateError}</div>}

        {sortedThesisVersions.length > 0 ? (
          <div className={styles.versionsList}>
            {sortedThesisVersions.map((version) => (
              <div key={version.versionId} className={styles.versionItem}>
                <input
                  type="file"
                  accept=".pdf"
                  id={`updateVersionFile-${version.versionId}`}
                  className={styles.hiddenFileInput}
                  onChange={(e) => {
                    const file = e.target.files[0];

                    if (!file) return;

                    handleUpdateThesisVersion(version.versionId, file);

                    e.target.value = "";
                  }}
                />
                <div className={styles.versionMainRow}>
                  <div className={styles.versionFileIcon}>
                    <DescriptionOutlined fontSize="small" />
                  </div>

                  <div className={styles.versionInfo}>
                    <div className={styles.versionTitleRow}>
                      <h4>{getFileName(version.fileURL)}</h4>

                      {version.thesisFeedbacks?.[0]?.decision && (
                        <span
                          className={
                            version.thesisFeedbacks[0].decision === "Approved"
                              ? styles.approvedBadge
                              : styles.rejectedBadge
                          }
                        >
                          {version.thesisFeedbacks[0].decision}
                        </span>
                      )}
                    </div>

                    <div className={styles.versionMeta}>
                      <span>Version {version.versionNumber}.0</span>
                      <span className={styles.metaDot}>•</span>
                      <span>{formatDate(version.uploadedAt)}</span>
                    </div>
                  </div>

                  <div className={styles.versionActions}>
                    {version.fileURL && (
                      <a
                        href={version.fileURL}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.viewBtn}
                      >
                        <VisibilityOutlined fontSize="small" />
                        View
                      </a>
                    )}

                    <label
                      htmlFor={
                        version.thesisFeedbacks?.[0]
                          ? undefined
                          : `updateVersionFile-${version.versionId}`
                      }
                      className={`${styles.updateBtn} ${
                        updatingVersionId === version.versionId
                          ? styles.disabledUpdateBtn
                          : ""
                      }`}
                      onClick={(e) => {
                        if (version.thesisFeedbacks?.[0]) {
                          e.preventDefault();
                          setUpdateError("Can't update version has feedback");
                        }
                      }}
                    >
                      <UploadFileOutlined fontSize="small" />
                      {updatingVersionId === version.versionId
                        ? "Updating..."
                        : "Update"}
                    </label>
                  </div>
                </div>

                {version.thesisFeedbacks?.[0] && (
                  <div className={styles.feedbackBox}>
                    <div className={styles.feedbackTop}>
                      <h4 className={styles.feedbackTitle}>
                        Supervisor Feedback
                      </h4>

                      <div className={styles.feedbackMeta}>
                        <span>{version.thesisFeedbacks[0].reviwerName}</span>

                        {version.thesisFeedbacks[0].createAt && (
                          <>
                            <span className={styles.metaDot}>•</span>
                            <span>
                              {formatDate(version.thesisFeedbacks[0].createAt)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {version.thesisFeedbacks[0].feedback && (
                      <p className={styles.feedbackText}>
                        {version.thesisFeedbacks[0].feedback}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyVersions}>
            You have not submitted any thesis version yet.
          </div>
        )}
      </div>
    </div>
  );
}
