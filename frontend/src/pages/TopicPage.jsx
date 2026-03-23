import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import AddCardModal from '../components/AddCardModal';
import AddBookModal from '../components/AddBookModal';
import BookCard from '../components/BookCard';
import CardModal from '../components/CardModal';
import EditCardModal from '../components/EditCardModal';
import styles from './TopicPage.module.css';
import { computeLayout } from '../lib/gridLayout';
import { TopicPageSkeleton } from '../components/Skeleton';
import Icon from '../components/Icons';

export default function TopicPage({ username, topic, session, dragMode, onTopicsLoaded, onNavigateToTopic }) {
  const [profile, setProfile]       = useState(null);
  const [cards, setCards]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [editingCard, setEditingCard]   = useState(null);

  // Drag state
  const dragCardId   = useRef(null);  // id of card being dragged
  const [draggingId, setDraggingId] = useState(null);
  const [overIdx, setOverIdx]       = useState(null);

  // Bug 6 fix: compare by user ID from loaded profile — works for all auth providers
  const isOwner = !!(session?.user && profile?.id && session.user.id === profile?.id);

  const BOOK_TOPICS = ['reading', 'books', 'book'];
  const isBookTopic = BOOK_TOPICS.includes(topic?.toLowerCase());


  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: prof } = await supabase
        .from('profiles').select('*').eq('username', username).single();
      const { data: cardData } = await supabase
        .from('cards').select('*')
        .eq('user_id', prof?.id).ilike('topic', topic)  // case-insensitive match
        .order('position', { ascending: true });
      setProfile(prof);
      setCards(cardData || []);
      if (prof?.topics) onTopicsLoaded?.(prof.topics);
      setLoading(false);
    }
    load();
  }, [username, topic]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drag handlers ──────────────────────────────
  function onDragStart(e, card) {
    dragCardId.current = card.id;
    setDraggingId(card.id);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag ghost
    const ghost = document.createElement('div');
    ghost.style.width = '1px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }

  function onDragEnter(e, card) {
    e.preventDefault();
    if (card.id === dragCardId.current) return;
    setOverIdx(cards.findIndex(c => c.id === card.id));
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function onDrop(e, targetCard) {
    e.preventDefault();
    if (!dragCardId.current || dragCardId.current === targetCard.id) return;

    const fromIdx = cards.findIndex(c => c.id === dragCardId.current);
    const toIdx   = cards.findIndex(c => c.id === targetCard.id);
    if (fromIdx === -1 || toIdx === -1) return;

    // Reorder locally
    const reordered = [...cards];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    // Assign positions
    const updated = reordered.map((c, i) => ({ ...c, position: i }));
    setCards(updated);

    // Persist to Supabase
    savePositions(updated);
  }

  function onDragEnd() {
    dragCardId.current = null;
    setDraggingId(null);
    setOverIdx(null);
  }

  async function savePositions(ordered) {
    // Batch update — one request per card
    await Promise.all(
      ordered.map(c => supabase.from('cards').update({ position: c.position }).eq('id', c.id))
    );
  }
  // ───────────────────────────────────────────────

  async function handlePin(card) {
    const newPinned = !card.pinned;
    await supabase.from('cards').update({ pinned: newPinned }).eq('id', card.id);
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, pinned: newPinned } : c));
  }

  function onCardAdded(card) {
    setCards(prev => [...prev, { ...card, position: prev.length }]);
  }

  function onCardUpdated(updated) {
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
  }

  function onCardDeleted(id) {
    setCards(prev => prev.filter(c => c.id !== id));
  }

  if (loading) return <TopicPageSkeleton />;

  return (
    <div className={styles.page}>

      {/* Drag mode banner */}
      {dragMode && isOwner && (
        <div className={styles.dragBanner}>
          Drag mode — drag cards to reorder. Turn off in settings when done.
        </div>
      )}

      <div className={styles.header}>
        {/* FIX: don't lowercase the rest — preserves multi-word topics like "Machine Learning" */}
        <h1 className={styles.title}>{topic.charAt(0).toUpperCase() + topic.slice(1)}.</h1>
      </div>

      {cards.length > 0 ? (
        <div className={`${styles.grid} ${dragMode && isOwner ? styles.dragActive : ''}`}>
          {computeLayout(cards).map((card, idx) => (
            card.card_type === 'book' ? (
              // BookCard manages its own styling — no outer wrapper
              <div key={card.id} style={{ gridColumn: card.gridColumn, gridRow: card.gridRow }}>
                <BookCard
                  card={card} isOwner={isOwner} dragMode={dragMode}
                  dragging={draggingId === card.id}
                  dragOver={dragMode && overIdx === idx && draggingId !== card.id}
                  onDragStart={dragMode ? e => onDragStart(e, card) : undefined}
                  onDragEnter={dragMode ? e => onDragEnter(e, card) : undefined}
                  onDragOver={dragMode ? onDragOver : undefined}
                  onDrop={dragMode ? e => onDrop(e, card) : undefined}
                  onDragEnd={dragMode ? onDragEnd : undefined}
                  onPin={() => handlePin(card)}
                  onEdit={() => setEditingCard(card)}
                  onClick={() => !dragMode && setSelectedCard(card)}
                />
              </div>
            ) : (
            <div
              key={card.id}
              className={`
                ${styles.card}
                ${!card.image_url ? styles.cardNoImage : ''}
                ${dragMode && isOwner ? styles.draggable : ''}
                ${draggingId === card.id ? styles.isDragging : ''}
                ${dragMode && overIdx === idx && draggingId !== card.id ? styles.isDragOver : ''}
              `}
              style={{ gridColumn: card.gridColumn, gridRow: card.gridRow }}
              draggable={dragMode && isOwner}
              onDragStart={dragMode ? e => onDragStart(e, card) : undefined}
              onDragEnter={dragMode ? e => onDragEnter(e, card) : undefined}
              onDragOver={dragMode ? onDragOver : undefined}
              onDrop={dragMode ? e => onDrop(e, card) : undefined}
              onDragEnd={dragMode ? onDragEnd : undefined}
              onClick={() => !dragMode && setSelectedCard(card)}
            >
              {dragMode && isOwner && (
                <div className={styles.dragHandle}>⠿</div>
              )}
              {isOwner && !dragMode && (
                <div className={styles.cardActions}>
                  <button
                    className={`${styles.actionBtn} ${card.pinned ? styles.pinned : ''}`}
                    onClick={e => { e.stopPropagation(); handlePin(card); }}
                    title={card.pinned ? 'Unpin' : 'Pin to garden'}
                  >
                    {card.pinned ? <Icon name="pin" size={12} /> : <Icon name="plus" size={12} />}
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={e => { e.stopPropagation(); setEditingCard(card); }}
                    title="Edit card"
                  >
                    <Icon name="pencil" size={12} />
                  </button>
                </div>
              )}
              {card.image_url ? (
                <>
                  <img src={card.image_url} alt={card.title} className={styles.cardImg} />
                  <div className={styles.cardOverlay}>
                    <div className={styles.cardMeta}>{topic}</div>
                    <h3 className={styles.cardTitle}>{card.title}</h3>
                    <div className={styles.cardDate}>
                      {new Date(card.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.cardMeta}>
                    <span>{topic}</span>
                    {card.external_url && (
                      <a href={card.external_url} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()} style={{color:'var(--ink-faint)',fontSize:'14px'}}>↗</a>
                    )}
                  </div>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  <div className={styles.cardDate}>
                    {new Date(card.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  {card.content && (
                    <p className={styles.cardExcerpt}>
                      {card.content.length > 180 ? card.content.slice(0, 180) + '...' : card.content}
                    </p>
                  )}
                </>
              )}
            </div>
            )
          ))}

          {isOwner && !dragMode && (
            <button className={styles.addCard} onClick={() => setShowAddCard(true)}>
              <span className={styles.addIcon}>+</span>
              <span className={styles.addLabel}>Add a card</span>
            </button>
          )}
        </div>
      ) : (
        <div className={styles.empty}>
          {isOwner ? (
            <>
              <p>No cards in {topic} yet.</p>
              <button className={styles.addFirstBtn} onClick={() => setShowAddCard(true)}>
                Plant the first one 🌱
              </button>
            </>
          ) : (
            <>
              <p>Nothing planted here yet.</p>
              <p className={styles.emptySubtext}>Check back soon — this garden is still growing 🌱</p>
            </>
          )}
        </div>
      )}

      {showAddCard && (
        isBookTopic ? (
          <AddBookModal
            session={session} topic={topic}
            onClose={() => setShowAddCard(false)}
            onCardAdded={onCardAdded}
          />
        ) : (
          <AddCardModal session={session} topics={[topic]}
            onClose={() => setShowAddCard(false)} onCardAdded={onCardAdded} />
        )
      )}
      {selectedCard && (
        <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} onNavigateToTopic={onNavigateToTopic} />
      )}
      {editingCard && (
        <EditCardModal card={editingCard}
          onClose={() => setEditingCard(null)}
          onCardUpdated={onCardUpdated}
          onCardDeleted={onCardDeleted} />
      )}
    </div>
  );
}