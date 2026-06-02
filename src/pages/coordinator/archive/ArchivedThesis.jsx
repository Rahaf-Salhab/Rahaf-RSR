import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { DescriptionOutlined, Search } from "@mui/icons-material";
import axiosInstance from "../../../api/axiosInstance";
import AlertMessage from "../../../components/AlertMessage/AlertMessage";
import styles from "./ArchiveSemesters.module.css";

export default function ArchivedThesis() {
  const { semesterId } = useParams();
  const location = useLocation();
  const [semester, setSemester] = useState(location.state?.semester || null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [publishingVersionId, setPublishingVersionId] = useState(null);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState("");
  const [publishErrorMessage, setPublishErrorMessage] = useState("");

  const fetchFrozenTheses = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axiosInstance.get("/Thesis/projects-archive");

      const archiveData = Array.isArray(res.data)
        ? res.data
        : res.data?.projects || [];

      const selectedSemester =
        archiveData.find((sem) => sem.semesterId === semesterId) ||
        archiveData.find(
          (sem) =>
            sem.name === semester?.name &&
            Array.isArray(sem.projects) &&
            sem.projects.length > 0,
        ) ||
        archiveData.find((sem) => sem.name === semester?.name);

      if (!selectedSemester || selectedSemester.projects?.length === 0) {
        setProjects([]);
        setError("No frozen theses found for this semester");
        return;
      }

      setSemester((prev) => prev || selectedSemester);
      setProjects(selectedSemester.projects || []);
    } catch {
      setError("Failed to load frozen theses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrozenTheses();
  }, [semesterId]);

  const handlePublishThesis = async (versionId) => {
    if (!versionId) return;

    try {
      setPublishingVersionId(versionId);
      setPublishSuccessMessage("");
      setPublishErrorMessage("");

      await axiosInstance.post(`/Thesis/publish-thesis/versionId/${versionId}`);

      setPublishSuccessMessage("Thesis published successfully.");
      await fetchFrozenTheses();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data ||
        "Failed to publish thesis.";

      setPublishErrorMessage(backendMessage);
    } finally {
      setPublishingVersionId(null);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const projectName = project.projectName || "";
      const projectIdea = project.projectIdea || "";

      return (
        projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projectIdea.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [projects, searchTerm]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        {semester?.name ? `${semester.name} Theses` : "Archived Theses"}
      </h1>

      <p className={styles.subtitle}>
        View frozen thesis versions for this semester
      </p>

      <div className={styles.searchBox}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} fontSize="small" />
          <input
            type="text"
            placeholder="Search by project name or idea..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Frozen Theses</h2>
        </div>

        <AlertMessage type="success" message={publishSuccessMessage} />
        <AlertMessage type="error" message={publishErrorMessage} />

        {loading && <p className={styles.infoText}>Loading theses...</p>}
        {error && !loading && <p className={styles.error}>{error}</p>}

        {!loading && !error && filteredProjects.length === 0 && (
          <p className={styles.infoText}>No theses found in this semester.</p>
        )}

        <div className={styles.list}>
          {filteredProjects.map((project) => (
            <div
              key={project.thesisVersionId}
              className={styles.thesisArchiveCard}
            >
              <div className={styles.thesisLeft}>
                <div className={styles.fileIcon}>
                  <DescriptionOutlined fontSize="small" />
                </div>

                <div className={styles.thesisInfo}>
                  <h3 className={styles.itemTitle}>
                    {project.projectName || "Unnamed Project"}
                  </h3>

                  <p className={styles.projectIdea}>
                    <span>Project Idea:</span>{" "}
                    {project.projectIdea || "No project idea available"}
                  </p>

                  <div className={styles.thesisDetails}>
                    {project.publishedAt && (
                      <p>
                        <span>Published At:</span>{" "}
                        {new Date(project.publishedAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.archiveActions}>
                {project.thesisFile ? (
                  <a
                    href={project.thesisFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.viewThesis}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open Thesis
                  </a>
                ) : (
                  <span className={styles.noFile}>No file</span>
                )}

                {!project.publishedAt ? (
                  <button
                    type="button"
                    className={styles.publishBtn}
                    onClick={() => handlePublishThesis(project.thesisVersionId)}
                    disabled={publishingVersionId === project.thesisVersionId}
                  >
                    {publishingVersionId === project.thesisVersionId
                      ? "Publishing..."
                      : "Publish"}
                  </button>
                ) : (
                  <span className={styles.publishedBadge}>Published</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
