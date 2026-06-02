import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowForward, Search } from "@mui/icons-material";
import styles from "./ArchiveSemesters.module.css";
import axiosInstance from "../../../api/axiosInstance";

export default function ArchiveSemesters() {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        setError("");

        const cached = sessionStorage.getItem("archiveSemesters");// Check if semesters are cached in sessionStorage

        if (cached) {
          setSemesters(JSON.parse(cached));// Use cached data if available )(اذا موجودة بحولها من نص الى ارري)
        } else {
          setLoading(true);
        }

        const res = await axiosInstance.get("/Semester/AllSemesters");
        const data = res.data?.semesters || [];

        setSemesters(data);
        sessionStorage.setItem("archiveSemesters", JSON.stringify(data));// Cache the fetched semesters in sessionStorage
      } catch (err) {
        console.error(err);
        setError("Failed to load semesters");
      } finally {
        setLoading(false);
      }
    };

    fetchSemesters();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredSemesters = useMemo(() => { // Filter semesters based on search term
    return semesters.filter((sem) => {
      const semesterName = sem.name || "";
      return semesterName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [semesters, searchTerm]);// Use useMemo to avoid unnecessary filtering on every render

  const handleSemesterClick = (semester) => {
  navigate(`${semester.semesterId}`, {
    state: { semester },
  });
};

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Archive</h1>
      <p className={styles.subtitle}>
        View archived semesters and their theses
      </p>

      <div className={styles.searchBox}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} fontSize="small" />
          <input
            type="text"
            placeholder="Search archived semesters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Archived Semesters</h2>
        </div>

        {loading && <p className={styles.infoText}>Loading semesters...</p>}
        {error && <p className={styles.error}>{error}</p>}

        {!loading && !error && filteredSemesters.length === 0 && (
          <p className={styles.infoText}>No semesters found.</p>
        )}

        <div className={styles.list}> {/*card يتحول الى sem عرض الفصول, كل */}
          {filteredSemesters.map((sem, index) => (
            <div
              key={sem.semesterId || index}
              className={styles.itemCard}
              onClick={() => handleSemesterClick(sem)}
            >
              <div className={styles.itemContent}>
                <h3 className={styles.itemTitle}>{sem.name}</h3>

                <div className={styles.dates}>
                  <p className={styles.itemMeta}>
                    <span className={styles.startDate}>Start:</span>{" "}
                    {formatDate(sem.startDate)}
                  </p>

                  <p className={styles.itemMeta}>
                    <span className={styles.endDate}>End:</span>{" "}
                    {formatDate(sem.endDate)}
                  </p>
                </div>
              </div>

              <span className={styles.viewThesis}>
                View Theses <ArrowForward />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
