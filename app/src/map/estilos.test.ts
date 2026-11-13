import { renderHook } from '@testing-library/react-native';

import { estiloDoMapa, estiloNoite, estiloSol, PREFIXO_EXTRAS, useEstiloMapa } from './estilos';

const extras = (e: { layers: { id: string }[] }) =>
  e.layers.filter((l) => l.id.startsWith(PREFIXO_EXTRAS)).map((l) => l.id);

describe('estilo do mapa por modo', () => {
  it('sol usa o estilo de dia e noite usa o de noite', () => {
    expect(estiloDoMapa('sol')).toBe(estiloSol);
    expect(estiloDoMapa('noite')).toBe(estiloNoite);
  });

  it('o hook obedece o modo automático e, sem ele, segue o tema do app', async () => {
    expect((await renderHook(() => useEstiloMapa('sol'))).result.current).toBe(estiloSol);
    expect((await renderHook(() => useEstiloMapa('noite'))).result.current).toBe(estiloNoite);
    // sem modo automático: tema padrão do app (noite)
    expect((await renderHook(() => useEstiloMapa(null))).result.current).toBe(estiloNoite);
  });

  it('pilotando esconde todas as camadas extra-, nos dois estilos, sem mexer nas outras', () => {
    for (const modo of ['sol', 'noite'] as const) {
      const base = modo === 'sol' ? estiloSol : estiloNoite;
      const meta = (base as unknown as { metadata: { camadasExtras: string[] } }).metadata.camadasExtras;
      expect(extras(base as never)).toEqual(meta);
      const limpo = estiloDoMapa(modo, true);
      expect(extras(limpo as never)).toEqual([]);
      expect(limpo.layers.length).toBe(base.layers.length - meta.length);
      expect(estiloDoMapa(modo, true)).toBe(limpo);
    }
  });

  it('o estilo original não é alterado pelo filtro', () => {
    estiloDoMapa('noite', true);
    expect(extras(estiloNoite as never).length).toBeGreaterThan(0);
  });
});
