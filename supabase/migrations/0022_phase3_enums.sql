-- 0022: Phase 3, step 1 of 2. Run this file ON ITS OWN and let it finish before 0023
-- (a new enum value cannot be used in the transaction that adds it).
alter type community_notification_type add value if not exists 'mention';
alter type community_notification_type add value if not exists 'task_due';
