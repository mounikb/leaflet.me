import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './EditProfileModal.module.css';

const DEFAULT_TOPICS = [
  'Writing', 'Photography', 'Reading', 'Code',
  'Art', 'Cooking', 'Travel', 'Music'
];

export default function EditProfileModal({ profile, initialTab = 'bio', onClose, onSaved }) {
  const [tab, setTab] = useState(initialTab);
  const [bio, setBio] = useState(profile?.bio || '');
  const [topics, setTopics] = useState(profile?.topics || []);
  const [customTopic, setCustomTopic] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggleTopic(topic) {
    setTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  }

  function addCustomTopic() {
    const t = customTopic.trim();
    if (t && !topics.includes(t)) setTopics(prev => [...prev, t]);
    setCustomTopic('');
    setShowCustomInput(false);
  }

  async function handleSave() {
    setSaving(true);
    const { data } = await supabase
      .from('profiles')
      .update({ bio: bio.trim(), topics })
      .eq('id', profile.id)
      .select()
      .single();
    setSaving(false);
    onSaved(data);
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <button className={styles.close} onClick={onClose}>✕</button>
        <h2 className={styles.title}>Edit your garden</h2>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'bio' ? styles.tabActive : ''}`} onClick={() => setTab('bio')}>
            Bio
          </button>
          <button className={`${styles.tab} ${tab === 'topics' ? styles.tabActive : ''}`} onClick={() => setTab('topics')}>
            Topics
          </button>
        </div>

        {/* Bio tab */}
        {tab === 'bio' && (
          <div className={styles.section}>
            <p className={styles.hint}>This shows on your garden page. Keep it short and personal.</p>
            <textarea
              className={styles.textarea}
              placeholder="e.g. I make sourdough, read too much, and think about fonts obsessively..."
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={5}
            />
          </div>
        )}

        {/* Topics tab */}
        {tab === 'topics' && (
          <div className={styles.section}>
            <p className={styles.hint}>Select topics for your garden. These appear in your navbar.</p>
            <div className={styles.topicGrid}>
              {DEFAULT_TOPICS.map(t => (
                <button
                  key={t}
                  className={`${styles.topicBtn} ${topics.includes(t) ? styles.topicSelected : ''}`}
                  onClick={() => toggleTopic(t)}
                >
                  {topics.includes(t) && <span>✓ </span>}{t}
                </button>
              ))}

              {/* Custom topics */}
              {topics.filter(t => !DEFAULT_TOPICS.includes(t)).map(t => (
                <button
                  key={t}
                  className={`${styles.topicBtn} ${styles.topicSelected}`}
                  onClick={() => toggleTopic(t)}
                >
                  ✓ {t}
                </button>
              ))}

              {showCustomInput ? (
                <div className={styles.customWrap}>
                  <input
                    className={styles.customInput}
                    placeholder="e.g. Ceramics..."
                    value={customTopic}
                    onChange={e => setCustomTopic(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomTopic()}
                    autoFocus
                  />
                  <button className={styles.customAddBtn} onClick={addCustomTopic}>Add</button>
                </div>
              ) : (
                <button className={styles.plusBtn} onClick={() => setShowCustomInput(true)}>+ Custom</button>
              )}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes ✓'}
          </button>
        </div>

      </div>
    </div>
  );
}