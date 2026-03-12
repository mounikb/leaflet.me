import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import AddCardModal from '../components/AddCardModal';
import CardModal from '../components/CardModal';
import styles from './TopicPage.module.css';

export default function TopicPage({ username, topic, session, onBack }) {
  const [profile, setProfile] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const isOwner = session?.user?.user_metadata?.username === username ||
    session?.user?.email?.split('@')[0] === username;

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      const { data: cardData } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', prof?.id)
        .eq('topic', topic)
        .order('created_at', { ascending: false });

      setProfile(prof);
      setCards(cardData || []);
      setLoading(false);
    }
    load();
  }, [username, topic]);

  async function handlePin(card) {
    const newPinned = !card.pinned;
    await supabase
      .from('cards')
      .update({ pinned: newPinned })
      .eq('id', card.id);

    setCards(prev =>
      prev.map(c => c.id === card.id ? { ...c, pinned: newPinned } : c)
    );
  }

  function onCardAdded(card) {
    setCards(prev => [card, ...prev]);
  }

  if (loading) {
    return <div className={styles.loading}><span>🌱</span></div>;
  }

  return (
    <div className={styles.page}>

      {/* Page header */}
      <div className={styles.header}>
        <h1 className={styles.title}>{topic.toLowerCase()}.</h1>
      </div>

      {/* Cards grid — 4 columns like Chester */}
      {cards.length > 0 ? (
        <div className={styles.grid}>
          {cards.map(card => (
            <div
              key={card.id}
              className={styles.card}
              onClick={() => setSelectedCard(card)}
            >
              {/* Pin button — top right, owner only */}
              {isOwner && (
                <button
                  className={`${styles.pinBtn} ${card.pinned ? styles.pinned : ''}`}
                  onClick={e => { e.stopPropagation(); handlePin(card); }}
                  title={card.pinned ? 'Unpin from garden' : 'Pin to garden'}
                >
                  {card.pinned ? '📌' : '⊕'}
                </button>
              )}

              {/* Arrow — top right like Chester */}
              <div className={styles.cardMeta}>
                {topic} · Blog
                <span className={styles.arrow}>↗</span>
              </div>

              {card.image_url && (
                <img src={card.image_url} alt={card.title} className={styles.cardImg} />
              )}

              <h3 className={styles.cardTitle}>{card.title}</h3>

              <div className={styles.cardDate}>
                {new Date(card.created_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })}
              </div>

              {card.content && (
                <p className={styles.cardExcerpt}>
                  {card.content.length > 120
                    ? card.content.slice(0, 120) + '...'
                    : card.content}
                </p>
              )}
            </div>
          ))}
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

      {/* Floating add button — owner only */}
      {isOwner && cards.length > 0 && (
        <button className={styles.fab} onClick={() => setShowAddCard(true)}>+</button>
      )}

      {/* Modals */}
      {showAddCard && (
        <AddCardModal
          session={session}
          topics={[topic]}
          onClose={() => setShowAddCard(false)}
          onCardAdded={onCardAdded}
        />
      )}

      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}

    </div>
  );
}