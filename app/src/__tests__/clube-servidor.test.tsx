import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import Aprovacoes from '@/app/aprovacoes';
import Guia from '@/app/negocios';
import Vitrine from '@/app/negocios/[id]';
import Lista from '@/app/ferramentas/lista/[tipo]';
import { todosOsLugares } from '@/dados/exemplos';
import { ferramentasVisiveis } from '@/ferramentas/catalogo';
import { fichaDoLugar } from '@/map/fichas';
import { ProvedorViagem } from '@/estado/viagem';
import { clienteConsultas } from '@/servidor/consulta';
import { enviarAceno } from '@/estado/avisoAceno';
import { router } from 'expo-router';
import { decidirLoja, lojaParaLugar, paraLoja, type Loja } from '@/servidor/lojas';
import { definirDestaque, negocioParaLugar, paraNegocio, decidirNegocio } from '@/servidor/negocios';
import * as lojasSrv from '@/servidor/lojas';
import * as negociosSrv from '@/servidor/negocios';
import * as membrosSrv from '@/servidor/membros';

let mockPapel = 'membro';
let mockTipo = 'lojas';
let mockId = 'n1';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ tipo: mockTipo, id: mockId }),
}));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});
jest.mock('@/servidor/supabase', () => ({ servidorConfigurado: true, supabase: {} }));
jest.mock('@/acesso/acesso', () => ({
  useAcessoOpcional: () => ({
    modo: 'supabase',
    estado: 'membro',
    papel: mockPapel,
    aprova: true,
    temConsentimento: () => false,
  }),
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
  listarLojas: jest.fn(),
  lojasPendentes: jest.fn(),
  decidirLoja: jest.fn(async () => undefined),
  apagarLoja: jest.fn(async () => undefined),
}));
jest.mock('@/servidor/negocios', () => ({
  ...jest.requireActual('@/servidor/negocios'),
  listarNegocios: jest.fn(),
  urlsDasFotos: jest.fn(async () => ({})),
  negociosPendentes: jest.fn(),
  decidirNegocio: jest.fn(async () => undefined),
  definirDestaque: jest.fn(async () => undefined),
}));
jest.mock('@/servidor/membros', () => ({
  ...jest.requireActual('@/servidor/membros'),
  listarMembros: jest.fn(),
  meuAniversario: jest.fn(async () => null),
  salvarAniversario: jest.fn(async () => undefined),
}));

const lojaLinha = (o: Partial<Parameters<typeof paraLoja>[0]> = {}) => ({
  id: 'l1',
  nome: 'Estrela do Sul',
  oriente: 'Cuiabá',
  potencia: 'GOMT',
  dias_sessao: '2as e 4as',
  endereco: null,
  cidade: 'Cuiabá',
  lat: -15.6,
  lng: -56.1,
  irmao_contato: 'outro',
  status: 'aprovada' as const,
  motivo_recusa: null,
  contato: { nome: 'Zé', apelido: null },
  ...o,
});
const negLinha = (o = {}) => ({
  id: 'n1',
  dono: 'u1',
  nome: 'Oficina Real',
  categoria: 'oficina' as const,
  descricao: 'Revisão',
  cidade: 'Cuiabá',
  lat: -15.62,
  lng: -56.06,
  telefone: null,
  whatsapp: null,
  site: null,
  beneficio_irmaos: '10% na revisão',
  fotos: [],
  destaque_ate: null as string | null,
  status: 'aprovado' as const,
  motivo_recusa: null,
  dono_perfil: { nome: 'Zé' },
  ...o,
});

afterEach(() => {
  clienteConsultas.clear();
});

beforeEach(() => {
  jest.clearAllMocks();
  clienteConsultas.clear();
  mockPapel = 'membro';
  mockTipo = 'lojas';
  mockId = 'n1';
  (lojasSrv.listarLojas as jest.Mock).mockResolvedValue([
    paraLoja(lojaLinha(), 'u1'),
    paraLoja(lojaLinha({ id: 'l2', nome: 'Minha Loja', irmao_contato: 'u1', status: 'pendente' }), 'u1'),
  ]);
  (lojasSrv.lojasPendentes as jest.Mock).mockResolvedValue([
    {
      id: 'l9',
      nome: 'Loja Nova',
      oriente: 'Cuiabá',
      potencia: '',
      diasSessao: '',
      endereco: '',
      cidade: 'Cuiabá',
      autor: 'Irmão Autor',
    },
  ]);
  (negociosSrv.listarNegocios as jest.Mock).mockResolvedValue([paraNegocio(negLinha(), 'u1')]);
  (negociosSrv.negociosPendentes as jest.Mock).mockResolvedValue([
    {
      id: 'n9',
      nome: 'Pousa Nova',
      categoria: 'pouso',
      cidade: 'Cuiabá',
      beneficio: 'Café',
      descricao: '',
      donoNome: 'Dono Um',
    },
  ]);
  (membrosSrv.listarMembros as jest.Mock).mockResolvedValue([
    { id: 'a', nome: 'Ana Souza', apelido: 'Aninha', capitulo: 'Cuiabá', aniversario: { dia: 7, mes: 9 } },
    { id: 'b', nome: 'Beto Lima', apelido: '', capitulo: '', aniversario: null },
  ]);
});

describe('versão com servidor: Lojas, Guia, Membros e Aniversários voltam', () => {
  it('o catálogo mostra as quatro ferramentas', () => {
    const chaves = ferramentasVisiveis(true).flatMap((g) => g.itens.map((i) => i.chave));
    for (const c of ['lojas', 'negocios', 'membros', 'aniversarios']) expect(chaves).toContain(c);
    for (const c of ['bodeAmigo', 'irmaosPerto', 'meta']) expect(chaves).not.toContain(c);
  });

  it('Lojas: mostra as do servidor, acena ao contato e deixa editar só a minha', async () => {
    await render(
      <ProvedorViagem>
        <Lista />
      </ProvedorViagem>,
    );
    expect(await screen.findByText('Estrela do Sul')).toBeTruthy();
    expect(screen.queryByText(/exemplo/i)).toBeNull();
    expect(screen.getAllByText('Contato: Zé')).toHaveLength(2);
    expect(screen.getByText('Em revisão')).toBeTruthy();
    // aceno só na Loja aprovada de outro; editar/apagar só na minha
    expect(screen.getAllByRole('button', { name: 'Acenar ao contato' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(1);
    await fireEvent.press(screen.getByRole('button', { name: 'Acenar ao contato' }));
    expect(enviarAceno).toHaveBeenCalledWith('outro');
    await fireEvent.press(screen.getByRole('button', { name: 'Editar' }));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/lojas/nova', params: { id: 'l2' } });
    await fireEvent.press(screen.getByText('Cadastrar minha Loja'));
    expect(router.push).toHaveBeenCalledWith('/lojas/nova');
  });

  it('Lojas: nunca mostra telefone nem quem cadastrou', async () => {
    await render(
      <ProvedorViagem>
        <Lista />
      </ProvedorViagem>,
    );
    await screen.findByText('Estrela do Sul');
    expect(screen.queryByText(/ligar/i)).toBeNull();
    expect(screen.queryByText(/WhatsApp/i)).toBeNull();
  });

  it('Guia: lista do servidor com selo de destaque só enquanto vale', async () => {
    (negociosSrv.listarNegocios as jest.Mock).mockResolvedValue([
      paraNegocio(negLinha({ id: 'n1', nome: 'Com Destaque', destaque_ate: '2999-12-31' }), 'u1'),
      paraNegocio(negLinha({ id: 'n2', nome: 'Destaque Vencido', destaque_ate: '2000-01-01' }), 'u1'),
      paraNegocio(negLinha({ id: 'n3', nome: 'Pendente Meu', status: 'pendente' }), 'u1'),
    ]);
    await render(
      <ProvedorViagem>
        <Guia />
      </ProvedorViagem>,
    );
    expect(await screen.findByText('Com Destaque')).toBeTruthy();
    expect(screen.queryByText('Oficina do Bode')).toBeNull();
    expect(screen.getAllByText('Destaque')).toHaveLength(1);
    expect(screen.getByText(/Em revisão/)).toBeTruthy();
    expect(screen.getByText('Sou membro (mostrar no balcão)')).toBeTruthy();
    await fireEvent.press(screen.getByText('Cadastrar meu negócio'));
    expect(router.push).toHaveBeenCalledWith('/negocios/novo');
  });

  it('Vitrine: o destaque não aparece para quem não é admin', async () => {
    mockPapel = 'moderador';
    await render(
      <ProvedorViagem>
        <Vitrine />
      </ProvedorViagem>,
    );
    await screen.findByText('Oficina Real');
    expect(screen.queryByText('Destaque (só administração)')).toBeNull();
  });

  it('Vitrine: o admin define o destaque com data válida pela função do banco', async () => {
    mockPapel = 'admin';
    await render(
      <ProvedorViagem>
        <Vitrine />
      </ProvedorViagem>,
    );
    await screen.findByText('Destaque (só administração)');
    await fireEvent.changeText(screen.getByLabelText('Vale até (AAAA-MM-DD)'), '2026-13-40');
    await fireEvent.press(screen.getByText('Definir destaque'));
    expect(definirDestaque).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByLabelText('Vale até (AAAA-MM-DD)'), '2026-12-31');
    await fireEvent.press(screen.getByText('Definir destaque'));
    await waitFor(() => expect(definirDestaque).toHaveBeenCalledWith('n1', '2026-12-31'));
  });

  it('Membros: nome, apelido e capítulo', async () => {
    mockTipo = 'membros';
    await render(
      <ProvedorViagem>
        <Lista />
      </ProvedorViagem>,
    );
    expect(await screen.findByText('Ana Souza')).toBeTruthy();
    expect(screen.getByText('“Aninha”')).toBeTruthy();
    expect(screen.getByText('2 irmãos no clube')).toBeTruthy();
    expect(screen.getByText('Sem capítulo')).toBeTruthy();
  });

  it('Aniversários: só quem mostrou; meu aniversário começa escondido', async () => {
    mockTipo = 'aniversarios';
    await render(
      <ProvedorViagem>
        <Lista />
      </ProvedorViagem>,
    );
    expect(await screen.findByText('Aninha')).toBeTruthy();
    expect(screen.getByText('07/09')).toBeTruthy();
    expect(screen.queryByText('Beto Lima')).toBeNull();
    expect(screen.getByText('Escondido dos outros irmãos')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Dia'), '7');
    await fireEvent.changeText(screen.getByLabelText('Mês'), '9');
    await fireEvent.press(screen.getByText('Salvar'));
    await waitFor(() =>
      expect(membrosSrv.salvarAniversario).toHaveBeenCalledWith({ dia: 7, mes: 9, visivel: false }),
    );
  });

  it('Aniversários: data inválida não salva', async () => {
    mockTipo = 'aniversarios';
    await render(
      <ProvedorViagem>
        <Lista />
      </ProvedorViagem>,
    );
    await screen.findByText('Aninha');
    await fireEvent.changeText(screen.getByLabelText('Dia'), '31');
    await fireEvent.changeText(screen.getByLabelText('Mês'), '2');
    await fireEvent.press(screen.getByText('Salvar'));
    expect(membrosSrv.salvarAniversario).not.toHaveBeenCalled();
  });
});

describe('aprovações de Lojas e negócios', () => {
  it('irmão comum (diretoria) não vê as abas Lojas e Negócios', async () => {
    mockPapel = 'diretoria_capitulo';
    await render(
      <ProvedorViagem>
        <Aprovacoes />
      </ProvedorViagem>,
    );
    expect(screen.queryByText('Lojas')).toBeNull();
    expect(screen.queryByText('Negócios')).toBeNull();
  });

  it('moderador aprova Loja e recusa negócio com motivo', async () => {
    mockPapel = 'moderador';
    await render(
      <ProvedorViagem>
        <Aprovacoes />
      </ProvedorViagem>,
    );
    await fireEvent.press(screen.getByText('Lojas'));
    expect(await screen.findByText('Loja Nova')).toBeTruthy();
    expect(screen.getByText('Cadastrada por Irmão Autor')).toBeTruthy();
    await fireEvent.press(screen.getByText('Aprovar'));
    await waitFor(() => expect(decidirLoja).toHaveBeenCalledWith('l9', true, undefined));

    await fireEvent.press(screen.getByText('Negócios'));
    expect(await screen.findByText('Pousa Nova')).toBeTruthy();
    await fireEvent.press(screen.getByText('Recusar'));
    expect(decidirNegocio).not.toHaveBeenCalled(); // recusar exige motivo
    await fireEvent.changeText(
      screen.getByLabelText('Motivo (obrigatório para recusar)'),
      'sem benefício real',
    );
    await fireEvent.press(screen.getByText('Recusar'));
    await waitFor(() => expect(decidirNegocio).toHaveBeenCalledWith('n9', false, 'sem benefício real'));
  });
});

describe('mapa: Lojas e negócios aprovados viram pinos', () => {
  const loja: Loja = paraLoja(lojaLinha(), null);

  it('entram na lista de lugares do servidor e ganham ficha própria', () => {
    const pinoLoja = lojaParaLugar(loja)!;
    const pinoNeg = negocioParaLugar(paraNegocio(negLinha(), null))!;
    const todos = todosOsLugares([pinoLoja, pinoNeg], true);
    expect(todos.map((l) => l.id)).toEqual(expect.arrayContaining(['loja:l1', 'negocio:n1']));

    const fLoja = fichaDoLugar(pinoLoja);
    expect(fLoja.acoes).toEqual(['rota', 'verLoja']);
    expect(fLoja.linhas.some((l) => l.chave === 'ficha.lojaDias')).toBe(true);
    const fNeg = fichaDoLugar(pinoNeg);
    expect(fNeg.acoes).toEqual(['rota', 'vitrine']);
    expect(fNeg.negocio).toBe('n1');
  });

  it('Loja pendente ou sem posição não aparece no mapa', () => {
    expect(lojaParaLugar(paraLoja(lojaLinha({ status: 'pendente' }), null))).toBeNull();
    expect(lojaParaLugar(paraLoja(lojaLinha({ lat: null, lng: null }), null))).toBeNull();
  });
});
