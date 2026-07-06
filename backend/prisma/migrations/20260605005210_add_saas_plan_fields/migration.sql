-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "chatbot_ia_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "saas_plan" TEXT NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "saas_plan_limit_attendants" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "saas_plan_limit_barbers" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "saas_plan_limit_clients" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "whatsapp_enabled" BOOLEAN NOT NULL DEFAULT true;
