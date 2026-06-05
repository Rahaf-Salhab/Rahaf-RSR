import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import styles from "./ExaminationTables.module.css";
import { CalendarMonth, Room, People } from "@mui/icons-material";

export default function ExaminationTables() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);

    try {
      const res = await api.get("/Schedule/schedules-supervisor");
      setSchedules(res.data?.result || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load examination schedules.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.loading}>{error}</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Examination Timetable</h1>
          <p className={styles.pageSubtitle}>
            Your scheduled group defense sessions
          </p>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className={styles.emptyBox}>
          <CalendarMonth style={{ fontSize: 48, color: "#ddd" }} />
          <p>No examination schedules found.</p>
        </div>
      ) : (
        <div className={styles.cardsList}>
          {schedules.map((t) => (
            <div key={t.scheduleId} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.groupName}>
                    {t.groupName || "-"}
                  </h3>
                  <p className={styles.projectTitle}>
                    {t.projectName || "-"}
                  </p>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <CalendarMonth
                      fontSize="small"
                      className={styles.infoIcon}
                    />
                    <div>
                      <p className={styles.infoLabel}>Date</p>
                      <p className={styles.infoValue}>
                        {t.date
                          ? new Date(t.date).toLocaleString()
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <Room
                      fontSize="small"
                      className={styles.infoIcon}
                    />
                    <div>
                      <p className={styles.infoLabel}>Location</p>
                      <p className={styles.infoValue}>
                        {t.location || "-"}
                      </p>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <People
                      fontSize="small"
                      className={styles.infoIcon}
                    />
                    <div>
                      <p className={styles.infoLabel}>Supervisor</p>
                      <p className={styles.infoValue}>
                        {t.supervisorName || "-"}
                      </p>
                    </div>
                  </div>

                  {t.students?.length > 0 && (
                    <div className={styles.infoItem}>
                      <People
                        fontSize="small"
                        className={styles.infoIcon}
                      />
                      <div>
                        <p className={styles.infoLabel}>Students</p>
                        <p className={styles.infoValue}>
                          {t.students.join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {t.notes && (
                    <div className={styles.infoItem}>
                      <div>
                        <p className={styles.infoLabel}>Notes</p>
                        <p className={styles.infoValue}>
                          {t.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {t.thesisURL && (
                    <div className={styles.infoItem}>
                      <div>
                        <p className={styles.infoLabel}>Thesis</p>

                        <a
                          href={t.thesisURL}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: "13px",
                            color: "#C0441A",
                            textDecoration: "none",
                            fontWeight: "600",
                          }}
                        >
                          View Thesis
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {t.examiners?.length > 0 && (
                  <div className={styles.examinersSection}>
                    <p className={styles.examinersLabel}>
                      Examination Committee
                    </p>

                    <div className={styles.examinersList}>
                      {t.examiners.map((name, i) => (
                        <span
                          key={i}
                          className={styles.examinerChip}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}