import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import AddCardModal from '../components/AddCardModal';
import CardModal from '../components/CardModal';
import EditCardModal from '../components/EditCardModal';
import styles from './TopicPage.module.css';

export default function TopicPage({ username, topic, session, onBack }) {
  const [profile, setProfile] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [editingCard, setEditingCard] = useState(null);

  const isOwner = session?.user?.user_metadata?.username === username ||
    session?.user?.email?.split('@')[0] === username;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: prof } = await supabase
        .from('profiles').select('*').eq('username', username).single();
      const { data: cardData } = await supabase
        .from('cards').select('*')
        .eq('user_id', prof?.id).eq('topic', topic)
        .order('created_at', { ascending: false });
      setProfile(prof);
      setCards(cardData || []);
      setLoading(false);
    }
    load();
  }, [username, topic]);

  async function handlePin(card) {
    const newPinned = !card.pinned;
    await supabase.from('cards').update({ pinned: newPinned }).eq('id', card.id);
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, pinned: newPinned } : c));
  }

  function onCardAdded(card) {
    setCards(prev => [card, ...prev]);
  }

  function onCardUpdated(updated) {
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
  }

  function onCardDeleted(id) {
    setCards(prev => prev.filter(c => c.id !== id));
  }

  if (loading) return <div className={styles.loading}><span>🌱</span></div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{topic.toLowerCase()}.</h1>
      </div>

      {cards.length > 0 ? (
        <div className={styles.grid}>
          {cards.map(card => (
            <div
              key={card.id}
              className={`${styles.card} ${!card.image_url ? styles.cardNoImage : ''}`}
              onClick={() => setSelectedCard(card)}
            >
              {/* Owner action buttons */}
              {isOwner && (
                <div className={styles.cardActions}>
                  <button
                    className={`${styles.actionBtn} ${card.pinned ? styles.pinned : ''}`}
                    onClick={e => { e.stopPropagation(); handlePin(card); }}
                    title={card.pinned ? 'Unpin' : 'Pin to garden'}
                  >
                    {card.pinned ? '📌' : '⊕'}
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={e => { e.stopPropagation(); setEditingCard(card); }}
                    title="Edit card"
                  >
                    ✏️
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
                  <div className={styles.cardMeta}>{topic}</div>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  <div className={styles.cardDate}>
                    {new Date(card.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  {card.content && (
                    <p className={styles.cardExcerpt}>
                      {card.content.length > 120 ? card.content.slice(0, 120) + '...' : card.content}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}

          {isOwner && (
            <button className={styles.addCard} onClick={() => setShowAddCard(true)}>
              <span className={styles.addIcon}>+</span>
              <span className={styles.addLabel}>Add a card</span>
            </button>
          )}
        </div>
      ) : (
        <div className={styles.empty}>
          <p>No cards in {topic} yet.</p>
          {isOwner && (
            <button className={styles.addFirstBtn} onClick={() => setShowAddCard(true)}>
              Plant the first one 🌱
            </button>
          )}
        </div>
      )}

      {showAddCard && (
        <AddCardModal
          session={session} topics={[topic]}
          onClose={() => setShowAddCard(false)}
          onCardAdded={onCardAdded}
        />
      )}

      {selectedCard && (
        <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}

      {editingCard && (
        <EditCardModal
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onCardUpdated={onCardUpdated}
          onCardDeleted={onCardDeleted}
        />
      )}
    </div>
  );
}