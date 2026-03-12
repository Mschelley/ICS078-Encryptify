START TRANSACTION;


INSERT INTO user_activity_logs (user_id, action)
VALUES (1, 'open_application');


SELECT * FROM user_activity_logs;

COMMIT;