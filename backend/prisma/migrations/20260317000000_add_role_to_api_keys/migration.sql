-- Add role column to api_keys table
ALTER TABLE "api_keys" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'MEMBER';
