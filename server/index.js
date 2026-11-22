import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { pool, testConnection } from './db.js';
import { ensureTablesAndSeed } from './bootstrapDb.js';
import { SUPER_ADMIN_USER } from '../src/data/chhattisgarhData.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 5000);
const AUTH_SECRET = process.env.AUTH_SECRET || 'sahu-samaj-cg-dev-secret-change-me';
const SUPER_ADMIN_PIN = process.env.SUPER_ADMIN_PIN || '1234';
const SUPER_ADMIN_MOBILE = process.env.SUPER_ADMIN_MOBILE || SUPER_ADMIN_USER.mobile;

app.use(cors());
app.use(express.json({ limit: '6mb' }));

// --- Lightweight HMAC-SHA256 Token Helpers ---
function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function authOptional(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  req.user = token ? verifyToken(token) : null;
  next();
}

function requireAuth(req, res, next) {
  authOptional(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  });
}

function requireSuperAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin access required' });
    }
    next();
  });
}

// --- Health Check ---
app.get('/api/health', async (_req, res) => {
  try {
    await testConnection();
    res.json({ ok: true, database: 'mysql', status: 'connected' });
  } catch (err) {
    res.status(503).json({ ok: false, database: 'mysql', error: err.message });
  }
});

// --- Auth: Member Register / Login ---
app.post('/api/auth/member', async (req, res) => {
  try {
    const { name, mobile, district, districtHi, blockVillage } = req.body || {};
    const cleanMobile = String(mobile || '').replace(/\D/g, '');
    if (!name?.trim() || cleanMobile.length !== 10 || !blockVillage?.trim()) {
      return res.status(400).json({ error: 'Name, 10-digit mobile, and block/village are required' });
    }

    const isSuperAdmin = cleanMobile === SUPER_ADMIN_MOBILE;
    const id = isSuperAdmin ? SUPER_ADMIN_USER.id : `member-${cleanMobile}`;
    const role = isSuperAdmin ? 'super_admin' : 'member';
    const finalName = isSuperAdmin ? SUPER_ADMIN_USER.name : name.trim();
    const finalNameHi = isSuperAdmin ? SUPER_ADMIN_USER.nameHi : name.trim();

    await pool.query(
      `INSERT INTO users (id, name, name_hi, mobile, district, district_hi, block_village, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         name_hi = VALUES(name_hi),
         district = VALUES(district),
         district_hi = VALUES(district_hi),
         block_village = VALUES(block_village)`,
      [
        id,
        finalName,
        finalNameHi,
        cleanMobile,
        district || 'Bemetara',
        districtHi || 'बेमेतरा',
        blockVillage.trim(),
        role,
      ]
    );

    const user = {
      id,
      name: finalName,
      nameHi: finalNameHi,
      mobile: cleanMobile,
      district: district || 'Bemetara',
      districtHi: districtHi || 'बेमेतरा',
      blockVillage: blockVillage.trim(),
      role,
    };

    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Auth: Super Admin Login (Sanjay Kumar Sahu) ---
app.post('/api/auth/admin', async (req, res) => {
  try {
    const { pin } = req.body || {};
    if (String(pin || '').trim() !== SUPER_ADMIN_PIN) {
      return res.status(401).json({ error: 'Invalid Admin PIN' });
    }
    const user = { ...SUPER_ADMIN_USER, mobile: SUPER_ADMIN_MOBILE };
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Bootstrap: Fetch all community data in one fast request ---
app.get('/api/bootstrap', authOptional, async (_req, res) => {
  try {
    const [postRows] = await pool.query('SELECT * FROM posts ORDER BY created_at DESC LIMIT 100');
    const [likeRows] = await pool.query('SELECT post_id, user_id FROM post_likes');
    const [commentRows] = await pool.query('SELECT * FROM post_comments ORDER BY created_at ASC');
    const [sahityaRows] = await pool.query('SELECT * FROM sahitya ORDER BY created_at DESC');
    const [historyRows] = await pool.query('SELECT * FROM history_items ORDER BY created_at ASC');
    const [eventRows] = await pool.query('SELECT * FROM events ORDER BY event_date ASC');
    const [settingRows] = await pool.query('SELECT * FROM app_settings');

    const likesByPost = {};
    for (const r of likeRows) {
      if (!likesByPost[r.post_id]) likesByPost[r.post_id] = [];
      likesByPost[r.post_id].push(r.user_id);
    }

    const commentsByPost = {};
    for (const c of commentRows) {
      if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
      commentsByPost[c.post_id].push({
        id: c.id,
        authorName: c.author_name,
        districtHi: c.district_hi,
        text: c.text,
        createdAt: c.created_at,
      });
    }

    const posts = postRows.map((p) => ({
      id: p.id,
      type: p.type,
      featured: Boolean(p.featured),
      status: p.status,
      authorName: p.author_name,
      authorNameEn: p.author_name_en,
      authorMobile: p.author_mobile,
      authorRole: p.author_role,
      district: p.district,
      districtHi: p.district_hi,
      blockVillage: p.block_village,
      createdAt: p.created_at,
      titleHi: p.title_hi,
      titleEn: p.title_en,
      contentHi: p.content_hi,
      contentEn: p.content_en,
      mediaType: p.media_type,
      mediaUrl: p.media_url,
      likes: likesByPost[p.id] || [],
      comments: commentsByPost[p.id] || [],
    }));

    const sahitya = sahityaRows.map((s) => ({
      id: s.id,
      category: s.category,
      titleHi: s.title_hi,
      titleEn: s.title_en,
      authorHi: s.author_hi,
      authorEn: s.author_en,
      durationSec: s.duration_sec,
      tempo: s.tempo,
      melodyKey: s.melody_key,
      audioUrl: s.audio_url,
      verses: JSON.parse(s.verses_json || '[]'),
      summaryEn: s.summary_en,
    }));

    const historyItems = historyRows.map((h) => ({
      id: h.id,
      eraHi: h.era_hi,
      eraEn: h.era_en,
      category: h.category,
      titleHi: h.title_hi,
      titleEn: h.title_en,
      subtitleHi: h.subtitle_hi,
      subtitleEn: h.subtitle_en,
      summaryHi: h.summary_hi,
      summaryEn: h.summary_en,
      detailsHi: h.details_hi,
      detailsEn: h.details_en,
    }));

    const events = eventRows.map((ev) => ({
      id: ev.id,
      titleHi: ev.title_hi,
      titleEn: ev.title_en,
      date: ev.event_date,
      time: ev.event_time,
      district: ev.district,
      districtHi: ev.district_hi,
      venueHi: ev.venue_hi,
      venueEn: ev.venue_en,
      descriptionHi: ev.description_hi,
      descriptionEn: ev.description_en,
      rsvpCount: ev.rsvp_count,
      rsvpedByMe: false,
    }));

    const settingsMap = Object.fromEntries(settingRows.map((r) => [r.setting_key, r.setting_value]));

    res.json({
      posts,
      sahitya,
      historyItems,
      events,
      requireApproval: settingsMap.require_approval !== 'false',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Posts CRUD ---
app.post('/api/posts', requireAuth, async (req, res) => {
  try {
    const { type, titleHi, titleEn, contentHi, contentEn, mediaType, mediaUrl } = req.body || {};
    const [settingRows] = await pool.query(
      "SELECT setting_value FROM app_settings WHERE setting_key = 'require_approval'"
    );
    const requireApproval = settingRows[0]?.setting_value !== 'false';
    const isAdmin = req.user.role === 'super_admin';
    const status = isAdmin || !requireApproval ? 'approved' : 'pending';
    const id = `post-${Date.now()}`;

    await pool.query(
      `INSERT INTO posts
       (id, type, featured, status, author_id, author_name, author_name_en, author_mobile, author_role, district, district_hi, block_village, title_hi, title_en, content_hi, content_en, media_type, media_url)
       VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        type || 'photo',
        status,
        req.user.id,
        req.user.nameHi || req.user.name,
        req.user.name,
        req.user.mobile,
        req.user.role,
        req.user.district,
        req.user.districtHi,
        req.user.blockVillage || '',
        titleHi || '',
        titleEn || titleHi || '',
        contentHi || '',
        contentEn || contentHi || '',
        mediaType || 'none',
        mediaUrl || '',
      ]
    );

    res.status(201).json({
      id,
      type: type || 'photo',
      featured: false,
      status,
      authorName: req.user.nameHi || req.user.name,
      authorNameEn: req.user.name,
      authorMobile: req.user.mobile,
      authorRole: req.user.role,
      district: req.user.district,
      districtHi: req.user.districtHi,
      blockVillage: req.user.blockVillage || '',
      createdAt: new Date().toISOString(),
      titleHi: titleHi || '',
      titleEn: titleEn || titleHi || '',
      contentHi: contentHi || '',
      contentEn: contentEn || contentHi || '',
      mediaType: mediaType || 'none',
      mediaUrl: mediaUrl || '',
      likes: [],
      comments: [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/like', requireAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    const [existing] = await pool.query(
      'SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?',
      [postId, req.user.id]
    );
    if (existing.length > 0) {
      await pool.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [
        postId,
        req.user.id,
      ]);
      res.json({ liked: false });
    } else {
      await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [
        postId,
        req.user.id,
      ]);
      res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/comments', requireAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Comment text required' });
    const id = `c-${Date.now()}`;
    await pool.query(
      'INSERT INTO post_comments (id, post_id, author_name, district_hi, text) VALUES (?, ?, ?, ?, ?)',
      [id, postId, req.user.nameHi || req.user.name, req.user.districtHi || '', text]
    );
    res.status(201).json({
      id,
      authorName: req.user.nameHi || req.user.name,
      districtHi: req.user.districtHi || '',
      text,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Super Admin Moderation & Content Endpoints ---
app.patch('/api/posts/:id/approve', requireSuperAdmin, async (req, res) => {
  try {
    await pool.query("UPDATE posts SET status = 'approved' WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/posts/:id/feature', requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE posts SET featured = NOT featured WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sahitya', requireSuperAdmin, async (req, res) => {
  try {
    const item = req.body || {};
    const id = `sahitya-${Date.now()}`;
    await pool.query(
      `INSERT INTO sahitya (id, category, title_hi, title_en, author_hi, author_en, duration_sec, tempo, melody_key, audio_url, verses_json, summary_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        item.category || 'bhajan',
        item.titleHi || '',
        item.titleEn || item.titleHi || '',
        item.authorHi || '',
        item.authorEn || '',
        item.durationSec || 0,
        item.tempo || 96,
        item.melodyKey || 'bhajan1',
        item.audioUrl || '',
        JSON.stringify(item.verses || []),
        item.summaryEn || '',
      ]
    );
    res.status(201).json({ id, ...item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sahitya/:id', requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM sahitya WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/history', requireSuperAdmin, async (req, res) => {
  try {
    const item = req.body || {};
    const id = `hist-${Date.now()}`;
    await pool.query(
      `INSERT INTO history_items (id, era_hi, era_en, category, title_hi, title_en, subtitle_hi, subtitle_en, summary_hi, summary_en, details_hi, details_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        item.eraHi || '',
        item.eraEn || '',
        item.category || 'chhattisgarh',
        item.titleHi || '',
        item.titleEn || item.titleHi || '',
        item.subtitleHi || '',
        item.subtitleEn || '',
        item.summaryHi || '',
        item.summaryEn || '',
        item.detailsHi || '',
        item.detailsEn || '',
      ]
    );
    res.status(201).json({ id, ...item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/history/:id', requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM history_items WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', requireSuperAdmin, async (req, res) => {
  try {
    const ev = req.body || {};
    const id = `evt-${Date.now()}`;
    await pool.query(
      `INSERT INTO events (id, title_hi, title_en, event_date, event_time, district, district_hi, venue_hi, venue_en, description_hi, description_en, rsvp_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        id,
        ev.titleHi || '',
        ev.titleEn || ev.titleHi || '',
        ev.date || '',
        ev.time || '',
        ev.district || 'Raipur',
        ev.districtHi || 'रायपुर',
        ev.venueHi || '',
        ev.venueEn || ev.venueHi || '',
        ev.descriptionHi || '',
        ev.descriptionEn || ev.descriptionHi || '',
      ]
    );
    res.status(201).json({ id, rsvpCount: 1, rsvpedByMe: false, ...ev });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:id', requireSuperAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events/:id/rsvp', async (req, res) => {
  try {
    const delta = req.body?.going ? 1 : -1;
    await pool.query('UPDATE events SET rsvp_count = GREATEST(0, rsvp_count + ?) WHERE id = ?', [
      delta,
      req.params.id,
    ]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/settings/approval', requireSuperAdmin, async (req, res) => {
  try {
    const val = req.body?.requireApproval ? 'true' : 'false';
    await pool.query(
      `INSERT INTO app_settings (setting_key, setting_value) VALUES ('require_approval', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [val]
    );
    res.json({ ok: true, requireApproval: val === 'true' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Serve Built React PWA in Production ---
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, async () => {
  console.log(`🚩 Sahu Samaj Chhattisgarh Server running on port ${PORT}`);
  try {
    await ensureTablesAndSeed();
    console.log('✅ MySQL tables verified and ready.');
  } catch (err) {
    console.warn('⚠️ MySQL not connected yet (check .env / Hostinger DB vars):', err.message);
  }
});
