import * as chat from './chat';
import { conversaDoComboio, enviarAlerta, enviarReagrupar, ouvirAvisos } from './avisosEstrada';

jest.mock('./chat', () => ({
  listarConversas: jest.fn(),
  enviar: jest.fn(async () => ({})),
  assinar: jest.fn(),
}));

const mock = chat as jest.Mocked<typeof chat>;
const conv = (id: string, tipo: string, ultimaEm: string | null) => ({ id, tipo, ultimaEm });

describe('avisos de estrada no servidor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('escolhe o comboio; sem comboio, o passeio mais recente; sem grupo, null', async () => {
    mock.listarConversas.mockResolvedValue({
      conversas: [
        conv('cap', 'capitulo', '2026-11-13'),
        conv('p1', 'passeio', '2026-11-10'),
        conv('p2', 'passeio', '2026-11-12'),
      ],
      ultimas: [],
    } as never);
    expect(await conversaDoComboio()).toBe('p2');
    mock.listarConversas.mockResolvedValue({
      conversas: [conv('p2', 'passeio', '2026-11-12'), conv('c1', 'comboio', '2026-11-01')],
      ultimas: [],
    } as never);
    expect(await conversaDoComboio()).toBe('c1');
    mock.listarConversas.mockResolvedValue({
      conversas: [conv('cap', 'capitulo', null)],
      ultimas: [],
    } as never);
    expect(await conversaDoComboio()).toBeNull();
    mock.listarConversas.mockRejectedValue(new Error('sem rede'));
    expect(await conversaDoComboio()).toBeNull();
  });

  it('o alerta vai como mensagem com marcador e posição aproximada', async () => {
    expect(await enviarAlerta('g1', 'policia', { lat: -15.6012, lng: -56.0988 })).toBe(true);
    expect(mock.enviar).toHaveBeenCalledWith('g1', '[[alerta:policia@-15.6,-56.1]]', true);
  });

  it('reagrupar envia ao grupo; sem grupo ou com erro devolve false', async () => {
    expect(await enviarReagrupar('g1', null)).toBe(true);
    expect(mock.enviar).toHaveBeenCalledWith('g1', '[[reagrupar]]', true);
    expect(await enviarReagrupar(null, null)).toBe(false);
    mock.enviar.mockRejectedValueOnce(new Error('x'));
    expect(await enviarAlerta('g1', 'obra', null)).toBe(false);
  });

  it('só avisos de outros irmãos chegam; texto comum e as minhas mensagens são ignorados', () => {
    let entrega: (m: unknown) => void = () => undefined;
    mock.assinar.mockImplementation(((_: string, f: (m: unknown) => void) => {
      entrega = f;
      return () => undefined;
    }) as never);
    const recebidos: unknown[] = [];
    ouvirAvisos('g1', (a, autor) => recebidos.push([a.tipo, autor]));
    entrega({ minha: false, texto: '[[alerta:buraco]]', autor: 'Zé' });
    entrega({ minha: true, texto: '[[alerta:buraco]]', autor: 'Eu' });
    entrega({ minha: false, texto: 'oi', autor: 'Zé' });
    entrega({ minha: false, texto: '[[reagrupar]]', autor: 'Ana' });
    expect(recebidos).toEqual([
      ['alerta', 'Zé'],
      ['reagrupar', 'Ana'],
    ]);
  });
});
