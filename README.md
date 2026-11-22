# साहू समाज छत्तीसगढ़ (Sahu Samaj Chhattisgarh) — Community PWA

A responsive, mobile-first Progressive Web App (PWA) in Hindi (Devanagari) & English built with **React**, **Tailwind CSS**, **Lucide Icons**, and a **Node.js (Express) + MySQL** backend.

## Architecture
- **Frontend (PWA)**: React + Tailwind CSS + Service Worker (`public/sw.js`) for offline caching & elderly font scaling (`A- / A+`).
- **Backend**: Node.js + Express (`server/index.js`) with MySQL (`server/schema.sql`, `utf8mb4_unicode_ci` for Hindi Devanagari) and HMAC-SHA256 authentication.
- **Seamless Offline Fallback**: Automatically syncs with your live MySQL server when connected, and falls back gracefully to cached `localStorage` data when offline.

## Server Setup (Node.js + MySQL)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Copy `.env.example` to `.env` and fill in your MySQL credentials:
   ```bash
   copy .env.example .env
   ```
   Update `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `AUTH_SECRET`, and `SUPER_ADMIN_PIN`.

3. **Initialize MySQL database & seed data**
   ```bash
   npm run db:init
   ```
   *(Or import `server/schema.sql` directly in phpMyAdmin / MySQL Workbench.)*

4. **Build frontend & start production server**
   ```bash
   npm run build
   npm start
   ```
   The single Node.js server serves both the REST API (`/api/*`) and the built React PWA (`dist/`) on `http://localhost:5000` (or your configured `PORT`).

## Development Mode (Frontend + Backend)
Run in two terminals:
```bash
npm run server
npm run dev
```
