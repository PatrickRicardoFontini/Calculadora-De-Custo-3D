import type { Prisma } from "@prisma/client";

export function decimalToNumber(valor: Prisma.Decimal | number | string): number {
  return parseFloat(valor.toString());
}
