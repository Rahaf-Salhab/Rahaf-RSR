import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import styles from "./SupervisorTasks.module.css";

import {Add,Search,Edit,HourglassEmpty,CheckCircle,Close,Assignment,AttachFile,InsertDriveFile,ExpandMore,
  ExpandLess,People,} from "@mui/icons-material";

function TaskModal({
  task,groupId,onClose,onSave,loading,error,onClearError,
}) {
  const isEdit = !!task?.taskId;

  const [form, setForm] = useState({
    Title: task?.title || "",
    Description: task?.description || "",
    DeadLine: task?.deadLine?.split("T")[0] || "",
    TaskFileURL: task?.taskFileURL || "",
    SupervisorNotes: task?.supervisorNotes || "",
  });

  const [selectedFile, setSelectedFile] =useState(null);

  const [localError, setLocalError] =useState("");

  const fileInputRef = useRef(null);
  const displayError = error || localError;

  const handleChange = (
    field,
    value
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setLocalError("");
    onClearError();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedFile(file);
    handleChange(
      "TaskFileURL",
      file.name
    );
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);

    handleChange(
      "TaskFileURL",
      ""
    );

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  };
  const handleSave = () => {
    if (!form.Title.trim()) {
      setLocalError(
        "Title is required."
      );
      return;
    }
    if (!form.DeadLine) {
      setLocalError(
        "Deadline is required."
      );
      return;
    }
    setLocalError("");
    onSave(
      form,
      groupId,
      task?.taskId,
      selectedFile
    );
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEdit
              ? "Edit Task"
              : "Add Task"}
          </h3>

          <button
            className={styles.closeBtn}
            onClick={onClose}
          >
            <Close fontSize="small" />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {displayError && (
            <p className={styles.errorMsg}>
              {displayError}
            </p>
          )}

          {/* Title */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Title{" "}
              <span
                className={
                  styles.required
                }
              >
                *
              </span>
            </label>

            <input
              className={styles.input}
              value={form.Title}
              onChange={(e) =>
                handleChange(
                  "Title",
                  e.target.value
                )
              }
              placeholder="Task title..."
            />
          </div>

          {/* Description */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Description
            </label>

            <textarea
              className={styles.textarea}
              rows={3}
              value={form.Description}
              onChange={(e) =>
                handleChange(
                  "Description",
                  e.target.value
                )
              }
              placeholder="Task description..."
            />
          </div>

          {/* Deadline */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Deadline{" "}
              <span
                className={
                  styles.required
                }
              >
                *
              </span>
            </label>

            <input
              type="date"
              className={styles.input}
              value={form.DeadLine}
              onChange={(e) =>
                handleChange(
                  "DeadLine",
                  e.target.value
                )
              }
            />
          </div>

          {/* File Upload */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Task File
            </label>

            <input
              ref={fileInputRef}
              type="file"
              style={{
                display: "none",
              }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.png,.jpg,.jpeg"
              onChange={
                handleFileChange
              }
            />

            {!selectedFile &&
            !form.TaskFileURL ? (
              <button
                type="button"
                className={
                  styles.uploadBtn
                }
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                <AttachFile fontSize="small" />
                Upload File
              </button>
            ) : (
              <div
                className={
                  styles.filePreview
                }
              >
                <InsertDriveFile
                  style={{
                    color:
                      "#C0441A",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                />

                {/* FILE NAME ONLY */}
                <span
                  className={
                    styles.fileName
                  }
                >
                  {selectedFile
                    ? selectedFile.name.replace(
                        /\.[^/.]+$/,
                        ""
                      )
                    : form.TaskFileURL
                        ?.split("/")
                        .pop()
                        ?.replace(
                          /\.[^/.]+$/,
                          ""
                        )}
                </span>

                <button
                  type="button"
                  className={
                    styles.removeFileBtn
                  }
                  onClick={
                    handleRemoveFile
                  }
                >
                  <Close fontSize="small" />
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Supervisor Notes
            </label>

            <textarea
              className={styles.textarea}
              rows={2}
              value={
                form.SupervisorNotes
              }
              onChange={(e) =>
                handleChange(
                  "SupervisorNotes",
                  e.target.value
                )
              }
              placeholder="Notes..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            className={
              styles.cancelBtn
            }
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : isEdit
              ? "Save Changes"
              : "Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SupervisorTasks() {
  const navigate = useNavigate();

  const [groupsWithTasks, setGroupsWithTasks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [
    expandedGroupId,
    setExpandedGroupId,
  ] = useState(null);

  const [taskModal, setTaskModal] =
    useState(null);

  const [
    selectedGroupId,
    setSelectedGroupId,
  ] = useState(null);

  const [taskLoading, setTaskLoading] =
    useState(false);

  const [taskError, setTaskError] =
    useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      const groupsRes =
        await api.get(
          "/Group/groups-supervisor"
        );

      const groups =
        groupsRes.data?.groups || [];

      const groupsWithTasksData =
        await Promise.all(
          groups.map(async (g) => {
            try {
              const tasksRes =
                await api.get(
                  `/Task/tasks-group/${g.groupId}`
                );

              return {
                ...g,
                tasks:
                  tasksRes.data
                    ?.tasks || [],
              };
            } catch {
              return {
                ...g,
                tasks: [],
              };
            }
          })
        );

      setGroupsWithTasks(
        groupsWithTasksData
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (
    form,
    groupId,
    taskId,
    file
  ) => {
    setTaskLoading(true);

    setTaskError("");

    try {
      const formData =
        new FormData();

      formData.append(
        "Title",
        form.Title
      );

      formData.append(
        "Description",
        form.Description || ""
      );

      formData.append(
        "DeadLine",
        `${form.DeadLine}T00:00:00`
      );

      formData.append(
        "SupervisorNotes",
        form.SupervisorNotes || ""
      );

      if (file) {
        formData.append(
          "TaskFileURL",
          file
        );
      }

      if (taskId) {
        // EDIT
        await api.patch(
          `/Task/${groupId}/tasks/${taskId}`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );
      } else {
        // CREATE
        await api.post(
          `/Task/create/${groupId}`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );
      }

      await fetchData();

      setTaskModal(null);

      setSelectedGroupId(null);
    } catch (err) {
      console.error(err);

      const data =
        err.response?.data;

      if (data?.message) {
        setTaskError(
          data.message
        );
      } else if (data?.errors) {
        setTaskError(
          Object.values(
            data.errors
          )
            .flat()
            .join(" ")
        );
      } else {
        setTaskError(
          "Something went wrong."
        );
      }
    } finally {
      setTaskLoading(false);
    }
  };


  const formatDate = (d) => {
    if (!d) return "-";

    return new Date(
      d
    ).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const isOverdue = (deadline) =>
    deadline &&
    new Date(deadline) <
      new Date();

  const filteredGroups =
    groupsWithTasks.filter(
      (g) =>
        g.groupName
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        g.projectName
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  const totalTasks =
    groupsWithTasks.reduce(
      (sum, g) =>
        sum +
        (g.tasks?.length || 0),
      0
    );

  const completedTasks =
    groupsWithTasks.reduce(
      (sum, g) =>
        sum +
        (g.tasks?.filter(
          (t) =>
            t.isCompleted
        ).length || 0),
      0
    );


  if (loading) {
    return (
      <div className={styles.loading}>
        Loading...
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            Tasks
          </h1>

          <p className={styles.pageSubtitle}>
            Manage tasks for all your
            groups
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{
              background:
                "#e0f2fe",
            }}
          >
            <Assignment
              style={{
                fontSize: 20,
                color:
                  "#0369a1",
              }}
            />
          </div>

          <div>
            <p className={styles.statValue}>
              {totalTasks}
            </p>

            <p className={styles.statLabel}>
              Total Tasks
            </p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{
              background:
                "#f0fdf4",
            }}
          >
            <CheckCircle
              style={{
                fontSize: 20,
                color:
                  "#22c55e",
              }}
            />
          </div>

          <div>
            <p className={styles.statValue}>
              {completedTasks}
            </p>

            <p className={styles.statLabel}>
              Completed
            </p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{
              background:
                "#fef3e2",
            }}
          >
            <HourglassEmpty
              style={{
                fontSize: 20,
                color:
                  "#f59e0b",
              }}
            />
          </div>

          <div>
            <p className={styles.statValue}>
              {totalTasks -
                completedTasks}
            </p>

            <p className={styles.statLabel}>
              Pending
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className={styles.filtersBox}>
        <div className={styles.searchWrapper}>
          <Search
            className={styles.searchIcon}
            fontSize="small"
          />

          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Groups */}
      {filteredGroups.length === 0 ? (
        <div className={styles.emptyBox}>
          <Assignment
            style={{
              fontSize: 48,
              color: "#ddd",
            }}
          />

          <p>No groups found.</p>
        </div>
      ) : (
        <div className={styles.groupsList}>
          {filteredGroups.map((g) => {
            const isExpanded =
              expandedGroupId ===
              g.groupId;

            return (
              <div
                key={g.groupId}
                className={
                  styles.groupSection
                }
              >
                {/* Group Row */}
                <div
                  className={
                    styles.groupRow
                  }
                >
                  <div
                    className={
                      styles.groupLeft
                    }
                  >
                    <div
                      className={
                        styles.groupAvatar
                      }
                    >
                      <People
                        style={{
                          fontSize: 18,
                          color:
                            "#C0441A",
                        }}
                      />
                    </div>

                    <div>
                      <h3
                        className={
                          styles.groupName
                        }
                      >
                        {g.groupName}
                      </h3>

                      <p
                        className={
                          styles.groupProject
                        }
                      >
                        {g.projectName}
                      </p>
                    </div>
                  </div>

                  <div
                    className={
                      styles.groupRight
                    }
                  >
                    <span
                      className={
                        styles.taskCount
                      }
                    >
                      {g.tasks?.length ||
                        0}{" "}
                      tasks
                    </span>

                    {/* ADD TASK */}
                    <button
                      className={
                        styles.addTaskBtn
                      }
                      onClick={() => {
                        setTaskError(
                          ""
                        );

                        setSelectedGroupId(
                          g.groupId
                        );

                        setTaskModal({});
                      }}
                    >
                      <Add fontSize="small" />
                      Add Task
                    </button>

                    {/* DETAILS */}
                    <button
                      className={
                        styles.detailsBtn
                      }
                      onClick={() =>
                        navigate(
                          `/supervisor/groups/${g.groupId}`
                        )
                      }
                    >
                      Details
                    </button>

                    {/* EXPAND */}
                    <button
                      className={
                        styles.toggleBtn
                      }
                      onClick={() =>
                        setExpandedGroupId(
                          isExpanded
                            ? null
                            : g.groupId
                        )
                      }
                    >
                      {isExpanded ? (
                        <ExpandLess fontSize="small" />
                      ) : (
                        <ExpandMore fontSize="small" />
                      )}
                    </button>
                  </div>
                </div>

                {/* TASKS */}
                {isExpanded && (
                  <div
                    className={
                      styles.tasksContainer
                    }
                  >
                    {g.tasks?.length ===
                    0 ? (
                      <div
                        className={
                          styles.emptyTasks
                        }
                      >
                        <HourglassEmpty
                          style={{
                            fontSize: 32,
                            color:
                              "#ddd",
                          }}
                        />

                        <p>
                          No tasks yet
                          for this
                          group.
                        </p>
                      </div>
                    ) : (
                      <div
                        className={
                          styles.tasksList
                        }
                      >
                        {g.tasks.map(
                          (t, i) => (
                            <div
                              key={
                                t.taskId ||
                                i
                              }
                              className={`${styles.taskItem} ${
                                isOverdue(
                                  t.deadLine
                                ) &&
                                !t.isCompleted
                                  ? styles.taskOverdue
                                  : ""
                              }`}
                            >
                              <div
                                className={
                                  styles.taskLeft
                                }
                              >
                                <div
                                  className={
                                    styles.taskIcon
                                  }
                                >
                                  {t.isCompleted ? (
                                    <CheckCircle
                                      style={{
                                        color:
                                          "#22c55e",
                                        fontSize: 20,
                                      }}
                                    />
                                  ) : (
                                    <HourglassEmpty
                                      style={{
                                        color:
                                          "#f59e0b",
                                        fontSize: 20,
                                      }}
                                    />
                                  )}
                                </div>

                                <div>
                                  <p
                                    className={
                                      styles.taskTitle
                                    }
                                  >
                                    {
                                      t.title
                                    }
                                  </p>

                                  {t.description && (
                                    <p
                                      className={
                                        styles.taskDesc
                                      }
                                    >
                                      {
                                        t.description
                                      }
                                    </p>
                                  )}

                                  {t.supervisorNotes && (
                                    <p
                                      className={
                                        styles.taskNotes
                                      }
                                    >
                                      📝{" "}
                                      {
                                        t.supervisorNotes
                                      }
                                    </p>
                                  )}

                                  <p
                                    className={
                                      styles.taskDeadline
                                    }
                                  >
                                    Deadline:{" "}
                                    {formatDate(
                                      t.deadLine
                                    )}

                                    {isOverdue(
                                      t.deadLine
                                    ) &&
                                      !t.isCompleted && (
                                        <span
                                          className={
                                            styles.overdueBadge
                                          }
                                        >
                                          Overdue
                                        </span>
                                      )}
                                  </p>

                                  {t.taskFileURL && (
                                    <a
                                      href={
                                        t.taskFileURL
                                      }
                                      target="_blank"
                                      rel="noreferrer"
                                      className={
                                        styles.taskFile
                                      }
                                    >
                                      📎
                                      View
                                      File
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* EDIT */}
                              <button
                                className={
                                  styles.editTaskBtn
                                }
                                onClick={() => {
                                  setTaskError(
                                    ""
                                  );

                                  setSelectedGroupId(
                                    g.groupId
                                  );

                                  setTaskModal(
                                    t
                                  );
                                }}
                              >
                                <Edit fontSize="small" />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      {taskModal &&
        selectedGroupId && (
          <TaskModal
            task={taskModal}
            groupId={selectedGroupId}
            onClose={() => {
              setTaskModal(null);

              setSelectedGroupId(
                null
              );

              setTaskError("");
            }}
            onSave={handleSaveTask}
            loading={taskLoading}
            error={taskError}
            onClearError={() =>
              setTaskError("")
            }
          />
        )}
    </div>
  );
}