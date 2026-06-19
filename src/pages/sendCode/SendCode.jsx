import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import styles from "./sendCode.module.css";
import rsrLogo from "../../assets/logo/rsrLogo.png";

const RSRLogo = () => (
  <img src={rsrLogo} alt="RSR Logo" className={styles.logo} />
);

export default function SendCode() {
  const navigate = useNavigate();
  const [codes, setCodes] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    if (timer === 0) { setCanResend(true); return; }
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newCodes = [...codes];
    newCodes[index] = value.slice(-1);
    setCodes(newCodes);
    if (error) setError("");
    if (value && index < 3) inputs.current[index + 1].focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !codes[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (paste.length === 4) {
      setCodes(paste.split(""));
      inputs.current[3].focus();
    }
  };

  const handleResend = async () => {
    setTimer(60);
    setCanResend(false);
    setError("");
    setCodes(["", "", "", ""]);
    inputs.current[0].focus();
    try {
      const email = sessionStorage.getItem("resetEmail");
      await api.post("/auth/Account/send-code", { Email: email });
    } catch (err) {
      setError("Failed to resend code. Please try again.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullCode = codes.join("");
    if (fullCode.length < 4) {
      setError("Please enter the complete 4-digit code.");
      return;
    }
     sessionStorage.setItem("resetCode", fullCode);
    navigate("/reset-password");
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className={styles.page}>
      <div className={styles.wave} />
      <div className={styles.card}>
        <RSRLogo />
        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.subtitle}>
          We sent a 4-digit code to your email address
        </p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.codeInputs} onPaste={handlePaste}>
            {codes.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className={`${styles.codeBox} ${digit ? styles.codeBoxFilled : ""}`}
              />
            ))}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : "Next"}
          </button>
        </form>

        <div className={styles.resendWrap}>
          {canResend ? (
            <button type="button" className={styles.resendBtn} onClick={handleResend}>
              Resend Code
            </button>
          ) : (
            <p className={styles.timerText}>
              Resend code in <span className={styles.timer}>{formatTime(timer)}</span>
            </p>
          )}
        </div>

        <button type="button" className={styles.back} onClick={() => navigate("/forgotPassword")}>
          ← Back
        </button>
      </div>
    </div>
  );
}