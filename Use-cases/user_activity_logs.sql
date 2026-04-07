$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $forwarded_ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
    $ip = trim($forwarded_ips[0]);
}

$user_agent = substr(trim($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'), 0, 255);
$page       = trim($_SERVER['PHP_SELF'] ?? 'unknown');
$user_id    = $db_user['id'] ?? null;

$action = sprintf(
    'User accessed Dashboard | Page: %s',
    $page
);

try {
    $log_stmt = $pdo->prepare("
        INSERT INTO activity_logs (user_id, action, ip_address, user_agent)
        VALUES (?, ?, ?, ?)
    ");
    $log_stmt->execute([
        $user_id,
        $action,
        $ip,
        $user_agent,
    ]);
} catch (PDOException $e) {
    error_log("Log insert failed: " . $e->getMessage());
}
