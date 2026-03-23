import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './AddBookModal.module.css';
import Icon from './Icons';

export default function AddBookModal({ session, topic, onClose, onCardAdded }) {
  const [step, setStep]               = useState('intro');
  const [source, setSource]           = useState(null);
  const [title, setTitle]             = useState('');
  const [author, setAuthor]           = useState('');
  const [review, setReview]           = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [rating, setRating]           = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [bookStatus, setBookStatus]   = useState('read');
  const [coverFile, setCoverFile]     = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverOptions, setCoverOptions] = useState([]);
  const [fetching, setFetching]       = useState(false);
  const [fetchError, setFetchError]   = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  // ── Fetch cover — always uses both title + author ──
  async function fetchCover() {
    if (!title.trim()) { setFetchError('Enter a title first.'); return; }
    setFetching(true); setFetchError('');
    try {
      // Search with title + author for precision
      const titleQuery = title.trim();
      const authorQuery = author.trim();
      const q = encodeURIComponent(authorQuery
        ? `title:${titleQuery} author:${authorQuery}`
        : titleQuery
      );
      const res = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=10&fields=cover_i,title,author_name`);
      const data = await res.json();
      const options = (data.docs || [])
        .filter(b => b.cover_i)
        .slice(0, 6)
        .map(b => ({
          url: `https://covers.openlibrary.org/b/id/${b.cover_i}-L.jpg`,
          title: b.title,
          author: b.author_name?.[0] || '',
        }));
      if (options.length > 0) {
        setCoverOptions(options);
        if (!author && options[0].author) setAuthor(options[0].author);
      } else {
        setFetchError('No covers found. Try uploading one instead.');
      }
    } catch {
      setFetchError('Could not fetch covers. Check your connection.');
    }
    setFetching(false);
  }

  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!title.trim()) { setError('Please add a title.'); return; }
    setSaving(true); setError('');

    // Resolve the cover image URL:
    // - If coverFile is set, upload it to Supabase Storage and use the public URL
    // - If coverPreview is an external URL (e.g. openlibrary fallback when CORS blocked fetch), use it as-is
    // - If coverPreview is a blob: URL but coverFile is null (shouldn't happen normally), treat as no cover
    let imageUrl = null;

    if (coverFile) {
      const ext = coverFile.name.split('.').pop();
      const path = `${session.user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('card-images').upload(path, coverFile);
      if (uploadError) { setError('Cover upload failed.'); setSaving(false); return; }
      const { data } = supabase.storage.from('card-images').getPublicUrl(path);
      imageUrl = data.publicUrl;
    } else if (coverPreview && !coverPreview.startsWith('blob:')) {
      // External URL (e.g. openlibrary.org) — store directly
      imageUrl = coverPreview;
    }
    // If coverPreview is a blob: URL without a coverFile, skip it (stale object URL)

    const { data: existing } = await supabase
      .from('cards').select('position')
      .eq('user_id', session.user.id).eq('topic', topic)
      .order('position', { ascending: false }).limit(1);
    const nextPosition = existing?.[0]?.position != null ? existing[0].position + 1 : 0;

    const { data, error: dbError } = await supabase.from('cards').insert({
      user_id: session.user.id,
      title: title.trim(),
      content: review.trim(),
      topic,
      image_url: imageUrl,
      position: nextPosition,
      size: '1x1',
      card_type: 'book',
      author: author.trim(),
      rating,
      book_status: bookStatus,
      external_url: source === 'external' ? externalUrl.trim() : null,
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

        {/* ── Intro step ── */}
        {step === 'intro' && (
          <div className={styles.introStep}>
            <div className={styles.introIcon}><Icon name="books" circle size={28} /></div>
            <h2 className={styles.introTitle}>Add a book</h2>
            <p className={styles.introText}>
              Leaflet lets you keep your reading life in one place.
              Write your review here, or link out to your Goodreads,
              StoryGraph, or anywhere else you already posted it.
            </p>
            <div className={styles.sourceGrid}>
              <button className={styles.sourceBtn}
                onClick={() => { setSource('leaflet'); setStep('details'); }}>
                <span className={styles.sourceBtnIcon}><Icon name="write" circle size={20} /></span>
                <span className={styles.sourceBtnLabel}>Write on Leaflet</span>
                <span className={styles.sourceBtnDesc}>Add your review, rating and cover right here</span>
              </button>
              <button className={styles.sourceBtn}
                onClick={() => { setSource('external'); setStep('details'); }}>
                <span className={styles.sourceBtnIcon}><Icon name="link" circle size={20} /></span>
                <span className={styles.sourceBtnLabel}>Link a review</span>
                <span className={styles.sourceBtnDesc}>Paste your Goodreads, StoryGraph or blog link</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Details step ── */}
        {step === 'details' && (
          <div className={styles.detailsStep}>
            <button className={styles.back} onClick={() => setStep('intro')}>← Back</button>
            <h2 className={styles.detailsTitle}>
              {source === 'external' ? 'Link your review' : 'Write your review'}
            </h2>

            {/* Title + Author — with autocomplete */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Title *</label>
                <input className={styles.input} placeholder="e.g. The Alchemist"
                  value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Author</label>
                <input className={styles.input} placeholder="Paulo Coelho"
                  value={author} onChange={e => setAuthor(e.target.value)} />
              </div>
            </div>

            {/* External URL */}
            {source === 'external' && (
              <div className={styles.field}>
                <label className={styles.label}>Review URL *</label>
                <div className={styles.urlWrap}>
                  <Icon name="link" size={14} color="hsl(22,35%,45%)" />
                  <input className={styles.urlInput} placeholder="https://goodreads.com/review/..."
                    value={externalUrl} onChange={e => setExternalUrl(e.target.value)} />
                </div>
                {externalUrl && (
                  <a href={externalUrl} target="_blank" rel="noopener noreferrer" className={styles.urlPreview}>
                    ↗ Preview link
                  </a>
                )}
              </div>
            )}

            {/* Review */}
            <div className={styles.field}>
              <label className={styles.label}>
                {source === 'external' ? 'Short note (optional)' : 'Your review'}
              </label>
              <textarea className={styles.textarea} rows={4}
                placeholder={source === 'external' ? 'A sentence about why you loved it...' : 'What did you think?'}
                value={review} onChange={e => setReview(e.target.value)} />
            </div>

            {/* Status + Rating */}
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Status</label>
                <select className={styles.select} value={bookStatus}
                  onChange={e => setBookStatus(e.target.value)}>
                  <option value="read">Read</option>
                  <option value="reading">Reading</option>
                  <option value="to-read">To Read</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Rating</label>
                <div className={styles.stars}>
                  {[1,2,3,4,5].map(i => (
                    <button key={i} type="button"
                      className={`${styles.star} ${i <= (hoverRating || rating) ? styles.starFilled : ''}`}
                      onMouseEnter={() => setHoverRating(i)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(i)}>★</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cover */}
            <div className={styles.field}>
              <label className={styles.label}>Book cover</label>
              {coverPreview ? (
                <div className={styles.coverPreviewWrap}>
                  <div className={styles.book3d}>
                    <img src={coverPreview} alt="cover" className={styles.bookCover} />
                    <div className={styles.bookSpine} />
                  </div>
                  <button className={styles.removeCover}
                    onClick={() => { setCoverPreview(null); setCoverFile(null); setCoverOptions([]); }}>
                    Remove
                  </button>
                </div>
              ) : coverOptions.length > 0 ? (
                <div className={styles.coverPicker}>
                  <p className={styles.coverPickerLabel}>Pick the right edition:</p>
                  <div className={styles.coverPickerGrid}>
                    {coverOptions.map((opt, i) => (
                      <button key={i} className={styles.coverOption}
                        onClick={async () => {
                          setCoverOptions([]);
                          try {
                            const resp = await fetch(opt.url);
                            const blob = await resp.blob();
                            const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
                            setCoverFile(file);
                            setCoverPreview(URL.createObjectURL(file));
                          } catch {
                            setCoverPreview(opt.url);
                          }
                        }}
                        title={`${opt.title}${opt.author ? ' — ' + opt.author : ''}`}
                      >
                        <img src={opt.url} alt={opt.title} className={styles.coverOptionImg} />
                        <span className={styles.coverOptionTitle}>
                          {opt.title}
                          {opt.author && <span className={styles.coverOptionAuthor}>{opt.author}</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button className={styles.coverPickerCancel} onClick={() => setCoverOptions([])}>
                    None of these — upload instead
                  </button>
                </div>
              ) : (
                <div className={styles.coverOptions}>
                  <button
                    className={`${styles.coverBtn} ${fetching ? styles.coverBtnLoading : ''}`}
                    onClick={fetchCover} disabled={fetching}>
                    {fetching ? '🔍 Searching...' : '✨ Fetch automatically'}
                  </button>
                  <span className={styles.coverOr}>or</span>
                  <label className={styles.coverBtn}>
                    <Icon name="paperclip" size={13} /> Upload image
                    <input type="file" accept="image/*" onChange={handleUpload} hidden />
                  </label>
                </div>
              )}
              {fetchError && <p className={styles.fetchError}>{fetchError}</p>}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Add to shelf'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}