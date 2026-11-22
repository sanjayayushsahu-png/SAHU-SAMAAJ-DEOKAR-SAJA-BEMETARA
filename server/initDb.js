import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import {
  SUPER_ADMIN_USER,
  INITIAL_POSTS,
  INITIAL_SAHITYA,
  INITIAL_HISTORY,
  INITIAL_EVENTS,
} from '../src/data/chhattisgarhData.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Connect without database first so CREATE DATABASE works
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  try {
    console.log('⏳ Creating MySQL database and tables (utf8mb4)...');
    await connection.query(schemaSql);

    const dbName = process.env.DB_NAME || 'sahu_samaj_cg';
    await connection.query(`USE \`${dbName}\``);

    // 1. Seed Super Admin: Sanjay Kumar Sahu
    await connection.query(
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

    // 2. Seed app settings
    await connection.query(
      `INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES ('require_approval', 'true')`
    );

    // 3. Seed Posts if empty
    const [[{ postCount }]] = await connection.query('SELECT COUNT(*) AS postCount FROM posts');
    if (postCount === 0) {
      for (const p of INITIAL_POSTS) {
        await connection.query(
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
          await connection.query(
            'INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)',
            [p.id, uid]
          );
        }

        for (const c of p.comments || []) {
          await connection.query(
            'INSERT IGNORE INTO post_comments (id, post_id, author_name, district_hi, text) VALUES (?, ?, ?, ?, ?)',
            [c.id, p.id, c.authorName, c.districtHi || '', c.text]
          );
        }
      }
      console.log(`✅ Seeded ${INITIAL_POSTS.length} community posts.`);
    }

    // 4. Seed Sahitya if empty
    const [[{ sahityaCount }]] = await connection.query('SELECT COUNT(*) AS sahityaCount FROM sahitya');
    if (sahityaCount === 0) {
      for (const s of INITIAL_SAHITYA) {
        await connection.query(
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
      console.log(`✅ Seeded ${INITIAL_SAHITYA.length} Sahitya & Bhajan items.`);
    }

    // 5. Seed History if empty
    const [[{ historyCount }]] = await connection.query('SELECT COUNT(*) AS historyCount FROM history_items');
    if (historyCount === 0) {
      for (const h of INITIAL_HISTORY) {
        await connection.query(
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
      console.log(`✅ Seeded ${INITIAL_HISTORY.length} history timeline items.`);
    }

    // 6. Seed Events if empty
    const [[{ eventCount }]] = await connection.query('SELECT COUNT(*) AS eventCount FROM events');
    if (eventCount === 0) {
      for (const ev of INITIAL_EVENTS) {
        await connection.query(
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
      console.log(`✅ Seeded ${INITIAL_EVENTS.length} upcoming events.`);
    }

    console.log('🎉 MySQL database initialization complete!');
  } finally {
    await connection.end();
  }
}

initDatabase().catch((err) => {
  console.error('❌ Database initialization failed:', err.message);
  process.exit(1);
});
