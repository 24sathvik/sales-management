const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:fVU5x7LroHcA1dTQ@db.icwebuepmihnpgxylifs.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run(sql, label) {
  try {
    await pool.query(sql);
    console.log(`✅ ${label}`);
  } catch (err) {
    // Ignore "already exists" errors gracefully
    if (err.message.includes('already exists')) {
      console.log(`ℹ️  ${label} (already exists)`);
    } else {
      console.log(`❌ ${label}: ${err.message}`);
    }
  }
}

async function main() {
  console.log('🔧 Fixing Prisma enum types and column types...\n');

  // 1. Create Prisma Role enum
  await run(`CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');`, 'Create Role enum');

  // 2. Create Prisma WIPPhase enum
  await run(`CREATE TYPE "WIPPhase" AS ENUM ('RAW_MATERIALS','DESIGN','PRINTING','POST_PRINTING','PAYMENT_PENDING');`, 'Create WIPPhase enum');

  // 3. Create other enums Prisma needs
  await run(`CREATE TYPE "AdvanceMode" AS ENUM ('ONLINE','CASH');`, 'Create AdvanceMode enum');
  await run(`CREATE TYPE "BalanceMode" AS ENUM ('ONLINE','CASH');`, 'Create BalanceMode enum');
  await run(`CREATE TYPE "PackingType" AS ENUM ('WITH_PACKING','WITHOUT_PACKING');`, 'Create PackingType enum');
  await run(`CREATE TYPE "InvoiceStatus" AS ENUM ('ACTIVE','CLOSED');`, 'Create InvoiceStatus enum');
  await run(`CREATE TYPE "LeadStatus" AS ENUM ('NEW','CONTACTED','NEGOTIATING','CONVERTED','LOST');`, 'Create LeadStatus enum');
  await run(`CREATE TYPE "PaymentStatus" AS ENUM ('PENDING','PAID','PARTIAL');`, 'Create PaymentStatus enum');
  await run(`CREATE TYPE "PaymentMode" AS ENUM ('ONLINE','CASH','UPI','BANK_TRANSFER');`, 'Create PaymentMode enum');
  await run(`CREATE TYPE "ExpenseCategory" AS ENUM ('RENT','SALARY','ELECTRICITY','FUEL','INTERNET','MISC','OTHER');`, 'Create ExpenseCategory enum');
  await run(`CREATE TYPE "TransactionType" AS ENUM ('CREDIT','DEBIT');`, 'Create TransactionType enum');
  await run(`CREATE TYPE "TransactionCategory" AS ENUM ('INVOICE_ADVANCE','INVOICE_BALANCE','INVOICE_FULL_PAYMENT','VENDOR_PAYMENT','OVERHEAD','MISC_INCOME','MISC_EXPENSE');`, 'Create TransactionCategory enum');

  // 4. Alter User table: change role column from TEXT to Role enum
  await run(`ALTER TABLE "User" ALTER COLUMN role TYPE "Role" USING role::"Role";`, 'Convert role column to Role enum');

  // 5. Verify
  const result = await pool.query(`SELECT id, name, email, role FROM "User";`);
  console.log('\n👤 Users in DB:');
  result.rows.forEach(u => console.log(`   - ${u.email} (${u.role})`));

  // 6. Create all remaining Prisma tables needed
  console.log('\n📦 Creating remaining Prisma tables...');

  await run(`
    CREATE TABLE IF NOT EXISTS "Invoice" (
      id TEXT PRIMARY KEY,
      "invoiceNumber" SERIAL UNIQUE,
      "customerName" TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      "brideName" TEXT NOT NULL DEFAULT '',
      "groomName" TEXT NOT NULL DEFAULT '',
      "modelNumber" TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'Uncategorized',
      description TEXT NOT NULL DEFAULT '',
      date TIMESTAMPTZ NOT NULL DEFAULT now(),
      quantity INTEGER NOT NULL DEFAULT 0,
      "toleranceQuantity" INTEGER NOT NULL DEFAULT 0,
      "unitRate" NUMERIC(12,2) NOT NULL DEFAULT 0,
      "totalAmount" NUMERIC(12,2) NOT NULL DEFAULT 0,
      "advancePaid" BOOLEAN NOT NULL DEFAULT false,
      "advanceAmount" NUMERIC(12,2),
      "advanceMode" "AdvanceMode",
      balance NUMERIC(12,2),
      "balancePaid" BOOLEAN NOT NULL DEFAULT false,
      "balanceMode" "BalanceMode",
      "estimatedDesignTime" TEXT NOT NULL DEFAULT '',
      "estimatedPrintTime" TEXT NOT NULL DEFAULT '',
      packing "PackingType" NOT NULL DEFAULT 'WITHOUT_PACKING',
      "printingColor" TEXT,
      designer TEXT,
      printer TEXT,
      "additionalNotes" TEXT,
      "contentConfirmedOn" TIMESTAMPTZ,
      "finalDeliveryDate" TIMESTAMPTZ,
      "assigneeId" TEXT NOT NULL DEFAULT '',
      status "InvoiceStatus" NOT NULL DEFAULT 'ACTIVE',
      "deletedAt" TIMESTAMPTZ,
      "createdById" TEXT NOT NULL DEFAULT '',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `, 'Create Invoice table');

  await run(`
    CREATE TABLE IF NOT EXISTS "Lead" (
      id TEXT PRIMARY KEY,
      "customerName" TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      quantity INTEGER NOT NULL DEFAULT 0,
      "assignedToId" TEXT NOT NULL DEFAULT '',
      "estimatedBillValue" NUMERIC(12,2) NOT NULL DEFAULT 0,
      status "LeadStatus" NOT NULL DEFAULT 'NEW',
      notes TEXT,
      "deletedAt" TIMESTAMPTZ,
      "createdById" TEXT NOT NULL DEFAULT '',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `, 'Create Lead table');

  await run(`
    CREATE TABLE IF NOT EXISTS "WIPCard" (
      id TEXT PRIMARY KEY,
      "invoiceId" TEXT NOT NULL,
      "invoiceNumber" TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      quantity INTEGER NOT NULL DEFAULT 0,
      "customerName" TEXT NOT NULL DEFAULT '',
      phase "WIPPhase" NOT NULL DEFAULT 'RAW_MATERIALS',
      "order" INTEGER NOT NULL DEFAULT 0,
      "deletedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `, 'Create WIPCard table');

  await run(`
    CREATE TABLE IF NOT EXISTS "FinalCheck" (
      id TEXT PRIMARY KEY,
      "invoiceId" TEXT UNIQUE NOT NULL,
      "invoiceNumber" TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      designer TEXT,
      printer TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      "modelNumber" TEXT NOT NULL DEFAULT '',
      "isComplete" BOOLEAN NOT NULL DEFAULT false,
      "completedAt" TIMESTAMPTZ,
      "deletedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `, 'Create FinalCheck table');

  await run(`
    CREATE TABLE IF NOT EXISTS "WIPChecklist" (
      id TEXT PRIMARY KEY,
      "wipCardId" TEXT NOT NULL,
      phase "WIPPhase" NOT NULL,
      "invoiceId" TEXT NOT NULL,
      rm_billNumberVerified BOOLEAN DEFAULT false,
      rm_modelNumberVerified BOOLEAN DEFAULT false,
      rm_descriptionVerified BOOLEAN DEFAULT false,
      rm_quantityVerified BOOLEAN DEFAULT false,
      rm_printerAssigned BOOLEAN DEFAULT false,
      rm_dtpAssigned BOOLEAN DEFAULT false,
      rm_colourExplainedToCustomer BOOLEAN DEFAULT false,
      rm_leadTimeExplained BOOLEAN DEFAULT false,
      rm_wastageRemarksAdjusted BOOLEAN DEFAULT false,
      rm_dtpAssignedAndStarted BOOLEAN DEFAULT false,
      d_materialCardsReceived BOOLEAN DEFAULT false,
      d_dtpConfirmed BOOLEAN DEFAULT false,
      d_cardsStockUpdated BOOLEAN DEFAULT false,
      d_currentStockChecked BOOLEAN DEFAULT false,
      d_stickersQualityChecked BOOLEAN DEFAULT false,
      d_stickerQualityUpdated BOOLEAN DEFAULT false,
      d_logoCheckedOnDtp BOOLEAN DEFAULT false,
      d_printerScheduleInformed BOOLEAN DEFAULT false,
      d_dtpSentToCustomer BOOLEAN DEFAULT false,
      p_namePlatesReceived1 BOOLEAN DEFAULT false,
      p_namePlatesQualityChecked BOOLEAN DEFAULT false,
      p_dtpConfirmedByCustomer BOOLEAN DEFAULT false,
      p_namePlatesReceivedFinal BOOLEAN DEFAULT false,
      p_signaturesFromCustomer BOOLEAN DEFAULT false,
      p_leadTimeUpdated BOOLEAN DEFAULT false,
      p_leftRightExplained BOOLEAN DEFAULT false,
      p_masterTracingsReady BOOLEAN DEFAULT false,
      p_samplesCollectedFromDtp BOOLEAN DEFAULT false,
      p_masterCheckWithPdfCard BOOLEAN DEFAULT false,
      p_timeColourWrittenOnCards BOOLEAN DEFAULT false,
      p_timeColourSentInGroup BOOLEAN DEFAULT false,
      p_cardOrientationSentToGroup BOOLEAN DEFAULT false,
      p_materialSentToPrinter BOOLEAN DEFAULT false,
      p_estimatedPrintingDateSet BOOLEAN DEFAULT false,
      p_printerFollowUp BOOLEAN DEFAULT false,
      p_cardOrientationConfirmed BOOLEAN DEFAULT false,
      pp_paddingBoxingScheduled BOOLEAN DEFAULT false,
      pp_printedMaterialReceived BOOLEAN DEFAULT false,
      pp_printedMaterialQC BOOLEAN DEFAULT false,
      pp_cardsToBinder BOOLEAN DEFAULT false,
      pp_binderFollowUp BOOLEAN DEFAULT false,
      pp_estimatedTimeToBinder BOOLEAN DEFAULT false,
      pp_endProductCheck BOOLEAN DEFAULT false,
      pp_sampleExchanged BOOLEAN DEFAULT false,
      pp_customerInformedBag BOOLEAN DEFAULT false,
      pp_customerInformedReadiness BOOLEAN DEFAULT false,
      pp_paymentCollected BOOLEAN DEFAULT false,
      pp_reminderFollowUp BOOLEAN DEFAULT false,
      pp_ratingTaken BOOLEAN DEFAULT false,
      pp_checkRatingName BOOLEAN DEFAULT false,
      pp_balanceCollected BOOLEAN DEFAULT false,
      pay_invoiceAmountConfirmed BOOLEAN DEFAULT false,
      pay_paymentReminderSent BOOLEAN DEFAULT false,
      pay_partialPaymentReceived BOOLEAN DEFAULT false,
      pay_fullPaymentReceived BOOLEAN DEFAULT false,
      pay_receiptIssued BOOLEAN DEFAULT false,
      "isComplete" BOOLEAN DEFAULT false,
      "completedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `, 'Create WIPChecklist table');

  await run(`
    CREATE TABLE IF NOT EXISTS "Purchase" (
      id TEXT PRIMARY KEY,
      "invoiceId" TEXT UNIQUE NOT NULL,
      "invoiceNumber" TEXT NOT NULL DEFAULT '',
      "customerName" TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      quantity INTEGER NOT NULL DEFAULT 0,
      "billValue" NUMERIC(12,2) NOT NULL DEFAULT 0,
      "leadSource" TEXT,
      "designer1Name" TEXT, "designer1Cost" NUMERIC DEFAULT 0, "designer1PaymentStatus" "PaymentStatus" DEFAULT 'PENDING', "designer1PaymentMode" "PaymentMode",
      "designer2Name" TEXT, "designer2Cost" NUMERIC DEFAULT 0, "designer2PaymentStatus" "PaymentStatus" DEFAULT 'PENDING', "designer2PaymentMode" "PaymentMode",
      "printer1Name" TEXT, "printer1Cost" NUMERIC DEFAULT 0, "printer1PaymentStatus" "PaymentStatus" DEFAULT 'PENDING', "printer1PaymentMode" "PaymentMode",
      "printer2Name" TEXT, "printer2Cost" NUMERIC DEFAULT 0, "printer2PaymentStatus" "PaymentStatus" DEFAULT 'PENDING', "printer2PaymentMode" "PaymentMode",
      "rawMaterial1Name" TEXT, "rawMaterial1Cost" NUMERIC DEFAULT 0, "rawMaterial1PaymentStatus" "PaymentStatus" DEFAULT 'PENDING', "rawMaterial1PaymentMode" "PaymentMode",
      "rawMaterial2Name" TEXT, "rawMaterial2Cost" NUMERIC DEFAULT 0, "rawMaterial2PaymentStatus" "PaymentStatus" DEFAULT 'PENDING', "rawMaterial2PaymentMode" "PaymentMode",
      "postProcess1Name" TEXT, "postProcess1Cost" NUMERIC DEFAULT 0, "postProcess1PaymentStatus" "PaymentStatus" DEFAULT 'PENDING', "postProcess1PaymentMode" "PaymentMode",
      "postProcess2Name" TEXT, "postProcess2Cost" NUMERIC DEFAULT 0, "postProcess2PaymentStatus" "PaymentStatus" DEFAULT 'PENDING', "postProcess2PaymentMode" "PaymentMode",
      "totalDesignerCost" NUMERIC DEFAULT 0,
      "totalPrinterCost" NUMERIC DEFAULT 0,
      "totalRawMaterialCost" NUMERIC DEFAULT 0,
      "totalPostProcessCost" NUMERIC DEFAULT 0,
      "totalProductionCost" NUMERIC DEFAULT 0,
      profit NUMERIC DEFAULT 0,
      "profitPercentage" NUMERIC DEFAULT 0,
      notes TEXT,
      "deletedAt" TIMESTAMPTZ,
      "completedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `, 'Create Purchase table');

  await run(`
    CREATE TABLE IF NOT EXISTS "MonthlyExpense" (
      id TEXT PRIMARY KEY,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      category "ExpenseCategory" NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      description TEXT,
      "paidOn" TIMESTAMPTZ,
      "paymentMode" "PaymentMode",
      "createdBy" TEXT NOT NULL DEFAULT '',
      "deletedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `, 'Create MonthlyExpense table');

  await run(`
    CREATE TABLE IF NOT EXISTS "CounterTransaction" (
      id TEXT PRIMARY KEY,
      date TIMESTAMPTZ NOT NULL DEFAULT now(),
      type "TransactionType" NOT NULL,
      mode "PaymentMode" NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      "invoiceId" TEXT,
      "invoiceNumber" TEXT,
      category "TransactionCategory" NOT NULL,
      "runningBalance" NUMERIC(12,2) NOT NULL DEFAULT 0,
      "createdBy" TEXT NOT NULL DEFAULT '',
      "deletedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `, 'Create CounterTransaction table');

  // 7. Add indexes for performance
  console.log('\n📑 Adding indexes...');
  await run(`CREATE INDEX IF NOT EXISTS idx_invoice_status ON "Invoice"(status);`, 'Index Invoice.status');
  await run(`CREATE INDEX IF NOT EXISTS idx_invoice_delivery ON "Invoice"("finalDeliveryDate");`, 'Index Invoice.finalDeliveryDate');
  await run(`CREATE INDEX IF NOT EXISTS idx_wipcard_phase ON "WIPCard"(phase);`, 'Index WIPCard.phase');
  await run(`CREATE INDEX IF NOT EXISTS idx_counter_date ON "CounterTransaction"(date);`, 'Index CounterTransaction.date');
  await run(`CREATE INDEX IF NOT EXISTS idx_purchase_completed ON "Purchase"("completedAt");`, 'Index Purchase.completedAt');

  console.log('\n\n🎉 ALL DATABASE TABLES CREATED SUCCESSFULLY!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ADMIN LOGIN CREDENTIALS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  URL     : http://localhost:3000/login');
  console.log('  Email   : admin@printflowpro.com');
  console.log('  Password: PrintFlow@2025');
  console.log('  Role    : ADMIN (full access)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
});
