<?php
// ══════════════════════════════════════════════════════════
//  ENCRYPTIFY — Settings Handler
//  Actions: save_settings
// ══════════════════════════════════════════════════════════

switch ($action) {

    // ════════════════════════
    // SAVE USER SETTINGS
    // ════════════════════════
    case 'save_settings':
        $user = requireSession();
        $pdo  = getDB();

        // ── Account fields ──
        $name  = trim($_POST['name']  ?? '');
        $email = trim($_POST['email'] ?? '');

        if ($name && $email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            // Split "First Last" → first_name + last_name
            $parts = explode(' ', $name, 2);
            $fn    = $parts[0];
            $ln    = $parts[1] ?? '';

            $pdo->prepare('UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?')
                ->execute([$fn, $ln, $email, $user['id']]);

            // Keep session in sync
            $_SESSION['user']['name']  = $name;
            $_SESSION['user']['email'] = $email;
        }

        // ── Preference fields ──
        $minPass      = (int)($_POST['minPassLength'] ?? 6);
        $autoClear    = isset($_POST['autoClear'])    ? 1 : 0;
        $showStrength = isset($_POST['showStrength']) ? 1 : 0;
        $theme        = in_array($_POST['theme'] ?? '', ['natural', 'ocean', 'dusk'])
                            ? $_POST['theme'] : 'natural';
        $reduceMotion = isset($_POST['reduceMotion']) ? 1 : 0;
        $saveHistory  = isset($_POST['saveHistory'])  ? 1 : 0;

        $pdo->prepare(
            'INSERT INTO user_settings
                (user_id, min_pass_length, auto_clear, show_strength, theme, reduce_motion, save_history)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                min_pass_length = VALUES(min_pass_length),
                auto_clear      = VALUES(auto_clear),
                show_strength   = VALUES(show_strength),
                theme           = VALUES(theme),
                reduce_motion   = VALUES(reduce_motion),
                save_history    = VALUES(save_history)'
        )->execute([$user['id'], $minPass, $autoClear, $showStrength, $theme, $reduceMotion, $saveHistory]);

        respond(['success' => true]);
        break;
}
