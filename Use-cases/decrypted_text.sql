START TRANSACTION;

SELECT decrypted_text
FROM decryption_records
WHERE user_id = 1;

COMMIT;