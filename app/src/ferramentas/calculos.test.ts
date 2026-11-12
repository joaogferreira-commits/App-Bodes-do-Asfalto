import {
  linkMapa,
  linkWhatsApp,
  planoCombustivel,
  planoViagemLonga,
  progressoMeta,
  proximaManutencao,
} from './calculos';

describe('ferramentas da estrada', () => {
  it('combustível: autonomia, paradas com reserva e custo', () => {
    const p = planoCombustivel({ distanciaKm: 600, tanqueL: 18, consumoKmL: 18, precoL: 6.29 });
    expect(p.autonomiaKm).toBe(324);
    expect(p.abastecerACadaKm).toBe(275);
    expect(p.paradas).toBe(2);
    expect(p.litros).toBeCloseTo(33.3);
    expect(p.custo).toBeCloseTo(209.67, 1);
    expect(planoCombustivel({ distanciaKm: 100, tanqueL: 18, consumoKmL: 18, precoL: 6 }).paradas).toBe(0);
  });

  it('viagem longa: dias, km e horas por dia, pausas', () => {
    expect(planoViagemLonga({ distanciaKm: 1500, kmPorDia: 500 })).toEqual({
      dias: 3,
      kmDia: 500,
      horasDia: 7.1,
      pausasDia: 3,
    });
  });

  it('meta do ano: fração e km por semana', () => {
    const m = progressoMeta({ metaKm: 10000, feitoKm: 8000, hoje: new Date(2026, 11, 1) });
    expect(m.fracao).toBeCloseTo(0.8);
    expect(m.falta).toBe(2000);
    expect(m.porSemana).toBe(400);
  });

  it('manutenção: avisa quando venceu', () => {
    expect(proximaManutencao({ ultimoKm: 10000, intervaloKm: 3000, kmAtual: 12500 })).toEqual({
      proximoKm: 13000,
      falta: 500,
      vencida: false,
    });
    expect(proximaManutencao({ ultimoKm: 10000, intervaloKm: 3000, kmAtual: 13100 }).vencida).toBe(true);
  });

  it('links de mapa e WhatsApp', () => {
    expect(linkMapa(-15.6, -56.1)).toBe('https://maps.google.com/?q=-15.60000,-56.10000');
    expect(linkWhatsApp('Oi irmão', '+55 (65) 99999-0000')).toBe(
      'https://wa.me/5565999990000?text=Oi%20irm%C3%A3o',
    );
  });
});

describe('previsão do tempo', () => {
  it('lê as próximas 8 horas, a chuva máxima e o nascer/pôr do sol', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { buscarTempo } = require('./tempo') as typeof import('./tempo');
    const horas = Array.from({ length: 24 }, (_, i) => `2026-11-12T${String(i).padStart(2, '0')}:00`);
    const buscar = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        hourly: {
          time: horas,
          temperature_2m: horas.map(() => 31.4),
          precipitation_probability: horas.map((_, i) => (i === 16 ? 70 : 10)),
          wind_speed_10m: horas.map(() => 12),
        },
        daily: { sunrise: ['2026-11-12T05:21'], sunset: ['2026-11-12T18:12'] },
      }),
    });
    const r = await buscarTempo(-15.6, -56.1, buscar, new Date(2026, 10, 12, 14));
    expect(r.horas).toHaveLength(8);
    expect(r.horas[0]).toEqual({ hora: '14:00', temperatura: 31, chuva: 10, vento: 12 });
    expect(r.chuvaMaxima).toBe(70);
    expect(r).toMatchObject({ nascer: '05:21', por: '18:12' });
    expect(buscar.mock.calls[0][0]).toContain('api.open-meteo.com');
  });
});
