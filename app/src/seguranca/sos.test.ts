import { mensagemSOS, somarTrecho } from './sos';

const textos = {
  titulo: 'SOS',
  semPosicao: 'sem GPS',
  sangue: 'Sangue',
  alergias: 'Alergias',
  remedios: 'Remédios',
  plano: 'Plano',
  rodape: 'Não substitui 192/193',
};

describe('SOS e odômetro', () => {
  it('mensagem com link do mapa, hora e ficha', () => {
    const m = mensagemSOS({
      nome: 'Zé',
      posicao: { lat: -15.6, lng: -56.1 },
      agora: new Date(2026, 10, 12, 9, 5),
      ficha: { sangue: 'O+' },
      textos,
    });
    expect(m).toContain('SOS — Zé (09:05)');
    expect(m).toContain('https://maps.google.com/?q=-15.60000,-56.10000');
    expect(m).toContain('Sangue: O+');
    expect(m).not.toContain('Alergias');
  });

  it('sem GPS avisa no lugar do link', () => {
    expect(mensagemSOS({ nome: 'Zé', posicao: null, agora: new Date(), textos })).toContain('sem GPS');
  });

  it('odômetro soma trechos reais e descarta imprecisão e saltos', () => {
    const a = { lat: -15.6, lng: -56.1, precisao: 10, tempo: 0 };
    const b = { lat: -15.6, lng: -56.09, precisao: 10, tempo: 60_000 }; // ~1,07 km em 1 min (~64 km/h)
    expect(somarTrecho(a, b).km).toBeGreaterThan(1);
    expect(somarTrecho(a, { ...b, precisao: 120 }).valida).toBe(false);
    expect(somarTrecho(a, { ...b, lng: -55.5, tempo: 60_000 }).valida).toBe(false); // ~64 km em 1 min
  });
});
