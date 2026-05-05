<?php require_once __DIR__ . '/config/db.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Encryptify — PDF Protection Suite</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="<?= BASE_URL ?>/assets/css/styles.css">
</head>
<body>

<div class="texture-overlay"></div>

<div class="landing-hero">
    <span class="landing-logo-icon">🔐</span>
    <h1>Encryptify</h1>
    <p>Protect your PDF documents with AES encryption — simple, secure, and entirely in your browser.</p>

    <div class="landing-cta">
        <a href="<?= BASE_URL ?>/app/app.php" class="btn-cta-primary">🚀 &nbsp;Launch App</a>
        <a href="<?= BASE_URL ?>/app/app.php" class="btn-cta-secondary">✨ &nbsp;Create Account</a>
    </div>

    <div class="landing-features">
        <div class="feature-card">
            <div class="feature-card-icon">🔒</div>
            <div class="feature-card-title">AES Encryption</div>
            <div class="feature-card-desc">Military-grade encryption applied directly in your browser. Files never leave your device.</div>
        </div>
        <div class="feature-card">
            <div class="feature-card-icon">🌿</div>
            <div class="feature-card-title">Zero Server Storage</div>
            <div class="feature-card-desc">Your PDFs are encrypted client-side. We only log metadata, never file contents.</div>
        </div>
        <div class="feature-card">
            <div class="feature-card-icon">👥</div>
            <div class="feature-card-title">Role-Based Access</div>
            <div class="feature-card-desc">User, Manager, and Admin roles with fine-grained access to team features.</div>
        </div>
    </div>
</div>

<div class="landing-footer">© <?= date('Y') ?> Encryptify · PDF Protection Suite</div>

</body>
</html>
