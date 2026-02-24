START TRANSACTION;

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

COMMIT;