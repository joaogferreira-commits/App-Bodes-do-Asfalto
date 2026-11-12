import { caminhoDe, diasAte, filtros, moverTexto, zoomDasVezes, type CamadaTexto } from './estilos';

describe('stories v3', () => {
  const tx: CamadaTexto = {
    id: 'a',
    texto: 'oi',
    estilo: 'forte',
    cor: '#FFF',
    fundo: 'nenhum',
    posicao: 'base',
    tamanho: 'm',
  };

  it('arrastar soma o deslocamento e não deixa o texto sair da tela', () => {
    const m = moverTexto(tx, 0.1, -0.2);
    expect(m.x).toBeCloseTo(0.6);
    expect(m.y).toBeCloseTo(0.58);
    expect(moverTexto(tx, 2, 2)).toMatchObject({ x: 0.95, y: 0.95 });
  });

  it('desenho vira caminho em 0–1000, independente do tamanho da tela', () => {
    expect(
      caminhoDe(
        [
          { x: 0, y: 0 },
          { x: 50, y: 100 },
        ],
        100,
        200,
      ),
    ).toBe('M0 0 L500 500');
    expect(caminhoDe([{ x: 1, y: 1 }], 100, 100)).toBe('');
  });

  it('13 filtros, zoom crescente e contagem nunca negativa', () => {
    expect(filtros).toHaveLength(13);
    expect(zoomDasVezes[1] < zoomDasVezes[2] && zoomDasVezes[2] < zoomDasVezes[4]).toBe(true);
    expect(diasAte('2000-01-01')).toBe(0);
  });
});
