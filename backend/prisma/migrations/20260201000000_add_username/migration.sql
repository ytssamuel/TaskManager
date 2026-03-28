-- Add username column with temporary unique values
ALTER TABLE "users" ADD COLUMN "username" TEXT UNIQUE;

-- Update existing users with unique usernames
UPDATE "users" SET "username" = 'user_' || REPLACE("id"::TEXT, '-', '') WHERE "username" IS NULL;

-- Set default for any remaining
ALTER TABLE "users" ALTER COLUMN "username" SET DEFAULT 'user_default';
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
