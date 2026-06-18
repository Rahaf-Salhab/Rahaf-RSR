import { useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";
import { Menu } from "@mui/icons-material";

export default function Navbar({ onMenuClick }) {
  const role = localStorage.getItem("role");
  const userName = localStorage.getItem("name") || "User";
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button className={styles.menuBtn} onClick={onMenuClick}>
          <Menu />
        </button>
        <span className={styles.breadcrumb}>
          Home &rsaquo; <span style={{ textTransform: "capitalize" }}>{role}</span>
        </span>
      </div>

      <div className={styles.headerRight}>
    
        <div
          className={styles.avatar}
          onClick={() => navigate(`/${role}/profile`)}
          style={{ cursor: "pointer" }}
        >
          {userName.charAt(0).toUpperCase()}
        </div>
        <span className={styles.roleBadge}>
          Role: <strong style={{ textTransform: "capitalize" }}>{role}</strong>
        </span>
      </div>
    </header>
  );
}