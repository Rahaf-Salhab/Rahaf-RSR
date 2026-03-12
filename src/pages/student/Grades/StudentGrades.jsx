import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import styles from "./StudentGrades.module.css";
import { EmojiEvents, HourglassEmpty, TrendingUp } from "@mui/icons-material";

export default function StudentGrades() {
  const [myGroup, setMyGroup] = useState(null);
  const [finalGrade, setFinalGrade] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const studentId = localStorage.getItem("id");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 🔴 MOCK
      const [groupsRes, finalGradesRes, gradesRes] = await Promise.all([
        api.get("/groups"),
        api.get("/finalGrades"),
        api.get("/grades"),
      ]);

      const group = groupsRes.data.find(g => g.students.includes(studentId));
      setMyGroup(group);

      if (group) {
        const fg = finalGradesRes.data.find(
          f => f.groupId === group.id && f.status === "published"
        );
        setFinalGrade(fg || null);

        const groupGrades = gradesRes.data.filter(g => g.groupId === group.id);
        setGrades(groupGrades);
      }
      // ✅ REAL
      // const [groupsRes, finalGradesRes, gradesRes] = await Promise.all([
      //   api.get("/student/group"),
      //   api.get("/student/final-grade"),
      //   api.get("/student/grades"),
      // ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getAllFields = () => {
    const fields = [];
    grades.forEach(g => {
      g.fields.forEach(f => {
        const existing = fields.find(ef => ef.fieldName === f.fieldName);
        if (existing) {
          existing.value += f.value;
        } else {
          fields.push({ ...f });
        }
      });
    });
    return fields;
  };

  const getGradeLabel = (grade, max) => {
    const pct = max > 0 ? (grade / max) * 100 : 0;
    if (pct >= 90) return "Excellent";
    if (pct >= 75) return "Very Good";
    if (pct >= 60) return "Good";
    return "Needs Improvement";
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  const totalMax = finalGrade ? finalGrade.supervisorTotal + finalGrade.examinerTotal : 0;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Grades</h1>
          <p className={styles.pageSubtitle}>View your project evaluation and grades</p>
        </div>
      </div>

      {!myGroup ? (
        <div className={styles.emptyBox}>
          <HourglassEmpty style={{ fontSize: 56, color: "#ddd" }} />
          <p>You are not assigned to any group yet.</p>
        </div>
      ) : !finalGrade ? (
        <div className={styles.notReleasedBox}>
          <HourglassEmpty style={{ fontSize: 56, color: "#C0441A" }} />
          <h3 className={styles.notReleasedTitle}>Grades Not Released Yet</h3>
          <p className={styles.notReleasedText}>
            Your grades are being reviewed. You will be notified once they are published.
          </p>
        </div>
      ) : (
        <>
          {/* Overall Grade Card */}
          <div className={styles.overallCard}>
            <div className={styles.overallLeft}>
              <p className={styles.overallLabel}>Overall Project Grade</p>
              <div className={styles.overallGradeRow}>
                <span className={styles.overallGrade}>
                  {finalGrade.finalGrade}
                </span>
                <span className={styles.overallMax}> pts</span>
              </div>
              <div className={styles.overallMeta}>
                <span className={styles.gradeLabelBadge}>
                  {getGradeLabel(finalGrade.finalGrade, totalMax)}
                </span>
                <span className={styles.groupBadge}>{myGroup.name}</span>
              </div>
            </div>
            <div className={styles.overallRight}>
              <div className={styles.trophyIcon}>
                <EmojiEvents style={{ fontSize: 48, color: "#C0441A" }} />
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className={styles.breakdownCard}>
            <div className={styles.breakdownHeader}>
              <TrendingUp fontSize="small" style={{ color: "#C0441A" }} />
              <h2 className={styles.breakdownTitle}>Grade Breakdown</h2>
            </div>

            {/* Supervisor & Examiner Summary */}
            <div className={styles.summaryRow}>
              <div className={styles.summaryItem}>
                <p className={styles.summaryLabel}>Supervisor Total</p>
                <p className={styles.summaryValue}>
                  {finalGrade.supervisorTotal} pts
                </p>
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryItem}>
                <p className={styles.summaryLabel}>Examiner Total</p>
                <p className={styles.summaryValue}>
                  {finalGrade.examinerTotal} pts
                </p>
              </div>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryItem}>
                <p className={styles.summaryLabel}>Final Grade</p>
                <p className={styles.summaryValue}>
                  {finalGrade.finalGrade} pts
                </p>
              </div>
            </div>

            {/* Fields Breakdown */}
            <div className={styles.fieldsList}>
              {getAllFields().map((field, i) => {
                const maxVal = Math.max(...grades.flatMap(g =>
                  g.fields.filter(f => f.fieldName === field.fieldName).map(f => f.value)
                ));
                const pct = maxVal > 0 ? Math.min((field.value / (maxVal * 1.2)) * 100, 100) : 0;

                return (
                  <div key={i} className={styles.fieldItem}>
                    <div className={styles.fieldItemHeader}>
                      <span className={styles.fieldItemName}>{field.fieldName}</span>
                      <span className={styles.fieldItemValue}>{field.value} pts</span>
                    </div>
                    <div className={styles.fieldBar}>
                      <div
                        className={styles.fieldBarFill}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}