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
  // للتحكم بفتح وإغلاق فورم إضافة تسليم جديد
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  // لتخزين الملف الذي يختاره الطالب عند التسليم الجديد
  const [submitFile, setSubmitFile] = useState(null);

  // لتخزين ملاحظات الطالب في التسليم الجديد
  const [studentNotes, setStudentNotes] = useState("");

  // لمعرفة إذا كانت عملية الإرسال شغالة، حتى نعطل الزر ونظهر Loading
  const [submitting, setSubmitting] = useState(false);

  // لتخزين رسالة الخطأ الخاصة بإضافة تسليم جديد
  const [submitError, setSubmitError] = useState("");

  // لمعرفة إذا كانت عملية الحذف شغالة
  const [deleting, setDeleting] = useState(false);

  // لتخزين رسالة الخطأ الخاصة بالحذف
  const [deleteError, setDeleteError] = useState("");

  // للتحكم بفتح وإغلاق نافذة تأكيد الحذف
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // للتحكم بفتح وإغلاق فورم تعديل التسليم
  const [showEditForm, setShowEditForm] = useState(startInEditMode);

  // لتخزين الملف الجديد إذا اختاره الطالب أثناء التعديل
  const [editFile, setEditFile] = useState(null);

  // لتخزين الملاحظات أثناء التعديل، ونبدأها بالملاحظات القديمة إن وجدت
  const [editNotes, setEditNotes] = useState(submission?.studentNotes || "");

  // لمعرفة إذا كانت عملية التعديل شغالة
  const [updating, setUpdating] = useState(false);

  // لتخزين رسالة الخطأ الخاصة بالتعديل
  const [updateError, setUpdateError] = useState("");

  // للتحكم بعرض الملف الحالي داخل فورم التعديل
  const [showCurrentFile, setShowCurrentFile] = useState(true);

  // إغلاق فورم الإضافة وتنظيف القيم
  const closeSubmitModal = () => {
    setShowSubmitForm(false);
    setSubmitFile(null);
    setStudentNotes("");
    setSubmitError("");
  };

  // تنظيف فورم التعديل بدون استدعاء onEditCancel
  // نستخدمها بعد نجاح التعديل حتى لا يعتبرها النظام Cancel
  const resetEditForm = () => {
    setShowEditForm(false);
    setEditFile(null);
    setShowCurrentFile(true);
    setEditNotes(submission?.studentNotes || "");
    setUpdateError("");
  };

  // إغلاق فورم التعديل عند الضغط على Cancel أو X
  const closeEditModal = () => {
    resetEditForm();
    onEditCancel?.();
  };

  // إرسال تسليم جديد للباك
  const handleSubmitTask = async (e) => {
    e.preventDefault();

    // لا نسمح بالإرسال بدون ملف
    if (!submitFile) {
      setSubmitError("Please select a file.");
      return;
    }

    // taskId ضروري لأنه يحدد لأي task سيتم إرسال التسليم
    if (!task?.taskId) {
      setSubmitError("Task id is missing.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      // نستخدم FormData لأن الطلب يحتوي على ملف
      const formData = new FormData();

      // اسم الحقل لازم يطابق الاسم المتوقع من الباك
      formData.append("TaskSubmission", submitFile);
      formData.append("StudentNotes", studentNotes);

      await api.post(
        `/TaskSubmission/tasks/${task.taskId}/submissions`,
        formData,
      );

      // بعد نجاح الإرسال نغلق الفورم ونحدث تفاصيل التاسك
      closeSubmitModal();
      refreshTaskDetails();
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Failed to submit task.");
    } finally {
      setSubmitting(false);
    }
  };

  // حذف التسليم الحالي
  const handleDeleteSubmission = async () => {
    // التأكد من وجود id الخاص بالتسليم قبل الحذف
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

      // بعد الحذف نغلق المودال ونحدث تفاصيل التاسك
      setShowDeleteModal(false);
      refreshTaskDetails();
    } catch (err) {
      setDeleteError(
        err.response?.data?.message || "Failed to delete submission.",
      );
    } finally {
      setDeleting(false);
    }
  };

  // تعديل التسليم الحالي
  const handleUpdateSubmission = async (e) => {
    e.preventDefault();

    // التأكد من وجود id الخاص بالتسليم قبل التعديل
    if (!submission?.taskSubmissionId) {
      setUpdateError("Submission id is missing.");
      return;
    }

    try {
      setUpdating(true);
      setUpdateError("");

      // نستخدم FormData لأن الطالب قد يرفع ملف جديد أثناء التعديل
      const formData = new FormData();

      // إذا اختار الطالب ملف جديد نرسله، وإذا لم يختر يبقى الملف القديم كما هو
      if (editFile) {
        formData.append("TaskSubmission", editFile);
      }

      // الملاحظات يتم إرسالها في كل الحالات سواء تغير الملف أو لا
      formData.append("StudentNotes", editNotes);

      await api.patch(
        `/TaskSubmission/submission/${submission.taskSubmissionId}`,
        formData,
      );

      // بعد نجاح التعديل نغلق الفورم ونحدث البيانات
      resetEditForm();
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

  // إذا كان يوجد submission، نعرض أزرار التعديل والحذف فقط حسب الشروط
  if (submission) {
    // لا نعرض الأزرار إلا على آخر نسخة فقط
    if (!isLatestSubmission) {
      return null;
    }

    // لا نعرض أزرار التعديل والحذف إذا كان التسليم مقيم Approved أو Rejected
    if (submission.status !== "Submitted") {
      return null;
    }

    return (
      <div className={styles.actionsAndEditWrapper}>
        {/* أزرار التعديل والحذف تظهر فقط عندما لا يكون فورم التعديل مفتوح */}
        {!showEditForm && (
          <div className={styles.submissionActions}>
            {deleteError && <p className={styles.actionError}>{deleteError}</p>}

            {/* زر تعديل التسليم */}
            <button
              type="button"
              className={styles.iconEditBtn}
              onClick={() => {
                onEditStart?.();
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

            {/* زر فتح نافذة تأكيد الحذف */}
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

        {/* مودال تعديل التسليم */}
        {showEditForm && (
          <div className={styles.modalOverlay}>
            <div className={styles.submissionModal}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Edit Submission</h3>

                {/* إغلاق فورم التعديل */}
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
                <div className={styles.formGroup}>
                  <label>Task Submission File </label>

                  {/* عرض الملف الحالي إذا لم يختر الطالب ملف جديد */}
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

                      {/* إخفاء الملف الحالي حتى يظهر input اختيار ملف جديد */}
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
                    // عرض اسم الملف الجديد الذي اختاره الطالب
                    <div className={styles.fileInputLikeBox}>
                      <div className={styles.currentFileInfo}>
                        <span className={styles.inlineFileIcon}>
                          <AttachFileIcon fontSize="small" />
                        </span>

                        <span className={styles.currentFileName}>
                          {editFile.name}
                        </span>
                      </div>

                      {/* إزالة الملف الجديد المختار والرجوع لاختيار ملف آخر */}
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
                    // اختيار ملف جديد عند التعديل
                    <input
                      type="file"
                      accept=".pdf"
                      className={styles.fileInput}
                      onChange={(e) => {
                        setEditFile(e.target.files?.[0] || null);
                        setShowCurrentFile(false);
                      }}
                    />
                  )}
                </div>

                {/* ملاحظات الطالب أثناء التعديل */}
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

                {/* أزرار إلغاء أو حفظ التعديل */}
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

        {/* مودال تأكيد حذف التسليم */}
        {showDeleteModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.confirmModal}>
              <h3>Delete Submission</h3>

              <p>Are you sure you want to delete this submission?</p>

              {deleteError && (
                <p className={styles.actionError}>{deleteError}</p>
              )}

              <div className={styles.modalActions}>
                {/* إلغاء الحذف وإغلاق المودال */}
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

                {/* تنفيذ عملية الحذف */}
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

  // إذا لا يوجد submission، نعرض زر إرسال تسليم جديد
  return (
    <div
      className={compact ? styles.compactSubmission : styles.emptySubmission}
    >
      {/* زر فتح فورم إضافة تسليم جديد */}
      <button
        type="button"
        className={styles.submitBtn}
        onClick={() => setShowSubmitForm(true)}
      >
        {submitButtonText}
      </button>

      {/* مودال إضافة تسليم جديد */}
      {showSubmitForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.submissionModal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{submitButtonText}</h3>

              {/* إغلاق فورم الإضافة */}
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
              {/* اختيار ملف التسليم */}
              <div className={styles.formGroup}>
                <label>Upload File</label>

                <input
                  type="file"
                  accept=".pdf"
                  className={styles.fileInput}
                  onChange={(e) => setSubmitFile(e.target.files?.[0] || null)}
                />
              </div>

              {/* ملاحظات الطالب، اختيارية */}
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

              {submitError && (
                <p className={styles.submitError}>{submitError}</p>
              )}

              {/* أزرار إلغاء أو إرسال التسليم */}
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