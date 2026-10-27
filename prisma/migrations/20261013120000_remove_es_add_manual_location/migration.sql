-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "locationManual" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Specialty" DROP COLUMN "nameEs";

