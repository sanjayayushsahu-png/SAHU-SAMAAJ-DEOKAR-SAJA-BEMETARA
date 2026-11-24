<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$candidatePaths = [
    dirname(__DIR__, 2) . '/sahu_config.php',     // one level above public_html (primary, safe from Redeploy!)
    dirname(__DIR__, 3) . '/sahu_config.php',     // domain/home parent folder
    __DIR__ . '/config.php',                      // fallback: public_html/api/config.php
];
$configPath = null;
foreach ($candidatePaths as $p) {
    if (file_exists($p)) {
        $configPath = $p;
        break;
    }
}
if (!$configPath) {
    http_response_code(503);
    echo json_encode([
        'ok' => false,
        'error' => 'Database config not found. Create sahu_config.php one folder above public_html (safe from Redeploy) or public_html/api/config.php.',
    ]);
    exit;
}

try {
    $config = require $configPath;
    if (!is_array($config)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'api/config.php must return a PHP array (start with <?php return [...];).']);
        exit;
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Syntax error in api/config.php: ' . $e->getMessage()]);
    exit;
}
$AUTH_SECRET = $config['auth_secret'] ?? 'sahu-samaj-cg-secret';
$SUPER_ADMIN_PIN = trim((string)($config['super_admin_pin'] ?? '1234'));
$SUPER_ADMIN_MOBILE = preg_replace('/\D/', '', (string)($config['super_admin_mobile'] ?? '9630273317'));

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
    $customToken = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
    if ($customToken !== '') {
        return verifyToken(trim($customToken), $secret);
    }

    $header = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';
    if (!$header && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (!empty($headers['X-Auth-Token'])) {
            return verifyToken(trim($headers['X-Auth-Token']), $secret);
        }
        if (!empty($headers['x-auth-token'])) {
            return verifyToken(trim($headers['x-auth-token']), $secret);
        }
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

// Connect MySQL via PDO (utf8mb4) & auto-create tables safely
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

    $pdo->exec("CREATE TABLE IF NOT EXISTS directory_members (
      id VARCHAR(64) PRIMARY KEY,
      name_hi VARCHAR(150) NOT NULL,
      name_en VARCHAR(150) DEFAULT '',
      designation_hi VARCHAR(200) NOT NULL,
      designation_en VARCHAR(200) DEFAULT '',
      district VARCHAR(80) NOT NULL,
      district_hi VARCHAR(80) NOT NULL,
      block_hi VARCHAR(120) DEFAULT '',
      phone VARCHAR(20) NOT NULL,
      wing VARCHAR(32) DEFAULT 'main',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS dharmashalas (
      id VARCHAR(64) PRIMARY KEY,
      name_hi VARCHAR(255) NOT NULL,
      name_en VARCHAR(255) DEFAULT '',
      district VARCHAR(80) NOT NULL,
      district_hi VARCHAR(80) NOT NULL,
      address_hi TEXT NOT NULL,
      address_en TEXT,
      capacity VARCHAR(150) DEFAULT '',
      capacity_en VARCHAR(150) DEFAULT '',
      facilities_json TEXT,
      phone VARCHAR(20) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS samaj_ratna (
      id VARCHAR(64) PRIMARY KEY,
      name_hi VARCHAR(180) NOT NULL,
      name_en VARCHAR(180) DEFAULT '',
      category VARCHAR(40) DEFAULT 'social',
      district_hi VARCHAR(80) NOT NULL,
      district_en VARCHAR(80) DEFAULT '',
      achievement_hi TEXT NOT NULL,
      achievement_en TEXT,
      bio_hi TEXT,
      bio_en TEXT,
      initials VARCHAR(12) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
} catch (Throwable $e) {
    respond(['ok' => false, 'database' => 'mysql', 'error' => $e->getMessage()], 503);
}

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
    if ($mobile === $SUPER_ADMIN_MOBILE) {
        respond(['error' => 'यह सुपर एडमिन नंबर है। कृपया सुपर एडमिन टैब से पासवर्ड डालकर लॉगिन करें।'], 403);
    }
    $user = [
        'id' => "member-$mobile",
        'name' => $name,
        'nameHi' => $name,
        'mobile' => $mobile,
        'district' => $body['district'] ?? 'Bemetara',
        'districtHi' => $body['districtHi'] ?? 'बेमेतरा',
        'blockVillage' => $block,
        'role' => 'member',
    ];
    $stmt = $pdo->prepare("INSERT INTO users (id, name, name_hi, mobile, district, district_hi, block_village, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'member')
      ON DUPLICATE KEY UPDATE name=VALUES(name), name_hi=VALUES(name_hi), district=VALUES(district), district_hi=VALUES(district_hi), block_village=VALUES(block_village)");
    $stmt->execute([$user['id'], $user['name'], $user['nameHi'], $user['mobile'], $user['district'], $user['districtHi'], $user['blockVillage']]);
    respond(['user' => $user, 'token' => signToken($user, $AUTH_SECRET)]);
}

if ($route === 'auth/admin' && $method === 'POST') {
    $body = getJsonBody();
    $mobile = preg_replace('/\D/', '', (string)($body['mobile'] ?? ''));
    $pin = trim((string)($body['pin'] ?? ''));

    // Basic brute-force protection using app_settings
    $ipHash = substr(hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown'), 0, 16);
    $lockKey = "admin_fail_$ipHash";
    $failRow = $pdo->prepare("SELECT setting_value FROM app_settings WHERE setting_key=?");
    $failRow->execute([$lockKey]);
    $failData = json_decode((string)$failRow->fetchColumn(), true) ?: ['count' => 0, 'until' => 0];

    if ($failData['until'] > time()) {
        $waitMin = (int)ceil(($failData['until'] - time()) / 60);
        respond(['error' => "बहुत अधिक गलत प्रयास। कृपया $waitMin मिनट बाद पुनः प्रयास करें।"], 429);
    }

    $validMobile = hash_equals($SUPER_ADMIN_MOBILE, $mobile);
    $validPin = $SUPER_ADMIN_PIN !== '' && hash_equals($SUPER_ADMIN_PIN, $pin);

    if (!$validMobile || !$validPin) {
        $nextCount = ((int)$failData['count']) + 1;
        $until = $nextCount >= 5 ? (time() + 900) : 0; // 15 min lockout after 5 wrong attempts
        $pdo->prepare("INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)")
            ->execute([$lockKey, json_encode(['count' => $nextCount >= 5 ? 0 : $nextCount, 'until' => $until])]);
        respond(['error' => 'गलत मोबाइल नंबर या एडमिन पासवर्ड।'], 401);
    }

    $pdo->prepare("DELETE FROM app_settings WHERE setting_key=?")->execute([$lockKey]);
    respond(['user' => $SUPER_ADMIN_USER, 'token' => signToken($SUPER_ADMIN_USER, $AUTH_SECRET)]);
}

if ($route === 'bootstrap' && $method === 'GET') {
    $postRows = $pdo->query("SELECT * FROM posts ORDER BY created_at DESC LIMIT 100")->fetchAll();
    $likeRows = $pdo->query("SELECT post_id, user_id FROM post_likes")->fetchAll();
    $commentRows = $pdo->query("SELECT * FROM post_comments ORDER BY created_at ASC")->fetchAll();
    $sahityaRows = $pdo->query("SELECT * FROM sahitya ORDER BY created_at DESC")->fetchAll();
    $historyRows = $pdo->query("SELECT * FROM history_items ORDER BY created_at ASC")->fetchAll();
    $eventRows = $pdo->query("SELECT * FROM events ORDER BY event_date ASC")->fetchAll();
    $dirRows = $pdo->query("SELECT * FROM directory_members ORDER BY created_at DESC")->fetchAll();
    $dharRows = $pdo->query("SELECT * FROM dharmashalas ORDER BY created_at DESC")->fetchAll();
    $ratnaRows = $pdo->query("SELECT * FROM samaj_ratna ORDER BY created_at DESC")->fetchAll();
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

    $directory = array_map(fn($d) => [
        'id' => $d['id'],
        'nameHi' => $d['name_hi'],
        'nameEn' => $d['name_en'],
        'designationHi' => $d['designation_hi'],
        'designationEn' => $d['designation_en'],
        'district' => $d['district'],
        'districtHi' => $d['district_hi'],
        'blockHi' => $d['block_hi'],
        'phone' => $d['phone'],
        'wing' => $d['wing'],
    ], $dirRows);

    $dharmashalas = array_map(fn($dh) => [
        'id' => $dh['id'],
        'nameHi' => $dh['name_hi'],
        'nameEn' => $dh['name_en'],
        'district' => $dh['district'],
        'districtHi' => $dh['district_hi'],
        'addressHi' => $dh['address_hi'],
        'addressEn' => $dh['address_en'],
        'capacity' => $dh['capacity'],
        'capacityEn' => $dh['capacity_en'],
        'facilitiesHi' => json_decode($dh['facilities_json'] ?: '[]', true) ?: [],
        'phone' => $dh['phone'],
    ], $dharRows);

    $samajRatna = array_map(fn($r) => [
        'id' => $r['id'],
        'nameHi' => $r['name_hi'],
        'nameEn' => $r['name_en'],
        'category' => $r['category'],
        'districtHi' => $r['district_hi'],
        'districtEn' => $r['district_en'],
        'achievementHi' => $r['achievement_hi'],
        'achievementEn' => $r['achievement_en'],
        'bioHi' => $r['bio_hi'],
        'bioEn' => $r['bio_en'],
        'initials' => $r['initials'],
    ], $ratnaRows);

    respond([
        'posts' => $posts,
        'sahitya' => $sahitya,
        'historyItems' => $historyItems,
        'events' => $events,
        'directory' => $directory,
        'dharmashalas' => $dharmashalas,
        'samajRatna' => $samajRatna,
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

if (preg_match('#^sahitya/([^/]+)$#', $route, $m) && $method === 'PUT') {
    requireSuperAdmin($AUTH_SECRET);
    $b = getJsonBody();
    $pdo->prepare("UPDATE sahitya SET category=?, title_hi=?, title_en=?, author_hi=?, author_en=?, audio_url=?, verses_json=?, summary_en=? WHERE id=?")
        ->execute([$b['category'] ?? 'bhajan', $b['titleHi'] ?? '', $b['titleEn'] ?? '', $b['authorHi'] ?? '', $b['authorEn'] ?? '', $b['audioUrl'] ?? '', json_encode($b['verses'] ?? [], JSON_UNESCAPED_UNICODE), $b['summaryEn'] ?? '', $m[1]]);
    respond(array_merge(['id' => $m[1]], $b));
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

if (preg_match('#^history/([^/]+)$#', $route, $m) && $method === 'PUT') {
    requireSuperAdmin($AUTH_SECRET);
    $b = getJsonBody();
    $pdo->prepare("UPDATE history_items SET era_hi=?, era_en=?, title_hi=?, title_en=?, summary_hi=?, summary_en=?, details_hi=?, details_en=? WHERE id=?")
        ->execute([$b['eraHi'] ?? '', $b['eraEn'] ?? '', $b['titleHi'] ?? '', $b['titleEn'] ?? '', $b['summaryHi'] ?? '', $b['summaryEn'] ?? '', $b['detailsHi'] ?? '', $b['detailsEn'] ?? '', $m[1]]);
    respond(array_merge(['id' => $m[1]], $b));
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

if (preg_match('#^events/([^/]+)$#', $route, $m) && $method === 'PUT') {
    requireSuperAdmin($AUTH_SECRET);
    $b = getJsonBody();
    $pdo->prepare("UPDATE events SET title_hi=?, title_en=?, event_date=?, event_time=?, district=?, district_hi=?, venue_hi=?, venue_en=?, description_hi=?, description_en=? WHERE id=?")
        ->execute([$b['titleHi'] ?? '', $b['titleEn'] ?? '', $b['date'] ?? '', $b['time'] ?? '', $b['district'] ?? 'Raipur', $b['districtHi'] ?? 'रायपुर', $b['venueHi'] ?? '', $b['venueEn'] ?? '', $b['descriptionHi'] ?? '', $b['descriptionEn'] ?? '', $m[1]]);
    respond(array_merge(['id' => $m[1]], $b));
}

if (preg_match('#^events/([^/]+)$#', $route, $m) && $method === 'DELETE') {
    requireSuperAdmin($AUTH_SECRET);
    $pdo->prepare("DELETE FROM events WHERE id=?")->execute([$m[1]]);
    respond(['ok' => true]);
}

// --- Directory (पदाधिकारी) CRUD ---
if ($route === 'directory' && $method === 'POST') {
    requireSuperAdmin($AUTH_SECRET);
    $b = getJsonBody();
    $id = 'dir-' . (int)(microtime(true) * 1000);
    $pdo->prepare("INSERT INTO directory_members (id,name_hi,name_en,designation_hi,designation_en,district,district_hi,block_hi,phone,wing) VALUES (?,?,?,?,?,?,?,?,?,?)")
        ->execute([$id, $b['nameHi'] ?? '', $b['nameEn'] ?? ($b['nameHi'] ?? ''), $b['designationHi'] ?? '', $b['designationEn'] ?? ($b['designationHi'] ?? ''), $b['district'] ?? 'Bemetara', $b['districtHi'] ?? 'बेमेतरा', $b['blockHi'] ?? '', $b['phone'] ?? '', $b['wing'] ?? 'main']);
    respond(array_merge(['id' => $id], $b), 201);
}

if (preg_match('#^directory/([^/]+)$#', $route, $m) && $method === 'PUT') {
    requireSuperAdmin($AUTH_SECRET);
    $b = getJsonBody();
    $pdo->prepare("UPDATE directory_members SET name_hi=?, name_en=?, designation_hi=?, designation_en=?, district=?, district_hi=?, block_hi=?, phone=?, wing=? WHERE id=?")
        ->execute([$b['nameHi'] ?? '', $b['nameEn'] ?? ($b['nameHi'] ?? ''), $b['designationHi'] ?? '', $b['designationEn'] ?? ($b['designationHi'] ?? ''), $b['district'] ?? 'Bemetara', $b['districtHi'] ?? 'बेमेतरा', $b['blockHi'] ?? '', $b['phone'] ?? '', $b['wing'] ?? 'main', $m[1]]);
    respond(array_merge(['id' => $m[1]], $b));
}

if (preg_match('#^directory/([^/]+)$#', $route, $m) && $method === 'DELETE') {
    requireSuperAdmin($AUTH_SECRET);
    $pdo->prepare("DELETE FROM directory_members WHERE id=?")->execute([$m[1]]);
    respond(['ok' => true]);
}

// --- Dharmashalas (धर्मशाला) CRUD ---
if ($route === 'dharmashalas' && $method === 'POST') {
    requireSuperAdmin($AUTH_SECRET);
    $b = getJsonBody();
    $id = 'dhar-' . (int)(microtime(true) * 1000);
    $pdo->prepare("INSERT INTO dharmashalas (id,name_hi,name_en,district,district_hi,address_hi,address_en,capacity,capacity_en,facilities_json,phone) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
        ->execute([$id, $b['nameHi'] ?? '', $b['nameEn'] ?? ($b['nameHi'] ?? ''), $b['district'] ?? 'Bemetara', $b['districtHi'] ?? 'बेमेतरा', $b['addressHi'] ?? '', $b['addressEn'] ?? ($b['addressHi'] ?? ''), $b['capacity'] ?? '', $b['capacityEn'] ?? ($b['capacity'] ?? ''), json_encode($b['facilitiesHi'] ?? [], JSON_UNESCAPED_UNICODE), $b['phone'] ?? '']);
    respond(array_merge(['id' => $id], $b), 201);
}

if (preg_match('#^dharmashalas/([^/]+)$#', $route, $m) && $method === 'PUT') {
    requireSuperAdmin($AUTH_SECRET);
    $b = getJsonBody();
    $pdo->prepare("UPDATE dharmashalas SET name_hi=?, name_en=?, district=?, district_hi=?, address_hi=?, address_en=?, capacity=?, capacity_en=?, facilities_json=?, phone=? WHERE id=?")
        ->execute([$b['nameHi'] ?? '', $b['nameEn'] ?? ($b['nameHi'] ?? ''), $b['district'] ?? 'Bemetara', $b['districtHi'] ?? 'बेमेतरा', $b['addressHi'] ?? '', $b['addressEn'] ?? ($b['addressHi'] ?? ''), $b['capacity'] ?? '', $b['capacityEn'] ?? ($b['capacity'] ?? ''), json_encode($b['facilitiesHi'] ?? [], JSON_UNESCAPED_UNICODE), $b['phone'] ?? '', $m[1]]);
    respond(array_merge(['id' => $m[1]], $b));
}

if (preg_match('#^dharmashalas/([^/]+)$#', $route, $m) && $method === 'DELETE') {
    requireSuperAdmin($AUTH_SECRET);
    $pdo->prepare("DELETE FROM dharmashalas WHERE id=?")->execute([$m[1]]);
    respond(['ok' => true]);
}

// --- Samaj Ratna (समाज रत्न) CRUD ---
if ($route === 'ratna' && $method === 'POST') {
    requireSuperAdmin($AUTH_SECRET);
    $b = getJsonBody();
    $id = 'ratna-' . (int)(microtime(true) * 1000);
    $pdo->prepare("INSERT INTO samaj_ratna (id,name_hi,name_en,category,district_hi,district_en,achievement_hi,achievement_en,bio_hi,bio_en,initials) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
        ->execute([$id, $b['nameHi'] ?? '', $b['nameEn'] ?? ($b['nameHi'] ?? ''), $b['category'] ?? 'social', $b['districtHi'] ?? 'बेमेतरा', $b['districtEn'] ?? 'Bemetara', $b['achievementHi'] ?? '', $b['achievementEn'] ?? ($b['achievementHi'] ?? ''), $b['bioHi'] ?? '', $b['bioEn'] ?? ($b['bioHi'] ?? ''), $b['initials'] ?? '']);
    respond(array_merge(['id' => $id], $b), 201);
}

if (preg_match('#^ratna/([^/]+)$#', $route, $m) && $method === 'PUT') {
    requireSuperAdmin($AUTH_SECRET);
    $b = getJsonBody();
    $pdo->prepare("UPDATE samaj_ratna SET name_hi=?, name_en=?, category=?, district_hi=?, district_en=?, achievement_hi=?, achievement_en=?, bio_hi=?, bio_en=?, initials=? WHERE id=?")
        ->execute([$b['nameHi'] ?? '', $b['nameEn'] ?? ($b['nameHi'] ?? ''), $b['category'] ?? 'social', $b['districtHi'] ?? 'बेमेतरा', $b['districtEn'] ?? 'Bemetara', $b['achievementHi'] ?? '', $b['achievementEn'] ?? ($b['achievementHi'] ?? ''), $b['bioHi'] ?? '', $b['bioEn'] ?? ($b['bioHi'] ?? ''), $b['initials'] ?? '', $m[1]]);
    respond(array_merge(['id' => $m[1]], $b));
}

if (preg_match('#^ratna/([^/]+)$#', $route, $m) && $method === 'DELETE') {
    requireSuperAdmin($AUTH_SECRET);
    $pdo->prepare("DELETE FROM samaj_ratna WHERE id=?")->execute([$m[1]]);
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
