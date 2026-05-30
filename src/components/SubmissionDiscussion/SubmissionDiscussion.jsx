import { useMemo, useRef, useState } from "react";
import api from "../../api/axiosInstance";
import SendIcon from "@mui/icons-material/Send";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ReplyIcon from "@mui/icons-material/Reply";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import styles from "./SubmissionDiscussion.module.css";

export default function SubmissionDiscussion({
  submission, // بيانات التسليم، وداخلها التعليقات الخاصة بهذا التسليم
  formatDate, // دالة لتنسيق التاريخ قبل عرضه
  currentRole = "Student", // الدور الحالي للمستخدم، والقيمة الافتراضية طالب
}) {
  // نص الرد أو التعليق الذي يكتبه المستخدم
  const [replyText, setReplyText] = useState("");

  // ردود تمت إضافتها محليًا بعد الإرسال، حتى تظهر مباشرة بدون refresh
  const [localReplies, setLocalReplies] = useState([]);

  // للتحكم بإظهار أو إخفاء صندوق النقاش
  const [isOpen, setIsOpen] = useState(false);

  // لمعرفة هل يتم إرسال الرد حاليًا أم لا
  const [sending, setSending] = useState(false);

  // لتخزين رسالة الخطأ الخاصة بالإرسال أو التعديل
  const [replyError, setReplyError] = useState("");

  // التعليق الذي يقوم المستخدم بالرد عليه حاليًا
  const [replyingToComment, setReplyingToComment] = useState(null);

  // قائمة IDs للتعليقات المحذوفة حتى نخفيها من الواجهة مباشرة
  const [deletedCommentIds, setDeletedCommentIds] = useState([]);

  // ID التعليق الذي يتم حذفه حاليًا
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  // التعليق الذي يتم تعديله حاليًا
  const [editingComment, setEditingComment] = useState(null);

  // ID التعليق الذي يتم تحديثه حاليًا
  const [updatingCommentId, setUpdatingCommentId] = useState(null);

  // تخزين محتوى التعليقات المعدلة محليًا حسب ID التعليق
  const [editedCommentContents, setEditedCommentContents] = useState({});

  // التعليق المراد حذفه، ويتم استخدامه لإظهار modal التأكيد
  const [commentToDelete, setCommentToDelete] = useState(null);

  // رسالة الخطأ الخاصة بالحذف
  const [deleteError, setDeleteError] = useState("");

  // ref لصندوق النقاش حتى نعمل scroll عليه عند فتح النقاش
  const discussionBoxRef = useRef(null);

  // ref لصندوق كتابة الرد حتى نعمل scroll له عند الرد أو التعديل
  const replyComposerRef = useRef(null);

  // ref للـ textarea حتى نعمل focus عند التعديل
  const replyTextareaRef = useRef(null);

  // دالة موحدة لإرجاع ID التعليق
  const getCommentId = (comment) => {
    return comment?.taskSubmissionCommentId;
  };

  // تحديد الدور الذي سيظهر على التعليق
  const getDisplayRole = (comment) => {
    const role = comment.role?.trim()?.toLowerCase();

    if (role === "student") return "Student";
    if (role === "supervisor") return "Supervisor";

    // إذا التعليق الأساسي لا يحتوي parentCommentId نعتبره من المشرف
    if (!comment.parentCommentId) return "Supervisor";

    // غير ذلك نعتبره من الطالب
    return "Student";
  };

  // تجهيز الاسم المعروض، وإذا كان مشرف نضيف Dr. إذا غير موجودة
  const getDisplayName = (comment) => {
    const name = comment.userName || getDisplayRole(comment);

    if (getDisplayRole(comment) === "Supervisor") {
      return name.startsWith("Dr.") ? name : `Dr. ${name}`;
    }

    return name;
  };

  // فحص هل التعليق لطالب أم لا
  const isStudentComment = (comment) => {
    return getDisplayRole(comment) === "Student";
  };

  // يسمح بالرد فقط على تعليق الطرف الآخر
  const canReplyToComment = (comment) => {
    return getDisplayRole(comment) !== currentRole;
  };

  // يسمح بالحذف فقط إذا التعليق تابع لنفس دور المستخدم الحالي
  const canDeleteComment = (comment) => {
    return getDisplayRole(comment) === currentRole;
  };

  // يسمح بالتعديل فقط إذا التعليق تابع لنفس دور المستخدم الحالي
  const canEditComment = (comment) => {
    return getDisplayRole(comment) === currentRole;
  };

  // دمج تعليقات الباك مع الردود المحلية، مع حذف المكرر وإخفاء المحذوف
  const allComments = useMemo(() => {
    const backendComments = submission.taskSubmissionComments || [];

    const commentsMap = new Map();

    // إضافة تعليقات الباك إلى map حسب ID التعليق
    backendComments.forEach((comment) => {
      const commentId = getCommentId(comment);

      // إذا التعليق بدون ID أو تم حذفه محليًا لا نعرضه
      if (!commentId || deletedCommentIds.includes(commentId)) return;

      commentsMap.set(commentId, comment);
    });

    // إضافة الردود المحلية إذا لم تكن موجودة مسبقًا من الباك
    localReplies.forEach((comment) => {
      const commentId = getCommentId(comment);

      // إذا الرد بدون ID أو تم حذفه محليًا لا نعرضه
      if (!commentId || deletedCommentIds.includes(commentId)) return;

      // منع تكرار الرد إذا رجع لاحقًا من الباك
      if (!commentsMap.has(commentId)) {
        commentsMap.set(commentId, comment);
      }
    });

    return (
      Array.from(commentsMap.values())
        .map((comment) => {
          const commentId = getCommentId(comment);

          return {
            ...comment,

            // إذا تم تعديل التعليق محليًا نعرض النسخة المعدلة
            content: editedCommentContents[commentId] ?? comment.content,
          };
        })

        // ترتيب التعليقات حسب تاريخ الإنشاء من الأقدم للأحدث
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    );
  }, [
    submission.taskSubmissionComments,
    localReplies,
    deletedCommentIds,
    editedCommentContents,
  ]);

  // عدد الرسائل الظاهرة في النقاش
  const totalMessages = allComments.length;

  // أول تعليق بدون parentCommentId نعتبره التعليق الأساسي
  const rootComment =
    allComments.find((comment) => !comment.parentCommentId) || null;

  // ID التعليق الأساسي
  const rootCommentId = rootComment ? getCommentId(rootComment) : null;

  // تحويل التعليقات إلى object للوصول السريع للتعليق من خلال ID
  const commentsById = useMemo(() => {
    const map = {};

    allComments.forEach((comment) => {
      map[getCommentId(comment)] = comment;
    });

    return map;
  }, [allComments]);

  // فتح أو إغلاق النقاش
  const handleToggleDiscussion = () => {
    const nextOpenState = !isOpen;
    setIsOpen(nextOpenState);

    // عند فتح النقاش، ننزل تلقائيًا على صندوق النقاش
    if (nextOpenState) {
      setTimeout(() => {
        discussionBoxRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  // بدء الرد على تعليق معين
  const handleStartReply = (comment) => {
    setReplyingToComment(comment);
    setReplyText("");
    setReplyError("");

    // الانتقال إلى صندوق كتابة الرد
    setTimeout(() => {
      replyComposerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  // إلغاء الرد الحالي
  const handleCancelReply = () => {
    setReplyingToComment(null);
    setReplyText("");
    setReplyError("");
  };

  // إرسال رد جديد
  const handleSendReply = async () => {
    // منع إرسال رد فارغ
    if (!replyText.trim()) return;

    // إذا كان المستخدم يرد على تعليق معين نستخدم ID هذا التعليق
    const selectedParentId = replyingToComment?.taskSubmissionCommentId;

    // إذا لم يحدد تعليق معين، نستخدم التعليق الأساسي كـ parent
    const defaultParentId = rootComment?.taskSubmissionCommentId;

    const parentCommentId = selectedParentId || defaultParentId;

    // إذا لم يوجد parentCommentId لا نستطيع إرسال الرد
    if (!parentCommentId) {
      setReplyError("Cannot find the parent comment id.");
      return;
    }

    try {
      setSending(true);
      setReplyError("");

      // إرسال الرد للباك
      const res = await api.post(
        `/TaskSubmission/reply-to-comment/parentCommentId/${parentCommentId}`,
        {
          content: replyText.trim(),
        },
      );

      const savedComment = res.data;

      // تجهيز التعليق الجديد بالشكل المستخدم في الواجهة
      const newReply = {
        taskSubmissionCommentId: savedComment.taskSubmissionCommentId,
        parentCommentId: savedComment.parentCommentId,
        content: savedComment.content,
        userName: savedComment.userName,
        role: savedComment.role,
        createdAt: savedComment.createdAt,

        // لمعرفة أن هذا الرد تم عمله على تعليق محدد وليس فقط على التعليق الأساسي
        isExplicitReply: Boolean(replyingToComment),
      };

      // إذا لم يرجع الباك ID للتعليق، نعرض خطأ
      if (!newReply.taskSubmissionCommentId) {
        setReplyError(
          "Reply was added, but the response did not include comment id.",
        );
        return;
      }

      // إضافة الرد محليًا مع منع التكرار
      setLocalReplies((prev) => {
        const alreadyExists = prev.some(
          (reply) => getCommentId(reply) === getCommentId(newReply),
        );

        if (alreadyExists) return prev;

        return [...prev, newReply];
      });

      // تفريغ صندوق الكتابة بعد الإرسال
      setReplyText("");
      setReplyingToComment(null);
    } catch (err) {
      // عرض رسالة الخطأ القادمة من الباك، أو رسالة عامة
      setReplyError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          "Failed to send reply.",
      );
    } finally {
      setSending(false);
    }
  };

  // فتح نافذة تأكيد الحذف
  const openDeleteModal = (comment) => {
    setCommentToDelete(comment);
    setDeleteError("");
    setReplyError("");
  };

  // إغلاق نافذة تأكيد الحذف
  const closeDeleteModal = () => {
    setCommentToDelete(null);
    setDeleteError("");
  };

  // حذف تعليق
  const handleDeleteComment = async () => {
    if (!commentToDelete) return;

    const commentId = getCommentId(commentToDelete);

    if (!commentId) return;

    // إذا التعليق محلي فقط، نحذفه من local state بدون طلب API
    if (commentToDelete.isLocalOnly || String(commentId).startsWith("local-")) {
      setLocalReplies((prev) =>
        prev.filter((reply) => getCommentId(reply) !== commentId),
      );

      setCommentToDelete(null);
      return;
    }

    try {
      setDeletingCommentId(commentId);

      // حذف التعليق من الباك
      await api.delete(`/TaskSubmission/delete-comment/commentId/${commentId}`);

      // إضافة ID التعليق إلى قائمة المحذوفين حتى يختفي مباشرة من الواجهة
      setDeletedCommentIds((prev) =>
        prev.includes(commentId) ? prev : [...prev, commentId],
      );

      // حذف التعليق من الردود المحلية إذا كان موجودًا
      setLocalReplies((prev) =>
        prev.filter((reply) => getCommentId(reply) !== commentId),
      );

      // حذف أي نسخة معدلة محفوظة لهذا التعليق
      setEditedCommentContents((prev) => {
        const copy = { ...prev };
        delete copy[commentId];
        return copy;
      });

      // إذا كان المستخدم يرد على نفس التعليق المحذوف نلغي الرد
      if (replyingToComment && getCommentId(replyingToComment) === commentId) {
        setReplyingToComment(null);
        setReplyText("");
      }

      // إذا كان المستخدم يعدل نفس التعليق المحذوف نلغي التعديل
      if (editingComment && getCommentId(editingComment) === commentId) {
        setEditingComment(null);
        setReplyText("");
      }

      setCommentToDelete(null);
    } catch (err) {
      // عرض خطأ الحذف
      setDeleteError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          "Failed to delete comment.",
      );
    } finally {
      setDeletingCommentId(null);
    }
  };

  // بدء تعديل تعليق
  const handleStartEdit = (comment) => {
    setEditingComment(comment);
    setReplyingToComment(null);
    setReplyText(comment.content || "");
    setReplyError("");

    // الانتقال إلى صندوق الكتابة والتركيز على textarea
    setTimeout(() => {
      replyComposerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      replyTextareaRef.current?.focus();
    }, 100);
  };

  // إلغاء الرد أو التعديل
  const handleCancelComposer = () => {
    setEditingComment(null);
    setReplyingToComment(null);
    setReplyText("");
    setReplyError("");
  };

  // حفظ تعديل التعليق
  const handleUpdateComment = async () => {
    if (!editingComment) return;

    const commentId = getCommentId(editingComment);

    if (!commentId) return;

    // منع حفظ تعليق فارغ
    if (!replyText.trim()) {
      setReplyError("Comment cannot be empty.");
      return;
    }

    try {
      setUpdatingCommentId(commentId);
      setReplyError("");

      // إرسال التعديل للباك
      const res = await api.put(
        `/TaskSubmission/update-comment/commentId/${commentId}`,
        {
          Content: replyText.trim(),
        },
      );

      // أخذ المحتوى المحدث من الاستجابة، مع fallback للنص المكتوب
      const updatedContent =
        res.data?.content ||
        res.data?.Content ||
        res.data?.updatedComment?.content ||
        replyText.trim();

      // تحديث المحتوى محليًا حتى يظهر مباشرة بدون refresh
      setEditedCommentContents((prev) => ({
        ...prev,
        [commentId]: updatedContent,
      }));

      // إذا التعليق موجود ضمن localReplies نحدثه هناك أيضًا
      setLocalReplies((prev) =>
        prev.map((reply) =>
          getCommentId(reply) === commentId
            ? { ...reply, content: updatedContent }
            : reply,
        ),
      );

      // إنهاء وضع التعديل
      setEditingComment(null);
      setReplyText("");
    } catch (err) {
      // عرض خطأ التعديل
      setReplyError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          "Failed to update comment.",
      );
    } finally {
      setUpdatingCommentId(null);
    }
  };

  // رسم تعليق واحد داخل النقاش
  const renderComment = (comment) => {
    const isStudent = isStudentComment(comment);
    const displayRole = getDisplayRole(comment);

    return (
      <div key={getCommentId(comment)} className={styles.commentThread}>
        <div
          className={`${styles.messageBubble} ${
            isStudent ? styles.studentMessage : styles.supervisorMessage
          }`}
        >
          <div className={styles.messageHeader}>
            <span>{displayRole}</span>

            <small>
              {getDisplayName(comment)} • {formatDate(comment.createdAt)}
            </small>
          </div>

          {/* عرض preview للتعليق الذي تم الرد عليه */}
          {comment.parentCommentId &&
            commentsById[comment.parentCommentId] &&
            (comment.isExplicitReply ||
              comment.parentCommentId !== rootCommentId) && (
              <div className={styles.repliedToPreview}>
                <div className={styles.repliedToHeader}>
                  <ReplyIcon
                    className={styles.repliedToIcon}
                    fontSize="small"
                  />

                  <span>
                    Replied to{" "}
                    <strong>
                      {getDisplayName(commentsById[comment.parentCommentId])}
                    </strong>
                  </span>
                </div>

                <div className={styles.repliedToContent}>
                  {commentsById[comment.parentCommentId].content}
                </div>
              </div>
            )}

          <div className={styles.commentBodyRow}>
            <p>{comment.content}</p>

            <div className={styles.commentRightActions}>
              {/* زر التعديل يظهر فقط لصاحب التعليق حسب الدور */}
              {canEditComment(comment) && (
                <button
                  type="button"
                  className={styles.editCommentBtn}
                  onClick={() => handleStartEdit(comment)}
                  title="Edit comment"
                >
                  <EditOutlinedIcon fontSize="small" />
                </button>
              )}

              {/* زر الحذف يظهر فقط لصاحب التعليق حسب الدور */}
              {canDeleteComment(comment) && (
                <button
                  type="button"
                  className={styles.deleteCommentBtn}
                  onClick={() => openDeleteModal(comment)}
                  disabled={deletingCommentId === getCommentId(comment)}
                  title="Delete comment"
                >
                  <DeleteOutlineIcon fontSize="small" />
                </button>
              )}
            </div>
          </div>

          <div className={styles.commentActions}>
            {/* زر الرد يظهر فقط إذا التعليق من الطرف الآخر */}
            {canReplyToComment(comment) && (
              <button
                type="button"
                className={styles.replyLink}
                onClick={() => handleStartReply(comment)}
              >
                <ReplyIcon className={styles.replyLinkIcon} fontSize="small" />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.discussionWrapper}>
      {/* زر فتح وإغلاق النقاش */}
      <button
        type="button"
        className={styles.discussionToggle}
        onClick={handleToggleDiscussion}
      >
        <span className={styles.toggleText}>
          {isOpen ? "Hide discussion" : "View discussion"}
        </span>

        <span className={styles.messageCount}>({totalMessages})</span>

        <span className={styles.arrow}>
          {isOpen ? (
            <KeyboardArrowDownIcon fontSize="small" />
          ) : (
            <KeyboardArrowRightIcon fontSize="small" />
          )}
        </span>
      </button>

      {/* محتوى النقاش يظهر فقط إذا isOpen = true */}
      {isOpen && (
        <div ref={discussionBoxRef} className={styles.discussionBox}>
          {/* عرض التعليقات إذا موجودة، أو رسالة فارغة إذا لا يوجد نقاش */}
          {allComments.length > 0 ? (
            allComments.map((comment) => renderComment(comment))
          ) : (
            <p className={styles.emptyDiscussion}>No discussion yet.</p>
          )}

          {/* صندوق كتابة الرد أو التعديل */}
          <div ref={replyComposerRef} className={styles.replyComposer}>
            {/* يظهر عند تعديل تعليق */}
            {editingComment && (
              <div className={styles.replyPreview}>
                <div className={styles.replyPreviewHeader}>
                  Editing your comment
                </div>

                <button
                  type="button"
                  className={styles.clearReplyBtn}
                  onClick={handleCancelComposer}
                >
                  Cancel edit
                </button>
              </div>
            )}

            {/* يظهر عند الرد على تعليق معين */}
            {replyingToComment && (
              <div className={styles.replyPreview}>
                <div className={styles.replyPreviewHeader}>
                  Replying to{" "}
                  <strong>{getDisplayName(replyingToComment)}</strong>
                </div>

                <p>{replyingToComment.content}</p>

                <button
                  type="button"
                  className={styles.clearReplyBtn}
                  onClick={handleCancelReply}
                >
                  Cancel
                </button>
              </div>
            )}

            <div className={styles.replyBox}>
              <textarea
                ref={replyTextareaRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  editingComment
                    ? "Edit your comment..."
                    : replyingToComment
                      ? "Write your reply..."
                      : "Write a comment..."
                }
                className={styles.replyTextarea}
              />

              {/* نفس الزر يستخدم للإرسال أو حفظ التعديل حسب الحالة */}
              <button
                type="button"
                className={styles.replyIconBtn}
                onClick={editingComment ? handleUpdateComment : handleSendReply}
                title={editingComment ? "Save edit" : "Send reply"}
                disabled={
                  sending ||
                  updatingCommentId === getCommentId(editingComment || {}) ||
                  !replyText.trim()
                }
              >
                <SendIcon fontSize="small" />
              </button>
            </div>

            {/* عرض خطأ الإرسال أو التعديل */}
            {replyError && <p className={styles.replyError}>{replyError}</p>}
          </div>
        </div>
      )}

      {/* Modal تأكيد حذف التعليق */}
      {commentToDelete && (
        <div className={styles.deleteModalOverlay}>
          <div className={styles.deleteModal}>
            <h3>Delete Comment</h3>

            <p className={styles.confirmDeleteQuestion}>
              Are you sure you want to delete this comment?
            </p>

            <div className={styles.deleteModalActions}>
              <button
                type="button"
                className={styles.cancelDeleteBtn}
                onClick={closeDeleteModal}
                disabled={deletingCommentId === getCommentId(commentToDelete)}
              >
                Cancel
              </button>

              <button
                type="button"
                className={styles.confirmDeleteBtn}
                onClick={handleDeleteComment}
                disabled={deletingCommentId === getCommentId(commentToDelete)}
              >
                {deletingCommentId === getCommentId(commentToDelete)
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>

            {/* عرض خطأ الحذف إذا صار */}
            {deleteError && (
              <p className={styles.deleteModalError}>{deleteError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
