START TRANSACTION;

-- Table: Encryption and Decryption
CREATE TABLE encrypt_and_decrypt_file (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    log_id INT NULL,
    rating TINYINT NOT NULL,
    comment VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (log_id) REFERENCES user_activity_logs(id)
) ENGINE=InnoDB;

-- Table: Encryption Keys 
CREATE TABLE encryption_keys (
    key_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    key_value TEXT NOT NULL,
    key_type VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Table: Encrypted Data
CREATE TABLE encrypted_data(
    encryption_id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    encrypted_text TEXT NOT NULL,
    encryption_algorithm VARCHAR(100),
    encryption_key_id INT,
    date_encrypted DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (encryption_key_id) REFERENCES encryption_keys(key_id)
) ENGINE=InnoDB;

-- Table: Decryption Records
CREATE TABLE decryption_records (
    decryption_id INT AUTO_INCREMENT PRIMARY KEY,
    encryption_id INT NOT NULL,
    decrypted_text TEXT NOT NULL,
    user_id INT NOT NULL,
    date_decrypted DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (encryption_id) REFERENCES encrypted_data(encryption_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

COMMIT;
