/*
  Warnings:

  - You are about to drop the column `dropboxToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleDriveToken` on the `User` table. All the data in the column will be lost.
  - Added the required column `spaceId` to the `BackupRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BackupRecord" ADD COLUMN     "hasZip" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "spaceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "dropboxToken",
DROP COLUMN "googleDriveToken",
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT;

-- CreateTable
CREATE TABLE "VisualBuilderTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "VisualBuilderTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "status" TEXT,
    "logFile" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "betaBannerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "betaBannerText" TEXT NOT NULL DEFAULT '🚀 This is a beta version of the app',
    "tickerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tickerText" TEXT NOT NULL DEFAULT 'Welcome to the migration tool!',
    "maxAssetSizeMB" INTEGER NOT NULL DEFAULT 1024,
    "maxBackupsPerUser" INTEGER NOT NULL DEFAULT 1,
    "enableAssetBackups" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisualBuilderTemplate_userId_idx" ON "VisualBuilderTemplate"("userId");

-- CreateIndex
CREATE INDEX "SystemLog_action_idx" ON "SystemLog"("action");

-- CreateIndex
CREATE INDEX "SystemLog_level_idx" ON "SystemLog"("level");

-- CreateIndex
CREATE INDEX "SystemLog_timestamp_idx" ON "SystemLog"("timestamp");

-- AddForeignKey
ALTER TABLE "VisualBuilderTemplate" ADD CONSTRAINT "VisualBuilderTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
