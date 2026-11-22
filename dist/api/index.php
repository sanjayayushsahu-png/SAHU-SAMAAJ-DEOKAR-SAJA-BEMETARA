<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(503);
    echo json_encode([
        'ok' => false,
        'error' => 'api/config.php not found. Copy api/config.example.php to api/config.php on Hostinger and add your MySQL credentials.',
    ]);
    exit;
}

$config = require $configPath;
$AUTH_SECRET = $config['auth_secret'] ?? 'sahu-samaj-cg-secret';
$SUPER_ADMIN_PIN = (string)($config['super_admin_pin'] ?? '1234');
$SUPER_ADMIN_MOBILE = (string)($config['super_admin_mobile'] ?? '9630273317');

$SUPER_ADMIN_USER = [
    'id' => 'admin-sanjay-sahu',
    'name' => 'Sanjay Kumar Sahu',
    'nameHi' => 'संजय कुमार साहू',
    'mobile' => $SUPER_ADMIN_MOBILE,
    'district' => 'Bemetara',
    'districtHi' => 'बेमेतरा',
    'blockVillage' => 'Bemetara Nagar / बेमेतरा नगर',
    'role' => 'super_admin',
];

function respond(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getJsonBody(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function b64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function b64url_decode(string $data): string {
    $pad = strlen($data) % 4;
    if ($pad > 0) $data .= str_repeat('=', 4 - $pad);
    return base64_decode(strtr($data, '-_', '+/')) ?: '';
}

function signToken(array $payload, string $secret): string {
    $data = b64url_encode(json_encode($payload, JSON_UNESCAPED_UNICODE));
    $sig = b64url_encode(hash_hmac('sha256', $data, $secret, true));
    return "$data.$sig";
}

function verifyToken(?string $token, string $secret): ?array {
    if (!$token || strpos($token, '.') === false) return null;
    [$data, $sig] = explode('.', $token, 2);
    $expected = b64url_encode(hash_hmac('sha256', $data, $secret, true));
    if (!hash_equals($expected, $sig)) return null;
    $decoded = json_decode(b64url_decode($data), true);
    return is_array($decoded) ? $decoded : null;
}

function getCurrentUser(string $secret): ?array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$header && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    if (stripos($header, 'Bearer ') === 0) {
        return verifyToken(trim(substr($header, 7)), $secret);
    }
    return null;
}

function requireAuth(string $secret): array {
    $user = getCurrentUser($secret);
    if (!$user) respond(['error' => 'Authentication required'], 401);
    return $user;
}

function requireSuperAdmin(string $secret): array {
    $user = requireAuth($secret);
    if (($user['role'] ?? '') !== 'super_admin') {
        respond(['error' => 'Super Admin access required'], 403);
    }
    return $user;
}

// Connect MySQL via PDO (utf8mb4)
try {
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        $config['db_host'] ?? '127.0.0.1',
        $config['db_port'] ?? '3306',
        $config['db_name'] ?? ''
    );
    $pdo = new PDO($dsn, $config['db_user'] ?? '', $config['db_pass'] ?? '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Throwable $e) {
    respond(['ok' => false, 'database' => 'mysql', 'error' => $e->getMessage()], 503);
}

// Auto-create tables on first request
$pdo->exec("CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  name_hi VARCHAR(150) NOT NULL,
  mobile VARCHAR(15) NOT NULL UNIQUE,
  district VARCHAR(80) NOT NULL,
  district_hi VARCHAR(80) NOT NULL,
  block_village VARCHAR(150) NOT NULL,
  role ENUM('member','super_admin') DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$pdo->exec("CREATE TABLE IF NOT EXISTS posts (
  id VARCHAR(64) PRIMARY KEY,
  type ENUM('photo','event','article','announcement') DEFAULT 'photo',
  featured TINYINT(1) DEFAULT 0,
  status ENUM('pending','approved') DEFAULT 'pending',
  author_id VARCHAR(64) NOT NULL,
  author_name VARCHAR(150) NOT NULL,
  author_name_en VARCHAR(150) DEFAULT '',
  author_mobile VARCHAR(15) DEFAULT '',
  author_role ENUM('member','super_admin') DEFAULT 'member',
  district VARCHAR(80) NOT NULL,
  district_hi VARCHAR(80) NOT NULL,
  block_village VARCHAR(150) DEFAULT '',
  title_hi VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) DEFAULT '',
  content_hi TEXT NOT NULL,
  content_en TEXT,
  media_type ENUM('none','image','video','video-link') DEFAULT 'none',
  media_url LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$pdo->exec("CREATE TABLE IF NOT EXISTS post_likes (
  post_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id),
  CONSTRAINT fk_php_likes_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$pdo->exec("CREATE TABLE IF NOT EXISTS post_comments (
  id VARCHAR(64) PRIMARY KEY,
  post_id VARCHAR(64) NOT NULL,
  author_name VARCHAR(150) NOT NULL,
  district_hi VARCHAR(80) DEFAULT '',
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_php_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$pdo->exec("CREATE TABLE IF NOT EXISTS sahitya (
  id VARCHAR(64) PRIMARY KEY,
  category ENUM('aarti','bhajan','poem','article') NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$pdo->exec("CREATE TABLE IF NOT EXISTS history_items (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$pdo->exec("CREATE TABLE IF NOT EXISTS events (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$pdo->exec("CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(64) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$method = $_SERVER['REQUEST_METHOD'];
$route = trim((string)($_GET['route'] ?? ''), '/');

// --- ROUTES ---
if ($route === 'health' && $method === 'GET') {
    respond(['ok' => true, 'database' => 'mysql', 'runtime' => 'php', 'status' => 'connected']);
}

if ($route === 'auth/member' && $method === 'POST') {
    $body = getJsonBody();
    $name = trim((string)($body['name'] ?? ''));
    $mobile = preg_replace('/\D/', '', (string)($body['mobile'] ?? ''));
    $block = trim((string)($body['blockVillage'] ?? ''));
    if ($name === '' || strlen($mobile) !== 10 || $block === '') {
        respond(['error' => 'Name, 10-digit mobile, and block/village are required'], 400);
    }
    $isAdmin = ($mobile === $SUPER_ADMIN_MOBILE);
    $user = [
        'id' => $isAdmin ? $SUPER_ADMIN_USER['id'] : "member-$mobile",
        'name' => $isAdmin ? $SUPER_ADMIN_USER['name'] : $name,
        'nameHi' => $isAdmin ? $SUPER_ADMIN_USER['nameHi'] : $name,
        'mobile' => $mobile,
        'district' => $body['district'] ?? 'Bemetara',
        'districtHi' => $body['districtHi'] ?? 'बेमेतरा',
        'blockVillage' => $block,
        'role' => $isAdmin ? 'super_admin' : 'member',
    ];
    $stmt = $pdo->prepare("INSERT INTO users (id, name, name_hi, mobile, district, district_hi, block_village, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name=VALUES(name), name_hi=VALUES(name_hi), district=VALUES(district), district_hi=VALUES(district_hi), block_village=VALUES(block_village)");
    $stmt->execute([$user['id'], $user['name'], $user['nameHi'], $user['mobile'], $user['district'], $user['districtHi'], $user['blockVillage'], $user['role']]);
    respond(['user' => $user, 'token' => signToken($user, $AUTH_SECRET)]);
}

if ($route === 'auth/admin' && $method === 'POST') {
    $body = getJsonBody();
    if (trim((string)($body['pin'] ?? '')) !== $SUPER_ADMIN_PIN) {
        respond(['error' => 'Invalid Admin PIN'], 401);
    }
    respond(['user' => $SUPER_ADMIN_USER, 'token' => signToken($SUPER_ADMIN_USER, $AUTH_SECRET)]);
}

if ($route === 'bootstrap' && $method === 'GET') {
    $postRows = $pdo->query("SELECT * FROM posts ORDER BY created_at DESC LIMIT 100")->fetchAll();
    $likeRows = $pdo->query("SELECT post_id, user_id FROM post_likes")->fetchAll();
    $commentRows = $pdo->query("SELECT * FROM post_comments ORDER BY created_at ASC")->fetchAll();
    $sahityaRows = $pdo->query("SELECT * FROM sahitya ORDER BY created_at DESC")->fetchAll();
    $historyRows = $pdo->query("SELECT * FROM history_items ORDER BY created_at ASC")->fetchAll();
    $eventRows = $pdo->query("SELECT * FROM events ORDER BY event_date ASC")->fetchAll();
    $settings = $pdo->query("SELECT setting_key, setting_value FROM app_settings")->fetchAll(PDO::FETCH_KEY_PAIR);

    $likesByPost = [];
    foreach ($likeRows as $r) $likesByPost[$r['post_id']][] = $r['user_id'];
    $commentsByPost = [];
    foreach ($commentRows as $c) {
        $commentsByPost[$c['post_id']][] = [
            'id' => $c['id'],
            'authorName' => $c['author_name'],
            'districtHi' => $c['district_hi'],
            'text' => $c['text'],
            'createdAt' => $c['created_at'],
        ];
    }

    $posts = array_map(fn($p) => [
        'id' => $p['id'],
        'type' => $p['type'],
        'featured' => (bool)$p['featured'],
        'status' => $p['status'],
        'authorName' => $p['author_name'],
        'authorNameEn' => $p['author_name_en'],
        'authorMobile' => $p['author_mobile'],
        'authorRole' => $p['author_role'],
        'district' => $p['district'],
        'districtHi' => $p['district_hi'],
        'blockVillage' => $p['block_village'],
        'createdAt' => $p['created_at'],
        'titleHi' => $p['title_hi'],
        'titleEn' => $p['title_en'],
        'contentHi' => $p['content_hi'],
        'contentEn' => $p['content_en'],
        'mediaType' => $p['media_type'],
        'mediaUrl' => $p['media_url'],
        'likes' => $likesByPost[$p['id']] ?? [],
        'comments' => $commentsByPost[$p['id']] ?? [],
    ], $postRows);

    $sahitya = array_map(fn($s) => [
        'id' => $s['id'],
        'category' => $s['category'],
        'titleHi' => $s['title_hi'],
        'titleEn' => $s['title_en'],
        'authorHi' => $s['author_hi'],
        'authorEn' => $s['author_en'],
        'durationSec' => (int)$s['duration_sec'],
        'tempo' => (int)$s['tempo'],
        'melodyKey' => $s['melody_key'],
        'audioUrl' => $s['audio_url'],
        'verses' => json_decode($s['verses_json'] ?: '[]', true) ?: [],
        'summaryEn' => $s['summary_en'],
    ], $sahityaRows);

    $historyItems = array_map(fn($h) => [
        'id' => $h['id'],
        'eraHi' => $h['era_hi'],
        'eraEn' => $h['era_en'],
        'category' => $h['category'],
        'titleHi' => $h['title_hi'],
        'titleEn' => $h['title_en'],
        'subtitleHi' => $h['subtitle_hi'],
        'subtitleEn' => $h['subtitle_en'],
        'summaryHi' => $h['summary_hi'],
        'summaryEn' => $h['summary_en'],
        'detailsHi' => $h['details_hi'],
        'detailsEn' => $h['details_en'],
    ], $historyRows);

    $events = array_map(fn($ev) => [
        'id' => $ev['id'],
        'titleHi' => $ev['title_hi'],
        'titleEn' => $ev['title_en'],
        'date' => $ev['event_date'],
        'time' => $ev['event_time'],
        'district' => $ev['district'],
        'districtHi' => $ev['district_hi'],
        'venueHi' => $ev['venue_hi'],
        'venueEn' => $ev['venue_en'],
        'descriptionHi' => $ev['description_hi'],
        'descriptionEn' => $ev['description_en'],
        'rsvpCount' => (int)$ev['rsvp_count'],
        'rsvpedByMe' => false,
    ], $eventRows);

    respond([
        'posts' => $posts,
        'sahitya' => $sahitya,
        'historyItems' => $historyItems,
        'events' => $events,
        'requireApproval' => ($settings['require_approval'] ?? 'true') !== 'false',
    ]);
}

if ($route === 'posts' && $method === 'POST') {
    $user = requireAuth($AUTH_SECRET);
    $b = getJsonBody();
    $reqApp = $pdo->query("SELECT setting_value FROM app_settings WHERE setting_key='require_approval'")->fetchColumn();
    $requireApproval = ($reqApp !== 'false');
    $status = (($user['role'] ?? '') === 'super_admin' || !$requireApproval) ? 'approved' : 'pending';
    $id = 'post-' . (int)(microtime(true) * 1000);
    $stmt = $pdo->prepare("INSERT INTO posts (id,type,featured,status,author_id,author_name,author_name_en,author_mobile,author_role,district,district_hi,block_village,title_hi,title_en,content_hi,content_en,media_type,media_url) VALUES (?,?,0,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $id, $b['type'] ?? 'photo', $status, $user['id'], $user['nameHi'] ?? $user['name'], $user['name'],
        $user['mobile'] ?? '', $user['role'] ?? 'member', $user['district'] ?? 'Bemetara', $user['districtHi'] ?? 'बेमेतरा',
        $user['blockVillage'] ?? '', $b['titleHi'] ?? '', $b['titleEn'] ?? ($b['titleHi'] ?? ''),
        $b['contentHi'] ?? '', $b['contentEn'] ?? ($b['contentHi'] ?? ''), $b['mediaType'] ?? 'none', $b['mediaUrl'] ?? ''
    ]);
    respond([
        'id' => $id, 'type' => $b['type'] ?? 'photo', 'featured' => false, 'status' => $status,
        'authorName' => $user['nameHi'] ?? $user['name'], 'authorNameEn' => $user['name'],
        'authorMobile' => $user['mobile'] ?? '', 'authorRole' => $user['role'] ?? 'member',
        'district' => $user['district'] ?? 'Bemetara', 'districtHi' => $user['districtHi'] ?? 'बेमेतरा',
        'blockVillage' => $user['blockVillage'] ?? '', 'createdAt' => gmdate('c'),
        'titleHi' => $b['titleHi'] ?? '', 'titleEn' => $b['titleEn'] ?? ($b['titleHi'] ?? ''),
        'contentHi' => $b['contentHi'] ?? '', 'contentEn' => $b['contentEn'] ?? ($b['contentHi'] ?? ''),
        'mediaType' => $b['mediaType'] ?? 'none', 'mediaUrl' => $b['mediaUrl'] ?? '', 'likes' => [], 'comments' => []
    ], 201);
}

if (preg_match('#^posts/([^/]+)/like$#', $route, $m) && $method === 'POST') {
    $user = requireAuth($AUTH_SECRET);
    $stmt = $pdo->prepare("SELECT 1 FROM post_likes WHERE post_id=? AND user_id=?");
    $stmt->execute([$m[1], $user['id']]);
    if ($stmt->fetchColumn()) {
        $pdo->prepare("DELETE FROM post_likes WHERE post_id=? AND user_id=?")->execute([$m[1], $user['id']]);
        respond(['liked' => false]);
    } else {
        $pdo->prepare("INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)")->execute([$m[1], $user['id']]);
        respond(['liked' => true]);
    }
}

if (preg_match('#^posts/([^/]+)/comments$#', $route, $m) && $method === 'POST') {
    $user = requireAuth($AUTH_SECRET);
    $text = trim((string)(getJsonBody()['text'] ?? ''));
    if ($text === '') respond(['error' => 'Comment text required'], 400);
    $id = 'c-' . (int)(microtime(true) * 1000);
    $pdo->prepare("INSERT INTO post_comments (id, post_id, author_name, district_hi, text) VALUES (?, ?, ?, ?, ?)")
        ->execute([$id, $m[1], $user['nameHi'] ?? $user['name'], $user['districtHi'] ?? '', $text]);
    respond(['id' => $id, 'authorName' => $user['nameHi'] ?? $user['name'], 'districtHi' => $user['districtHi'] ?? '', 'text' => $text, 'createdAt' => gmdate('c')], 201);
}

if (preg_match('#^posts/([^/]+)/approve$#', $route, $m) && $method === 'PATCH') {
    requireSuperAdmin($AUTH_SECRET);
    $pdo->prepare("UPDATE posts SET status='approved' WHERE id=?")->execute([$m[1]]);
    respond(['ok' => true]);
}

if (preg_match('#^posts/([^/]+)/feature$#', $route, $m) && $method === 'PATCH') {
    requireSuperAdmin($AUTH_SECRET);
    $pdo->prepare("UPDATE posts SET featured = NOT featured WHERE id=?")->execute([$m[1]]);
    respond(['ok' => true]);
}

if (preg_match('#^posts/([^/]+)$#', $route, $m) && $method === 'DELETE') {
    requireSuperAdmin($AUTH_SECRET);
    $pdo->prepare("DELETE FROM posts WHERE id=?")->execute([$m[1]]);
    respond(['ok' => true]);
}

if ($route === 'sahitya' && $method === 'POST') {
    requireSuperAdmin($AUTH_SECRET);
    $b = getJsonBody();
    $id = 'sahitya-' . (int)(microtime(true) * 1000);
    $pdo->prepare("INSERT INTO sahitya (id,category,title_hi,title_en,author_hi,author_en,duration_sec,tempo,melody_key,audio_url,verses_json,summary_en) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
        ->execute([$id, $b['category'] ?? 'bhajan', $b['titleHi'] ?? '', $b['titleEn'] ?? '', $b['authorHi'] ?? '', $b['authorEn'] ?? '', (int)($b['durationSec'] ?? 0), (int)($b['tempo'] ?? 96), $b['melodyKey'] ?? 'bhajan1', $b['audioUrl'] ?? '', json_encode($b['verses'] ?? [], JSON_UNESCAPED_UNICODE), $b['summaryEn'] ?? '']);
    respond(array_merge(['id' => $id], $b), 201);
}

if (preg_match('#^sahitya/([^/]+)$#', $route, $m) && $method === 'DELETE') {
    requireSuperAdmin($AUTH_SECRET);
    $pdo->prepare("DELETE FROM sahitya WHERE id=?")->execute([$m[1]]);
    respond(['ok' => true]);
}

if ($route === 'history' && $method === 'POST') {
    requireSuperAdmin($AUTH_SECRET);
    $b = getJsonBody();
    $id = 'hist-' . (int)(microtime(true) * 1000);
    $pdo->prepare("INSERT INTO history_items (id,era_hi,era_en,category,title_hi,title_en,subtitle_hi,subtitle_en,summary_hi,summary_en,details_hi,details_en) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
        ->execute([$id, $b['eraHi'] ?? '', $b['eraEn'] ?? '', $b['category'] ?? 'chhattisgarh', $b['titleHi'] ?? '', $b['titleEn'] ?? '', $b['subtitleHi'] ?? '', $b['subtitleEn'] ?? '', $b['summaryHi'] ?? '', $b['summaryEn'] ?? '', $b['detailsHi'] ?? '', $b['detailsEn'] ?? '']);
    respond(array_merge(['id' => $id], $b), 201);
}

if (preg_match('#^history/([^/]+)$#', $route, $m) && $method === 'DELETE') {
    requireSuperAdmin($AUTH_SECRET);
    $pdo->prepare("DELETE FROM history_items WHERE id=?")->execute([$m[1]]);
    respond(['ok' => true]);
}

if ($route === 'events' && $method === 'POST') {
    requireSuperAdmin($AUTH_SECRET);
    $b = getJsonBody();
    $id = 'evt-' . (int)(microtime(true) * 1000);
    $pdo->prepare("INSERT INTO events (id,title_hi,title_en,event_date,event_time,district,district_hi,venue_hi,venue_en,description_hi,description_en,rsvp_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,1)")
        ->execute([$id, $b['titleHi'] ?? '', $b['titleEn'] ?? '', $b['date'] ?? '', $b['time'] ?? '', $b['district'] ?? 'Raipur', $b['districtHi'] ?? 'रायपुर', $b['venueHi'] ?? '', $b['venueEn'] ?? '', $b['descriptionHi'] ?? '', $b['descriptionEn'] ?? '']);
    respond(array_merge(['id' => $id, 'rsvpCount' => 1, 'rsvpedByMe' => false], $b), 201);
}

if (preg_match('#^events/([^/]+)$#', $route, $m) && $method === 'DELETE') {
    requireSuperAdmin($AUTH_SECRET);
    $pdo->prepare("DELETE FROM events WHERE id=?")->execute([$m[1]]);
    respond(['ok' => true]);
}

if (preg_match('#^events/([^/]+)/rsvp$#', $route, $m) && $method === 'POST') {
    $delta = !empty(getJsonBody()['going']) ? 1 : -1;
    $pdo->prepare("UPDATE events SET rsvp_count = GREATEST(0, rsvp_count + ?) WHERE id=?")->execute([$delta, $m[1]]);
    respond(['ok' => true]);
}

if ($route === 'settings/approval' && $method === 'PATCH') {
    requireSuperAdmin($AUTH_SECRET);
    $val = !empty(getJsonBody()['requireApproval']) ? 'true' : 'false';
    $pdo->prepare("INSERT INTO app_settings (setting_key, setting_value) VALUES ('require_approval', ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)")->execute([$val]);
    respond(['ok' => true, 'requireApproval' => $val === 'true']);
}

respond(['error' => 'Route not found'], 404);
