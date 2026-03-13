import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import CardModal from '../components/CardModal';
import EditProfileModal from '../components/EditProfileModal';
import styles from './GardenPage.module.css';

export default function GardenPage({ username, session, onTopicsLoaded, onNavigateToTopic, dragMode }) {
  const [profile, setProfile]           = useState(null);
  const [pinnedCards, setPinnedCards]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editTab, setEditTab]           = useState('bio');

  // Drag state
  const dragCardId = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const [overIdx, setOverIdx]       = useState(null);

  const isOwner = session?.user?.user_metadata?.username === username ||
    session?.user?.email?.split('@')[0] === username;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: prof } = await supabase
        .from('profiles').select('*').eq('username', username).single();
      const { data: pinned } = await supabase
        .from('cards').select('*')
        .eq('user_id', prof?.id).eq('pinned', true)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });
      setProfile(prof);
      setPinnedCards(pinned || []);
      if (prof?.topics) onTopicsLoaded(prof.topics);
      setLoading(false);
    }
    load();
  }, [username]);

  // Listen for navbar "Edit bio" / "Manage topics" events
  useEffect(() => {
    function onEditBio()    { setEditTab('bio');    setShowEditProfile(true); }
    function onEditTopics() { setEditTab('topics'); setShowEditProfile(true); }
    window.addEventListener('leaflet:editbio',    onEditBio);
    window.addEventListener('leaflet:edittopics', onEditTopics);
    return () => {
      window.removeEventListener('leaflet:editbio',    onEditBio);
      window.removeEventListener('leaflet:edittopics', onEditTopics);
    };
  }, []);

  function onProfileSaved(updated) {
    setProfile(updated);
    if (updated?.topics) onTopicsLoaded(updated.topics);
  }

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
  // ──────────────────

  if (loading) return <div className={styles.loading}><span>🌱</span></div>;

  if (!profile) {
    return (
      <div className={styles.notFound}>
        <h2>Garden not found</h2>
        <p>No garden exists at this address yet.</p>
        <a href="/" className={styles.homeLink}>← Go home</a>
      </div>
    );
  }

  const topics    = profile?.topics || [];
  const hasPinned = pinnedCards.length > 0;

  return (
    <div className={`${styles.page} ${hasPinned ? styles.twoCol : ''}`}>

      <aside className={styles.intro}>
        <div className={styles.profileName}>
          {username}
          {isOwner && (
            <button
              className={styles.editBtn}
              title="Edit your garden"
              onClick={() => { setEditTab('bio'); setShowEditProfile(true); }}
            >✏️</button>
          )}
        </div>
        {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
        {isOwner && topics.length === 0 && (
          <p className={styles.emptyHint}>Your garden is empty. Go through onboarding to add topics! 🌱</p>
        )}
      </aside>

      {hasPinned && (
        <main className={styles.pinnedArea}>
          {dragMode && isOwner && (
            <div className={styles.dragBanner}>⠿ Drag mode — drag pinned cards to reorder.</div>
          )}
          <p className={styles.pinnedLabel}>Pinned ↓</p>
          <div className={styles.masonry}>
            {pinnedCards.map((card, idx) => (
              <div
                key={card.id}
                className={`
                  ${styles.card}
                  ${!card.image_url ? styles.cardNoImage : ''}
                  ${dragMode && isOwner ? styles.draggable : ''}
                  ${draggingId === card.id ? styles.isDragging : ''}
                  ${dragMode && overIdx === idx && draggingId !== card.id ? styles.isDragOver : ''}
                `}
                draggable={dragMode && isOwner}
                onDragStart={dragMode ? e => onDragStart(e, card) : undefined}
                onDragEnter={dragMode ? e => onDragEnter(e, card) : undefined}
                onDragOver={dragMode ? onDragOver : undefined}
                onDrop={dragMode ? e => onDrop(e, card) : undefined}
                onDragEnd={dragMode ? onDragEnd : undefined}
                onClick={() => !dragMode && setSelectedCard(card)}
              >
                {dragMode && isOwner && <div className={styles.dragHandle}>⠿</div>}
                {card.image_url ? (
                  <>
                    <img src={card.image_url} alt={card.title} className={styles.cardImg} />
                    <div className={styles.cardOverlay}>
                      <div className={styles.cardTopic}>📌 {card.topic}</div>
                      <h3 className={styles.cardTitle}>{card.title}</h3>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.cardTopic}>📌 {card.topic}</div>
                    <h3 className={styles.cardTitle}>{card.title}</h3>
                    {card.content && (
                      <p className={styles.cardText}>
                        {card.content.length > 100 ? card.content.slice(0, 100) + '...' : card.content}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </main>
      )}

      {selectedCard && <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />}

      {showEditProfile && (
        <EditProfileModal
          profile={profile}
          initialTab={editTab}
          onClose={() => setShowEditProfile(false)}
          onSaved={onProfileSaved}
        />
      )}
    </div>
  );
}