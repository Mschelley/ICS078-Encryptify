<?php
// ══════════════════════════════════════════════════════════
//  ENCRYPTIFY — File Logs Handler
//  Actions: log_file | get_file_logs
// ══════════════════════════════════════════════════════════

switch ($action) {

    // ════════════════════════
    // LOG A FILE OPERATION
    // ════════════════════════
    case 'log_file':
        $user       = requireSession();
        $actionType = $_POST['type']     ?? '';   // 'encrypted' | 'decrypted'
        $fileName   = trim($_POST['fileName']  ?? '');
        $fileSize   = (int)($_POST['fileSize'] ?? 0);

        if (!in_array($actionType, ['encrypted', 'decrypted'], true) || !$fileName) {
            respond(['error' => 'Invalid parameters.']);
        }

        getDB()->prepare(
            'INSERT INTO file_logs (user_id, action, file_name, file_size) VALUES (?, ?, ?, ?)'
        )->execute([$user['id'], $actionType, $fileName, $fileSize]);

        respond(['success' => true]);
        break;

    // ════════════════════════
    // GET USER'S FILE HISTORY
    // ════════════════════════
    case 'get_file_logs':
        $user = requireSession();
        $stmt = getDB()->prepare(
            'SELECT action, file_name, file_size, created_at
             FROM file_logs
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 200'
        );
        $stmt->execute([$user['id']]);
        respond(['logs' => $stmt->fetchAll()]);
        break;
}
