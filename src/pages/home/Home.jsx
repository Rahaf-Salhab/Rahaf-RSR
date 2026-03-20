import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mockApi as api } from "../../api/axiosInstance";
import styles from "./Home.module.css";
import rsrLogo from "../../assets/logo/rsrLogo.png";

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
  const [currentPage, setCurrentPage] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(
    window.innerWidth <= 600 ? 1 : 3
  );

  const isLoggedIn = !!localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");

  useEffect(() => {
    const handleResize = () => setCardsPerView(window.innerWidth <= 600 ? 1 : 3);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    api.get("/archive")
      .then((res) => setArchive(res.data))
      .catch(() => setArchive([]))
      .finally(() => setLoadingArchive(false));
  }, []);

  useEffect(() => { setCurrentPage(0); }, [searchTerm, selectedYear]);

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

  const totalPages = Math.ceil(filtered.length / cardsPerView);
  const paginated = filtered.slice(
    currentPage * cardsPerView,
    (currentPage + 1) * cardsPerView
  );

  const handleDashboard = () => {
    navigate("/login");
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
                <div className={styles.aboutCardSub}>Kadoorie</div>
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
        <div className={styles.archiveHeader}>
          <div className={styles.sectionHeader} style={{ marginBottom: 0, textAlign: "left" }}>
            <span className={styles.sectionTag}>Project Archive</span>
            <h2 className={styles.sectionTitle}>Past Graduation Projects</h2>
          </div>
          {!loadingArchive && filtered.length > 0 && (
            <div className={styles.carouselControls}>
              <span className={styles.carouselInfo}>
                {currentPage * cardsPerView + 1}–{Math.min((currentPage + 1) * cardsPerView, filtered.length)} of {filtered.length}
              </span>
              <button
                className={styles.arrowBtn}
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 0}
              >←</button>
              <button
                className={styles.arrowBtn}
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage >= totalPages - 1}
              >→</button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.yearTabs}>
            {years.map((y) => (
              <button
                key={y}
                className={`${styles.yearTab} ${selectedYear === y ? styles.yearTabActive : ""}`}
                onClick={() => setSelectedYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {loadingArchive ? (
          <div className={styles.loading}>Loading projects...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No projects found.</div>
        ) : (
          <>
            <div className={styles.archiveGrid}>
              {paginated.map((project) => (
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

            {totalPages > 1 && (
              <div className={styles.carouselDots}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.dot} ${i === currentPage ? styles.dotActive : ""}`}
                    onClick={() => setCurrentPage(i)}
                  />
                ))}
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