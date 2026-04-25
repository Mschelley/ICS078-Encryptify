<?php

session_start();
error_reporting(0);
ini_set('display_errors', '0');
header('Content-Type: application/json');

require_once __DIR__ . '/../config/db.php';   
// ══════════════════════════════════════════════════════════
//  ENCRYPTIFY — API Router  (api/router.php)
//  Entry point for all fetch() calls from assets/js/script.js
//  Dispatches to the correct handler based on $action.
// ══════════════════════════════════════════════════════════
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
    $headers = ['HTTP_CF_CONNECTING_IP','HTTP_X_FORWARDED_FOR','HTTP_X_REAL_IP','REMOTE_ADDR'];
    foreach ($headers as $h) {
        if (!empty($_SERVER[$h])) {
            $ip = trim(explode(',', $_SERVER[$h])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                // Normalize IPv6 loopback to readable form
                if ($ip === '::1') return '127.0.0.1 (localhost)';
                return $ip;
            }
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
function writeSystemLog(PDO $pdo, ?int $userId, string $message, string $page = '', string $url = ''): void {
    $pageRecord = $url ?: $page;
    $pdo->prepare(
        'INSERT INTO system_logs (user_id, message, ip_address, browser, page) VALUES (?, ?, ?, ?, ?)'
    )->execute([$userId, $message, getClientIP(), parseBrowser(), $pageRecord]);
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

if (!isset($routes[$action])) {
    respond(['error' => 'Unknown action.'], 404);
}

try {
    include __DIR__ . '/' . $routes[$action];
} catch (Throwable $e) {
    respond(['error' => 'Server error: ' . $e->getMessage()], 500);
}