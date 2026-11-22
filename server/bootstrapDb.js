import { pool } from './db.js';
import {
  SUPER_ADMIN_USER,
  INITIAL_POSTS,
  INITIAL_SAHITYA,
  INITIAL_HISTORY,
  INITIAL_EVENTS,
} from '../src/data/chhattisgarhData.js';

const TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    name_hi VARCHAR(150) NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    district VARCHAR(80) NOT NULL,
    district_hi VARCHAR(80) NOT NULL,
    block_village VARCHAR(150) NOT NULL,
    role ENUM('member', 'super_admin') DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(64) PRIMARY KEY,
    type ENUM('photo', 'event', 'article', 'announcement') DEFAULT 'photo',
    featured TINYINT(1) DEFAULT 0,
    status ENUM('pending', 'approved') DEFAULT 'pending',
    author_id VARCHAR(64) NOT NULL,
    author_name VARCHAR(150) NOT NULL,
    author_name_en VARCHAR(150) DEFAULT '',
    author_mobile VARCHAR(15) DEFAULT '',
    author_role ENUM('member', 'super_admin') DEFAULT 'member',
    district VARCHAR(80) NOT NULL,
    district_hi VARCHAR(80) NOT NULL,
    block_village VARCHAR(150) DEFAULT '',
    title_hi VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) DEFAULT '',
    content_hi TEXT NOT NULL,
    content_en TEXT,
    media_type ENUM('none', 'image', 'video', 'video-link') DEFAULT 'none',
    media_url LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_posts_status_created (status, created_at),
    INDEX idx_posts_district (district)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS post_likes (
    post_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id),
    CONSTRAINT fk_likes_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS post_comments (
    id VARCHAR(64) PRIMARY KEY,
    post_id VARCHAR(64) NOT NULL,
    author_name VARCHAR(150) NOT NULL,
    district_hi VARCHAR(80) DEFAULT '',
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    INDEX idx_comments_post (post_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS sahitya (
    id VARCHAR(64) PRIMARY KEY,
    category ENUM('aarti', 'bhajan', 'poem', 'article') NOT NULL,
    title_hi VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) DEFAULT '',
    author_hi VARCHAR(150) DEFAULT '',
    author_en VARCHAR(150) DEFAULT '',
    duration_sec INT DEFAULT 0,
    tempo INT DEFAULT 96,
    melody_key VARCHAR(40) DEFAULT 'aarti',
    audio_url TEXT,
    verses_json LONGTEXT NOT NULL,
    summary_en TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS history_items (
    id VARCHAR(64) PRIMARY KEY,
    era_hi VARCHAR(120) NOT NULL,
    era_en VARCHAR(120) DEFAULT '',
    category VARCHAR(50) DEFAULT 'chhattisgarh',
    title_hi VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) DEFAULT '',
    subtitle_hi VARCHAR(255) DEFAULT '',
    subtitle_en VARCHAR(255) DEFAULT '',
    summary_hi TEXT NOT NULL,
    summary_en TEXT,
    details_hi LONGTEXT NOT NULL,
    details_en LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(64) PRIMARY KEY,
    title_hi VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) DEFAULT '',
    event_date VARCHAR(32) NOT NULL,
    event_time VARCHAR(80) DEFAULT '',
    district VARCHAR(80) NOT NULL,
    district_hi VARCHAR(80) NOT NULL,
    venue_hi VARCHAR(255) NOT NULL,
    venue_en VARCHAR(255) DEFAULT '',
    description_hi TEXT,
    description_en TEXT,
    rsvp_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(64) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

/**
 * Automatically ensures all MySQL tables exist and seeds initial Chhattisgarh
 * Sahu Samaj data on first boot — ideal for Hostinger Node.js GitHub deploys
 * where SSH is optional.
 */
export async function ensureTablesAndSeed() {
  for (const stmt of TABLE_STATEMENTS) {
    await pool.query(stmt);
  }

  await pool.query(
    `INSERT IGNORE INTO users (id, name, name_hi, mobile, district, district_hi, block_village, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'super_admin')`,
    [
      SUPER_ADMIN_USER.id,
      SUPER_ADMIN_USER.name,
      SUPER_ADMIN_USER.nameHi,
      process.env.SUPER_ADMIN_MOBILE || SUPER_ADMIN_USER.mobile,
      SUPER_ADMIN_USER.district,
      SUPER_ADMIN_USER.districtHi,
      SUPER_ADMIN_USER.blockVillage,
    ]
  );

  await pool.query(
    `INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES ('require_approval', 'true')`
  );

  const [[{ postCount }]] = await pool.query('SELECT COUNT(*) AS postCount FROM posts');
  if (postCount === 0) {
    for (const p of INITIAL_POSTS) {
      await pool.query(
        `INSERT INTO posts
         (id, type, featured, status, author_id, author_name, author_name_en, author_mobile, author_role, district, district_hi, block_village, title_hi, title_en, content_hi, content_en, media_type, media_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          p.type,
          p.featured ? 1 : 0,
          p.status,
          p.authorRole === 'super_admin' ? SUPER_ADMIN_USER.id : `seed-${p.id}`,
          p.authorName,
          p.authorNameEn || p.authorName,
          p.authorMobile || '',
          p.authorRole || 'member',
          p.district,
          p.districtHi,
          p.blockVillage || '',
          p.titleHi,
          p.titleEn || p.titleHi,
          p.contentHi,
          p.contentEn || p.contentHi,
          p.mediaType || 'none',
          p.mediaUrl || '',
        ]
      );
      for (const uid of p.likes || []) {
        await pool.query('INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)', [
          p.id,
          uid,
        ]);
      }
      for (const c of p.comments || []) {
        await pool.query(
          'INSERT IGNORE INTO post_comments (id, post_id, author_name, district_hi, text) VALUES (?, ?, ?, ?, ?)',
          [c.id, p.id, c.authorName, c.districtHi || '', c.text]
        );
      }
    }
  }

  const [[{ sahityaCount }]] = await pool.query('SELECT COUNT(*) AS sahityaCount FROM sahitya');
  if (sahityaCount === 0) {
    for (const s of INITIAL_SAHITYA) {
      await pool.query(
        `INSERT INTO sahitya
         (id, category, title_hi, title_en, author_hi, author_en, duration_sec, tempo, melody_key, audio_url, verses_json, summary_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.id,
          s.category,
          s.titleHi,
          s.titleEn || s.titleHi,
          s.authorHi || '',
          s.authorEn || '',
          s.durationSec || 0,
          s.tempo || 96,
          s.melodyKey || 'aarti',
          s.audioUrl || '',
          JSON.stringify(s.verses || []),
          s.summaryEn || '',
        ]
      );
    }
  }

  const [[{ historyCount }]] = await pool.query(
    'SELECT COUNT(*) AS historyCount FROM history_items'
  );
  if (historyCount === 0) {
    for (const h of INITIAL_HISTORY) {
      await pool.query(
        `INSERT INTO history_items
         (id, era_hi, era_en, category, title_hi, title_en, subtitle_hi, subtitle_en, summary_hi, summary_en, details_hi, details_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          h.id,
          h.eraHi,
          h.eraEn || '',
          h.category || 'chhattisgarh',
          h.titleHi,
          h.titleEn || h.titleHi,
          h.subtitleHi || '',
          h.subtitleEn || '',
          h.summaryHi,
          h.summaryEn || '',
          h.detailsHi,
          h.detailsEn || '',
        ]
      );
    }
  }

  const [[{ eventCount }]] = await pool.query('SELECT COUNT(*) AS eventCount FROM events');
  if (eventCount === 0) {
    for (const ev of INITIAL_EVENTS) {
      await pool.query(
        `INSERT INTO events
         (id, title_hi, title_en, event_date, event_time, district, district_hi, venue_hi, venue_en, description_hi, description_en, rsvp_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ev.id,
          ev.titleHi,
          ev.titleEn || ev.titleHi,
          ev.date,
          ev.time || '',
          ev.district,
          ev.districtHi,
          ev.venueHi,
          ev.venueEn || ev.venueHi,
          ev.descriptionHi || '',
          ev.descriptionEn || '',
          ev.rsvpCount || 0,
        ]
      );
    }
  }
}
