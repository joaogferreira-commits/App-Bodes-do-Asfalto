/**
 * Gamificação (docs/ESPECIFICACAO.md, "Regras da gamificação"): XP por rodar junto e conhecer
 * lugares, nunca por velocidade. Valores iniciais; serão configuráveis no painel.
 * Os números do irmão abaixo são de EXEMPLO até existir o backend (Etapa 5).
 */
export type ChaveNivel = 'cabrito' | 'bode' | 'bodeVelho' | 'bodeLendario';

export const niveis: { chave: ChaveNivel; xpMinimo: number; imagem: number }[] = [
  { chave: 'cabrito', xpMinimo: 0, imagem: require('../../assets/gerados/niveis/nivel-cabrito.webp') },
  { chave: 'bode', xpMinimo: 1000, imagem: require('../../assets/gerados/niveis/nivel-bode.webp') },
  {
    chave: 'bodeVelho',
    xpMinimo: 5000,
    imagem: require('../../assets/gerados/niveis/nivel-bode-velho.webp'),
  },
  {
    chave: 'bodeLendario',
    xpMinimo: 15000,
    imagem: require('../../assets/gerados/niveis/nivel-bode-lendario.webp'),
  },
];

/** Nível atual, próximo e fração do caminho até ele (0–1). */
export function nivelDoXp(xp: number) {
  let i = 0;
  while (i + 1 < niveis.length && xp >= niveis[i + 1]!.xpMinimo) i++;
  const atual = niveis[i]!;
  const proximo = niveis[i + 1] ?? null;
  const progresso = proximo ? (xp - atual.xpMinimo) / (proximo.xpMinimo - atual.xpMinimo) : 1;
  return {
    atual,
    proximo,
    progresso: Math.min(1, Math.max(0, progresso)),
    falta: proximo ? proximo.xpMinimo - xp : 0,
  };
}

export type ChaveSelo = 'agape' | 'irmaoNaRota' | 'sedesMt' | 'pantanal' | 'visitaLojas' | 'socorroFraterno';

/** Selos do Passaporte do Bode: meta (quantas vezes/lugares) e XP de recompensa. */
export const selos: { chave: ChaveSelo; imagem: number; meta: number; xp: number }[] = [
  { chave: 'agape', imagem: require('../../assets/gerados/selos/selo-agape.webp'), meta: 1, xp: 100 },
  {
    chave: 'irmaoNaRota',
    imagem: require('../../assets/gerados/selos/selo-irmao-na-rota.webp'),
    meta: 1,
    xp: 100,
  },
  { chave: 'sedesMt', imagem: require('../../assets/gerados/selos/selo-sedes-mt.webp'), meta: 5, xp: 500 },
  { chave: 'pantanal', imagem: require('../../assets/gerados/selos/selo-pantanal.webp'), meta: 3, xp: 400 },
  {
    chave: 'visitaLojas',
    imagem: require('../../assets/gerados/selos/selo-visita-lojas.webp'),
    meta: 3,
    xp: 300,
  },
  {
    chave: 'socorroFraterno',
    imagem: require('../../assets/gerados/selos/selo-socorro-fraterno.webp'),
    meta: 1,
    xp: 200,
  },
];

/** Exemplo do irmão (até o backend): XP total, progresso de cada selo e desafio do mês. */
export const exemploIrmao = {
  xp: 3420,
  progresso: {
    agape: 1,
    irmaoNaRota: 1,
    sedesMt: 2,
    pantanal: 1,
    visitaLojas: 0,
    socorroFraterno: 0,
  } as Record<ChaveSelo, number>,
  desafio: { chave: 'milKm', atual: 640, meta: 1000 },
  kmMes: 640,
  posicaoCapitulo: 7,
};

export const conquistou = (chave: ChaveSelo, progresso: Record<ChaveSelo, number>) =>
  progresso[chave] >= (selos.find((s) => s.chave === chave)?.meta ?? Infinity);

/** Tabela "como ganhar XP" (chaves de tradução + valores). */
export const comoGanharXp: { chave: string; xp: string }[] = [
  { chave: 'km', xp: '10' },
  { chave: 'passeio', xp: '200' },
  { chave: 'sede', xp: '150' },
  { chave: 'monumento', xp: '50–300' },
  { chave: 'foto', xp: '5' },
  { chave: 'alerta', xp: '20' },
];

/** Ranking do mês entre capítulos (soma dos km com rota gravada). EXEMPLO. */
export const rankingCapitulos = [
  { nome: 'Tangará da Serra', km: 18420, meu: false },
  { nome: 'Cuiabá', km: 16975, meu: true },
  { nome: 'Rondonópolis', km: 12310, meu: false },
  { nome: 'Várzea Grande', km: 9870, meu: false },
  { nome: 'Sinop', km: 7240, meu: false },
];
