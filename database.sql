CREATE DATABASE IF NOT EXISTS encryptify_finals CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE encryptify_finals;

CREATE TABLE IF NOT EXISTS users (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name  VARCHAR(60)  NOT NULL,
    last_name   VARCHAR(60)  NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('user','manager','admin') NOT NULL DEFAULT 'user',
    status      ENUM('active','suspended')     NOT NULL DEFAULT 'active',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS file_logs (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    action      ENUM('encrypted','decrypted') NOT NULL,
    file_name   VARCHAR(255) NOT NULL,
    file_size   INT UNSIGNED NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS system_logs (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NULL,
    message     TEXT NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_settings (
    user_id         INT UNSIGNED PRIMARY KEY,
    min_pass_length INT  NOT NULL DEFAULT 6,
    auto_clear      TINYINT(1) NOT NULL DEFAULT 1,
    show_strength   TINYINT(1) NOT NULL DEFAULT 1,
    theme           VARCHAR(20) NOT NULL DEFAULT 'natural',
    reduce_motion   TINYINT(1) NOT NULL DEFAULT 0,
    save_history    TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO users (first_name, last_name, email, password, role, status) VALUES
('Demo',  'User',      'demo@encryptify.app',    'demo1234',   'user',    'active'),
('Maya',  'Rodriguez', 'manager@encryptify.app', 'manager123', 'manager', 'active'),
('Admin', 'System',    'admin@encryptify.app',   'admin123',   'admin',   'active');
