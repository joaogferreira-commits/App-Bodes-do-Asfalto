import { ehDeDia, modoDoMapa, nascerEPorDoSol } from './temaMapa';

// Cuiabá
const CUIABA = { lat: -15.6, lon: -56.1 };
/** Hora local de Cuiabá (UTC-4) em UTC. */
const cuiaba = (dia: string, hhmm: string) => new Date(`${dia}T${hhmm}:00-04:00`);

describe('nascer e pôr do sol locais', () => {
  it('Cuiabá em novembro: nascer ~5h05 e pôr ~17h52 (UTC-4), tolerância de 12 min', () => {
    const s = nascerEPorDoSol(cuiaba('2026-11-13', '12:00'), CUIABA.lat, CUIABA.lon)!;
    const min = (d: Date) => ((d.getUTCHours() - 4 + 24) % 24) * 60 + d.getUTCMinutes();
    expect(Math.abs(min(s.nascer) - (5 * 60 + 5))).toBeLessThanOrEqual(12);
    expect(Math.abs(min(s.por) - (17 * 60 + 52))).toBeLessThanOrEqual(12);
    expect(s.nascer.getTime()).toBeLessThan(s.por.getTime());
  });

  it('dia polar não tem nascer nem pôr', () => {
    expect(nascerEPorDoSol(new Date('2026-06-21T12:00:00Z'), 85, 0)).toBeNull();
  });

  it('meio-dia é dia e meia-noite é noite', () => {
    expect(ehDeDia(cuiaba('2026-11-13', '12:00'), CUIABA.lat, CUIABA.lon)).toBe(true);
    expect(ehDeDia(cuiaba('2026-11-13', '00:30'), CUIABA.lat, CUIABA.lon)).toBe(false);
    expect(ehDeDia(cuiaba('2026-11-13', '22:00'), CUIABA.lat, CUIABA.lon)).toBe(false);
  });
});

describe('modo do mapa com histerese', () => {
  const s = nascerEPorDoSol(cuiaba('2026-11-13', '12:00'), CUIABA.lat, CUIABA.lon)!;
  const em = (minDepoisDoPor: number) => new Date(s.por.getTime() + minDepoisDoPor * 60_000);

  it('escolhe sol de dia e noite à noite', () => {
    expect(modoDoMapa(cuiaba('2026-11-13', '12:00'), CUIABA, null)).toBe('sol');
    expect(modoDoMapa(cuiaba('2026-11-13', '22:00'), CUIABA, null)).toBe('noite');
  });

  it('não pisca perto do pôr do sol: mantém o modo anterior na faixa de 20 min', () => {
    expect(modoDoMapa(em(-5), CUIABA, 'sol')).toBe('sol');
    expect(modoDoMapa(em(5), CUIABA, 'sol')).toBe('sol');
    expect(modoDoMapa(em(-5), CUIABA, 'noite')).toBe('noite');
    expect(modoDoMapa(em(5), CUIABA, 'noite')).toBe('noite');
  });

  it('troca quando passa da faixa', () => {
    expect(modoDoMapa(em(25), CUIABA, 'sol')).toBe('noite');
    expect(modoDoMapa(em(-25), CUIABA, 'noite')).toBe('sol');
  });

  it('sem posição: mantém o anterior ou usa o relógio do aparelho', () => {
    expect(modoDoMapa(new Date(2026, 10, 13, 22, 0), null, 'sol')).toBe('sol');
    expect(modoDoMapa(new Date(2026, 10, 13, 22, 0), null, null)).toBe('noite');
    expect(modoDoMapa(new Date(2026, 10, 13, 12, 0), null, null)).toBe('sol');
  });
});
