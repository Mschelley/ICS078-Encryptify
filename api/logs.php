<?php
// ══════════════════════════════════════════════════════════
//  ENCRYPTIFY — System Logs Handler
//  Actions: get_system_logs | clear_system_logs
// ══════════════════════════════════════════════════════════

switch ($action) {

    // ════════════════════════
    // FETCH SYSTEM LOG (admin only)
    // ════════════════════════
    case 'get_system_logs':
        requireRole('admin');

        $stmt = getDB()->prepare(
            'SELECT sl.message, sl.created_at, u.first_name, u.last_name
             FROM system_logs sl
             LEFT JOIN users u ON u.id = sl.user_id
             ORDER BY sl.created_at DESC
             LIMIT 200'
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
