import React, { useEffect, useState } from "react";
import api from "../../../api/axiosInstance.jsx";
import styles from "./StudentExamination.module.css";

function StudentExamination() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await api.get("/Schedule/schedule-student");

        setData(res.data.result);
      } catch (err) {
        console.error(err);
        setError("Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const formatDate = (iso) => {
    const d = new Date(iso);

    return (
      d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }) +
      " — " +
      d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const initials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const avatarColors = [
    "av-blue",
    "av-teal",
    "av-pink",
    "av-amber",
    "av-purple",
  ];

  if (loading) {
    return <div className={styles["exam-status"]}>Loading...</div>;
  }

  if (error) {
    return (
      <div className={`${styles["exam-status"]} ${styles.error}`}>
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles["exam-status"]}>
        No schedule found.
      </div>
    );
  }

  return (
    <div className={styles["exam-card"]}>
      <div className={styles["exam-header"]}>
        <div className={styles["project-icon"]}>
          <span className={styles.icon}>🎓</span>
        </div>

        <div className={styles["header-info"]}>
          <h2 className={styles["project-title"]}>
            {data.projectName}
          </h2>

          <div className={styles["header-badges"]}>
            <span
              className={`${styles.badge} ${styles["badge-info"]}`}
            >
              Group: {data.groupName}
            </span>

            <span
              className={`${styles.badge} ${styles["badge-default"]}`}
            >
              Supervisor: {data.supervisorName}
            </span>
          </div>
        </div>
      </div>

      <div className={styles["info-grid"]}>
        <div className={styles["info-item"]}>
          <div className={styles["info-label"]}>
            📅 Date & Time
          </div>
          <div className={styles["info-value"]}>
            {formatDate(data.date)}
          </div>
        </div>

        <div className={styles["info-item"]}>
          <div className={styles["info-label"]}>
            📍 Location
          </div>
          <div className={styles["info-value"]}>
            {data.location}
          </div>
        </div>

        <div
          className={`${styles["info-item"]} ${styles["full-width"]}`}
        >
          <div className={styles["info-label"]}>📝 Notes</div>
          <div
            className={`${styles["info-value"]} ${styles.muted}`}
          >
            {data.notes || "No notes"}
          </div>
        </div>
      </div>

      <div className={styles["people-section"]}>
        <div className={styles["section-title"]}>Students</div>

        <div className={styles["people-list"]}>
          {data.students?.map((student, index) => (
            <div key={index} className={styles["avatar-chip"]}>
              <div
                className={`${styles.avatar} ${
                  styles[
                    avatarColors[index % avatarColors.length]
                  ]
                }`}
              >
                {initials(student)}
              </div>

              <span className={styles["chip-name"]}>
                {student}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles["people-section"]}>
        <div className={styles["section-title"]}>Examiners</div>

        <div className={styles["people-list"]}>
          {data.examiners?.map((examiner, index) => (
            <div key={index} className={styles["avatar-chip"]}>
              <div
                className={`${styles.avatar} ${styles["av-amber"]}`}
              >
                {initials(examiner)}
              </div>

              <span className={styles["chip-name"]}>
                {examiner}
              </span>
            </div>
          ))}
        </div>
      </div>

      {data.thesisURL && (
        <a
          href={data.thesisURL}
          target="_blank"
          rel="noreferrer"
          className={styles["thesis-link"]}
        >
          <span>📄 View Thesis PDF</span>
          <span className={styles["ext-icon"]}>↗</span>
        </a>
      )}
    </div>
  );
}

export default StudentExamination;