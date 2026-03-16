import React from 'react';
import heroImg from '../assets/hero-cottage.jpg';
import Icon from './Icons';
import styles from './Hero.module.css';

const PREVIEW_CARDS = [
  { topic: 'Reading',  title: 'Why I read 50 books a year',              description: 'It started as a challenge and became the best habit of my life.', tall: true },
  { topic: 'Movies',  title: 'Films that changed how I see the world',   description: 'A quiet collection of stories that stayed with me.' },
  { topic: 'Travel',  title: 'Three weeks in Japan with no plan',        description: "Sometimes the best trips are the ones you don't plan." },
  { topic: 'Code',    title: 'Building in public — what I learned',      description: 'Shipping imperfect things is better than never shipping at all.' },
  { topic: 'Music',   title: 'Albums I return to every year',            description: 'Some records never stop revealing new things.' },
  { topic: 'Writing', title: 'On keeping a journal for 10 years',        description: 'A small practice that quietly changed everything.', tall: true },
];

const HOW_ITEMS = [
  { icon: 'seedling', title: 'Plant your ideas',       desc: 'Start with a seed — a thought, a bookmark, a sketch. Watch it grow into something meaningful over time.' },
  { icon: 'book',     title: "Curate, don't perform",  desc: 'No likes, no followers. Just a quiet space to collect the things that matter to you.' },
  { icon: 'pencil',   title: 'Write at your own pace', desc: 'No publishing pressure. Add a sentence today, a paragraph next week. Your garden grows with you.' },
];

export default function Hero({ onAuthClick, planting }) {
  return (
    <div className={styles.page}>

      {/* ── Section 1: Hero ── */}
      <section className={styles.heroSection}>
        <div className={styles.heroLeft}>
          <span className={styles.eyebrow}>Your digital garden awaits</span>

          <h1 className={styles.heroHeadline}>
            Grow your<br />
            <em className={styles.heroItalic}>ideas</em> here.
          </h1>

          <p className={styles.heroSub}>
            Leaflet is a quiet corner of the internet where you can collect,
            write, and share the things that matter — no algorithms, no noise.
          </p>

          <div className={styles.heroCta}>
            <button onClick={onAuthClick} className={styles.btnPrimary} disabled={planting}>
              {planting ? 'Opening garden...' : 'Plant your garden →'}
            </button>
            <button onClick={onAuthClick} className={styles.btnOutline}>
              Explore gardens
            </button>
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.heroImgWrap}>
            <img src={heroImg} alt="A cosy writing desk with flowers and tea" className={styles.heroImg} />
          </div>
          <p className={styles.heroCaption}>Your quiet corner of the internet</p>
        </div>
      </section>

      {/* ── Section 2: Preview cards ── */}
      <section className={styles.previewSection}>
        <div className={styles.sectionLabel}>
          <span>What people are growing</span>
          <div className={styles.labelLine} />
        </div>
        <div className={styles.previewGrid}>
          {PREVIEW_CARDS.map((card, i) => (
            <div
              key={i}
              className={`${styles.previewCard} ${card.tall ? styles.previewCardTall : ''}`}
              style={{ animationDelay: `${0.35 + i * 0.07}s` }}
            >
              <div>
                <span className={styles.previewTopic}>{card.topic}</span>
                <p className={styles.previewTitle}>{card.title}</p>
              </div>
              <p className={styles.previewDesc}>{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: How it works ── */}
      <section className={styles.howSection}>
        <div className={styles.howHeader}>
          <span className={styles.eyebrow}>How it works</span>
          <h2 className={styles.howTitle}>Grown slowly, made by hand.</h2>
          <p className={styles.howSub}>
            A digital garden isn't a blog. It's a living collection of ideas — messy,
            evolving, and entirely yours.
          </p>
        </div>
        <div className={styles.howGrid}>
          {HOW_ITEMS.map(({ icon, title, desc }) => (
            <div key={title} className={styles.howCard}>
              <div className={styles.howIconWrap}><Icon name={icon} size={20} color="hsl(22,35%,35%)" /></div>
              <h3 className={styles.howCardTitle}>{title}</h3>
              <p className={styles.howCardDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: Quote ── */}
      <section className={styles.quoteSection}>
        <blockquote className={styles.quote}>
          "The garden is a metaphor for the mind — you don't need to show
          everything at once. Let things bloom when they're ready."
        </blockquote>
        <p className={styles.quoteAttrib}>— A fellow gardener</p>
      </section>

      {/* ── Section 5: CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBox}>
          <h2 className={styles.ctaTitle}>Ready to start growing?</h2>
          <p className={styles.ctaSub}>
            Your garden is waiting. No algorithms, no noise — just you
            and your ideas, growing at their own pace.
          </p>
          <div className={styles.ctaButtons}>
            <button onClick={onAuthClick} className={styles.btnPrimary} disabled={planting}>
              {planting ? 'Opening garden...' : 'Plant your garden →'}
            </button>
            <button onClick={onAuthClick} className={styles.btnOutline}>
              See examples
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}