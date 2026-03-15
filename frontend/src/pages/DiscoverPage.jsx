import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './DiscoverPage.module.css';

const BANNER_COLORS = [
  '#C9B99A', '#A8B5A0', '#B5A8B5', '#C4A882',
  '#9BADB5', '#B5A99A', '#A0B0A8', '#C2A8A8',
];

function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.highlight}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function DiscoverPage({ onVisitGarden }) {
  const [gardens, setGardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('username, bio, topics')
        .eq('onboarded', true)
        .order('created_at', { ascending: false });
      setGardens(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? gardens.filter(g =>
        g.username?.toLowerCase().includes(q) ||
        g.bio?.toLowerCase().includes(q) ||
        g.topics?.some(t => t.toLowerCase().includes(q))
      )
    : gardens;

  if (loading) return <div className={styles.loading}><span>🌱</span></div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Discover gardens.</h1>
        <p className={styles.sub}>Explore what people are growing on Leaflet.</p>
      </div>

      {/* Search bar */}
      <div className={styles.searchWrap}>
        <div className={`${styles.searchBox} ${focused ? styles.searchBoxFocused : ''}`}>
          {/* Search icon */}
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>

          <input
            ref={inputRef}
            className={styles.search}
            placeholder="Search by name, topic, or bio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />

          {/* Clear button */}
          {search && (
            <button
              className={styles.clearBtn}
              onClick={() => { setSearch(''); inputRef.current?.focus(); }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Results count */}
        {q && (
          <p className={styles.resultsCount}>
            {filtered.length === 0
              ? 'No results'
              : `${filtered.length} garden${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          {q
            ? <>No gardens match <strong>"{search}"</strong> 🌿</>
            : 'No gardens yet. Be the first! 🌱'}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((garden, i) => (
            <button
              key={garden.username}
              className={styles.card}
              onClick={() => onVisitGarden(garden.username)}
            >
              <div
                className={styles.cardBanner}
                style={{ background: BANNER_COLORS[i % BANNER_COLORS.length] }}
              >
                <div className={styles.cardInitial}>
                  {garden.username?.[0]?.toUpperCase()}
                </div>
                <span className={styles.cardArrow}>↗</span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardName}>
                  {highlight(garden.username, search)}
                </div>
                {garden.bio && (
                  <p className={styles.cardBio}>
                    {highlight(garden.bio, search)}
                  </p>
                )}
                {garden.topics?.length > 0 && (
                  <div className={styles.cardTopics}>
                    {garden.topics.slice(0, 4).map(t => (
                      <span
                        key={t}
                        className={`${styles.topicTag} ${t.toLowerCase().includes(q) && q ? styles.topicTagMatch : ''}`}
                      >
                        {highlight(t, search)}
                      </span>
                    ))}
                    {garden.topics.length > 4 && (
                      <span className={styles.topicMore}>+{garden.topics.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}