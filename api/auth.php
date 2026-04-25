<?php
// ══════════════════════════════════════════════════════════
//  ENCRYPTIFY — Auth Handler
//  Actions: login | logout | register | session
// ══════════════════════════════════════════════════════════

// Helper: build the settings array from a DB row
function buildSettingsArray(array $row): array {
    return [
        'minPassLength' => (int)$row['min_pass_length'],
        'autoClear'     => (bool)$row['auto_clear'],
        'showStrength'  => (bool)$row['show_strength'],
        'theme'         => $row['theme'],
        'reduceMotion'  => (bool)$row['reduce_motion'],
        'saveHistory'   => (bool)$row['save_history'],
    ];
}

// Helper: fetch (or create) settings for a user
function fetchSettings(PDO $pdo, int $userId): array {
    $stmt = $pdo->prepare('SELECT * FROM user_settings WHERE user_id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();

    if (!$row) {
        $pdo->prepare('INSERT IGNORE INTO user_settings (user_id) VALUES (?)')->execute([$userId]);
        $row = [
            'min_pass_length' => 6, 'auto_clear'  => 1, 'show_strength' => 1,
            'theme'           => 'natural', 'reduce_motion' => 0, 'save_history' => 1,
        ];
    }
    return buildSettingsArray($row);
}

// ──────────────────────────────────────────────────────────
switch ($action) {

    // ════════════════════════
    // LOGIN
    // ════════════════════════
    case 'login':
        $email    = trim($_POST['email']    ?? '');
        $password =      $_POST['password'] ?? '';

        if (!$email || !$password) {
            respond(['error' => 'Email and password are required.']);
        }

        $pdo  = getDB();
        $stmt = $pdo->prepare(
            'SELECT id, first_name, last_name, email, password, role, status
             FROM users WHERE email = ? LIMIT 1'
        );
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            respond(['error' => 'Invalid email or password.']);
        }

        // All passwords in the DB are bcrypt ($2y$10$...).
        // Demo accounts were seeded with pre-generated verified hashes.
        // New registrations are hashed at sign-up time.
        if (!password_verify($password, $user['password'])) {
            respond(['error' => 'Invalid email or password.']);
        }
        if ($user['status'] === 'suspended') {
            respond(['error' => '🚫 This account has been suspended. Contact admin.']);
        }

        $sessionUser = [
            'id'    => (int)$user['id'],
            'name'  => $user['first_name'] . ' ' . $user['last_name'],
            'email' => $user['email'],
            'role'  => $user['role'],
        ];
        $_SESSION['user'] = $sessionUser;

        // Log login event
        writeSystemLog($pdo, $sessionUser['id'],
            'User logged in: ' . $sessionUser['name'] . ' [' . $sessionUser['role'] . ']',
            'login'
        );

        respond([
            'success'  => true,
            'user'     => $sessionUser,
            'settings' => fetchSettings($pdo, $sessionUser['id']),
        ]);
        break;

    // ════════════════════════
    // LOGOUT
    // ════════════════════════
    case 'logout':
        if (!empty($_SESSION['user'])) {
            $u = $_SESSION['user'];
            try {
                writeSystemLog(getDB(), $u['id'], 'User logged out: ' . $u['name'], 'logout');
            } catch (Exception $e) { /* non-fatal */ }
        }
        session_destroy();
        respond(['success' => true]);
        break;

    // ════════════════════════
    // REGISTER
    // ════════════════════════
    case 'register':
        $firstName = trim($_POST['firstName'] ?? '');
        $lastName  = trim($_POST['lastName']  ?? '');
        $email     = trim($_POST['email']     ?? '');
        $password  =      $_POST['password']  ?? '';
        $confirm   =      $_POST['confirm']   ?? '';

        if (!$firstName || !$lastName)
            respond(['error' => 'Please enter your first and last name.']);
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL))
            respond(['error' => 'Please enter a valid email address.']);
        if (strlen($password) < 6)
            respond(['error' => 'Password must be at least 6 characters.']);
        if ($password !== $confirm)
            respond(['error' => 'Passwords do not match.']);

        $pdo = getDB();
        $chk = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $chk->execute([$email]);
        if ($chk->fetch()) respond(['error' => 'An account with this email already exists.']);

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $pdo->prepare(
            "INSERT INTO users (first_name, last_name, email, password, role, status)
             VALUES (?, ?, ?, ?, 'user', 'active')"
        )->execute([$firstName, $lastName, $email, $hash]);
        $newId = (int)$pdo->lastInsertId();

        $pdo->prepare('INSERT IGNORE INTO user_settings (user_id) VALUES (?)')->execute([$newId]);
        writeSystemLog($pdo, $newId, 'New user registered: ' . $firstName . ' ' . $lastName, 'register');

        respond(['success' => true, 'name' => $firstName]);
        break;

    // ════════════════════════
    // SESSION CHECK
    // ════════════════════════
    case 'session':
        if (!empty($_SESSION['user'])) {
            $u = $_SESSION['user'];
            respond([
                'loggedIn' => true,
                'user'     => $u,
                'settings' => fetchSettings(getDB(), $u['id']),
            ]);
        } else {
            respond(['loggedIn' => false]);
        }
        break;
}
