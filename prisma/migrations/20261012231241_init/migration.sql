-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PROFESSIONAL', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProfessionalType" AS ENUM ('DOCTOR', 'NURSE');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PROFESSIONAL',
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ProfessionalType" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "sex" "Sex" NOT NULL,
    "nni" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "whatsapp" TEXT,
    "specialtyId" INTEGER NOT NULL,
    "yearsExperience" INTEGER NOT NULL,
    "workplace" TEXT NOT NULL,
    "languages" TEXT[],
    "bio" TEXT NOT NULL DEFAULT '',
    "homeZoneId" INTEGER NOT NULL,
    "hasVehicle" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "availableSince" TIMESTAMP(3),
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "locationUpdatedAt" TIMESTAMP(3),
    "currentZoneId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialty" (
    "id" SERIAL NOT NULL,
    "type" "ProfessionalType" NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEs" TEXT NOT NULL,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" SERIAL NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "polygon" JSONB NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_userId_key" ON "Professional"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_nni_key" ON "Professional"("nni");

-- CreateIndex
CREATE INDEX "Professional_isAvailable_idx" ON "Professional"("isAvailable");

-- CreateIndex
CREATE INDEX "Professional_currentZoneId_idx" ON "Professional"("currentZoneId");

-- CreateIndex
CREATE INDEX "Professional_type_idx" ON "Professional"("type");

-- CreateIndex
CREATE INDEX "Professional_specialtyId_idx" ON "Professional"("specialtyId");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_type_nameFr_key" ON "Specialty"("type", "nameFr");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_nameFr_key" ON "Zone"("nameFr");

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_homeZoneId_fkey" FOREIGN KEY ("homeZoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_currentZoneId_fkey" FOREIGN KEY ("currentZoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
