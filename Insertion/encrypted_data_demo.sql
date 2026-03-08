INSERT INTO encrypted_data(
    encryption_id,
    message_id,
    encrypted_text,
    encryption_algorithm,
    encryption_key_id,
    date_encrypted,
) 
VALUES(
 (1, 101, 'U2FsdGVkX1+8KJH23hds72...', 'AES-256', 1, '2026-03-08 10:30:00'),
(2, 102, 'ZGF0YUVuY3J5cHRlZFN0cmluZw==', 'RSA-2048', 2, '2026-03-08 10:35:00'),
(3, 103, 'QWxhZGRpbjpPcGVuU2VzYW1l', 'AES-256', 3, '2026-03-08 10:40:00');
);