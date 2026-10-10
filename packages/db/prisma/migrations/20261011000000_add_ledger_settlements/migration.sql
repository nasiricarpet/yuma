-- CreateEnum
CREATE TYPE "LedgerAccount" AS ENUM ('customer_receivable', 'gateway_clearing', 'platform_revenue', 'workshop_payable', 'tax_payable');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('debit', 'credit');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('pending', 'paid');

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" BIGSERIAL NOT NULL,
    "entry_group" TEXT NOT NULL,
    "order_id" TEXT,
    "payment_id" TEXT,
    "account" "LedgerAccount" NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amount_minor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "reference" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ledger_entries_entry_group_idx" ON "ledger_entries"("entry_group");

-- CreateIndex
CREATE INDEX "ledger_entries_order_id_idx" ON "ledger_entries"("order_id");

-- CreateIndex
CREATE INDEX "ledger_entries_payment_id_idx" ON "ledger_entries"("payment_id");

-- CreateIndex
CREATE INDEX "ledger_entries_account_created_at_idx" ON "ledger_entries"("account", "created_at");

-- CreateTable
CREATE TABLE "workshop_settlements" (
    "id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "gross_minor" BIGINT NOT NULL,
    "commission_minor" BIGINT NOT NULL,
    "net_payable_minor" BIGINT NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workshop_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workshop_settlements_workshop_id_period_start_period_end_key" ON "workshop_settlements"("workshop_id", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "workshop_settlements_status_period_start_idx" ON "workshop_settlements"("status", "period_start");

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_settlements" ADD CONSTRAINT "workshop_settlements_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "laundries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
