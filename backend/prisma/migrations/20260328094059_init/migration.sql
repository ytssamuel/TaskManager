/*
  Warnings:

  - The `role` column on the `api_keys` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ApiKeyRole" AS ENUM ('READ_ONLY', 'MEMBER', 'ADMIN', 'OWNER');

-- DropIndex
DROP INDEX "task_comments_taskId_index";

-- DropIndex
DROP INDEX "task_comments_userId_index";

-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "projectId" TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" "ApiKeyRole" NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "task_comments" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
