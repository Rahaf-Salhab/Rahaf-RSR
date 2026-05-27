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
  submission, // فيه بيانات التسليم والتعليقات
  formatDate,
  currentRole = "Student",
}) {
  const [replyText, setReplyText] = useState("");
  const [localReplies, setLocalReplies] = useState([]);
  const [isOpen, setIsOpen] = useState(false); // هل النقاش مفتوح ام مخفي
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [deletedCommentIds, setDeletedCommentIds] = useState([]);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [editingComment, setEditingComment] = useState(null); // التعليق الذي يتم تعديله حاليا
  const [updatingCommentId, setUpdatingCommentId] = useState(null);
  const [editedCommentContents, setEditedCommentContents] = useState({});
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const discussionBoxRef = useRef(null);
  const replyComposerRef = useRef(null);
  const replyTextareaRef = useRef(null);

  const getCommentId = (comment) => {
    return comment?.taskSubmissionCommentId;
  };

  const getDisplayRole = (comment) => {
    const role = comment.role?.trim()?.toLowerCase();

    if (role === "student") return "Student";
    if (role === "supervisor") return "Supervisor";

    if (!comment.parentCommentId) return "Supervisor";

    return "Student";
  };

  const getDisplayName = (comment) => {
    const name = comment.userName || getDisplayRole(comment);

    if (getDisplayRole(comment) === "Supervisor") {
      return name.startsWith("Dr.") ? name : `Dr. ${name}`;
    }

    return name;
  };

  const isStudentComment = (comment) => {
    return getDisplayRole(comment) === "Student";
  };
  const canReplyToComment = (comment) => {
    return getDisplayRole(comment) !== currentRole;
  };

  const canDeleteComment = (comment) => {
    return getDisplayRole(comment) === currentRole;
  };
  const canEditComment = (comment) => {
    return getDisplayRole(comment) === currentRole;
  };
  const allComments = useMemo(() => {
    const backendComments = submission.taskSubmissionComments || [];

    const commentsMap = new Map();

    backendComments.forEach((comment) => {
      const commentId = getCommentId(comment);
      if (!commentId || deletedCommentIds.includes(commentId)) return;

      commentsMap.set(commentId, comment);
    });

    localReplies.forEach((comment) => {
      const commentId = getCommentId(comment);
      if (!commentId || deletedCommentIds.includes(commentId)) return;

      if (!commentsMap.has(commentId)) {
        commentsMap.set(commentId, comment);
      }
    });

    return Array.from(commentsMap.values())
      .map((comment) => {
        const commentId = getCommentId(comment);

        return {
          ...comment,
          content: editedCommentContents[commentId] ?? comment.content,
        };
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [
    submission.taskSubmissionComments,
    localReplies,
    deletedCommentIds,
    editedCommentContents,
  ]);

  const totalMessages = allComments.length;

  const rootComment =
    allComments.find((comment) => !comment.parentCommentId) || null;

  const rootCommentId = rootComment ? getCommentId(rootComment) : null;

  const commentsById = useMemo(() => {
    const map = {};

    allComments.forEach((comment) => {
      map[getCommentId(comment)] = comment;
    });

    return map;
  }, [allComments]);

  const handleToggleDiscussion = () => {
    const nextOpenState = !isOpen;
    setIsOpen(nextOpenState);

    if (nextOpenState) {
      setTimeout(() => {
        discussionBoxRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  const handleStartReply = (comment) => {
    setReplyingToComment(comment);
    setReplyText("");
    setReplyError("");

    setTimeout(() => {
      replyComposerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingToComment(null);
    setReplyText("");
    setReplyError("");
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    const selectedParentId =
      replyingToComment?.taskSubmissionCommentId;

    const defaultParentId =
      rootComment?.taskSubmissionCommentId;

    const parentCommentId = selectedParentId || defaultParentId;

    if (!parentCommentId) {
      setReplyError("Cannot find the parent comment id.");
      return;
    }

    try {
      setSending(true);
      setReplyError("");

      const res = await api.post(
        `/TaskSubmission/reply-to-comment/parentCommentId/${parentCommentId}`,
        {
          content: replyText.trim(),
        },
      );

      const savedComment = res.data;

     const newReply = {
  taskSubmissionCommentId: savedComment.taskSubmissionCommentId,
  parentCommentId: savedComment.parentCommentId,
  content: savedComment.content,
  userName: savedComment.userName,
  role: savedComment.role,
  createdAt: savedComment.createdAt,
  isExplicitReply: Boolean(replyingToComment),
};
      if (!newReply.taskSubmissionCommentId) {
        setReplyError(
          "Reply was added, but the response did not include comment id.",
        );
        return;
      }

      setLocalReplies((prev) => {
        const alreadyExists = prev.some(
          (reply) => getCommentId(reply) === getCommentId(newReply),
        );
        if (alreadyExists) return prev;
        return [...prev, newReply];
      });

      setReplyText("");
      setReplyingToComment(null);
    } catch (err) {
      setReplyError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          "Failed to send reply.",
      );
    } finally {
      setSending(false);
    }
  };

  const openDeleteModal = (comment) => {
    setCommentToDelete(comment);
    setDeleteError("");
    setReplyError("");
  };

  const closeDeleteModal = () => {
    setCommentToDelete(null);
    setDeleteError("");
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    const commentId = getCommentId(commentToDelete);
    if (!commentId) return;
    if (commentToDelete.isLocalOnly || String(commentId).startsWith("local-")) {
      setLocalReplies((prev) =>
        prev.filter((reply) => getCommentId(reply) !== commentId),
      );
      setCommentToDelete(null);
      return;
    }

    try {
      setDeletingCommentId(commentId);

      await api.delete(`/TaskSubmission/delete-comment/commentId/${commentId}`);
      setDeletedCommentIds((prev) =>
        prev.includes(commentId) ? prev : [...prev, commentId],
      );

      setLocalReplies((prev) =>
        prev.filter((reply) => getCommentId(reply) !== commentId),
      );

      setEditedCommentContents((prev) => {
        const copy = { ...prev };
        delete copy[commentId];
        return copy;
      });

      if (replyingToComment && getCommentId(replyingToComment) === commentId) {
        setReplyingToComment(null);
        setReplyText("");
      }

      if (editingComment && getCommentId(editingComment) === commentId) {
        setEditingComment(null);
        setReplyText("");
      }
      setCommentToDelete(null);
    } catch (err) {
      setDeleteError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          "Failed to delete comment.",
      );
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleStartEdit = (comment) => {
    setEditingComment(comment);
    setReplyingToComment(null);
    setReplyText(comment.content || "");
    setReplyError("");

    setTimeout(() => {
      replyComposerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      replyTextareaRef.current?.focus();
    }, 100);
  };

  const handleCancelComposer = () => {
    setEditingComment(null);
    setReplyingToComment(null);
    setReplyText("");
    setReplyError("");
  };

  const handleUpdateComment = async () => {
    if (!editingComment) return;

    const commentId = getCommentId(editingComment);

    if (!commentId) return;

    if (!replyText.trim()) {
      setReplyError("Comment cannot be empty.");
      return;
    }

    try {
      setUpdatingCommentId(commentId);
      setReplyError("");

      const res = await api.put(
        `/TaskSubmission/update-comment/commentId/${commentId}`,
        {
          Content: replyText.trim(),
        },
      );
      const updatedContent =
        res.data?.content ||
        res.data?.Content ||
        res.data?.updatedComment?.content ||
        replyText.trim();

      setEditedCommentContents((prev) => ({
        ...prev,
        [commentId]: updatedContent,
      }));

      setLocalReplies((prev) =>
        prev.map((reply) =>
          getCommentId(reply) === commentId
            ? { ...reply, content: updatedContent }
            : reply,
        ),
      );

      setEditingComment(null);
      setReplyText("");
    } catch (err) {
      setReplyError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          "Failed to update comment.",
      );
    } finally {
      setUpdatingCommentId(null);
    }
  };
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

      {isOpen && (
        <div ref={discussionBoxRef} className={styles.discussionBox}>
          {allComments.length > 0 ? (
            allComments.map((comment) => renderComment(comment))
          ) : (
            <p className={styles.emptyDiscussion}>No discussion yet.</p>
          )}
          <div ref={replyComposerRef} className={styles.replyComposer}>
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

            {replyError && <p className={styles.replyError}>{replyError}</p>}
          </div>
        </div>
      )}

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
            {deleteError && (
              <p className={styles.deleteModalError}>{deleteError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
