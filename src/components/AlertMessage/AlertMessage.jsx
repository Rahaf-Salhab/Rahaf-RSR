import { useEffect } from "react";
import styles from "./AlertMessage.module.css";

export default function AlertMessage({
  type = "success",
  message,
  onClose,
  duration = 3000,
}) {
  useEffect(() => {
    if (!message || !onClose) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, onClose, duration]);

  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div
      className={`${styles.alertMessage} ${
        isSuccess ? styles.success : styles.error
      }`}
    >
      <span className={styles.icon}>{isSuccess ? "✓" : "!"}</span>
      <span>{message}</span>
    </div>
  );
}