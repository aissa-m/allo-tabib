-- Validación de profesionales por un admin. Los que ya existían se dan por validados;
-- los nuevos registros entran como PENDING.
CREATE TYPE "ProfessionalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "Professional" ADD COLUMN "status" "ProfessionalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "reviewedAt" TIMESTAMP(3);

ALTER TABLE "Professional" ALTER COLUMN "status" SET DEFAULT 'PENDING';

CREATE INDEX "Professional_status_idx" ON "Professional"("status");
