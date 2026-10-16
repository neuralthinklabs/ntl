-- 0007: new roles. Run this file ON ITS OWN and let it finish before 0008.
-- (A new enum value cannot be used in the same transaction that adds it.)
alter type user_role add value if not exists 'volunteer';
alter type user_role add value if not exists 'core_team';
