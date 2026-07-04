const TOKEN_KEY = "token";

export function obterToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function salvarToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function limparToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
