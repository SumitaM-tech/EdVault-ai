-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'FACULTY', 'ADMIN', 'RECRUITER');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('VERIFIED', 'PENDING', 'REVOKED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "VerificationOutcome" AS ENUM ('VERIFIED', 'PENDING', 'FLAGGED');

-- CreateEnum
CREATE TYPE "FraudLevel" AS ENUM ('TRUSTED', 'SUSPICIOUS', 'HIGH_RISK', 'BLOCKED');

-- CreateEnum
CREATE TYPE "InstitutionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('ETHEREUM', 'POLYGON', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "institution" TEXT,
    "degree" TEXT,
    "wallet" TEXT,
    "walletType" "WalletType",
    "year" TEXT,
    "avatar" TEXT,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "did" TEXT,
    "didDocument" TEXT,
    "didActive" BOOLEAN NOT NULL DEFAULT false,
    "publicKey" TEXT,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "fraudLevel" "FraudLevel" NOT NULL DEFAULT 'TRUSTED',
    "riskFlags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "website" TEXT,
    "address" TEXT,
    "email" TEXT,
    "walletAddress" TEXT,
    "status" "InstitutionStatus" NOT NULL DEFAULT 'ACTIVE',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "allowedIssuers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "credentialCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "department" TEXT,
    "cgpa" TEXT,
    "gradDate" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CredentialStatus" NOT NULL DEFAULT 'VERIFIED',
    "hash" TEXT NOT NULL,
    "cid" TEXT NOT NULL,
    "blockchainTx" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "onChainId" TEXT,
    "qrPayload" TEXT NOT NULL,
    "documentUrl" TEXT,
    "documentHash" TEXT,
    "encryptionKey" TEXT,
    "encryptionIv" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "issuerSignature" TEXT,
    "signatureProof" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokeTx" TEXT,
    "revocationReason" TEXT,
    "fraudLevel" "FraudLevel" NOT NULL DEFAULT 'TRUSTED',
    "ocrExtracted" TEXT,
    "ocrConfidence" DOUBLE PRECISION,
    "duplicateOf" TEXT,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "anomalyFlags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "studentId" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IPFSDocument" (
    "id" TEXT NOT NULL,
    "cid" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "credentialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IPFSDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncryptionKey" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "masterKey" TEXT NOT NULL,
    "derivedKey" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'AES-256-GCM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EncryptionKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationLog" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT,
    "credentialId" TEXT NOT NULL,
    "outcome" "VerificationOutcome" NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'Credential ID',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationAudit" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "verifierId" TEXT NOT NULL,
    "verifierName" TEXT NOT NULL,
    "verifierEmail" TEXT NOT NULL,
    "hashMatch" BOOLEAN NOT NULL,
    "documentMatch" BOOLEAN NOT NULL,
    "signatureValid" BOOLEAN NOT NULL,
    "trustScore" DOUBLE PRECISION NOT NULL,
    "fraudLevel" "FraudLevel" NOT NULL,
    "reportUrl" TEXT,
    "downloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tone" TEXT NOT NULL DEFAULT 'success',
    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentPassport" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "totalCredentials" INTEGER NOT NULL,
    "verifiedCredentials" INTEGER NOT NULL,
    "skills" TEXT[] NOT NULL,
    "certifications" TEXT[] NOT NULL,
    "achievements" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentPassport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudDetection" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "ocrResults" TEXT NOT NULL,
    "ocrConfidence" DOUBLE PRECISION NOT NULL,
    "duplicateMatches" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "anomalies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "trustScore" DOUBLE PRECISION NOT NULL,
    "riskFactors" TEXT NOT NULL,
    "fraudLevel" "FraudLevel" NOT NULL DEFAULT 'TRUSTED',
    "confidence" DOUBLE PRECISION NOT NULL,
    "aiAnalysis" TEXT NOT NULL,
    "predictions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FraudDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletAuthLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "authenticated" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletAuthLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalWorkflow" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApprovalWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionAnalytics" (
    "id" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "credentialsIssued" INTEGER NOT NULL,
    "credentialsVerified" INTEGER NOT NULL,
    "credentialsRevoked" INTEGER NOT NULL,
    "fraudDetected" INTEGER NOT NULL,
    "trustScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstitutionAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_wallet_key" ON "User"("wallet");

-- CreateIndex
CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_did_key" ON "User"("did");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_name_key" ON "Institution"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_code_key" ON "Institution"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_walletAddress_key" ON "Institution"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_onChainId_key" ON "Credential"("onChainId");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_qrPayload_key" ON "Credential"("qrPayload");

-- CreateIndex
CREATE UNIQUE INDEX "IPFSDocument_cid_key" ON "IPFSDocument"("cid");

-- CreateIndex
CREATE UNIQUE INDEX "IPFSDocument_hash_key" ON "IPFSDocument"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "EncryptionKey_credentialId_key" ON "EncryptionKey"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentPassport_studentId_key" ON "StudentPassport"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_token_key" ON "ShareLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "FraudDetection_credentialId_key" ON "FraudDetection"("credentialId");

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncryptionKey" ADD CONSTRAINT "EncryptionKey_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationLog" ADD CONSTRAINT "VerificationLog_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationLog" ADD CONSTRAINT "VerificationLog_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationAudit" ADD CONSTRAINT "VerificationAudit_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletAuthLog" ADD CONSTRAINT "WalletAuthLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

