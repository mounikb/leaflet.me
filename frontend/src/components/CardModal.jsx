import React from 'react';
import styles from './CardModal.module.css';

export default function CardModal({ card, onClose, onNavigateToTopic }) {
  if (!card) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <button className={styles.close} onClick={onClose}>✕</button>

        {card.image_url && (
          <img src={card.image_url} alt={card.title} className={styles.image} />
        )}

        <div className={styles.body}>
          <div className={styles.topicRow}>
            <span className={styles.topic}>🌿 {card.topic}</span>
            {card.pinned && <span className={styles.pinnedBadge}>📌 Pinned</span>}
          </div>
          <h2 className={styles.title}>{card.title}</h2>
          {card.content && <p className={styles.content}>{card.content}</p>}
          <div className={styles.footer}>
            <span className={styles.date}>
              {new Date(card.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </span>
            {onNavigateToTopic && (
              <button
                className={styles.topicLink}
                onClick={() => { onClose(); onNavigateToTopic(card.topic); }}
              >
                See all {card.topic} →
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}