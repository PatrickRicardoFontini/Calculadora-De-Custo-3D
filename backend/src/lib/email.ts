import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// onboarding@resend.dev funciona sem verificar domínio, mas só entrega pro email da
// própria conta Resend — trocar por um remetente do domínio verificado antes de abrir
// pra outros makers (ver CLAUDE.md)
const REMETENTE = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export async function enviarEmailRedefinicaoSenha(destinatario: string, link: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: REMETENTE,
    to: destinatario,
    subject: "Redefinição de senha - Calculadora de custos",
    html: `
      <p>Recebemos um pedido pra redefinir a senha da sua conta.</p>
      <p><a href="${link}">Clique aqui pra escolher uma nova senha</a></p>
      <p>Esse link expira em 1 hora. Se você não pediu essa redefinição, ignore este email.</p>
    `,
  });

  if (error) {
    throw new Error(`Falha ao enviar email via Resend: ${JSON.stringify(error)}`);
  }
}
