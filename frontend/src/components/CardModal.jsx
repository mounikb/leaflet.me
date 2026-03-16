import React from 'react';
import styles from './CardModal.module.css';
import Icon from './Icons';

const STATUS = {
  'read':    { label: 'Read',    bg: 'hsl(152,60%,42%,0.12)', color: 'hsl(152,60%,32%)' },
  'reading': { label: 'Reading', bg: 'hsl(220,70%,55%,0.12)', color: 'hsl(220,70%,45%)' },
  'to-read': { label: 'To Read', bg: 'hsl(0,70%,60%,0.12)',   color: 'hsl(0,70%,45%)' },
};

export default function CardModal({ card, onClose, onNavigateToTopic }) {
  if (!card) return null;

  const isBook = card.card_type === 'book';

  // ── Book modal ──
  if (isBook) {
    const status = STATUS[card.book_status] || STATUS['to-read'];
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <button className={styles.close} onClick={onClose}>✕</button>

          <div className={styles.bookModal}>
            {/* Cover */}
            {card.image_url && (
              <div className={styles.bookCoverWrap}>
                <img src={card.image_url} alt={card.title} className={styles.bookCover} />
                <div className={styles.bookCoverSpine} />
              </div>
            )}

            {/* Info */}
            <div className={styles.bookInfo}>
              <span className={styles.bookStatus}
                style={{ background: status.bg, color: status.color }}>
                {status.label}
              </span>
              <h2 className={styles.bookTitle}>{card.title}</h2>
              {card.author && <p className={styles.bookAuthor}>{card.author}</p>}

              {card.rating > 0 && (
                <div className={styles.bookStars}>
                  {[1,2,3,4,5].map(i => (
                    <span key={i} style={{ color: i <= card.rating ? '#F59E0B' : 'hsl(220,13%,88%)', fontSize: 18 }}>★</span>
                  ))}
                </div>
              )}

              {card.content && (
                <p className={styles.bookReview}>{card.content}</p>
              )}

              {card.external_url && (
                <a href={card.external_url} target="_blank" rel="noopener noreferrer"
                  className={styles.bookExtLink}>
                  View full review ↗
                </a>
              )}

              <div className={styles.footer}>
                <span className={styles.date}>
                  {new Date(card.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Regular card modal ──
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>✕</button>

        {card.image_url && (
          <img src={card.image_url} alt={card.title} className={styles.image} />
        )}

        <div className={styles.body}>
          <div className={styles.topicRow}>
            <span className={styles.topic}><Icon name="leaf" size={12} /> {card.topic}</span>
            {card.pinned && <span className={styles.pinnedBadge}><Icon name="pin" size={11} /> Pinned</span>}
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
              <button className={styles.topicLink}
                onClick={() => { onClose(); onNavigateToTopic(card.topic); }}>
                See all {card.topic} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}