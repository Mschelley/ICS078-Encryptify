START TRANSACTION;


INSERT INTO encryption_keys (user_id, key_value, key_type)
VALUES (1, 'A9X7K3L8P2', 'AES');

SELECT * FROM encryption_keys;

COMMIT;