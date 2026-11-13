import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import Aprovacoes from '@/app/aprovacoes';
import Classificados from '@/app/classificados';
import Anuncio from '@/app/classificados/[id]';
import NovoAnuncio from '@/app/classificados/novo';
import NovoEvento from '@/app/eventos/novo';
import Lista from '@/app/ferramentas/lista/[tipo]';
import { ProvedorClassificados } from '@/estado/classificados';
import { enviarAceno } from '@/estado/avisoAceno';
import { ProvedorViagem } from '@/estado/viagem';
import { ferramentasVisiveis, soExemplo } from '@/ferramentas/catalogo';
import { clienteConsultas } from '@/servidor/consulta';
import * as classSrv from '@/servidor/classificados';
import * as eventosSrv from '@/servidor/eventos';
import * as feedSrv from '@/servidor/feed';
import * as dialogo from '@/ui/dialogo';

let mockPapel = 'membro';
let mockTipo = 'eventos';
let mockId = 'c1';
let mockSb: unknown = {};

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ tipo: mockTipo, id: mockId }),
}));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});
jest.mock('@/servidor/supabase', () => ({
  servidorConfigurado: true,
  get supabase() {
    return mockSb;
  },
}));
jest.mock('@/acesso/acesso', () => ({
  useAcessoOpcional: () => ({ modo: 'supabase', estado: 'membro', papel: mockPapel, aprova: true }),
  useAcesso: () => ({ modo: 'supabase', estado: 'membro', papel: mockPapel }),
}));
jest.mock('@/estado/avisoAceno', () => ({
  enviarAceno: jest.fn(async () => 'ok'),
  avisarResultadoAceno: jest.fn(),
}));
jest.mock('@/servidor/auth', () => ({
  pedidosParaAprovar: jest.fn(async () => []),
  decidirPedido: jest.fn(),
}));
jest.mock('@/componentes/AprovarDesafios', () => ({ AprovarDesafios: () => null }));
jest.mock('@/componentes/AprovarSuporte', () => ({ AprovarSuporte: () => null }));
jest.mock('@/servidor/lojas', () => ({
  ...jest.requireActual('@/servidor/lojas'),
  listarLojas: jest.fn(async () => []),
  lojasPendentes: jest.fn(async () => []),
}));
jest.mock('@/servidor/negocios', () => ({
  ...jest.requireActual('@/servidor/negocios'),
  listarNegocios: jest.fn(async () => []),
  negociosPendentes: jest.fn(async () => []),
}));
jest.mock('@/servidor/feed', () => ({
  ...jest.requireActual('@/servidor/feed'),
  denunciar: jest.fn(async () => undefined),
}));
jest.mock('@/servidor/classificados', () => ({
  ...jest.requireActual('@/servidor/classificados'),
  listarClassificados: jest.fn(),
  urlsDasFotosClassificados: jest.fn(async () => ({})),
  marcarVendidoServidor: jest.fn(async () => undefined),
  apagarClassificado: jest.fn(async () => undefined),
  criarClassificado: jest.fn(async () => undefined),
  subirFotoClassificado: jest.fn(async () => 'u1/foto.jpg'),
}));
jest.mock('@/servidor/eventos', () => ({
  ...jest.requireActual('@/servidor/eventos'),
  listarEventos: jest.fn(),
  eventosPendentes: jest.fn(),
  decidirEvento: jest.fn(async () => undefined),
  criarEvento: jest.fn(async () => undefined),
  editarEvento: jest.fn(async () => undefined),
  apagarEvento: jest.fn(async () => undefined),
}));

const REAL_CLASS = jest.requireActual('@/servidor/classificados') as typeof classSrv;
const REAL_EV = jest.requireActual('@/servidor/eventos') as typeof eventosSrv;

const emDias = (n: number) => new Date(Date.now() + n * 86400000).toISOString();
const linhaClass = (o: Partial<Parameters<typeof REAL_CLASS.paraClassificadoServidor>[0]> = {}) => ({
  id: 'c1',
  autor: 'outro',
  titulo: 'Capacete Shoei 60',
  descricao: 'Pouco uso',
  preco: '450.00',
  categoria: 'equipamento' as const,
  cidade: 'Cuiabá',
  fotos: ['outro/f1.jpg'],
  whatsapp: '65999990000',
  status: 'ativo' as const,
  expira_em: emDias(30),
  created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  autor_perfil: { nome: 'Zé Ferreira', apelido: null, capitulos: { nome: 'Cuiabá' } },
  ...o,
});
const linhaEv = (o: Partial<Parameters<typeof REAL_EV.paraEvento>[0]> = {}) => ({
  id: 'e1',
  autor: 'outro',
  titulo: 'Sessão magna aberta',
  descricao: 'Divulgação da Loja',
  tipo: 'loja' as const,
  inicio: emDias(2),
  fim: null,
  local: 'Templo central',
  cidade: 'Cuiabá',
  lat: -15.6,
  lng: -56.1,
  status: 'aprovado' as const,
  motivo_recusa: null,
  autor_perfil: { nome: 'Irmão Autor', apelido: null },
  ...o,
});

beforeEach(() => {
  jest.clearAllMocks();
  clienteConsultas.clear();
  mockPapel = 'membro';
  mockTipo = 'eventos';
  mockId = 'c1';
  mockSb = {};
  (classSrv.listarClassificados as jest.Mock).mockResolvedValue([
    REAL_CLASS.paraClassificadoServidor(linhaClass(), 'eu'),
    REAL_CLASS.paraClassificadoServidor(
      linhaClass({ id: 'c2', autor: 'eu', titulo: 'Minha Bandana', preco: null, status: 'ativo' }),
      'eu',
    ),
  ]);
  (eventosSrv.listarEventos as jest.Mock).mockResolvedValue([
    REAL_EV.paraEvento(linhaEv(), 'eu'),
    REAL_EV.paraEvento(linhaEv({ id: 'e2', autor: 'eu', titulo: 'Meu Encontro', status: 'pendente' }), 'eu'),
  ]);
  (eventosSrv.eventosPendentes as jest.Mock).mockResolvedValue([
    {
      id: 'e9',
      titulo: 'Moto Fest',
      tipo: 'motoclube',
      inicio: emDias(5),
      fim: null,
      local: 'Praça',
      cidade: 'Chapada',
      descricao: '',
      autorNome: 'Dono Evento',
    },
  ]);
});
afterEach(() => clienteConsultas.clear());

describe('serviços: Classificados', () => {
  it('traduz a linha do banco (preço como texto, autor, capítulo, categoria)', () => {
    const c = REAL_CLASS.paraClassificadoServidor(linhaClass(), 'eu');
    expect(c).toMatchObject({
      preco: 450,
      autorNome: 'Zé Ferreira',
      autorCapitulo: 'Cuiabá',
      meu: false,
      whatsapp: '65999990000',
    });
    expect(REAL_CLASS.paraClassificadoServidor(linhaClass({ autor: 'eu' }), 'eu').meu).toBe(true);
    expect(REAL_CLASS.paraClassificadoServidor(linhaClass({ preco: null }), null).preco).toBeNull();
  });

  it('categorias do app e do banco fazem a viagem de ida e volta', () => {
    for (const [app, srv] of Object.entries(REAL_CLASS.paraCategoriaServidor))
      expect(REAL_CLASS.daCategoriaServidor[srv]).toBe(app);
  });

  it('só vale o que não foi removido nem venceu', () => {
    const agora = Date.now();
    const ok = { status: 'ativo' as const, expiraEm: emDias(1) };
    expect(REAL_CLASS.anuncioVigente(ok, agora)).toBe(true);
    expect(REAL_CLASS.anuncioVigente({ ...ok, status: 'removido' }, agora)).toBe(false);
    expect(REAL_CLASS.anuncioVigente({ ...ok, expiraEm: emDias(-1) }, agora)).toBe(false);
    expect(REAL_CLASS.anuncioVigente({ ...ok, status: 'vendido' }, agora)).toBe(true);
  });

  it('listar descarta vencidos e removidos mesmo que o banco os devolva', async () => {
    const linhas = [
      linhaClass({ id: 'a', titulo: 'Vigente' }),
      linhaClass({ id: 'b', titulo: 'Vencido', expira_em: emDias(-2) }),
      linhaClass({ id: 'c', titulo: 'Removido', status: 'removido' }),
    ];
    const cadeia = { order: () => cadeia, limit: async () => ({ data: linhas, error: null }) };
    mockSb = {
      auth: { getUser: async () => ({ data: { user: { id: 'eu' } } }) },
      from: () => ({ select: () => cadeia }),
    };
    const r = await REAL_CLASS.listarClassificados();
    expect(r.map((x) => x.titulo)).toEqual(['Vigente']);
  });

  it('formato das telas: sem ficha, "a combinar" vira 0 e só fotos com link', () => {
    const c = REAL_CLASS.paraClassificadoServidor(
      linhaClass({ preco: null, fotos: ['a.jpg', 'b.jpg'] }),
      'eu',
    );
    const a = REAL_CLASS.paraAnuncio(c, { 'a.jpg': 'https://x/a' }, 'há 3 h');
    expect(a).toMatchObject({
      preco: 0,
      semFicha: true,
      servidor: true,
      autorId: 'outro',
      categoria: 'equipamentos',
      quando: 'há 3 h',
    });
    expect(a.fotos).toEqual([{ uri: 'https://x/a' }]);
  });

  it('criar grava preço nulo, categoria do banco e no máximo 6 fotos', async () => {
    const insert = jest.fn(async () => ({ error: null }));
    mockSb = { from: jest.fn(() => ({ insert })) };
    await REAL_CLASS.criarClassificado({
      titulo: ' Capacete ',
      descricao: '',
      preco: 0,
      categoria: 'servicos',
      cidade: 'Cuiabá',
      whatsapp: '',
      fotos: Array.from({ length: 8 }, (_, i) => `u/${i}.jpg`),
    });
    const corpo = (insert.mock.calls[0] as unknown as [Record<string, unknown>])[0];
    expect(corpo).toMatchObject({
      titulo: 'Capacete',
      preco: null,
      categoria: 'outro',
      descricao: null,
      whatsapp: null,
    });
    expect(corpo.fotos).toHaveLength(6);
  });

  it('o erro de limite do banco vira o aviso de limite', () => {
    expect(REAL_CLASS.motivoDoErro({ message: 'limite_ativos' })).toBe('limite');
    expect(REAL_CLASS.motivoDoErro({ message: 'outra coisa' })).toBe('erro');
  });
});

describe('serviços: Eventos', () => {
  it('em andamento vale; sem hora de fim vale por 12 h; passado não', () => {
    const agora = Date.now();
    const h = (n: number) => new Date(agora + n * 3600000).toISOString();
    expect(REAL_EV.eventoVigente({ inicio: h(-2), fim: h(2) }, agora)).toBe(true);
    expect(REAL_EV.eventoVigente({ inicio: h(-5), fim: null }, agora)).toBe(true);
    expect(REAL_EV.eventoVigente({ inicio: h(-13), fim: null }, agora)).toBe(false);
    expect(REAL_EV.eventoVigente({ inicio: h(-30), fim: h(-24) }, agora)).toBe(false);
  });

  it('organizar: aprovados dos outros + os meus; passados fora; ordem por data', () => {
    const agora = Date.now();
    const lista = [
      REAL_EV.paraEvento(linhaEv({ id: 'tarde', inicio: emDias(9) }), 'eu'),
      REAL_EV.paraEvento(linhaEv({ id: 'cedo', inicio: emDias(1) }), 'eu'),
      REAL_EV.paraEvento(linhaEv({ id: 'pend-outro', status: 'pendente' }), 'eu'),
      REAL_EV.paraEvento(
        linhaEv({ id: 'meu-pend', autor: 'eu', status: 'pendente', inicio: emDias(3) }),
        'eu',
      ),
      REAL_EV.paraEvento(linhaEv({ id: 'passado', inicio: emDias(-10), fim: emDias(-9) }), 'eu'),
      REAL_EV.paraEvento(
        linhaEv({ id: 'meu-passado', autor: 'eu', inicio: emDias(-10), fim: emDias(-9) }),
        'eu',
      ),
    ];
    expect(REAL_EV.organizarEventos(lista, agora).map((e) => e.id)).toEqual(['cedo', 'meu-pend', 'tarde']);
  });

  it('período: início no futuro, fim opcional e depois do início', () => {
    const d = new Date(Date.now() + 3 * 86400000);
    const dia = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    expect(REAL_EV.montarPeriodo('01/01/2020', '19:00', '')).toBe('inicio');
    expect(REAL_EV.montarPeriodo(dia, 'xx', '')).toBe('inicio');
    expect(REAL_EV.montarPeriodo(dia, '19:00', '18:00')).toBe('fim');
    const p = REAL_EV.montarPeriodo(dia, '19:00', '22:00');
    expect(p).toMatchObject({ inicio: expect.any(Date), fim: expect.any(Date) });
    expect(REAL_EV.montarPeriodo(dia, '19:00', '')).toMatchObject({ fim: null });
  });

  it('criar grava a posição arredondada e as datas em ISO', async () => {
    const insert = jest.fn(async () => ({ error: null }));
    mockSb = { from: jest.fn(() => ({ insert })) };
    const inicio = new Date(Date.now() + 86400000);
    await REAL_EV.criarEvento({
      titulo: ' Sessão ',
      descricao: '',
      tipo: 'loja',
      inicio,
      fim: null,
      local: '',
      cidade: 'Cuiabá',
      lat: -15.60123,
      lng: -56.09876,
    });
    expect((insert.mock.calls[0] as unknown as [unknown])[0]).toMatchObject({
      titulo: 'Sessão',
      inicio: inicio.toISOString(),
      fim: null,
      local: null,
      lat: -15.6,
      lng: -56.1,
    });
  });
});

describe('liberação no catálogo do servidor', () => {
  it('Classificados e Eventos deixaram a lista de só-exemplo', () => {
    const chaves = ferramentasVisiveis(true).flatMap((g) => g.itens.map((i) => i.chave));
    for (const c of ['classificados', 'eventos']) {
      expect(soExemplo).not.toContain(c);
      expect(chaves).toContain(c);
    }
    for (const c of ['bodeAmigo', 'irmaosPerto', 'meta']) expect(chaves).not.toContain(c);
  });
});

describe('Classificados no servidor (telas)', () => {
  const envolver = (tela: React.ReactElement) => <ProvedorClassificados>{tela}</ProvedorClassificados>;

  it('lista só anúncios reais; preço nulo mostra "A combinar"; nada de exemplo', async () => {
    await render(envolver(<Classificados />));
    expect(await screen.findByText('Capacete Shoei 60')).toBeTruthy();
    expect(screen.getByText('Minha Bandana')).toBeTruthy();
    expect(screen.getByText('A combinar')).toBeTruthy();
    expect(screen.getByText('R$ 450')).toBeTruthy();
    expect(screen.queryByText(/Fat Boy/)).toBeNull();
  });

  it('lista vazia no servidor diz que ninguém anunciou ainda', async () => {
    (classSrv.listarClassificados as jest.Mock).mockResolvedValue([]);
    await render(envolver(<Classificados />));
    expect(await screen.findByText(/Nenhum anúncio por enquanto/)).toBeTruthy();
  });

  it('comprador: acena ao vendedor, abre o WhatsApp opcional e denuncia', async () => {
    mockId = 'c1';
    const aviso = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    await render(envolver(<Anuncio />));
    expect(await screen.findByText('Capacete Shoei 60')).toBeTruthy();
    expect(screen.queryByText('Marcar como vendido')).toBeNull();
    expect(screen.queryByText('Estado')).toBeNull(); // sem ficha de estado/troca no servidor
    expect(screen.getByText('Chamar no WhatsApp')).toBeTruthy();
    await fireEvent.press(screen.getByText('Acenar ao vendedor'));
    expect(enviarAceno).toHaveBeenCalledWith('outro');

    await fireEvent.press(screen.getByRole('button', { name: 'Denunciar' }));
    const botoes = aviso.mock.calls.at(-1)![2]!;
    await act(async () => botoes.find((b) => b.style === 'destructive')!.onPress!());
    expect(feedSrv.denunciar).toHaveBeenCalledWith('classificado', 'c1', expect.any(String));
    aviso.mockRestore();
  });

  it('dono: marca como vendido e não vê aceno nem denúncia', async () => {
    mockId = 'c2';
    await render(envolver(<Anuncio />));
    expect(await screen.findByText('Minha Bandana')).toBeTruthy();
    expect(screen.queryByText('Acenar ao vendedor')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Denunciar' })).toBeNull();
    await fireEvent.press(screen.getByText('Marcar como vendido'));
    await waitFor(() => expect(classSrv.marcarVendidoServidor).toHaveBeenCalledWith('c2', true));
  });

  it('formulário: sem foto e título curto não envia', async () => {
    const aviso = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    await render(envolver(<NovoAnuncio />));
    await fireEvent.changeText(screen.getByLabelText('Título do anúncio'), 'ab');
    await fireEvent.changeText(screen.getByLabelText('Cidade'), 'Cuiabá');
    await fireEvent.press(screen.getByRole('button', { name: 'Publicar anúncio' }));
    expect(classSrv.criarClassificado).not.toHaveBeenCalled();
    expect(aviso).toHaveBeenCalled();
    expect(screen.queryByLabelText('Estado')).toBeNull();
    aviso.mockRestore();
  });

  it('formulário: publica com foto sem EXIF enviada, preço opcional e WhatsApp opcional', async () => {
    const aviso = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    await render(envolver(<NovoAnuncio />));
    await fireEvent.changeText(screen.getByLabelText('Título do anúncio'), 'Capacete');
    await fireEvent.changeText(screen.getByLabelText('Cidade'), 'Cuiabá');
    const menu = jest.spyOn(dialogo, 'abrirMenu').mockImplementation(() => undefined);
    await fireEvent.press(screen.getByRole('button', { name: 'Adicionar foto' }));
    await act(async () => menu.mock.calls[0]![0].opcoes.find((o) => o.rotulo === 'Da galeria')!.onPress());
    menu.mockRestore();
    await screen.findByRole('button', { name: 'Remover esta foto' });
    await fireEvent.press(screen.getByRole('button', { name: 'Publicar anúncio' }));
    await waitFor(() => expect(classSrv.criarClassificado).toHaveBeenCalled());
    expect(classSrv.criarClassificado).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: 'Capacete', preco: 0, whatsapp: '', fotos: ['u1/foto.jpg'] }),
    );
    expect(router.back).toHaveBeenCalled();
    aviso.mockRestore();
  });

  it('formulário: no limite de 5 anúncios mostra o aviso certo', async () => {
    (classSrv.criarClassificado as jest.Mock).mockRejectedValueOnce({ message: 'limite_ativos' });
    const aviso = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    await render(envolver(<NovoAnuncio />));
    await fireEvent.changeText(screen.getByLabelText('Título do anúncio'), 'Sexto anúncio');
    await fireEvent.changeText(screen.getByLabelText('Cidade'), 'Cuiabá');
    const menu = jest.spyOn(dialogo, 'abrirMenu').mockImplementation(() => undefined);
    await fireEvent.press(screen.getByRole('button', { name: 'Adicionar foto' }));
    await act(async () => menu.mock.calls[0]![0].opcoes.find((o) => o.rotulo === 'Da galeria')!.onPress());
    menu.mockRestore();
    await screen.findByRole('button', { name: 'Remover esta foto' });
    await fireEvent.press(screen.getByRole('button', { name: 'Publicar anúncio' }));
    await waitFor(() => expect(aviso).toHaveBeenCalledWith(expect.stringMatching(/5 anúncios ativos/)));
    expect(router.back).not.toHaveBeenCalled();
    aviso.mockRestore();
  });
});

describe('Eventos no servidor (telas)', () => {
  const lista = () => (
    <ProvedorViagem>
      <Lista />
    </ProvedorViagem>
  );

  it('lista aprovados de outros (com aceno e rota) e os meus em revisão (com editar)', async () => {
    await render(lista());
    expect(await screen.findByText('Sessão magna aberta')).toBeTruthy();
    expect(screen.getByText('Meu Encontro')).toBeTruthy();
    expect(screen.getByText('Em revisão')).toBeTruthy();
    expect(screen.queryByText(/exemplo/i)).toBeNull();
    expect(screen.queryByText('Encontro Estadual dos Bodes')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Acenar a quem divulgou' })).toHaveLength(1);
    await fireEvent.press(screen.getByRole('button', { name: 'Acenar a quem divulgou' }));
    expect(enviarAceno).toHaveBeenCalledWith('outro');
    await fireEvent.press(screen.getByRole('button', { name: 'Editar' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/eventos/novo', params: { id: 'e2' } });
    await fireEvent.press(screen.getByText('Divulgar um evento'));
    expect(router.push).toHaveBeenCalledWith('/eventos/novo');
  });

  it('o filtro por tipo esconde os outros tipos', async () => {
    (eventosSrv.listarEventos as jest.Mock).mockResolvedValue([
      REAL_EV.paraEvento(linhaEv({ id: 'a', titulo: 'Evento de Loja', tipo: 'loja' }), 'eu'),
      REAL_EV.paraEvento(linhaEv({ id: 'b', titulo: 'Evento Motoclube', tipo: 'motoclube' }), 'eu'),
    ]);
    await render(lista());
    await screen.findByText('Evento de Loja');
    await fireEvent.press(screen.getByRole('button', { name: 'Motoclube' }));
    expect(screen.queryByText('Evento de Loja')).toBeNull();
    expect(screen.getByText('Evento Motoclube')).toBeTruthy();
  });

  it('formulário: data no passado não envia; data futura envia para revisão', async () => {
    mockId = '';
    const aviso = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    await render(<NovoEvento />);
    await fireEvent.changeText(screen.getByLabelText('Nome do evento'), 'Encontro dos Bodes');
    await fireEvent.changeText(screen.getByLabelText('Cidade'), 'Cuiabá');
    await fireEvent.changeText(screen.getByLabelText('Dia (dd/mm/aaaa)'), '01/01/2020');
    await fireEvent.changeText(screen.getByLabelText('Início (ex.: 19:30)'), '19:00');
    await fireEvent.press(screen.getByText('Enviar para revisão'));
    expect(eventosSrv.criarEvento).not.toHaveBeenCalled();
    expect(aviso).toHaveBeenCalledWith(expect.stringMatching(/Confira o dia e a hora/));

    const d = new Date(Date.now() + 4 * 86400000);
    const dia = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    await fireEvent.changeText(screen.getByLabelText('Dia (dd/mm/aaaa)'), dia);
    await fireEvent.press(screen.getByText('Enviar para revisão'));
    await waitFor(() => expect(eventosSrv.criarEvento).toHaveBeenCalled());
    const dados = (eventosSrv.criarEvento as jest.Mock).mock.calls[0][0];
    expect(dados).toMatchObject({
      titulo: 'Encontro dos Bodes',
      tipo: 'motoclube',
      cidade: 'Cuiabá',
      fim: null,
    });
    expect(dados.inicio).toBeInstanceOf(Date);
    expect(router.back).toHaveBeenCalled();
    aviso.mockRestore();
  });

  it('formulário: o limite de 3 por dia mostra o aviso', async () => {
    mockId = '';
    (eventosSrv.criarEvento as jest.Mock).mockRejectedValueOnce({ message: 'limite_diario' });
    mockId = '';
    const aviso = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    await render(<NovoEvento />);
    const d = new Date(Date.now() + 4 * 86400000);
    const dia = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    await fireEvent.changeText(screen.getByLabelText('Nome do evento'), 'Quarto evento');
    await fireEvent.changeText(screen.getByLabelText('Cidade'), 'Cuiabá');
    await fireEvent.changeText(screen.getByLabelText('Dia (dd/mm/aaaa)'), dia);
    await fireEvent.changeText(screen.getByLabelText('Início (ex.: 19:30)'), '19:00');
    await fireEvent.press(screen.getByText('Enviar para revisão'));
    await waitFor(() => expect(aviso).toHaveBeenCalledWith(expect.stringMatching(/eventos demais hoje/)));
    aviso.mockRestore();
  });
});

describe('aprovações: aba Eventos', () => {
  it('quem não é moderação não vê a aba', async () => {
    mockPapel = 'diretoria_capitulo';
    await render(
      <ProvedorViagem>
        <Aprovacoes />
      </ProvedorViagem>,
    );
    expect(screen.queryByText('Eventos')).toBeNull();
  });

  it('moderador aprova e recusa (com motivo obrigatório)', async () => {
    mockPapel = 'moderador';
    await render(
      <ProvedorViagem>
        <Aprovacoes />
      </ProvedorViagem>,
    );
    await fireEvent.press(screen.getByText('Eventos'));
    expect(await screen.findByText('Moto Fest')).toBeTruthy();
    expect(screen.getByText('Divulgado por Dono Evento')).toBeTruthy();
    await fireEvent.press(screen.getByText('Recusar'));
    expect(eventosSrv.decidirEvento).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByLabelText('Motivo (obrigatório para recusar)'), 'fora do tema');
    await fireEvent.press(screen.getByText('Recusar'));
    await waitFor(() => expect(eventosSrv.decidirEvento).toHaveBeenCalledWith('e9', false, 'fora do tema'));
    await fireEvent.press(screen.getByText('Aprovar'));
    await waitFor(() => expect(eventosSrv.decidirEvento).toHaveBeenCalledWith('e9', true, undefined));
  });
});
