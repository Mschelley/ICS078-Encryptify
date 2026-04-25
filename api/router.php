<?php
// ══════════════════════════════════════════════════════════
//  ENCRYPTIFY — API Router  (api/router.php)
//  Entry point for all fetch() calls from assets/js/script.js
//  Dispatches to the correct handler based on $action.
// ══════════════════════════════════════════════════════════
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../config/db.php';

// ── Shared helpers — available to every included handler ──
function respond(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function requireSession(): array {
    if (empty($_SESSION['user'])) {
        respond(['error' => 'Not authenticated.'], 401);
    }
    return $_SESSION['user'];
}

function requireRole(string ...$roles): void {
    $user = requireSession();
    if (!in_array($user['role'], $roles, true)) {
        respond(['error' => 'Access denied.'], 403);
    }
}

// ── Get real client IP ─────────────────────────────────────
function getClientIP(): string {
    $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
    foreach ($headers as $h) {
        if (!empty($_SERVER[$h])) {
            $ip = trim(explode(',', $_SERVER[$h])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
    }
    return '0.0.0.0';
}

// ── Parse a concise browser label from UA ─────────────────
function parseBrowser(): string {
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    if (preg_match('/(OPR|Opera)\/[\d.]+/', $ua))            return 'Opera';
    if (preg_match('/Edg\/[\d.]+/', $ua))                     return 'Edge';
    if (preg_match('/Chrome\/([\d.]+)/', $ua, $m))            return 'Chrome ' . explode('.', $m[1])[0];
    if (preg_match('/Firefox\/([\d.]+)/', $ua, $m))           return 'Firefox ' . explode('.', $m[1])[0];
    if (preg_match('/Safari\/([\d.]+)/', $ua) && !str_contains($ua, 'Chrome')) return 'Safari';
    return substr($ua, 0, 60);
}

// ── Shared log helper (used by auth.php & the route below) ─
function writeSystemLog(PDO $pdo, ?int $userId, string $message, string $page = ''): void {
    $pdo->prepare(
        'INSERT INTO system_logs (user_id, message, ip_address, browser, page) VALUES (?, ?, ?, ?, ?)'
    )->execute([$userId, $message, getClientIP(), parseBrowser(), $page]);
}

// ── Dispatch ──────────────────────────────────────────────
$action = trim($_POST['action'] ?? $_GET['action'] ?? '');

$routes = [
    // auth
    'login'             => 'auth.php',
    'logout'            => 'auth.php',
    'register'          => 'auth.php',
    'session'           => 'auth.php',
    // file logs
    'log_file'          => 'files.php',
    'get_file_logs'     => 'files.php',
    // user management
    'get_users'         => 'users.php',
    'add_user'          => 'users.php',
    'change_role'       => 'users.php',
    'toggle_status'     => 'users.php',
    'delete_user'       => 'users.php',
    // system logs
    'get_system_logs'   => 'logs.php',
    'get_activity_logs' => 'logs.php',
    'clear_system_logs' => 'logs.php',
    'log_page_visit'    => 'logs.php',
    // settings
    'save_settings'     => 'settings.php',
];

if (!$action || !isset($routes[$action])) {
    respond(['error' => 'Unknown action: ' . htmlspecialchars($action)], 400);
}

require __DIR__ . '/' . $routes[$action];

respond(['error' => 'Handler did not return a response.'], 500);
