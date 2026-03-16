import React from 'react';
import styles from './Skeleton.module.css';

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.shimmer} />
    </div>
  );
}

export function GardenPageSkeleton() {
  return (
    <div className={styles.gardenPage}>
      <div className={styles.gardenIntro}>
        <div className={`${styles.block} ${styles.blockTitle}`} />
        <div className={`${styles.block} ${styles.blockLine}`} />
        <div className={`${styles.block} ${styles.blockLine} ${styles.blockLineShort}`} />
        <div className={`${styles.block} ${styles.blockLine}`} />
      </div>
      <div className={styles.gardenCards}>
        {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

export function TopicPageSkeleton() {
  return (
    <div className={styles.topicPage}>
      <div className={`${styles.block} ${styles.blockHero}`} />
      <div className={styles.topicGrid}>
        {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}