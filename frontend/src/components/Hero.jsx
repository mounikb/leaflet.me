import React from 'react';
import styles from './Hero.module.css';

export default function Hero({ onAuthClick }) {
  return (
    <section className={styles.hero}>
      <div className={styles.intro}>
        <p className={`${styles.line} fade-up delay-1`}>
          Hey there, welcome to{' '}
          <strong className={styles.brand}>Leaflet</strong> 🌸
        </p>

        <p className={`${styles.line} fade-up delay-2`}>
          A place to grow your{' '}
          <span className={styles.underlined}>digital garden</span> 🌱 — share
          what you love, what you're learning, and what makes you{' '}
          <em>you</em>.
        </p>

        <p className={`${styles.line} ${styles.muted} fade-up delay-3`}>
          No code needed. Just pick a name, plant some cards, and share your
          corner of the internet with the world.
        </p>

        <p className={`${styles.line} ${styles.muted} fade-up delay-4`}>
          I built this because personal websites shouldn't require a CS degree.
          Everyone deserves a{' '}
          <span className={styles.accent}>beautiful space online</span>.
        </p>

        <div className={`${styles.cta} fade-up delay-5`}>
          <button onClick={onAuthClick} className={styles.btnPrimary}>
            Plant your garden →
          </button>
          <a href="/gardens" className={styles.btnGhost}>
            Explore gardens
          </a>
        </div>
      </div>
    </section>
  );
}