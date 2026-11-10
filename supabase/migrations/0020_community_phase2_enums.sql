-- 0020: Community phase 2, step 1 of 2. Run this file ON ITS OWN and let it
-- finish before 0021 (a new enum value cannot be used in the transaction that adds it).
alter type community_notification_type add value if not exists 'message';
alter type community_notification_type add value if not exists 'task_assigned';
alter type community_notification_type add value if not exists 'task_update';
alter type community_notification_type add value if not exists 'meeting_scheduled';
alter type community_notification_type add value if not exists 'meeting_cancelled';
alter type community_notification_type add value if not exists 'meeting_reminder';
