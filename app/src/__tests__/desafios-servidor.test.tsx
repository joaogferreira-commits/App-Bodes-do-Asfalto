import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import Conquistas from '@/app/(abas)/conquistas';
import Aprovacoes from '@/app/aprovacoes';
import Desafios from '@/app/desafios';
import NovoDesafio from '@/app/desafios/novo';
import { SairDoRanking } from '@/componentes/SairDoRanking';
import { clienteConsultas } from '@/servidor/consulta';
import * as servico from '@/servidor/desafios';
import * as dialogo from '@/ui/dialogo';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), navigate: jest.fn() } }));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});
jest.mock('@/servidor/supabase', () => ({ servidorConfigurado: true, supabase: {} }));
jest.mock('@/servidor/auth', () => ({
  pedidosParaAprovar: jest.fn(async () => []),
  decidirPedido: jest.fn(),
}));

let mockAprova = false;
jest.mock('@/acesso/acesso', () => ({
  useAcessoOpcional: () => ({
    modo: 'supabase',
    estado: 'membro',
    papel: mockAprova ? 'moderador' : 'membro',
    aprova: mockAprova,
  }),
}));
jest.mock('@/servidor/desafios', () => ({
  ...jest.requireActual('@/servidor/desafios'),
  listarDesafios: jest.fn(),
  carregarMeuProgresso: jest.fn(),
  carregarRanking: jest.fn(),
  definirForaDoRanking: jest.fn(async () => true),
  criarDesafioServidor: jest.fn(),
  entrarDesafioServidor: jest.fn(async () => ({ ok: true, valor: true })),
  sairDesafioServidor: jest.fn(async () => ({ ok: true, valor: true })),
  decidirDesafioServidor: jest.fn(async () => ({ ok: true, valor: 'aprovado' })),
  desafiosParaAprovar: jest.fn(),
  sincronizarKm: jest.fn(async (_l: unknown, _k: number, m: Record<string, number>) => m),
}));

const base = {
  id: 'srv-1',
  titulo: 'Desafio do servidor',
  tipo: 'km' as const,
  meta: 500,
  origem: 'irmao' as const,
  criador: 'Zezão',
  criadorId: 'outro',
  capitulos: ['Cuiabá'],
  inicio: '2026-11-01',
  fim: '2099-12-01',
  situacao: 'ativo' as const,
  participantes: 4,
  xpServidor: 250,
  kmFeitos: 0,
  participo: false,
  concluido: false,
};
const meu = { id: 'eu', xp: 1500, selos: ['agape'], capituloId: 'cap1', foraDoRanking: false };

beforeEach(() => {
  mockAprova = false;
  clienteConsultas.clear();
  jest.clearAllMocks();
  (servico.listarDesafios as jest.Mock).mockResolvedValue([base]);
  (servico.carregarMeuProgresso as jest.Mock).mockResolvedValue(meu);
  (servico.carregarRanking as jest.Mock).mockResolvedValue([
    { posicao: 1, usuarioId: 'u2', nome: 'Irmão Outro', apelido: null, xp: 900, eu: false },
    { posicao: 2, usuarioId: 'eu', nome: 'Eu', apelido: 'Bravo', xp: 250, eu: true },
  ]);
  (servico.desafiosParaAprovar as jest.Mock).mockResolvedValue([{ ...base, situacao: 'aguardando' }]);
});
afterEach(() => clienteConsultas.clear());

describe('desafios no servidor', () => {
  it('lista só os do servidor (sem exemplos) com o XP do banco e participar chama o servidor', async () => {
    await render(<Desafios />);
    expect(await screen.findByText('Desafio do servidor')).toBeTruthy();
    expect(screen.getByText('+250 XP')).toBeTruthy();
    expect(screen.queryByText('1.000 km em novembro')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Participar' }));
    await waitFor(() => expect(servico.entrarDesafioServidor).toHaveBeenCalledWith('srv-1'));
  });

  it('o atalho de aprovar só aparece para quem aprova (diretoria, moderador, admin)', async () => {
    await render(<Desafios />);
    await screen.findByText('Desafio do servidor');
    expect(screen.queryByRole('button', { name: 'Aprovar desafios e irmãos' })).toBeNull();
    mockAprova = true;
    await render(<Desafios />);
    expect(await screen.findByRole('button', { name: 'Aprovar desafios e irmãos' })).toBeTruthy();
  });

  it('criar vai para o servidor (fica pendente) e erro do banco mostra o aviso e guarda o rascunho', async () => {
    const alerta = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    (servico.criarDesafioServidor as jest.Mock).mockResolvedValueOnce({ ok: false, erro: 'um_por_mes' });
    await render(<NovoDesafio />);
    await fireEvent.changeText(screen.getByLabelText('Nome do desafio'), 'Rodar 500 km');
    await fireEvent.changeText(screen.getByLabelText('Meta em km'), '500');
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar para aprovação' }));
    await waitFor(() =>
      expect(alerta).toHaveBeenCalledWith('Você já criou um desafio este mês. Tente no próximo.'),
    );
    expect(screen.getByLabelText('Nome do desafio').props.value).toBe('Rodar 500 km');

    (servico.criarDesafioServidor as jest.Mock).mockResolvedValueOnce({ ok: true, valor: 'novo' });
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar para aprovação' }));
    await waitFor(() => expect(alerta).toHaveBeenCalledWith('Desafio enviado!', expect.any(String)));
    expect(servico.criarDesafioServidor).toHaveBeenLastCalledWith({
      titulo: 'Rodar 500 km',
      modalidade: 'km',
      meta: 500,
      dias: 30,
    });
    alerta.mockRestore();
  });

  it('a diretoria vê a fila de desafios e aprova; recusar exige motivo', async () => {
    mockAprova = true;
    const alerta = jest.spyOn(dialogo, 'avisar').mockImplementation(() => undefined);
    await render(<Aprovacoes />);
    await fireEvent.press(screen.getByRole('button', { name: 'Desafios' }));
    expect(await screen.findByText('Desafio do servidor')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Recusar desafio' }));
    expect(alerta).toHaveBeenCalledWith('Escreva o motivo da recusa. Ele chega ao irmão.');
    expect(servico.decidirDesafioServidor).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Aprovar desafio' }));
    await waitFor(() =>
      expect(servico.decidirDesafioServidor).toHaveBeenCalledWith('srv-1', true, undefined),
    );
    alerta.mockRestore();
  });
});

describe('conquistas e ranking no servidor', () => {
  it('mostra XP e selos do banco e o ranking por XP, sem os números de exemplo', async () => {
    await render(<Conquistas />);
    expect(await screen.findByText('Irmão Outro')).toBeTruthy();
    expect(screen.getByText('Bravo')).toBeTruthy();
    expect(screen.getByText('1.500 XP')).toBeTruthy();
    expect(screen.queryByText(/exemplo/i)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Meu capítulo' }));
    await waitFor(() => expect(servico.carregarRanking).toHaveBeenCalledWith('cap1', 'mes', 'eu'));
  });

  it('quem saiu do ranking vê o aviso e não aparece na lista', async () => {
    (servico.carregarMeuProgresso as jest.Mock).mockResolvedValue({ ...meu, foraDoRanking: true });
    (servico.carregarRanking as jest.Mock).mockResolvedValue([
      { posicao: 1, usuarioId: 'u2', nome: 'Irmão Outro', apelido: null, xp: 900, eu: false },
    ]);
    await render(<Conquistas />);
    expect(await screen.findByText('Você saiu do ranking. Só você vê seu XP.')).toBeTruthy();
    expect(screen.queryByText('Bravo')).toBeNull();
    expect(screen.getByText('1.500 XP')).toBeTruthy();
  });

  it('"Sair do ranking" chama o servidor', async () => {
    await render(<SairDoRanking />);
    const chave = await screen.findByLabelText('Sair do ranking');
    await fireEvent(chave, 'valueChange', true);
    await waitFor(() => expect(servico.definirForaDoRanking).toHaveBeenCalledWith(true));
  });
});
