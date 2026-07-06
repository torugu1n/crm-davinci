-- Add missing description field expected by the Prisma schema
ALTER TABLE "services"
ADD COLUMN "descricao" TEXT;

-- Add missing products table expected by the Prisma schema
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "descricao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);
