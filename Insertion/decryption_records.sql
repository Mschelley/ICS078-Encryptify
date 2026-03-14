INSERT INTO decryption_records(
    decryption_id,
    encryption_id,
    descrypted_text,
    user_id,
    date_decrypted,
)
VALUES(
(1, 1, 'Hello World', 1, '2026-03-08 11:00:00'),
(2, 2, 'Confidential Message', 2, '2026-03-08 11:05:00'),
(3, 3, 'Sample Text for Testing', 1, '2026-03-08 11:10:00');
);