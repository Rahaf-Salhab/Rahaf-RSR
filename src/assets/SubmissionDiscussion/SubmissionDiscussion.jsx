import { useMemo, useRef, useState } from "react";
import api from "../api/axiosInstance";
import SendIcon from "@mui/icons-material/Send";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import styles from "./SubmissionDiscussion.module.css";

export default function SubmissionDiscussion({
  submission,
  formatDate,
  currentRole = "Student",
}) {
  const [replyText, setReplyText] = useState("");
  const [localReplies, setLocalReplies] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [replyingToComment, setReplyingToComment] = useState(null);

  const discussionBoxRef = useRef(null);

  const getCommentId = (comment) => {
    return comment.taskSubmissionCommentId || comment.id;
  };

  const normalizeRole = (role) => {
    return role?.trim()?.toLowerCase();
  };

  const getDisplayRole = (comment) => {
    const role = normalizeRole(comment.role);

    if (role === "student") return "Student";
    if (role === "supervisor") return "Supervisor";

    // fallback للبيانات القديمة اللي role فيها فاضي
    if (!comment.parentCommentId) return "Supervisor";

    return "Student";
  };

  const isStudentComment = (comment) => {
    return getDisplayRole(comment) === "Student";
  };

  const allComments = useMemo(() => {
    const backendComments = submission.taskSubmissionComments || [];
    return [...backendComments, ...localReplies];
  }, [submission.taskSubmissionComments, localReplies]);

  const totalMessages = allComments.length;

  const buildCommentTree = (comments) => {
    const commentMap = {};
    const roots = [];

    comments.forEach((comment) => {
      const id = getCommentId(comment);

      commentMap[id] = {
        ...comment,
        replies: [],
      };
    });

    comments.forEach((comment) => {
      const id = getCommentId(comment);
      const parentId = comment.parentCommentId;

      if (parentId && commentMap[parentId]) {
        commentMap[parentId].replies.push(commentMap[id]);
      } else {
        roots.push(commentMap[id]);
      }
    });

    return roots;
  };

  const commentTree = useMemo(() => {
    return buildCommentTree(allComments);
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
  };

  const handleCancelReply = () => {
    setReplyingToComment(null);
    setReplyText("");
    setReplyError("");
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    const parentCommentId =
      replyingToComment?.taskSubmissionCommentId ||
      replyingToComment?.id ||
      commentTree?.[0]?.taskSubmissionCommentId;

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

      const newReply = {
        taskSubmissionCommentId:
          res.data?.taskSubmissionCommentId ||
          window.crypto?.randomUUID?.() ||
          String(Date.now()),
        parentCommentId: res.data?.parentCommentId || parentCommentId,
        content: res.data?.content || replyText.trim(),
        userName: res.data?.userName || currentRole,
        role: res.data?.role || currentRole,
        createdAt: res.data?.createdAt || new Date().toISOString(),
      };

      setLocalReplies((prev) => [...prev, newReply]);
      setReplyText("");
      setReplyingToComment(null);
    } catch (err) {
      console.log("Reply error:", err);

      setReplyError(
        err.response?.data?.message ||
          err.response?.data?.title ||
          "Failed to send reply.",
      );
    } finally {
      setSending(false);
    }
  };

  const renderReplyBox = (comment) => {
    if (!replyingToComment) return null;

    if (getCommentId(replyingToComment) !== getCommentId(comment)) {
      return null;
    }

    return (
      <div className={styles.inlineReplyBox}>
        <div className={styles.replyingToText}>
          Replying to {comment.userName || getDisplayRole(comment)}
        </div>

        <div className={styles.replyBox}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply..."
            className={styles.replyTextarea}
          />

          <button
            type="button"
            className={styles.replyIconBtn}
            onClick={handleSendReply}
            title="Send reply"
            disabled={sending || !replyText.trim()}
          >
            <SendIcon fontSize="small" />
          </button>
        </div>

        <button
          type="button"
          className={styles.cancelReplyBtn}
          onClick={handleCancelReply}
        >
          Cancel
        </button>

        {replyError && <p className={styles.replyError}>{replyError}</p>}
      </div>
    );
  };

  const renderComment = (comment, level = 0) => {
    const isStudent = isStudentComment(comment);
    const displayRole = getDisplayRole(comment);

    return (
      <div
        key={getCommentId(comment)}
        className={styles.commentThread}
        style={{ marginLeft: `${level * 34}px` }}
      >
        <div
          className={`${styles.messageBubble} ${
            isStudent ? styles.studentMessage : styles.supervisorMessage
          }`}
        >
          <div className={styles.messageHeader}>
            <span>{displayRole}</span>

            <small>
              {comment.userName || "-"} • {formatDate(comment.createdAt)}
            </small>
          </div>

          <p>{comment.content}</p>

          <button
            type="button"
            className={styles.replyLink}
            onClick={() => handleStartReply(comment)}
          >
            Reply
          </button>
        </div>

        {renderReplyBox(comment)}

        {comment.replies?.map((reply) => renderComment(reply, level + 1))}
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
          {commentTree.length > 0 ? (
            commentTree.map((comment) => renderComment(comment))
          ) : (
            <p className={styles.emptyDiscussion}>No discussion yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
