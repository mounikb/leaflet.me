import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import CardModal from '../components/CardModal';
import EditCardModal from '../components/EditCardModal';
import BookCard from '../components/BookCard';
import styles from './GardenPage.module.css';
import { computeLayout } from '../lib/gridLayout';
import { GardenPageSkeleton } from '../components/Skeleton';
import NotFoundPage from './NotFoundPage';
import Icon from '../components/Icons';

export default function GardenPage({ username, session, onTopicsLoaded, onNavigateToTopic, dragMode }) {
  const [profile, setProfile]           = useState(null);
  const [pinnedCards, setPinnedCards]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [editingCard, setEditingCard]   = useState(null);

  // Drag state
  const dragCardId = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const [overIdx, setOverIdx]       = useState(null);

  // Bug 6 fix: compare by user ID from loaded profile — works for all auth providers
  const isOwner = !!(session?.user && profile?.id && session.user.id === profile?.id);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: prof } = await supabase
        .from('profiles').select('*').eq('username', username).single();
      const { data: pinned } = await supabase
        .from('cards').select('*')
        .eq('user_id', prof?.id).eq('pinned', true)
        .order('position', { ascending: true });
      setProfile(prof);
      setPinnedCards(pinned || []);
      if (prof?.topics) onTopicsLoaded(prof.topics);
      setLoading(false);
    }
    load();
  }, [username]);

  // ── Drag handlers ──
  function onDragStart(e, card) {
    dragCardId.current = card.id;
    setDraggingId(card.id);
    e.dataTransfer.effectAllowed = 'move';
    const ghost = document.createElement('div');
    ghost.style.width = '1px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }
  function onDragEnter(e, card) {
    e.preventDefault();
    if (card.id === dragCardId.current) return;
    setOverIdx(pinnedCards.findIndex(c => c.id === card.id));
  }
  function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
  function onDrop(e, targetCard) {
    e.preventDefault();
    if (!dragCardId.current || dragCardId.current === targetCard.id) return;
    const fromIdx = pinnedCards.findIndex(c => c.id === dragCardId.current);
    const toIdx   = pinnedCards.findIndex(c => c.id === targetCard.id);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...pinnedCards];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const updated = reordered.map((c, i) => ({ ...c, position: i }));
    setPinnedCards(updated);
    Promise.all(updated.map(c => supabase.from('cards').update({ position: c.position }).eq('id', c.id)));
  }
  function onDragEnd() { dragCardId.current = null; setDraggingId(null); setOverIdx(null); }

  async function handlePin(card) {
    const newPinned = !card.pinned;
    await supabase.from('cards').update({ pinned: newPinned }).eq('id', card.id);
    setPinnedCards(prev => newPinned
      ? prev.map(c => c.id === card.id ? { ...c, pinned: true } : c)
      : prev.filter(c => c.id !== card.id)
    );
  }

  function onCardUpdated(updated) {
    setPinnedCards(prev => prev.map(c => c.id === updated.id ? updated : c));
  }
  function onCardDeleted(id) {
    setPinnedCards(prev => prev.filter(c => c.id !== id));
  }
  // ──────────────────

  if (loading) return <GardenPageSkeleton />;

  if (!profile) return <NotFoundPage onGoHome={() => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }} />;

  const topics    = profile?.topics || [];

  // Chester layout: intro in col 1 rows 1-N, cards fill cols 2-3 then all 3 cols
  const INTRO_ROWS = 3; // how many rows the intro spans
  // For the first INTRO_ROWS rows, cards that land in col 1 get pushed to col 2
  // We do this by computing layout starting from col 2 for first INTRO_ROWS rows
  function chesterLayout(cards) {
    if (!cards.length) return [];
    const COLS = 3;
    const occupied = [];
    function isOccupied(row, col) { return occupied[row]?.[col] === true; }
    function occupy(row, col, rowSpan, colSpan) {
      for (let r = row; r < row + rowSpan; r++) {
        if (!occupied[r]) occupied[r] = [];
        for (let c = col; c < col + colSpan; c++) occupied[r][c] = true;
      }
    }
    // Block col 0 for first INTRO_ROWS rows (intro lives there)
    for (let r = 0; r < INTRO_ROWS; r++) {
      if (!occupied[r]) occupied[r] = [];
      occupied[r][0] = true;
    }
    function findSlot(colSpan, rowSpan) {
      const span = Math.min(colSpan, COLS);
      for (let row = 0; row < 999; row++) {
        for (let col = 0; col <= COLS - span; col++) {
          let fits = true;
          outer: for (let r = row; r < row + rowSpan; r++) {
            for (let c = col; c < col + span; c++) {
              if (isOccupied(r, c)) { fits = false; break outer; }
            }
          }
          if (fits) return { row, col, span };
        }
      }
      return { row: 0, col: 1, span: colSpan };
    }
    function getSizeSpan(size) {
      switch(size) {
        case '2x2': return { colSpan: 2, rowSpan: 2 };
        case '2x1': return { colSpan: 2, rowSpan: 1 };
        case '1x2': return { colSpan: 1, rowSpan: 2 };
        default:    return { colSpan: 1, rowSpan: 1 };
      }
    }
    return cards.map(card => {
      const { colSpan, rowSpan } = getSizeSpan(card.size || '1x1');
      const { row, col, span } = findSlot(colSpan, rowSpan);
      occupy(row, col, rowSpan, span);
      return {
        ...card,
        gridColumn: `${col + 1} / span ${span}`,
        gridRow:    `${row + 1} / span ${rowSpan}`,
      };
    });
  }

  const layoutCards = chesterLayout(pinnedCards);

  return (
    <div className={styles.page}>

      {/* Intro — col 1, spans INTRO_ROWS rows */}
      <aside className={styles.intro}>
        {profile.bio && (
          <p className={styles.bio}>
            {profile.bio}
            {isOwner && (
              <button
                className={styles.editBtn}
                title="Edit your garden"
                onClick={() => window.dispatchEvent(new CustomEvent('leaflet:editbio'))}
              ><Icon name="pencil" size={14} /></button>
            )}
          </p>
        )}
        {isOwner && topics.length === 0 && (
          <p className={styles.emptyHint}>Your garden is empty. Go through onboarding to add topics! 🌱</p>
        )}
      </aside>

      {/* Each card is a direct child of .page grid */}
      {dragMode && isOwner && (
        <div className={styles.dragBanner}>Drag mode — drag pinned cards to reorder.</div>
      )}

      {pinnedCards.length === 0 ? (
        <div className={styles.noPinned}>
          <Icon name="seedling" size={36} circle color="hsl(22,35%,40%)" />
          {isOwner ? (
              <p>Pin cards from your topics to show them here.</p>
            ) : (
              <>
                <p style={{fontFamily:'var(--font-display)',fontSize:'18px',color:'var(--ink)',fontWeight:400,letterSpacing:'-0.01em'}}>This garden is still growing</p>
                <p style={{fontFamily:'var(--font-sans)',fontSize:'13px',color:'var(--ink-faint)',marginTop:'4px'}}>Check back soon — something beautiful is being planted here.</p>
              </>
            )}
        </div>
      ) : (
        layoutCards.map((card, idx) => (
          card.card_type === 'book' ? (
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
            {dragMode && isOwner && <div className={styles.dragHandle}><Icon name="drag" size={16} color="white" /></div>}
            {card.image_url ? (
              <>
                <img src={card.image_url} alt={card.title} className={styles.cardImg} />
                <div className={styles.cardOverlay}>
                  <div className={styles.cardTopic}><Icon name="pin" size={10} /> {card.topic}</div>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                </div>
              </>
            ) : (
              <>
                <div className={styles.cardTopic}><Icon name="pin" size={10} /> {card.topic}</div>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                {card.content && (
                  <p className={styles.cardText}>
                    {card.content.length > 160 ? card.content.slice(0, 160) + '...' : card.content}
                  </p>
                )}
              </>
            )}
          </div>
          )
        ))
      )}

      {selectedCard && <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} onNavigateToTopic={onNavigateToTopic} />}
      {editingCard && (
        <EditCardModal card={editingCard}
          onClose={() => setEditingCard(null)}
          onCardUpdated={onCardUpdated}
          onCardDeleted={onCardDeleted} />
      )}
    </div>
  );
}