import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import styles from "./Examination.module.css";
import {
  CalendarMonth,
  Room,
  People,
  MenuBook,
} from "@mui/icons-material";

export default function Examination() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      const res = await api.get("/Schedule/schedules-Examiner");
      setSchedules(res.data?.result || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = schedules.filter(
    (s) =>
      s.groupName?.toLowerCase().includes(search.toLowerCase()) ||
      s.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      s.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Examination Timetable</h1>
          <p className={styles.pageSubtitle}>
            Your assigned group defense sessions
          </p>
        </div>
      </div>

      <div className={styles.filtersBox}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search by group or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyBox}>
          <CalendarMonth style={{ fontSize: 48, color: "#ddd" }} />
          <p>No examination schedules found.</p>
        </div>
      ) : (
        <div className={styles.cardsList}>
          {filtered.map((s) => (
            <div key={s.scheduleId} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.groupName}>{s.groupName}</h3>
                  <p className={styles.projectName}>{s.projectName}</p>
                </div>

                <span className={styles.dateBadge}>
                  {s.date
                    ? new Date(s.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </span>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <CalendarMonth
                    fontSize="small"
                    className={styles.infoIcon}
                  />

                  <div>
                    <p className={styles.infoLabel}>Date &amp; Time</p>

                    <p className={styles.infoValue}>
                      {s.date
                        ? new Date(s.date).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <Room fontSize="small" className={styles.infoIcon} />

                  <div>
                    <p className={styles.infoLabel}>Location</p>
                    <p className={styles.infoValue}>{s.location || "-"}</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <People fontSize="small" className={styles.infoIcon} />

                  <div>
                    <p className={styles.infoLabel}>Supervisor</p>
                    <p className={styles.infoValue}>
                      {s.supervisorName || "-"}
                    </p>
                  </div>
                </div>

                {s.thesisURL && (
                  <div className={styles.infoItem}>
                    <MenuBook
                      fontSize="small"
                      className={styles.infoIcon}
                    />

                    <div>
                      <p className={styles.infoLabel}>Thesis</p>

                      <a
                        href={s.thesisURL}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.thesisLink}
                      >
                        View Thesis
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {s.students?.length > 0 && (
                <div className={styles.section}>
                  <p className={styles.sectionLabel}>Students</p>

                  <div className={styles.chipList}>
                    {s.students.map((name, i) => (
                      <span key={i} className={styles.studentChip}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {s.examiners?.length > 0 && (
                <div className={styles.section}>
                  <p className={styles.sectionLabel}>
                    Examination Committee
                  </p>

                  <div className={styles.chipList}>
                    {s.examiners.map((name, i) => (
                      <span key={i} className={styles.examinerChip}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {s.notes && (
                <div className={styles.notes}>
                  <p className={styles.sectionLabel}>Notes</p>
                  <p className={styles.notesText}>{s.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}