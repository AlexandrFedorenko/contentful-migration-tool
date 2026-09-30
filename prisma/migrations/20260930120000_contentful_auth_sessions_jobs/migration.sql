-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TokenKind" AS ENUM ('OAUTH', 'PAT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "BackupRecord" ADD COLUMN     "environmentId" TEXT,
ADD COLUMN     "sizeBytes" BIGINT,
ADD COLUMN     "stats" JSONB,
ADD COLUMN     "storageKey" TEXT;

-- AlterTable
ALTER TABLE "ContentfulToken" ADD COLUMN     "kind" "TokenKind" NOT NULL DEFAULT 'PAT',
ADD COLUMN     "lastUsedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SystemLog" ADD COLUMN     "ip" TEXT;

-- Preserve tokens that only exist in the legacy User.contentfulToken column
INSERT INTO "ContentfulToken" ("id", "alias", "token", "isActive", "createdAt", "updatedAt", "userId")
SELECT gen_random_uuid()::text, 'Migrated token', u."contentfulToken", true, now(), now(), u."id"
FROM "User" u
WHERE u."contentfulToken" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "ContentfulToken" t WHERE t."userId" = u."id" AND t."token" = u."contentfulToken");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "contentfulToken",
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "contentfulUserId" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ALTER COLUMN "clerkId" DROP NOT NULL;

-- Convert role to enum, keeping existing values
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING (CASE WHEN "role" = 'ADMIN' THEN 'ADMIN' ELSE 'MEMBER' END)::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "params" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "logTail" JSONB,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Job_userId_createdAt_idx" ON "Job"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "BackupRecord_userId_spaceId_idx" ON "BackupRecord"("userId", "spaceId");

-- CreateIndex
CREATE INDEX "SystemLog_userId_timestamp_idx" ON "SystemLog"("userId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "User_contentfulUserId_key" ON "User"("contentfulUserId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

