import { lerAviso, marcadorAlerta, marcadorReagrupar, textoDoAviso, TIPOS_ALERTA } from './avisosEstrada';

describe('avisos de estrada (formato da mensagem)', () => {
  it('monta e lê o alerta com a posição arredondada (~1 km), nunca a exata', () => {
    const m = marcadorAlerta('buraco', { lat: -15.601234, lng: -56.097456 });
    expect(m).toBe('[[alerta:buraco@-15.6,-56.1]]');
    expect(lerAviso(m)).toEqual({ tipo: 'alerta', alerta: 'buraco', posicao: { lat: -15.6, lng: -56.1 } });
  });

  it('lê todos os tipos, com e sem posição', () => {
    for (const tipo of TIPOS_ALERTA) {
      expect(lerAviso(marcadorAlerta(tipo, null))).toEqual({ tipo: 'alerta', alerta: tipo, posicao: null });
    }
    expect(lerAviso(marcadorReagrupar({ lat: 1.5, lng: 2 }))).toEqual({
      tipo: 'reagrupar',
      posicao: { lat: 1.5, lng: 2 },
    });
    expect(lerAviso(marcadorReagrupar(null))).toEqual({ tipo: 'reagrupar', posicao: null });
  });

  it('texto comum e marcador inválido não viram aviso', () => {
    expect(lerAviso('oi, pessoal')).toBeNull();
    expect(lerAviso('[[alerta:dragao]]')).toBeNull();
    expect(lerAviso('veja [[alerta:buraco]] aqui')).toBeNull();
  });

  it('mostra no chat o texto traduzido no lugar do marcador', () => {
    const t = ((c: string, o?: Record<string, string>) => `${c}${o ? JSON.stringify(o) : ''}`) as never;
    expect(textoDoAviso('[[reagrupar]]', t)).toBe('pilotando.reagruparMensagem');
    expect(textoDoAviso('[[alerta:oleo]]', t)).toContain('pilotando.alertas.oleo');
    expect(textoDoAviso('bom dia', t)).toBe('bom dia');
  });
});
