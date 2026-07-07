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
  console.log(
    "\nEsse usuário não tem senha utilizável (não é possível logar nem se registrar com este email — " +
      "POST /auth/registro sempre rejeita email já cadastrado). Sirva só para inspecionar dados de teste direto no banco."
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
