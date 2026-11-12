import { contraste, cores, tamanhoTexto, toque } from '@/theme';

describe('tema da Interface v2', () => {
  it.each([
    ['texto sobre fundo', cores.texto, cores.fundo],
    ['texto sobre superfície 2', cores.texto, cores.superficie2],
    ['texto secundário sobre superfície', cores.textoSec, cores.superficie],
    ['texto secundário sobre superfície 2', cores.textoSec, cores.superficie2],
    ['texto apagado sobre superfície', cores.textoApagado, cores.superficie],
    ['fundo sobre laranja (botão principal)', cores.fundo, cores.acao],
    ['texto sobre vermelho (SOS)', cores.textoSobreSos, cores.sos],
    ['fundo sobre amarelo (alerta)', cores.fundo, cores.alerta],
    ['fundo sobre creme (filtro ativo)', cores.fundo, cores.texto],
    ['terra sobre superfície (rótulos de terra)', cores.terra, cores.superficie],
  ])('%s tem contraste mínimo de 4,5:1', (_nome, texto, fundo) => {
    expect(contraste(texto, fundo)).toBeGreaterThanOrEqual(4.5);
  });

  it('asfalto e terra no mapa são bem diferentes em claridade', () => {
    expect(contraste(cores.asfalto, cores.terra)).toBeGreaterThanOrEqual(2);
  });

  it('texto nunca menor que 13 px e corpo 17 px', () => {
    expect(Math.min(...Object.values(tamanhoTexto))).toBeGreaterThanOrEqual(13);
    expect(tamanhoTexto.corpo).toBe(17);
  });

  it('toque mínimo de 48 px e botões do modo pilotando grandes', () => {
    expect(toque.minimo).toBeGreaterThanOrEqual(48);
    expect(toque.pilotando).toBeGreaterThanOrEqual(100);
  });
});
