-- Per-user preferences (notification channel opt-ins).
--
-- Stored as JSON so channels/categories can be added without a migration.
-- NULL means "never set", which the API resolves to the documented defaults.

ALTER TABLE "users" ADD COLUMN "preferences" JSONB;
