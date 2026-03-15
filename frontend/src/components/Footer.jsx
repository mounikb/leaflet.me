import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandName}>Leaflet</span>
          <span>🌸</span>
        </div>
        <nav className={styles.links}>
          <a href="/about" className={styles.link}>About</a>
          <a href="https://github.com/mounikb/leaflet.me" className={styles.link} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="/privacy" className={styles.link}>Privacy</a>
        </nav>
        <p className={styles.copy}>Made with care, 2026</p>
      </div>
    </footer>
  );
}