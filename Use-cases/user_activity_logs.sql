<?php


// ── Build a clean, structured action string ────────────────
$ip         = trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown')[0]);
$user_agent = trim($_SERVER['HTTP_USER_AGENT'] ?? 'unknown');
$page       = trim($_SERVER['PHP_SELF']        ?? 'unknown');

$action = sprintf(
    'User accessed Dashboard | Page: %s | IP: %s | Agent: %s',
    $page,
    $ip,
    $user_agent
);

// ── Insert into activity_logs ──────────────────────────────
$log_stmt = $pdo->prepare("
    INSERT INTO activity_logs (user_id, action, ip_address, user_agent)
    VALUES (?, ?, ?, ?)
");
$log_stmt->execute([
    $db_user['id'],
    $action,
    $ip,
    $user_agent,
]);