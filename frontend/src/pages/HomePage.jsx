import React from 'react';
import Hero from '../components/Hero';
import styles from './HomePage.module.css';

export default function HomePage({ onAuthClick }) {
  return (
    <main className={styles.page}>
      <Hero onAuthClick={onAuthClick} />
    </main>
  );
}