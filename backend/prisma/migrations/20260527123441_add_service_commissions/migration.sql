-- CreateTable
CREATE TABLE "service_commissions" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "barber_id" TEXT NOT NULL,
    "commission_rate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "service_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_commissions_service_id_barber_id_key" ON "service_commissions"("service_id", "barber_id");

-- AddForeignKey
ALTER TABLE "service_commissions" ADD CONSTRAINT "service_commissions_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_commissions" ADD CONSTRAINT "service_commissions_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
