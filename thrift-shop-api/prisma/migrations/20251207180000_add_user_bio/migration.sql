-- The account profile form has always rendered a Bio field with nowhere to
-- store it, so submitting the form failed whitelist validation and no part of
-- the profile could be saved.
ALTER TABLE "users" ADD COLUMN "bio" TEXT;
