-- Sahu Samaj Chhattisgarh (साहू समाज छत्तीसगढ़) MySQL Schema
-- Character Set: utf8mb4 for full Hindi (Devanagari) & Emoji support

CREATE DATABASE IF NOT EXISTS sahu_samaj_cg
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sahu_samaj_cg;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  name_hi VARCHAR(150) NOT NULL,
  mobile VARCHAR(15) NOT NULL UNIQUE,
  district VARCHAR(80) NOT NULL,
  district_hi VARCHAR(80) NOT NULL,
  block_village VARCHAR(150) NOT NULL,
  role ENUM('member', 'super_admin') DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS posts (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_likes (
  post_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id),
  CONSTRAINT fk_likes_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_comments (
  id VARCHAR(64) PRIMARY KEY,
  post_id VARCHAR(64) NOT NULL,
  author_name VARCHAR(150) NOT NULL,
  district_hi VARCHAR(80) DEFAULT '',
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_comments_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sahitya (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS history_items (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(64) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
