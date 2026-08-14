-- CreateTable
CREATE TABLE "CompilerErrorCache" (
    "id" TEXT NOT NULL,
    "errorHash" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "directFix" TEXT NOT NULL,
    "errorType" TEXT,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompilerErrorCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompilerErrorCache_errorHash_key" ON "CompilerErrorCache"("errorHash");

-- CreateIndex
CREATE INDEX "CompilerErrorCache_errorHash_idx" ON "CompilerErrorCache"("errorHash");
