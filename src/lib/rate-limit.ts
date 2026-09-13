type RateLimitInfo = {
  count: number;
  resetTime: number;
};

const rateLimitMap = new Map<string, RateLimitInfo>();

/**
 * Limitador de requisições em memória.
 * @param ip O endereço IP ou identificador único.
 * @param limit Limite de requisições permitidas.
 * @param windowMs Janela de tempo em milissegundos.
 * @returns true se permitido, false se bloqueado (rate limited).
 */
export function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const info = rateLimitMap.get(ip);

  if (!info) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (now > info.resetTime) {
    // Passou a janela, reseta
    info.count = 1;
    info.resetTime = now + windowMs;
    return true;
  }

  info.count += 1;

  if (info.count > limit) {
    return false; // Bloqueado
  }

  return true;
}

// Limpeza periódica para não estourar a memória do Node.js
// Verifica se estamos no ambiente do navegador (para evitar erro de setInterval não definido no Next.js build em client components, 
// embora este arquivo seja usado apenas no server).
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, info] of rateLimitMap.entries()) {
      if (now > info.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  }, 60 * 1000); // Roda a cada 1 minuto
}
