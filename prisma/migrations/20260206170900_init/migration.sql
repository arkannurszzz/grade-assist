-- CreateTable
CREATE TABLE "GradingSession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courseName" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerKey" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "parsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "answerKeyId" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "totalScore" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAnswer" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "weightedScore" DOUBLE PRECISION,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIDetection" (
    "id" TEXT NOT NULL,
    "studentAnswerId" TEXT NOT NULL,
    "isAIGenerated" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isCopyPasted" BOOLEAN NOT NULL DEFAULT false,
    "similarityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "suspectedParts" JSONB,
    "analysis" TEXT,
    "penaltyApplied" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionSettings" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL DEFAULT 'gemini',
    "modelName" TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
    "gradingStrictness" TEXT NOT NULL DEFAULT 'moderate',
    "enableAIDetection" BOOLEAN NOT NULL DEFAULT true,
    "aiPenaltyPercent" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "copyPenaltyPercent" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
    "aiDetectionThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "language" TEXT NOT NULL DEFAULT 'id',

    CONSTRAINT "SessionSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "geminiApiKey" TEXT NOT NULL DEFAULT '',
    "openaiApiKey" TEXT NOT NULL DEFAULT '',
    "defaultProvider" TEXT NOT NULL DEFAULT 'gemini',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnswerKey_sessionId_key" ON "AnswerKey"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AIDetection_studentAnswerId_key" ON "AIDetection"("studentAnswerId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionSettings_sessionId_key" ON "SessionSettings"("sessionId");

-- AddForeignKey
ALTER TABLE "AnswerKey" ADD CONSTRAINT "AnswerKey_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GradingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_answerKeyId_fkey" FOREIGN KEY ("answerKeyId") REFERENCES "AnswerKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GradingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAnswer" ADD CONSTRAINT "StudentAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAnswer" ADD CONSTRAINT "StudentAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIDetection" ADD CONSTRAINT "AIDetection_studentAnswerId_fkey" FOREIGN KEY ("studentAnswerId") REFERENCES "StudentAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSettings" ADD CONSTRAINT "SessionSettings_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GradingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
