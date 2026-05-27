-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "assigned_barber_id" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_assigned_barber_id_fkey" FOREIGN KEY ("assigned_barber_id") REFERENCES "barbers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
