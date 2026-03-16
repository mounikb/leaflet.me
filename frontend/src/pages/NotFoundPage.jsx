import React from 'react';
import styles from './NotFoundPage.module.css';
import Icon from '../components/Icons';

export default function NotFoundPage({ onGoHome }) {
  return (
    <div className={styles.page}>
      <div className={styles.icon}><Icon name="seedling" circle size={32} /></div>
      <h1 className={styles.title}>Garden not found</h1>
      <p className={styles.sub}>
        This garden doesn't exist yet — or it may have been removed.
      </p>
      <button className={styles.btn} onClick={onGoHome}>← Back to Leaflet</button>
    </div>
  );
}