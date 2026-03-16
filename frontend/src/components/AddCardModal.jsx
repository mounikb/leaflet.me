import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './AddCardModal.module.css';
import Icon from './Icons';

const SIZE_OPTIONS = [
  { value: '1x1', label: '1×1', desc: 'Default', cols: 1, rows: 1 },
  { value: '1x2', label: '1×2', desc: 'Tall',    cols: 1, rows: 2 },
  { value: '2x1', label: '2×1', desc: 'Wide',    cols: 2, rows: 1 },
  { value: '2x2', label: '2×2', desc: 'Large',   cols: 2, rows: 2 },
];

export default function AddCardModal({ session, topics, onClose, onCardAdded }) {
  const [title, setTitle]             = useState('');
  const [content, setContent]         = useState('');
  const [topic, setTopic]             = useState(topics[0] || '');
  const [size, setSize]               = useState('1x1');
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState(null);

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!title.trim()) { setError('Please add a title.'); return; }
    setSaving(true);
    setError(null);

    let imageUrl = null;
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `${session.user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('card-images').upload(path, imageFile);
      if (uploadError) { setError('Image upload failed.'); setSaving(false); return; }
      const { data } = supabase.storage.from('card-images').getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    const { data: existing } = await supabase
      .from('cards').select('position')
      .eq('user_id', session.user.id).eq('topic', topic)
      .order('position', { ascending: false }).limit(1);
    const nextPosition = existing?.[0]?.position != null ? existing[0].position + 1 : 0;

    const { data, error: dbError } = await supabase.from('cards').insert({
      user_id: session.user.id,
      title: title.trim(),
      content: content.trim(),
      topic,
      image_url: imageUrl,
      position: nextPosition,
      size,
    }).select().single();

    setSaving(false);
    if (dbError) { setError('Something went wrong.'); return; }
    onCardAdded(data);
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <button className={styles.close} onClick={onClose}>✕</button>
        <h2 className={styles.title}>Add a card</h2>
        <p className={styles.sub}>Plant a new idea in your garden.</p>

        {topics.length > 1 && (
          <div className={styles.field}>
            <label className={styles.label}>Topic</label>
            <select className={styles.select} value={topic} onChange={e => setTopic(e.target.value)}>
              {topics.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Title</label>
          <input className={styles.input} placeholder="What's this about?"
            value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Content</label>
          <textarea className={styles.textarea} placeholder="Write something... a note, a thought, a recipe."
            value={content} onChange={e => setContent(e.target.value)} rows={4} />
        </div>

        {/* Size picker */}
        <div className={styles.field}>
          <label className={styles.label}>Card size</label>
          <div className={styles.sizePicker}>
            {SIZE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.sizeBtn} ${size === opt.value ? styles.sizeBtnActive : ''}`}
                onClick={() => setSize(opt.value)}
              >
                {/* Mini grid preview */}
                <div className={styles.sizePreview}>
                  <div
                    className={styles.sizeBlock}
                    style={{
                      gridColumn: `span ${opt.cols}`,
                      gridRow: `span ${opt.rows}`,
                    }}
                  />
                </div>
                <span className={styles.sizeBtnLabel}>{opt.label}</span>
                <span className={styles.sizeBtnDesc}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Image (optional)</label>
          {imagePreview ? (
            <div className={styles.previewWrap}>
              <img src={imagePreview} alt="preview" className={styles.preview} />
              <button className={styles.removeImg} onClick={() => { setImageFile(null); setImagePreview(null); }}>Remove</button>
            </div>
          ) : (
            <label className={styles.uploadBtn}>
              <Icon name="paperclip" size={13} /> Attach image
              <input type="file" accept="image/*" onChange={handleImage} hidden />
            </label>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Planting...' : 'Plant this card'}
          </button>
        </div>

      </div>
    </div>
  );
}