import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import CardModal from '../components/CardModal';
import styles from './GardenPage.module.css';

export default function GardenPage({ username, session, onTopicsLoaded, onNavigateToTopic }) {
  const [profile, setProfile] = useState(null);
  const [pinnedCards, setPinnedCards] = useState([]);
  const [loading, setLoading] = useState(true);
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

      const { data: pinned } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', prof?.id)
        .eq('pinned', true)
        .order('created_at', { ascending: false });

      setProfile(prof);
      setPinnedCards(pinned || []);
      if (prof?.topics) onTopicsLoaded(prof.topics);
      setLoading(false);
    }
    load();
  }, [username]);

  if (loading) {
    return <div className={styles.loading}><span>🌱</span></div>;
  }

  if (!profile) {
    return (
      <div className={styles.notFound}>
        <h2>Garden not found</h2>
        <p>No garden exists at this address yet.</p>
        <a href="/" className={styles.homeLink}>← Go home</a>
      </div>
    );
  }

  const topics = profile?.topics || [];
  const hasPinned = pinnedCards.length > 0;

  return (
    <div className={`${styles.page} ${hasPinned ? styles.twoCol : ''}`}>

      <aside className={styles.intro}>
        <div className={styles.profileName}>
          {username}
          {isOwner && (
            <button className={styles.editBtn} title="Edit your garden">✏️</button>
          )}
        </div>

        {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

        {isOwner && topics.length === 0 && (
          <p className={styles.emptyHint}>
            Your garden is empty. Go through onboarding to add topics! 🌱
          </p>
        )}
      </aside>

      {hasPinned && (
        <main className={styles.pinnedArea}>
          <p className={styles.pinnedLabel}>Pinned ↓</p>
          <div className={styles.masonry}>
            {pinnedCards.map(card => (
              <div
                key={card.id}
                className={`${styles.card} ${!card.image_url ? styles.cardNoImage : ''}`}
                onClick={() => setSelectedCard(card)}
              >
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

      {selectedCard && (
        <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  );
}