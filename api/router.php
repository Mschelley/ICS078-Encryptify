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
    'clear_system_logs' => 'logs.php',
    // settings
    'save_settings'     => 'settings.php',
];

if (!$action || !isset($routes[$action])) {
    respond(['error' => 'Unknown action: ' . htmlspecialchars($action)], 400);
}

require __DIR__ . '/' . $routes[$action];

respond(['error' => 'Handler did not return a response.'], 500);
