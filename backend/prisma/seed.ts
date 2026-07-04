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
  console.log("\nCopie esse id para DEFAULT_USUARIO_ID no arquivo .env");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
