import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";
import rsrLogo from "../../assets/logo/rsrLogo.png";
import {
  Dashboard,
  People,
  Assignment,
  CalendarMonth,
  MenuBook,
  Grade,
  Archive,
  Person,
  Logout,
  Close,
  RateReview,
  Schedule,
  Folder,
  Task,
  DateRange,
} from "@mui/icons-material";

const sidebarConfig = {
  coordinator: [
    { label: "Dashboard", icon: <Dashboard />, path: "/coordinator/home" },
    { label: "Semester", icon: <DateRange />, path: "/coordinator/semester" },
    { label: "Users", icon: <People />, path: "/coordinator/users" },
    {
      label: "Evaluation Forms",
      icon: <Assignment />,
      path: "/coordinator/evaluation-forms",
    },
    {
      label: "Examination Timetable",
      icon: <CalendarMonth />,
      path: "/coordinator/examination-timetable",
    },
    {
      label: "Thesis Management",
      icon: <MenuBook />,
      path: "/coordinator/thesis-management",
    },
    {
      label: "Final Grades",
      icon: <Grade />,
      path: "/coordinator/final-grades",
    },
    { label: "Archive", icon: <Archive />, path: "/coordinator/archive" },
    { label: "Profile", icon: <Person />, path: "/coordinator/profile" },
  ],
  examiner: [
    { label: "Dashboard", icon: <Dashboard />, path: "/examiner/home" },
    { label: "My Projects", icon: <Folder />, path: "/examiner/projects" },
    {
      label: "Evaluation Forms",
      icon: <RateReview />,
      path: "/examiner/evaluation-forms",
    },
    {
      label: "Examination Schedule",
      icon: <Schedule />,
      path: "/examiner/examination-timetable",
    },
    { label: "Profile", icon: <Person />, path: "/examiner/profile" },
  ],
  supervisor: [
    { label: "Dashboard", icon: <Dashboard />, path: "/supervisor/home" },
    { label: "Groups", icon: <People />, path: "/supervisor/groups" },
    { label: "Tasks", icon: <Task />, path: "/supervisor/tasks" },
    { label: "Thesis", icon: <MenuBook />, path: "/supervisor/thesis" },
    {
      label: "Evaluation Forms",
      icon: <RateReview />,
      path: "/supervisor/evaluation-forms",
    },
    {
      label: "Examination Timetables",
      icon: <CalendarMonth />,
      path: "/supervisor/examination-timetable",
    },
    { label: "Archive", icon: <Archive />, path: "/supervisor/archive" },
    { label: "Profile", icon: <Person />, path: "/supervisor/profile" },
  ],
  student: [
    { label: "Dashboard", icon: <Dashboard />, path: "/student/home" },
     { label: "Tasks", icon: <Task />, path: "/student/tasks" },
    {label: "Thesis", icon:<MenuBook />, path: "/student/thesis"},
    { label: "Grades", icon: <Grade />, path: "/student/grades" },
    { label: "Schedule", icon: <Schedule />, path: "/student/schedule" },
    { label: "Profile", icon: <Person />, path: "/student/profile" },
    
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const role = localStorage.getItem("role");
  const sidebarItems = sidebarConfig[role] || [];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
      <div className={styles.sidebarHeader}>
        <img src={rsrLogo} alt="RSR" className={styles.logo} />
        <button className={styles.closeBtn} onClick={onClose}>
          <Close fontSize="small" />
        </button>
      </div>

      <nav className={styles.nav}>
        {sidebarItems.map((item) => (
          <button
            key={item.path}
            className={`${styles.navItem} ${location.pathname === item.path ? styles.navItemActive : ""}`}
            onClick={() => {
              navigate(item.path);
              onClose();
            }}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

      <button className={styles.logoutBtn} onClick={handleLogout}>
        <Logout fontSize="small" />
        <span>Logout</span>
      </button>
    </aside>
  );
}
