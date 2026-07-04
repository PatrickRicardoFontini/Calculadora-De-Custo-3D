import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const usuario = await prisma.usuario.upsert({
    where: { email: "default@calculadora.local" },
    update: {},
    create: {
      email: "default@calculadora.local",
      senhaHash: "sem-autenticacao-ainda",
      nome: "Usuário Padrão",
    },
  });

  console.log("Usuário padrão pronto:");
  console.log(`  id: ${usuario.id}`);
  console.log(`  email: ${usuario.email}`);
  console.log("\nRegistre-se no app com esse mesmo email para assumir essa conta e ver os dados de teste já existentes.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
