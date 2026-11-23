-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "spoiler" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "spoilerAuto" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Indication" ADD COLUMN     "spoiler" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "spoilerAuto" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "spoiler" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "spoilerAuto" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Reply" ADD COLUMN     "spoiler" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "spoilerAuto" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "spoilerAuto" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "spoiler" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "spoilerAuto" BOOLEAN NOT NULL DEFAULT false;
