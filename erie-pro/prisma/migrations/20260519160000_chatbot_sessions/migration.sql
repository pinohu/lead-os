-- CreateEnum
CREATE TYPE "ChatPersona" AS ENUM ('consumer_service', 'consumer_status', 'provider_growth', 'provider_operations', 'admin_operations');

-- CreateEnum
CREATE TYPE "ChatSessionStatus" AS ENUM ('active', 'closed', 'escalated');

-- CreateEnum
CREATE TYPE "ChatMessageRole" AS ENUM ('user', 'assistant', 'system', 'tool');

-- CreateEnum
CREATE TYPE "ChatActionStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "ChatEscalationStatus" AS ENUM ('open', 'in_progress', 'resolved');

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "persona" "ChatPersona" NOT NULL,
    "status" "ChatSessionStatus" NOT NULL DEFAULT 'active',
    "visitorId" TEXT,
    "userId" TEXT,
    "providerId" TEXT,
    "serviceRequestId" TEXT,
    "contextPath" TEXT,
    "contextJson" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "ChatMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "toolName" TEXT,
    "toolPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_actions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB,
    "status" "ChatActionStatus" NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_escalations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ChatEscalationStatus" NOT NULL DEFAULT 'open',
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "chat_escalations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_sessions_persona_status_idx" ON "chat_sessions"("persona", "status");

-- CreateIndex
CREATE INDEX "chat_sessions_visitorId_idx" ON "chat_sessions"("visitorId");

-- CreateIndex
CREATE INDEX "chat_sessions_serviceRequestId_idx" ON "chat_sessions"("serviceRequestId");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_createdAt_idx" ON "chat_messages"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_actions_sessionId_createdAt_idx" ON "chat_actions"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_actions_toolName_status_idx" ON "chat_actions"("toolName", "status");

-- CreateIndex
CREATE INDEX "chat_escalations_sessionId_idx" ON "chat_escalations"("sessionId");

-- CreateIndex
CREATE INDEX "chat_escalations_status_createdAt_idx" ON "chat_escalations"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_actions" ADD CONSTRAINT "chat_actions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_escalations" ADD CONSTRAINT "chat_escalations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
