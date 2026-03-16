import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './TopicsPage.module.css';
import Icon from '../components/Icons';

export default function TopicsPage({ onVisitGarden }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('username, topics')
        .eq('onboarded', true);

      // Aggregate topics across all users
      const map = {};
      (data || []).forEach(profile => {
        (profile.topics || []).forEach(topic => {
          if (!map[topic]) map[topic] = [];
          map[topic].push(profile.username);
        });
      });

      const sorted = Object.entries(map)
        .map(([name, users]) => ({ name, count: users.length, users }))
        .sort((a, b) => b.count - a.count);

      setTopics(sorted);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = search.trim()
    ? topics.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : topics;

  if (loading) return (
    <div className={styles.loading}>
      <Icon name="leaf" size={36} color="hsl(22,35%,45%)" />
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Topics.</h1>
        <p className={styles.sub}>Everything people are growing on Leaflet.</p>
      </div>

      <div className={styles.searchWrap}>
        <div className={`${styles.searchBox} ${focused ? styles.searchBoxFocused : ''}`}>
          <Icon name="leaf" size={14} color={focused ? 'hsl(22,35%,35%)' : 'hsl(38,12%,68%)'} />
          <input
            className={styles.search}
            placeholder="Search topics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        {search && (
          <p className={styles.resultsCount}>
            {filtered.length === 0 ? 'No topics found' : `${filtered.length} topic${filtered.length !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      <div className={styles.grid}>
        {filtered.map(topic => (
          <div key={topic.name} className={styles.card}>
            <div className={styles.cardName}>{topic.name}</div>
            <div className={styles.cardCount}>
              {topic.count} {topic.count === 1 ? 'garden' : 'gardens'}
            </div>
            <div className={styles.cardGardens}>
              {topic.users.slice(0, 5).map(u => (
                <button key={u} className={styles.gardenPill}
                  onClick={() => onVisitGarden(u)}>
                  {u}
                </button>
              ))}
              {topic.users.length > 5 && (
                <span className={styles.more}>+{topic.users.length - 5} more</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {topics.length === 0 && (
        <div className={styles.empty}>
          <Icon name="seedling" circle size={28} />
          <p>No topics yet. Be the first to plant one! 🌱</p>
        </div>
      )}
    </div>
  );
}