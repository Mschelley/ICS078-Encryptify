<?php
// ══════════════════════════════════════════════════════════
//  ENCRYPTIFY — User Management Handler
//  Actions: get_users | add_user | change_role | toggle_status | delete_user
// ══════════════════════════════════════════════════════════

switch ($action) {

    // ════════════════════════
    // LIST USERS (manager sees only 'user' role; admin sees all)
    // ════════════════════════
    case 'get_users':
        $caller = requireSession();
        $pdo    = getDB();

        if ($caller['role'] === 'admin') {
            $stmt = $pdo->query(
                'SELECT id, first_name, last_name, email, role, status, created_at
                 FROM users ORDER BY created_at ASC'
            );
        } elseif ($caller['role'] === 'manager') {
            $stmt = $pdo->query(
                "SELECT id, first_name, last_name, email, role, status, created_at
                 FROM users WHERE role = 'user' ORDER BY created_at ASC"
            );
        } else {
            respond(['error' => 'Access denied.'], 403);
        }

        $users   = $stmt->fetchAll();
        $logStmt = $pdo->prepare('SELECT COUNT(*) FROM file_logs WHERE user_id = ?');
        foreach ($users as &$u) {
            $logStmt->execute([$u['id']]);
            $u['ops'] = (int)$logStmt->fetchColumn();
        }
        unset($u);

        respond(['users' => $users]);
        break;

    // ════════════════════════
    // ADD USER (admin only)
    // ════════════════════════
    case 'add_user':
        requireRole('admin');

        $fn   = trim($_POST['firstName'] ?? '');
        $ln   = trim($_POST['lastName']  ?? '');
        $em   = trim($_POST['email']     ?? '');
        $pw   =      $_POST['password']  ?? '';
        $role =      $_POST['role']      ?? 'user';

        if (!$fn || !$ln)
            respond(['error' => 'Please enter first and last name.']);
        if (!filter_var($em, FILTER_VALIDATE_EMAIL))
            respond(['error' => 'Please enter a valid email.']);
        if (strlen($pw) < 6)
            respond(['error' => 'Password must be at least 6 characters.']);
        if (!in_array($role, ['user', 'manager', 'admin'], true))
            respond(['error' => 'Invalid role.']);

        $pdo = getDB();
        $chk = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $chk->execute([$em]);
        if ($chk->fetch()) respond(['error' => 'Email already in use.']);

        $hash = password_hash($pw, PASSWORD_DEFAULT);
        $pdo->prepare(
            "INSERT INTO users (first_name, last_name, email, password, role, status)
             VALUES (?, ?, ?, ?, ?, 'active')"
        )->execute([$fn, $ln, $em, $hash, $role]);
        $newId = (int)$pdo->lastInsertId();

        $pdo->prepare('INSERT IGNORE INTO user_settings (user_id) VALUES (?)')->execute([$newId]);

        $caller = $_SESSION['user'];
        $pdo->prepare('INSERT INTO system_logs (user_id, message) VALUES (?, ?)')
            ->execute([$caller['id'], 'Admin created user: ' . $fn . ' ' . $ln . ' [' . $role . ']']);

        respond(['success' => true]);
        break;

    // ════════════════════════
    // CHANGE ROLE (admin only)
    // ════════════════════════
    case 'change_role':
        requireRole('admin');

        $targetId = (int)($_POST['userId'] ?? 0);
        $newRole  =      $_POST['role']    ?? '';

        if (!in_array($newRole, ['user', 'manager', 'admin'], true))
            respond(['error' => 'Invalid role.']);

        $pdo = getDB();
        $old = $pdo->prepare('SELECT first_name, last_name, role FROM users WHERE id = ?');
        $old->execute([$targetId]);
        $target = $old->fetch();
        if (!$target) respond(['error' => 'User not found.']);

        $pdo->prepare('UPDATE users SET role = ? WHERE id = ?')->execute([$newRole, $targetId]);

        $caller = $_SESSION['user'];
        $pdo->prepare('INSERT INTO system_logs (user_id, message) VALUES (?, ?)')
            ->execute([
                $caller['id'],
                'Role changed: ' . $target['first_name'] . ' ' . $target['last_name']
                . ' → ' . $newRole . ' (was ' . $target['role'] . ')',
            ]);

        respond(['success' => true]);
        break;

    // ════════════════════════
    // TOGGLE ACTIVE / SUSPENDED (admin only)
    // ════════════════════════
    case 'toggle_status':
        requireRole('admin');

        $targetId = (int)($_POST['userId'] ?? 0);
        $caller   = $_SESSION['user'];

        if ($targetId === $caller['id'])
            respond(['error' => 'You cannot suspend your own account.']);

        $pdo = getDB();
        $cur = $pdo->prepare('SELECT first_name, last_name, status FROM users WHERE id = ?');
        $cur->execute([$targetId]);
        $target = $cur->fetch();
        if (!$target) respond(['error' => 'User not found.']);

        $newStatus = $target['status'] === 'active' ? 'suspended' : 'active';
        $pdo->prepare('UPDATE users SET status = ? WHERE id = ?')->execute([$newStatus, $targetId]);

        $pdo->prepare('INSERT INTO system_logs (user_id, message) VALUES (?, ?)')
            ->execute([
                $caller['id'],
                'User ' . ($newStatus === 'suspended' ? 'suspended' : 'reactivated')
                . ': ' . $target['first_name'] . ' ' . $target['last_name'],
            ]);

        respond(['success' => true, 'newStatus' => $newStatus]);
        break;

    // ════════════════════════
    // DELETE USER (admin only)
    // ════════════════════════
    case 'delete_user':
        requireRole('admin');

        $targetId = (int)($_POST['userId'] ?? 0);
        $caller   = $_SESSION['user'];

        if ($targetId === $caller['id'])
            respond(['error' => 'You cannot delete your own account.']);

        $pdo = getDB();
        $cur = $pdo->prepare('SELECT first_name, last_name FROM users WHERE id = ?');
        $cur->execute([$targetId]);
        $target = $cur->fetch();
        if (!$target) respond(['error' => 'User not found.']);

        $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$targetId]);

        $pdo->prepare('INSERT INTO system_logs (user_id, message) VALUES (?, ?)')
            ->execute([$caller['id'], 'User deleted: ' . $target['first_name'] . ' ' . $target['last_name']]);

        respond(['success' => true]);
        break;
}
