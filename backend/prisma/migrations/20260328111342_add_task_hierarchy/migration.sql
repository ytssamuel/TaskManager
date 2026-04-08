-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "parentTaskId" TEXT;

-- CreateTable
CREATE TABLE "task_operation_logs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sourceIds" TEXT[],
    "targetId" TEXT,
    "metadata" JSONB,
    "performedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_operation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_task_dependencies" (
    "id" TEXT NOT NULL,
    "localTaskId" TEXT NOT NULL,
    "localProjectId" TEXT NOT NULL,
    "externalTaskId" TEXT NOT NULL,
    "externalProjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_task_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "external_task_dependencies_localTaskId_externalTaskId_key" ON "external_task_dependencies"("localTaskId", "externalTaskId");

-- CreateIndex
CREATE INDEX "tasks_projectId_status_idx" ON "tasks"("projectId", "status");

-- CreateIndex
CREATE INDEX "tasks_parentTaskId_idx" ON "tasks"("parentTaskId");

-- CreateIndex
CREATE INDEX "tasks_projectId_parentTaskId_idx" ON "tasks"("projectId", "parentTaskId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
