import { irmaosExemplo, lugaresExemplo } from '@/dados/exemplos';

import {
  ACENOS_POR_DIA,
  acenar,
  fichaDoIrmao,
  fichaDoIrmaoAoVivo,
  diaMesDaColeta,
  fichaDoLugar,
  lerPrecoCombustivel,
} from './fichas';

describe('fichas do mapa', () => {
  it('todo lugar do mapa abre ficha com "Rota até aqui" como primeira ação', () => {
    for (const l of lugaresExemplo) {
      const f = fichaDoLugar(l);
      expect(f.acoes[0]).toBe('rota');
      expect(f.acoes.length).toBeLessThanOrEqual(2);
    }
  });

  it('irmão nunca tem rota até ele (posição aproximada) e "não perturbe" não recebe aceno', () => {
    for (const i of irmaosExemplo) expect(fichaDoIrmao(i).acoes).not.toContain('rota');
    expect(fichaDoIrmao({ ...irmaosExemplo[0]!, status: 'naoPerturbe' }).acoes).toEqual(['perfil']);
  });

  it('posto mostra o preço do irmão com data quando informado', () => {
    const posto = lugaresExemplo.find((l) => l.tipo === 'posto')!;
    const f = fichaDoLugar(posto, { valor: '6,10', dia: '12/11/2026' });
    expect(f.linhas[0]).toMatchObject({
      chave: 'ficha.precoIrmao',
      valores: { preco: '6,10', dia: '12/11/2026' },
    });
  });

  it('acenos: um por irmão por dia e no máximo o limite diário', () => {
    let r = { dia: '', para: [] as string[] };
    r = acenar(r, 'ze', '2026-11-12')!;
    expect(acenar(r, 'ze', '2026-11-12')).toBeNull();
    for (let i = 1; i < ACENOS_POR_DIA; i++) r = acenar(r, `i${i}`, '2026-11-12')!;
    expect(acenar(r, 'outro', '2026-11-12')).toBeNull();
    expect(acenar(r, 'ze', '2026-11-13')).toEqual({ dia: '2026-11-13', para: ['ze'] });
  });

  it.each([
    ['6,29', '6,29'],
    ['R$ 6.5', '6,50'],
    ['abc', null],
    ['62', null],
  ])('preço "%s" → %s', (e, s) => expect(lerPrecoCombustivel(e)).toBe(s));
});

describe('pontos coletados', () => {
  it('Rota Biker tem ficha com número, crédito e link do site oficial', () => {
    const { pontosColetados } = jest.requireActual('@/dados/exemplos') as typeof import('@/dados/exemplos');
    const rb = pontosColetados.filter((p) => p.tipo === 'rotaBiker');
    expect(rb.length).toBeGreaterThanOrEqual(40);
    const f = fichaDoLugar(rb[0]!);
    expect(f.acoes).toEqual(['rota', 'site']);
    expect(f.link).toContain('monumentobikers.com.br');
    expect(f.linhas.map((l) => l.chave)).toContain('ficha.fonteRotaBiker');
  });

  it('cachoeiras e mirantes do OpenStreetMap trazem o crédito e o tipo certo', () => {
    const { pontosColetados } = jest.requireActual('@/dados/exemplos') as typeof import('@/dados/exemplos');
    const c = pontosColetados.find((p) => p.tipo === 'cachoeira')!;
    const f = fichaDoLugar(c);
    expect(f.subtitulo).toBe('ficha.tipos.cachoeira');
    expect(f.linhas[0]!.chave).toBe('ficha.fonteOsm');
    expect(new Set(pontosColetados.map((p) => p.id)).size).toBe(pontosColetados.length);
  });
});

describe('pontos do banco (OpenStreetMap)', () => {
  const base = {
    id: 'node/1',
    tipo: 'museu' as const,
    nome: 'Museu do Morro',
    lng: -56,
    lat: -15.6,
    fonte: 'osm' as const,
  };

  it('ficha mostra tipo, fonte e só oferece Ligar e Site quando existem', () => {
    const sem = fichaDoLugar(base);
    expect(sem.subtitulo).toBe('ficha.tipos.museu');
    expect(sem.linhas[0]!.chave).toBe('ficha.fonteOsm');
    expect(sem.acoes).toEqual(['rota', 'salvar']);
    const com = fichaDoLugar({ ...base, site: 'https://museu.example', telefone: '+55 65 3000-0000' });
    expect(com.acoes).toEqual(['rota', 'telefone', 'site', 'salvar']);
    expect(com.link).toBe('https://museu.example');
    expect(com.telefone).toBe('+55 65 3000-0000');
  });
});

describe('fichaDoIrmaoAoVivo', () => {
  const base = {
    id: 'u1',
    nome: 'Zé Ferreira',
    apelido: 'Zé Bode',
    capitulo: 'Cuiabá',
    status: 'cafe' as const,
    lat: -15.6,
    lng: -56.1,
    precisao: 'aproximado' as const,
  };
  it('mostra apelido, nome, capítulo e status, com aceno', () => {
    const f = fichaDoIrmaoAoVivo(base);
    expect(f).toMatchObject({ id: 'u1', tipo: 'irmao', titulo: 'Zé Bode', subtitulo: 'ficha.status.cafe' });
    expect(f.linhas.map((l) => l.chave)).toEqual([
      'ficha.nomeDe',
      'ficha.capituloDe',
      'ficha.posicaoAproximada',
    ]);
    expect(f.acoes).toEqual(['acenar']);
    expect(f.acoes).not.toContain('rota');
  });
  it('não perturbe não recebe aceno; precisão muda o texto', () => {
    const f = fichaDoIrmaoAoVivo({
      ...base,
      status: 'naoPerturbe',
      precisao: 'cidade',
      apelido: null,
      capitulo: null,
    });
    expect(f.acoes).toEqual([]);
    expect(f.titulo).toBe('Zé Ferreira');
    expect(f.linhas.map((l) => l.chave)).toEqual(['ficha.posicaoCidade']);
  });
});

describe('ficha de posto da ANP', () => {
  const posto = {
    id: 'anp/1',
    tipo: 'posto' as const,
    nome: 'Posto Trevo',
    lat: -15.57,
    lng: -56.07,
    fonte: 'anp' as const,
    bandeira: 'Ipiranga',
    precosAnp: [
      { produto: 'gasolina_comum' as const, valor: 6.29, data: '2026-11-03' },
      { produto: 'etanol' as const, valor: 4.19, data: '2026-11-10' },
    ],
  };

  it('mostra cada preço com a data e a fonte ANP com a coleta mais recente', () => {
    const f = fichaDoLugar(posto);
    expect(f.linhas.map((l) => l.chave)).toEqual([
      'ficha.precoAnp_gasolina_comum',
      'ficha.precoAnp_etanol',
      'ficha.fonteAnp',
      'ficha.texto',
    ]);
    expect(f.linhas[0]!.valores).toEqual({ preco: '6,29', dia: '03/11' });
    expect(f.linhas[2]!.valores).toEqual({ dia: '10/11' });
    expect(f.acoes).toEqual(['rota', 'informarPreco']);
  });

  it('sem preço da ANP avisa; local aproximado e preço de irmão aparecem', () => {
    const f = fichaDoLugar(
      { ...posto, precosAnp: [], localAproximado: true },
      { valor: '6,10', dia: '12/11/2026' },
    );
    expect(f.linhas.map((l) => l.chave)).toEqual([
      'ficha.precoIrmao',
      'ficha.anpSemPreco',
      'ficha.texto',
      'ficha.localAproximado',
    ]);
  });

  it('diaMesDaColeta formata AAAA-MM-DD', () => {
    expect(diaMesDaColeta('2026-11-03')).toBe('03/11');
    expect(diaMesDaColeta('lixo')).toBe('lixo');
  });
});
