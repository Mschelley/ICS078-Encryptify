<?php
// ══════════════════════════════════════════════════════════
//  ENCRYPTIFY — Central Configuration
//  Edit this file to switch environments (local / staging / production)
// ══════════════════════════════════════════════════════════

// ── Base URL ─────────────────────────────────────────────
//  Set this to the root URL of your project folder.
//  No trailing slash.
//  Examples:
//    Local XAMPP sub-folder : 'http://localhost/encryptify'
//    Local root             : 'http://localhost'
//    Live domain            : 'https://encryptify.yourdomain.com'
if (!defined('BASE_URL')) {
    $docRoot = str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT'] ?? '');
    $appRoot = str_replace('\\', '/', dirname(__DIR__));
    $relative = $docRoot ? str_replace($docRoot, '', $appRoot) : '';
    $relative = '/' . ltrim($relative, '/');
    define('BASE_URL', rtrim($relative, '/'));
}

// ── Database Credentials ──────────────────────────────────
define('DB_HOST',    '');
define('DB_NAME',    '');
define('DB_USER',    '');
define('DB_PASS',    '');
define('DB_CHARSET', 'utf8mb4');

// ── App Settings ─────────────────────────────────────────
define('APP_NAME',   'Encryptify');
define('APP_ENV',    'development');  

// ══════════════════════════════════════════════════════════
//  PDO Singleton — call getDB() anywhere after requiring this file
// ══════════════════════════════════════════════════════════
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn     = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // In development show the real error; in production show generic message
            $msg = (APP_ENV === 'development')
                ? 'Database connection failed: ' . $e->getMessage()
                : 'Database connection failed. Please contact the administrator.';
            http_response_code(500);
            header('Content-Type: application/json');
            die(json_encode(['error' => $msg]));
        }
    }
    return $pdo;
}
