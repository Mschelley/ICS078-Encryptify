START TRANSACTION;

-- Table: Encryption Keys 

CREATE TABLE encryption_keys (
    Key_iD int auto_increment PRIMARY KEY,
    user_id int not null,
    key_value text not null,
    key_type VARCHAR(50),
    created_at DATETIME DEFAULT CUURRENT_TIMESTAMP
);

-- Table: Encrypted Data
CREATE TABLE encrypted_data(
    encryption_id INT auto_increment PRIMARY KEY,
    message_id INT not null,
    encrypted_text TEXT not null,
    encryption_algorithm VARCHAR(100),
    encryption_key_id INT,
    date_encrypted DATETIME DEFAULT CUURRENT_TIMESTAMP,
    FOREIGN KEY (encryption_key_id) REFERENCES encryption_keys(Key_iD)
);