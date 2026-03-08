START TRANSACTION;

-- Table: Encryption Keys 

CREATE TABLE encryption_keys (
    Key_iD int auto_increment PRIMARY kEY,
    user_id int not null,
    key_value text not null,
    key_type VARCHAR(50),
    created_at DATETIME DEFAULT CUURRENT_TIMESTAMP
);
