-- AlterTable: store hashed refresh token per user for rotation validation
ALTER TABLE "User" ADD COLUMN "refreshTokenHash" TEXT;
