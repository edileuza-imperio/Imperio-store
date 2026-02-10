import api from "@/Api/conectar";

/* ===================== HELPERS ===================== */
export const getImagemUrl = (caminho?: string) => {
  if (!caminho) return undefined;

  const base = api.defaults.baseURL || '';

  // Remove barras duplicadas no início do caminho
  const caminhoLimpo = caminho.replace(/^\/+/, '');

  // Garante que a base termine com barra
  const baseFinal = base.endsWith('/') ? base : `${base}/`;

  return `${baseFinal}${caminhoLimpo}`;
};


// Luhn check
const isValidCardLuhn = (num: string) => {
  const s = num.replace(/\D/g, '');
  let sum = 0;
  let alternate = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = parseInt(s[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0 && s.length >= 13 && s.length <= 19;
};

// mask card: "4242 4242 4242 4242"
const maskCardNumber = (value: string) =>
  value
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();

// expiry mask mm/yy
const maskExpiry = (value: string) =>
  value
    .replace(/\D/g, '')
    .slice(0, 4)
    .replace(/^(\d{2})(\d{1,2})?/, (m, p1, p2) => (p2 ? `${p1}/${p2}` : p1));
