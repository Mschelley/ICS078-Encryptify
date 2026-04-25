<?php
// ══════════════════════════════════════════════════════════
//  ENCRYPTIFY — System Logs Handler
//  Actions: get_system_logs | get_activity_logs | clear_system_logs | log_page_visit
// ══════════════════════════════════════════════════════════

switch ($action) {

    // ════════════════════════
    // LOG A PAGE VISIT (any authenticated user)
    // ════════════════════════
    case 'log_page_visit':
    $user = requireSession();
    $page = trim($_POST['page'] ?? 'unknown');
    $url  = trim($_POST['url']  ?? '');
    $page = substr(preg_replace('/[^a-z0-9_\-]/', '', strtolower($page)), 0, 60);
    $url  = substr(filter_var($url, FILTER_SANITIZE_URL), 0, 255);
    writeSystemLog(getDB(), $user['id'],
        'Page visited: ' . $page . ' by ' . $user['name'] . ' [' . $user['role'] . ']',
        $url ?: $page
    );
    respond(['success' => true]);
    break;

    // ════════════════════════
    // FETCH FULL ACTIVITY LOG for Activity page (all authenticated users)
    // Returns own logs for regular users; all logs for manager/admin
    // ════════════════════════
    case 'get_activity_logs':
    requireRole('admin');

    $stmt = getDB()->prepare(
        'SELECT sl.id, sl.message, sl.ip_address, sl.browser, sl.page, sl.created_at,
                CONCAT(u.first_name, " ", u.last_name) AS user_name, u.role AS user_role
         FROM system_logs sl
         LEFT JOIN users u ON u.id = sl.user_id
         ORDER BY sl.created_at DESC
         LIMIT 500'
    );
    $stmt->execute();
    respond(['logs' => $stmt->fetchAll()]);
    break;

        respond(['logs' => $stmt->fetchAll()]);
        break;

    // ════════════════════════
    // FETCH SYSTEM LOG (admin only — Admin Panel)
    // ════════════════════════
    case 'get_system_logs':
        requireRole('admin');

        $stmt = getDB()->prepare(
            'SELECT sl.id, sl.message, sl.ip_address, sl.browser, sl.page, sl.created_at,
                    CONCAT(u.first_name, " ", u.last_name) AS user_name, u.role AS user_role
             FROM system_logs sl
             LEFT JOIN users u ON u.id = sl.user_id
             ORDER BY sl.created_at DESC
             LIMIT 500'
        );
        $stmt->execute();
        respond(['logs' => $stmt->fetchAll()]);
        break;

    // ════════════════════════
    // CLEAR SYSTEM LOG (admin only)
    // ════════════════════════
    case 'clear_system_logs':
        requireRole('admin');
        getDB()->exec('DELETE FROM system_logs');
        respond(['success' => true]);
        break;
}
