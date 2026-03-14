INSERT INTO encryption_keys(

Key_iD,
    user_id,
    key_value,
    key_type,
    created_at DATETIME DEFAULT CUURRENT_TIMESTAMP,
) 
VALUES(
    (1, 1, 'K9F3L8A227', 'AES-256', '2026-03-08 10:15:00'),
    (2,2, 'X5P8Q1R4T6', 'RSA-2048', '2026-03-08 10:20:00'),
    (3, 1, 'M7N2B5V9C3', 'AES-256', '2026-03-08 10:25:00');
)