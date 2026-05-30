-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "footer_address" TEXT,
ADD COLUMN     "footer_copyright" TEXT,
ADD COLUMN     "footer_email" TEXT,
ADD COLUMN     "footer_facebook" TEXT,
ADD COLUMN     "footer_hours" TEXT,
ADD COLUMN     "footer_instagram" TEXT,
ADD COLUMN     "footer_phone" TEXT,
ADD COLUMN     "footer_powered_by" TEXT,
ADD COLUMN     "footer_slogan" TEXT,
ADD COLUMN     "footer_whatsapp" TEXT,
ADD COLUMN     "whatsapp_instance" TEXT,
ADD COLUMN     "whatsapp_status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
ADD COLUMN     "whatsapp_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tenants_whatsapp_instance_key" ON "tenants"("whatsapp_instance");
