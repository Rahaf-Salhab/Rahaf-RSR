import styles from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <span className={styles.university}>Palestine Technical University - Kadoorie</span>
      <span className={styles.divider}>·</span>
      <span className={styles.copy}>© {year} RSR Platform. All rights reserved.</span>
    </footer>
  );
}