import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mockApi as api } from "../../api/axiosInstance";
import styles from "./Home.module.css";
import rsrLogo from "../../assets/logo/rsrLogo.png";

const STATS = [
  { value: "200+", label: "Graduated Projects" },
  { value: "50+", label: "Faculty Supervisors" },
  { value: "8", label: "Years of Excellence" },
  { value: "1200+", label: "Students Graduated" },
];

const FEATURES = [
  {
    icon: "📋",
    title: "Evaluation Forms",
    desc: "Structured assessment forms designed by coordinators for supervisors and examiners to evaluate graduation projects fairly.",
  },
  {
    icon: "📅",
    title: "Examination Timetable",
    desc: "Organized scheduling system for graduation project presentations, ensuring smooth coordination between all parties.",
  },
  {
    icon: "🎓",
    title: "Grade Management",
    desc: "Transparent grade tracking from evaluation through final publishing, accessible to students instantly upon release.",
  },
  {
    icon: "📁",
    title: "Project Archive",
    desc: "A rich library of past graduation projects, preserving knowledge and inspiring future generations of students.",
  },
];

const GRADE_COLOR = {
  Excellent: "#C0441A",
  "Very Good": "#e07b54",
  Good: "#f4a97a",
};

export default function Home() {
  const navigate = useNavigate();
  const [archive, setArchive] = useState([]);
  const [loadingArchive, setLoadingArchive] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("All");
  const [visibleCount, setVisibleCount] = useState(6);

  const isLoggedIn = !!localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");

  useEffect(() => {
    api.get("/archive")
      .then((res) => setArchive(res.data))
      .catch(() => setArchive([]))
      .finally(() => setLoadingArchive(false));
  }, []);

  const years = ["All", ...new Set(archive.map((p) => p.year))].sort((a, b) =>
    a === "All" ? -1 : b - a
  );

  const filtered = archive.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchYear = selectedYear === "All" || p.year === selectedYear;
    return matchSearch && matchYear;
  });

  const handleDashboard = () => {
    if (role) navigate(`/${role}/home`);
  };

  return (
    <div className={styles.page}>
      {/* ── NAVBAR ── */}
      <nav className={styles.nav}>
        <img src={rsrLogo} alt="RSR" className={styles.navLogo} />
        <div className={styles.navLinks}>
          <a href="#about" className={styles.navLink}>About</a>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#archive" className={styles.navLink}>Archive</a>
        </div>
        {isLoggedIn ? (
          <button className={styles.navBtn} onClick={handleDashboard}>
            Go to Dashboard →
          </button>
        ) : (
          <button className={styles.navBtn} onClick={() => navigate("/login")}>
            Sign In
          </button>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>Palestine Technical University — Kadoorie</span>
          <h1 className={styles.heroTitle}>
            Where Graduation <br />
            <span className={styles.heroAccent}>Projects Shine</span>
          </h1>
          <p className={styles.heroSubtitle}>
            RSR is the official platform for managing, evaluating, and archiving
            graduation projects — connecting students, supervisors, examiners, and coordinators.
          </p>
          <div className={styles.heroBtns}>
            <a href="#archive" className={styles.heroBtnPrimary}>
              Explore Archive
            </a>
            {!isLoggedIn && (
              <button className={styles.heroBtnSecondary} onClick={() => navigate("/login")}>
                Sign In
              </button>
            )}
          </div>
        </div>
        <div className={styles.heroDecor}>
          <div className={styles.heroCircle1} />
          <div className={styles.heroCircle2} />
          <div className={styles.heroCircle3} />
        </div>
      </section>

      {/* ── STATS ── */}
      <section className={styles.stats}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className={styles.about}>
        <div className={styles.aboutInner}>
          <div className={styles.aboutText}>
            <span className={styles.sectionTag}>About RSR</span>
            <h2 className={styles.sectionTitle}>A Complete Graduation Management Ecosystem</h2>
            <p className={styles.aboutDesc}>
              RSR (Research, Supervision & Review) is built to streamline every step of the graduation
              project journey at PTUK. From project registration to final grade publishing, the platform
              ensures transparency, efficiency, and fairness for all stakeholders.
            </p>
            <p className={styles.aboutDesc}>
              Coordinators manage the full lifecycle, supervisors guide and evaluate projects,
              examiners review and score presentations, and students track their progress in real time.
            </p>
          </div>
          <div className={styles.aboutVisual}>
            <div className={styles.aboutCard}>
              <div className={styles.aboutCardIcon}>🏛️</div>
              <div>
                <div className={styles.aboutCardTitle}>Palestine Technical University</div>
                <div className={styles.aboutCardSub}>Kadoorie — Faculty of Engineering & IT</div>
              </div>
            </div>
            <div className={styles.aboutCard}>
              <div className={styles.aboutCardIcon}>🔬</div>
              <div>
                <div className={styles.aboutCardTitle}>Research-Driven Education</div>
                <div className={styles.aboutCardSub}>Empowering students through real-world projects</div>
              </div>
            </div>
            <div className={styles.aboutCard}>
              <div className={styles.aboutCardIcon}>✅</div>
              <div>
                <div className={styles.aboutCardTitle}>Accredited Evaluation Process</div>
                <div className={styles.aboutCardSub}>Standardized forms, transparent grading</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Platform Features</span>
          <h2 className={styles.sectionTitle}>Everything You Need, In One Place</h2>
        </div>
        <div className={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ARCHIVE ── */}
      <section id="archive" className={styles.archiveSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Project Archive</span>
          <h2 className={styles.sectionTitle}>Past Graduation Projects</h2>
          <p className={styles.archiveSubtitle}>
            Browse outstanding projects from previous years
          </p>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(6); }}
            className={styles.searchInput}
          />
          <div className={styles.yearTabs}>
            {years.map((y) => (
              <button
                key={y}
                className={`${styles.yearTab} ${selectedYear === y ? styles.yearTabActive : ""}`}
                onClick={() => { setSelectedYear(y); setVisibleCount(6); }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {loadingArchive ? (
          <div className={styles.loading}>Loading projects...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No projects found.</div>
        ) : (
          <>
            <div className={styles.archiveGrid}>
              {filtered.slice(0, visibleCount).map((project) => (
                <div key={project.id} className={styles.archiveCard}>
                  <div className={styles.archiveCardTop}>
                    <span className={styles.archiveYear}>{project.year}</span>
                    <span
                      className={styles.archiveGrade}
                      style={{ color: GRADE_COLOR[project.grade] || "#888" }}
                    >
                      {project.grade}
                    </span>
                  </div>
                  <h3 className={styles.archiveTitle}>{project.title}</h3>
                  <p className={styles.archiveDesc}>{project.description}</p>
                  <div className={styles.archiveFooter}>
                    <div className={styles.archiveStudents}>
                      {project.students.map((s) => (
                        <span key={s} className={styles.studentChip}>{s}</span>
                      ))}
                    </div>
                    <div className={styles.archiveSupervisor}>
                      👨‍🏫 {project.supervisorName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div className={styles.loadMoreWrap}>
                <button
                  className={styles.loadMoreBtn}
                  onClick={() => setVisibleCount((v) => v + 6)}
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <img src={rsrLogo} alt="RSR" className={styles.footerLogo} />
            <p className={styles.footerTagline}>
              Research · Supervision · Review
            </p>
          </div>
          <div className={styles.footerLinks}>
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#archive">Archive</a>
            <span onClick={() => navigate("/login")} style={{ cursor: "pointer" }}>Sign In</span>
          </div>
          <p className={styles.footerCopy}>
            © {new Date().getFullYear()} RSR Platform — Palestine Technical University Kadoorie
          </p>
        </div>
      </footer>
    </div>
  );
}