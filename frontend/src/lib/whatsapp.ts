export function formatarTelefoneWhatsapp(whatsapp: string): string | null {
  const somenteDigitos = whatsapp.replace(/\D/g, "");
  if (somenteDigitos.length === 0) return null;

  // Números com DDD (10 ou 11 dígitos) ainda não têm o código do país (55 = Brasil)
  if (somenteDigitos.length === 10 || somenteDigitos.length === 11) {
    return `55${somenteDigitos}`;
  }

  return somenteDigitos;
}

export function montarLinkWhatsapp(numero: string, mensagem: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
