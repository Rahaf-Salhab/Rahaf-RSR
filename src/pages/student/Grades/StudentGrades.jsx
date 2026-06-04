import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import styles from "./StudentGrades.module.css";
import { EmojiEvents, HourglassEmpty } from "@mui/icons-material";

export default function StudentGrades() {
  const [finalGrade, setFinalGrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notReleased, setNotReleased] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const studentId = localStorage.getItem("id");

      const groupRes = await api.get(`/Group/my-group/${studentId}`);
      const groupId = groupRes.data?.groupId;

      if (!groupId) {
        setNotReleased(true);
        return;
      }

      const gradeRes = await api.get(`/Student/final-grade/${groupId}`);
      if (gradeRes.data?.finalScore !== undefined && gradeRes.data?.finalScore !== null) {
        setFinalGrade(gradeRes.data.finalScore);
      } else {
        setNotReleased(true);
      }
    } catch (err) {
      setNotReleased(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getGradeLabel = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Very Good";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Grades</h1>
          <p className={styles.pageSubtitle}>View your project final grade</p>
        </div>
      </div>

      {notReleased ? (
        <div className={styles.notReleasedBox}>
          <HourglassEmpty style={{ fontSize: 56, color: "#C0441A" }} />
          <h3 className={styles.notReleasedTitle}>Grades Not Released Yet</h3>
          <p className={styles.notReleasedText}>
            Your grades are being reviewed. You will be notified once they are published.
          </p>
        </div>
      ) : (
        <div className={styles.overallCard}>
          <div className={styles.overallLeft}>
            <p className={styles.overallLabel}>Overall Project Grade</p>
            <div className={styles.overallGradeRow}>
              <span className={styles.overallGrade}>{finalGrade}</span>
              <span className={styles.overallMax}> pts</span>
            </div>
            <div className={styles.overallMeta}>
              <span className={styles.gradeLabelBadge}>
                {getGradeLabel(finalGrade)}
              </span>
            </div>
          </div>
          <div className={styles.overallRight}>
            <div className={styles.trophyIcon}>
              <EmojiEvents style={{ fontSize: 48, color: "#C0441A" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}