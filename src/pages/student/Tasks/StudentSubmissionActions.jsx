import { useState } from "react";
import api from "../../../api/axiosInstance";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import styles from "./StudentSubmissionActions.module.css";

export default function StudentSubmissionActions({
  task,
  submission,
  refreshTaskDetails,
  onEditStart,
  onEditCancel,
  onEditDone,
  startInEditMode = false,
  isLatestSubmission = true,
  submitButtonText = "Submit Task",
  compact = false,
}) {
  const [showSubmitForm, setShowSubmitForm] = useState(false); //to show the submission form when the student clicks "Submit Task" button, and hide it when they cancel or after submission
  const [submitFile, setSubmitFile] = useState(null); //to store the file that the student selects for submission
  const [studentNotes, setStudentNotes] = useState(""); //to store the notes that the student enters for the submission
  const [submitting, setSubmitting] = useState(false); //to indicate whether the submission is in progress, used to disable the submit button and show a loading state  (من خلاله بنعرف اذا عملية الارسال شغالة ام لا)
  const [submitError, setSubmitError] = useState("");
  const [deleting, setDeleting] = useState(false); //to indicate whether the deletion is in progress
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false); //to control the visibility of the delete confirmation modal
  const [showEditForm, setShowEditForm] = useState(startInEditMode); //to control the visibility of the edit form, initialized with startInEditMode prop to allow starting in edit mode if needed
  const [editFile, setEditFile] = useState(null); //to store the new file
  const [editNotes, setEditNotes] = useState(submission?.studentNotes || ""); //to store the new notes, initialized with the existing notes if available
  const [updating, setUpdating] = useState(false); //to indicate whether the update is in progress
  const [updateError, setUpdateError] = useState("");
  const [showCurrentFile, setShowCurrentFile] = useState(true); //to control whether to show the current file name in the edit form (when true) or the new selected file name (when false)
  const closeSubmitModal = () => {
    setShowSubmitForm(false);
    setSubmitFile(null);
    setStudentNotes("");
    setSubmitError("");
  };

  const closeEditModal = () => {
    setShowEditForm(false);
    setEditFile(null);
    setShowCurrentFile(true);
    setEditNotes(submission?.studentNotes || "");
    setUpdateError("");
    onEditCancel?.();
  };
  const handleSubmitTask = async (e) => {
    e.preventDefault(); //to prevent the default reload

    if (!submitFile) {
      //Submitبفحص اذا الطالب اختار ملف قبل ما يعملٍ
      setSubmitError("Please select a file.");
      return;
    }

    if (!task?.taskId) {
      //يفحص ال taskId اذا موجود قبل ما يرسل الطلب، لانه ضروري لعملية الارسال
      setSubmitError("Task id is missing.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      const formData = new FormData(); //FormData(because we need to send a file)
      formData.append("TaskSubmission", submitFile); //(TaskSubmission)ارسال ملف للباك باسم الحقل الذي يتوقعه
      formData.append("StudentNotes", studentNotes);

      await api.post(
        `/TaskSubmission/tasks/${task.taskId}/submissions`,
        formData,
      ); //FormData الي هو ال body ارسال ارابط للباك وال

      closeSubmitModal();
      refreshTaskDetails();
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Failed to submit task.");
    } finally {
      setSubmitting(false);
    }
  };

  //__________________________________Delete Action_________________________________________
  const handleDeleteSubmission = async () => {
    if (!submission?.taskSubmissionId) {
      setDeleteError("Submission id is missing.");
      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");

      await api.delete(
        `/TaskSubmission/Delete/SubmissionId/${submission.taskSubmissionId}`,
      );
      setShowDeleteModal(false);
      refreshTaskDetails(); //بعد الحذف بنحدث تفاصيل المهمة لنعكس التغيير
    } catch (err) {
      setDeleteError(
        err.response?.data?.message || "Failed to delete submission.",
      );
    } finally {
      setDeleting(false);
    }
  };

  //__________________________________Edit Action_________________________________________
  const handleUpdateSubmission = async (e) => {
    e.preventDefault();

    if (!submission?.taskSubmissionId) {
      //نتأكد من وجود ال submissionId قبل محاولة التحديث، لانه ضروري لعملية التحديث
      setUpdateError("Submission id is missing.");
      return;
    }
    try {
      setUpdating(true);
      setUpdateError("");
      const formData = new FormData();
      if (editFile) {
        formData.append("TaskSubmission", editFile);
      } //اذا الطالب اختار ملف جديد للتعديل بنضيفه لل formData اما اذا ما اختار بنترك الملف القديم بدون تغيير
      formData.append("StudentNotes", editNotes);
      await api.patch(
        `/TaskSubmission/submission/${submission.taskSubmissionId}`,
        formData,
      );
      closeEditModal();
      refreshTaskDetails();
      onEditDone?.();
    } catch (err) {
      setUpdateError(
        err.response?.data?.message || "Failed to update submission.",
      );
    } finally {
      setUpdating(false);
    }
  };
  //اذا في تسليم موجود بنعرض خيارات الحذف، اذا ما في بنعرض زر الارسال (استدعاء)
  if (submission) {
    if (!isLatestSubmission) {
      //
      return null;
    }
    // ما بنعرض ازرار الحذف والتعديلSubmitted  هون اذا حالته مش
    if (submission.status !== "Submitted") {
      return null;
    }
    //اذا التسليم موجود وما تم مراجعته بنعرض زر الحذف
    return (
      <div className={styles.actionsAndEditWrapper}>
        {!showEditForm && (
          <div className={styles.submissionActions}>
            {deleteError && <p className={styles.actionError}>{deleteError}</p>}

            <button
              type="button"
              className={styles.iconEditBtn}
              onClick={() => {
                setShowEditForm(true);
                setEditNotes(submission?.studentNotes || "");
                setEditFile(null);
                setShowCurrentFile(true);
                setUpdateError("");
              }}
              disabled={deleting || updating}
              title="Edit Submission"
            >
              <EditIcon fontSize="small" />
            </button>

            <button
              type="button"
              className={styles.iconDeleteBtn}
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              title="Delete Submission"
            >
              <DeleteIcon fontSize="small" />
            </button>
          </div>
        )}

        {/* Edit Submission Form */}
        {showEditForm && (
          <div className={styles.modalOverlay}>
            <div className={styles.submissionModal}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Edit Submission</h3>

                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={closeEditModal}
                  disabled={updating}
                >
                  ×
                </button>
              </div>
              <form
                className={styles.submitForm}
                onSubmit={handleUpdateSubmission}
              >
                {/*نموذج تعديل التسليم، مشابه لنموذج الارسال */}
                <div className={styles.formGroup}>
                  <label>
                    Task Submission File{" "}
                    <span className={styles.optionalText}></span>
                  </label>

                  {showCurrentFile &&
                  !editFile &&
                  submission.taskSubmissionURL ? (
                    <div className={styles.fileInputLikeBox}>
                      <div className={styles.currentFileInfo}>
                        <span className={styles.inlineFileIcon}>
                          <AttachFileIcon fontSize="small" />
                        </span>
                        <span className={styles.currentFileName}>
                          {submission.taskSubmissionURL.split("/").pop()}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={styles.clearFileBtn}
                        onClick={() => {
                          setShowCurrentFile(false);
                          setEditFile(null);
                        }}
                        title="Change file"
                      >
                        ×
                      </button>
                    </div>
                  ) : editFile ? (
                    <div className={styles.fileInputLikeBox}>
                      <div className={styles.currentFileInfo}>
                        <span className={styles.inlineFileIcon}>
                          <AttachFileIcon fontSize="small" />
                        </span>

                        <span className={styles.currentFileName}>
                          {editFile.name}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={styles.clearFileBtn}
                        onClick={() => {
                          setEditFile(null);
                          setShowCurrentFile(false);
                        }}
                        title="Choose another file"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept=".pdf"
                      className={styles.fileInput}
                      onChange={(e) => {
                        setEditFile(e.target.files[0]);
                        setShowCurrentFile(false);
                      }}
                    />
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Student Notes{" "}
                    <span className={styles.optionalText}>(Optional)</span>
                  </label>

                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Write your notes..."
                    className={styles.notesTextarea}
                  />
                </div>

                {updateError && (
                  <p className={styles.submitError}>{updateError}</p>
                )}
                {/*  cancel button */}
                <div className={styles.submitActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={closeEditModal}
                    disabled={updating}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={updating}
                  >
                    {updating ? "Updating..." : "Update"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.confirmModal}>
              <h3>Delete Submission</h3>

              <p>Are you sure you want to delete this submission?</p>

              {deleteError && (
                <p className={styles.actionError}>{deleteError}</p>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteError("");
                  }}
                  disabled={deleting}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className={styles.modalDeleteBtn}
                  onClick={handleDeleteSubmission}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

 //اذا ما في تسليم بنعرض زر الارسال
return (
  <div className={compact ? styles.compactSubmission : styles.emptySubmission}>
    <button
      type="button"
      className={styles.submitBtn}
      onClick={() => setShowSubmitForm(true)}
    >
      {submitButtonText}
    </button>

    {showSubmitForm && (
      <div className={styles.modalOverlay}>
        <div className={styles.submissionModal}>
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>{submitButtonText}</h3>

            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={closeSubmitModal}
              disabled={submitting}
            >
              ×
            </button>
          </div>

          <form className={styles.submitForm} onSubmit={handleSubmitTask}>
            <div className={styles.formGroup}>
              <label>Upload File</label>

              <input
                type="file"
                accept=".pdf"
                className={styles.fileInput}
                onChange={(e) => setSubmitFile(e.target.files[0])}
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                Student Notes{" "}
                <span className={styles.optionalText}>(Optional)</span>
              </label>

              <textarea
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="Write your notes..."
                className={styles.notesTextarea}
              />
            </div>

            {submitError && <p className={styles.submitError}>{submitError}</p>}

            <div className={styles.submitActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={closeSubmitModal}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
}