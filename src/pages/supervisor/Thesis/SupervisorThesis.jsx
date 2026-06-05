import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import taskStyles from "../Tasks/SupervisorTasks.module.css";
import thesisStyles from "./SupervisorThesis.module.css";
import {
  Add,
  Search,
  People,
  MenuBook,
  VisibilityOutlined,
  AttachFile,
} from "@mui/icons-material";

export default function SupervisorThesis() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]); // لتخزين الجروباات
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false); // اذا المودال مفتوح ام لا
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [thesisFile, setThesisFile] = useState(null);
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);

    try {
      const res = await api.get("/Group/groups-supervisor");
      setGroups(res.data?.groups || []);
    } catch (err) {
      console.error("Error fetching supervisor groups:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.groupName?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreateThesis = (groupId) => {
    setSelectedGroupId(groupId);
    setThesisFile(null);
    setDeadline("");
    setShowCreateModal(true);
  };
  const closeCreateModal = () => {
    setShowCreateModal(false);
    setSelectedGroupId(null);
    setThesisFile(null);
    setDeadline("");
    setErrorMessage("");
  };

  const handleSubmitThesis = async (e) => {
    e.preventDefault();

    if (!thesisFile && !deadline) {
      setErrorMessage("Thesis file and deadline are required.");
      return;
    }

    if (!thesisFile) {
      setErrorMessage("Thesis file is required.");
      return;
    }

    if (!deadline) {
      setErrorMessage("Deadline is required.");
      return;
    }

    const formData = new FormData();
    formData.append("ThesisFile", thesisFile);
    formData.append("DeadLine", `${deadline}:00`);

    setSubmitting(true);

    try {
      await api.post(
        `/Thesis/create-thesis/group-Id/${selectedGroupId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      await fetchGroups();
      closeCreateModal();
    } catch (err) {
      console.error("Error creating thesis:", err);
      setErrorMessage("Failed to create thesis. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewThesis = (groupId) => {
    navigate(`/supervisor/thesis/${groupId}`);
  };

  if (loading) {
    return <div className={taskStyles.loading}>Loading...</div>;
  }

  return (
    <div className={taskStyles.page}>
      <div className={taskStyles.pageHeader}>
        <div>
          <h1 className={taskStyles.pageTitle}>Thesis</h1>
          <p className={taskStyles.pageSubtitle}>
            Manage thesis files for your groups
          </p>
        </div>
      </div>

      <div className={taskStyles.filtersBox}>
        <div className={taskStyles.searchWrapper}>
          <Search className={taskStyles.searchIcon} fontSize="small" />

          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            // للبحث
            onChange={(e) => setSearch(e.target.value)}
            className={taskStyles.searchInput}
          />
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div className={taskStyles.emptyBox}>
          <MenuBook
            style={{
              fontSize: 48,
              color: "#ddd",
            }}
          />

          <p>No groups found.</p>
        </div>
      ) : (
        <div className={taskStyles.groupsList}>
          {filteredGroups.map((g) => (
            <div key={g.groupId} className={taskStyles.groupSection}>
              <div
                className={`${taskStyles.groupRow} ${thesisStyles.thesisGroupRow}`}
              >
                <div
                  className={`${taskStyles.groupLeft} ${thesisStyles.thesisGroupLeft}`}
                >
                  <div className={taskStyles.groupAvatar}>
                    <People style={{ fontSize: 18, color: "#C0441A" }} />
                  </div>

                  <div className={thesisStyles.thesisGroupText}>
                    <h3 className={taskStyles.groupName}>{g.groupName}</h3>
                    <p className={taskStyles.groupProject}>{g.projectName}</p>
                  </div>
                </div>

               <div className={`${taskStyles.groupRight} ${thesisStyles.thesisGroupRight}`}>
                  <button
                    className={thesisStyles.createThesisBtn}
                    onClick={() => handleCreateThesis(g.groupId)}
                  >
                    <Add fontSize="small" />
                    Create Thesis
                  </button>

                  <button
                    className={thesisStyles.viewThesisBtn}
                    onClick={() => handleViewThesis(g.groupId)}
                  >
                    <VisibilityOutlined fontSize="small" />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showCreateModal && (
        <div className={thesisStyles.modalOverlay}>
          <div className={thesisStyles.modalBox}>
            <div className={thesisStyles.modalHeader}>
              <h2>Create Thesis</h2>

              <button
                type="button"
                className={thesisStyles.closeBtn}
                onClick={closeCreateModal}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmitThesis}
              className={thesisStyles.modalForm}
            >
              {errorMessage && (
                <div className={thesisStyles.errorMessage}>{errorMessage}</div>
              )}
              <div className={thesisStyles.formGroup}>
                <label>
                  Thesis File <span className={thesisStyles.star}>*</span>
                </label>

                <label className={thesisStyles.uploadBox}>
                  <input
                    type="file"
                    accept=".pdf"
                    hidden
                    onChange={(e) => setThesisFile(e.target.files[0])}
                  />

                  <AttachFile
                    fontSize="small"
                    className={thesisStyles.uploadIcon}
                  />
                  <span className={thesisStyles.uploadThesisFile}>
                    {thesisFile ? thesisFile.name : "Upload Thesis File"}
                  </span>
                </label>
              </div>

              <div className={thesisStyles.formGroup}>
                <label>
                  Deadline <span className={thesisStyles.star}>*</span>
                </label>

                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`${thesisStyles.input} ${thesisStyles.dateInput}`}
                />
              </div>

              <div className={thesisStyles.modalActions}>
                <button
                  type="button"
                  className={thesisStyles.cancelBtn}
                  onClick={closeCreateModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={thesisStyles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Thesis"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
