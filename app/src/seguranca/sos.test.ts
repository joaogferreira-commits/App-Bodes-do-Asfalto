import { ehUrgente, MAX_MENSAGEM_AJUDA, mensagemSOS, somarTrecho, tiposAjuda } from './sos';

const textos = {
  titulo: 'PEDIDO DE AJUDA',
  quem: 'Quem',
  oQueHouve: 'O que houve',
  onde: 'Onde',
  enviadoAs: (h: string, d: string) => `Enviado às ${h} de ${d}`,
  semPosicao: 'sem GPS',
  sangue: 'Sangue',
  alergias: 'Alergias',
  remedios: 'Remédios',
  plano: 'Plano',
  rodape: 'Não substitui 192/193',
};

describe('SOS e odômetro', () => {
  it('mensagem com quem, tipo, texto, link do mapa, hora rotulada e ficha', () => {
    const m = mensagemSOS({
      nome: 'Zé da Silva',
      apelido: 'Zezão',
      tipo: 'Sem combustível',
      mensagem: 'Estou no acostamento',
      posicao: { lat: -15.6, lng: -56.1 },
      agora: new Date(2026, 10, 13, 20, 33),
      ficha: { sangue: 'O+' },
      textos,
    });
    expect(m.split('\n')).toEqual([
      'PEDIDO DE AJUDA',
      'Quem: Zé da Silva (Zezão)',
      'O que houve: Sem combustível',
      'Estou no acostamento',
      'Onde: https://maps.google.com/?q=-15.60000,-56.10000',
      'Enviado às 20:33 de 13/11',
      'Sangue: O+',
      'Não substitui 192/193',
    ]);
  });

  it('sem tipo, sem texto e sem apelido omite essas linhas; texto longo é cortado', () => {
    const m = mensagemSOS({ nome: 'Zé', apelido: ' ', posicao: null, agora: new Date(), textos });
    expect(m).not.toContain('O que houve');
    expect(m).toContain('Quem: Zé\n');
    const longo = mensagemSOS({
      nome: 'Zé',
      mensagem: 'x'.repeat(500),
      posicao: null,
      agora: new Date(),
      textos,
    });
    expect(longo).toContain('x'.repeat(MAX_MENSAGEM_AJUDA));
    expect(longo).not.toContain('x'.repeat(MAX_MENSAGEM_AJUDA + 1));
  });

  it('hora no idioma do app e nunca com dado maçônico', () => {
    const m = mensagemSOS({
      nome: 'Zé',
      posicao: null,
      agora: new Date(2026, 10, 13, 9, 5),
      idioma: 'en',
      textos,
    });
    expect(m).toContain('Enviado às 09:05 de');
    expect(m).not.toMatch(/loja|oriente|potência/i);
  });

  it('tipos de ajuda: no máximo 8, acidente e saúde urgentes', () => {
    expect(tiposAjuda.length).toBeLessThanOrEqual(8);
    expect(ehUrgente('acidente')).toBe(true);
    expect(ehUrgente('saude')).toBe(true);
    expect(ehUrgente('pneu')).toBe(false);
    expect(ehUrgente(null)).toBe(false);
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
