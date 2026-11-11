import { contraste, cores, tamanhoTexto, toque } from '@/theme';

describe('tema Patch de Colete', () => {
  it.each([
    ['creme sobre sarja', cores.creme, cores.sarja],
    ['creme sobre noite', cores.creme, cores.noite],
    ['caramelo sobre sarja', cores.caramelo, cores.sarja],
    ['caramelo sobre noite', cores.caramelo, cores.noite],
    ['noite sobre laranja (botão principal)', cores.noite, cores.laranja],
    ['creme sobre vermelho (SOS)', cores.creme, cores.vermelho],
    ['noite sobre alerta', cores.noite, cores.alerta],
  ])('%s tem contraste mínimo de 4,5:1', (_nome, texto, fundo) => {
    expect(contraste(texto, fundo)).toBeGreaterThanOrEqual(4.5);
  });

  it('texto nunca menor que 13 px e corpo 17 px', () => {
    expect(Math.min(...Object.values(tamanhoTexto))).toBeGreaterThanOrEqual(13);
    expect(tamanhoTexto.corpo).toBe(17);
  });

  it('toque mínimo de 48 px', () => {
    expect(toque.minimo).toBeGreaterThanOrEqual(48);
  });
});
