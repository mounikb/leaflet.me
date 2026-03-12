import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.brand}>🌸 DigiOrchid</span>
        <span className={styles.copy}>
          Your digital garden, beautifully grown.
        </span>
        <span className={styles.year}>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}