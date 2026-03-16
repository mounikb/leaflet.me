import React from 'react';
import styles from './BookCard.module.css';
import Icon from './Icons';

const STATUS = {
  'read':    { label: 'READ',    bg: 'hsl(152,60%,42%,0.15)', color: 'hsl(152,60%,32%)' },
  'reading': { label: 'READING', bg: 'hsl(220,70%,55%,0.15)', color: 'hsl(220,70%,45%)' },
  'to-read': { label: 'TO READ', bg: 'hsl(0,70%,60%,0.15)',   color: 'hsl(0,70%,45%)' },
};

export default function BookCard({ card, isOwner, dragMode, dragging, dragOver,
  onDragStart, onDragEnter, onDragOver, onDrop, onDragEnd,
  onPin, onEdit, onClick }) {

  const status = STATUS[card.book_status] || STATUS['to-read'];

  return (
    <div
      className={`${styles.card} ${dragging ? styles.dragging : ''} ${dragMode ? styles.draggable : ''}`}
      draggable={dragMode && isOwner}
      onDragStart={dragMode ? onDragStart : undefined}
      onDragEnter={dragMode ? onDragEnter : undefined}
      onDragOver={dragMode ? onDragOver : undefined}
      onDrop={dragMode ? onDrop : undefined}
      onDragEnd={dragMode ? onDragEnd : undefined}
      onClick={() => !dragMode && onClick?.()}
    >
      {/* Owner actions */}
      {isOwner && !dragMode && (
        <div className={styles.actions}>
          <button className={`${styles.actionBtn} ${card.pinned ? styles.pinned : ''}`}
            onClick={e => { e.stopPropagation(); onPin?.(); }}
            title={card.pinned ? 'Unpin' : 'Pin'}>{card.pinned ? <Icon name="pin" size={12} /> : <Icon name="plus" size={12} />}</button>
          <button className={styles.actionBtn}
            onClick={e => { e.stopPropagation(); onEdit?.(); }}
            title="Edit"><Icon name="pencil" size={12} /></button>
        </div>
      )}

      {/* Meta */}
      <div className={styles.meta}>
        <span>{card.topic} · Books</span>
        {card.external_url && (
          <a href={card.external_url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()} className={styles.extLink}
            title="View full review">
            View review ↗
          </a>
        )}
      </div>

      {/* Cover + Info */}
      <div className={styles.body}>
        <div className={styles.coverWrap}>
          {card.image_url ? (
            <>
              <img src={card.image_url} alt={card.title} className={styles.cover} />
              <div className={styles.coverSpine} />
              <div className={styles.coverShadow} />
            </>
          ) : (
            <div className={styles.coverPlaceholder}>📖</div>
          )}
        </div>

        <div className={styles.info}>
          <span className={styles.status}
            style={{ background: status.bg, color: status.color }}>
            {status.label}
          </span>
          <h3 className={styles.title}>{card.title}</h3>
          {card.author && <p className={styles.author}>{card.author}</p>}
          {card.rating > 0 && (
            <div className={styles.stars}>
              {[1,2,3,4,5].map(i => (
                <span key={i} className={i <= card.rating ? styles.starFilled : styles.starEmpty}>★</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}