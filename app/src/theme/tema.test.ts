import {
  contraste,
  modoPelaHora,
  paletaNoite,
  paletaSol,
  resolverModo,
  tamanhoTexto,
  toque,
  type Paleta,
} from '@/theme';

/** Pares de cor realmente usados na interface (R14: texto ≥ 4,5:1, principal ≥ 7:1; gráficos ≥ 3:1). */
function paresDeTexto(c: Paleta): [string, string, string, number][] {
  return [
    ['texto sobre fundo (≥ 7:1, AAA)', c.texto, c.fundo, 7],
    ['texto sobre superfície 2', c.texto, c.superficie2, 7],
    ['texto secundário sobre superfície', c.textoSec, c.superficie, 4.5],
    ['texto secundário sobre superfície 3', c.textoSec, c.superficie3, 4.5],
    ['texto apagado sobre superfície', c.textoApagado, c.superficie, 4.5],
    ['texto apagado sobre fundo', c.textoApagado, c.fundo, 4.5],
    ['texto sobre laranja (botão principal)', c.textoSobreAcao, c.acao, 4.5],
    ['texto sobre vermelho (SOS)', c.textoSobreSos, c.sos, 4.5],
    ['texto sobre amarelo (alerta)', c.textoSobreAlerta, c.alerta, 4.5],
    ['fundo sobre texto (filtro ativo)', c.fundo, c.texto, 4.5],
    ['terra sobre superfície (rótulos de terra)', c.terra, c.superficie, 4.5],
    ['verde dos postos sobre superfície', c.verdePosto, c.superficie, 4.5],
  ];
}

function paresGraficos(c: Paleta): [string, string, string][] {
  return [
    ['laranja (ação) sobre fundo', c.acao, c.fundo],
    ['anel "na estrada" sobre fundo', c.estrada, c.fundo],
    ['lojas (azul) sobre fundo', c.azulRio, c.fundo],
    ['contorno do SOS sobre fundo', c.contornoSos, c.fundo],
    ['terra tracejada sobre o leito', c.terra, c.terraEscura],
    ['terra sobre o chão do mapa', c.terra, c.chao],
    ['vias locais sobre o chão do mapa', c.viaLocal, c.chao],
  ];
}

describe.each([
  ['noite', paletaNoite],
  ['sol', paletaSol],
])('paleta %s', (_nome, c) => {
  it.each(paresDeTexto(c))('%s', (_n, texto, fundo, minimo) => {
    expect(contraste(texto, fundo)).toBeGreaterThanOrEqual(minimo);
  });

  it.each(paresGraficos(c))('%s tem ao menos 3:1 (elemento gráfico)', (_n, a, b) => {
    expect(contraste(a, b)).toBeGreaterThanOrEqual(3);
  });

  it('asfalto e terra bem diferentes em claridade', () => {
    expect(contraste(c.asfalto, c.terra)).toBeGreaterThanOrEqual(2);
  });

  it('tem as mesmas chaves das duas paletas', () => {
    expect(Object.keys(c).sort()).toEqual(Object.keys(paletaNoite).sort());
  });
});

describe('regras gerais do tema', () => {
  it('fundo da noite não é preto puro (evita halação)', () => {
    expect(paletaNoite.fundo).toBe('#141110');
    expect(contraste(paletaNoite.texto, paletaNoite.fundo)).toBeLessThan(16);
  });

  it('texto nunca menor que 13 px e corpo 17 px', () => {
    expect(Math.min(...Object.values(tamanhoTexto))).toBeGreaterThanOrEqual(13);
    expect(tamanhoTexto.corpo).toBe(17);
  });

  it('toque mínimo de 48 dp; modo pilotando com botões ≥ 90 dp', () => {
    expect(toque.minimo).toBeGreaterThanOrEqual(48);
    expect(toque.pilotando).toBeGreaterThanOrEqual(90);
  });

  it('troca automática: sol de dia, noite à noite; escolha manual prevalece', () => {
    expect(modoPelaHora(new Date(2026, 10, 12, 10))).toBe('sol');
    expect(modoPelaHora(new Date(2026, 10, 12, 5, 59))).toBe('noite');
    expect(modoPelaHora(new Date(2026, 10, 12, 18))).toBe('noite');
    expect(resolverModo('noite', new Date(2026, 10, 12, 12))).toBe('noite');
    expect(resolverModo('sol', new Date(2026, 10, 12, 23))).toBe('sol');
  });
});
