-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "trailerYoutubeId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "GameSuggestion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT,
    "link" TEXT,
    "reason" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "teamNote" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameSuggestion_status_createdAt_idx" ON "GameSuggestion"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "GameSuggestion" ADD CONSTRAINT "GameSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
