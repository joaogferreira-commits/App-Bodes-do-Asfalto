import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';

import StatusServidor from '@/app/status-servidor';

let mockConfigurado = true;
let mockSb: unknown = null;
jest.mock('@/servidor/supabase', () => ({
  get servidorConfigurado() {
    return mockConfigurado;
  },
  get supabase() {
    return mockSb;
  },
  get pecasServidor() {
    return {
      urlBruta: mockConfigurado,
      urlValida: mockConfigurado,
      chavePresente: mockConfigurado,
      chaveValida: mockConfigurado,
    };
  },
}));
jest.mock('@/servidor/notificacoes', () => ({ tokenRegistrado: jest.fn(async () => true) }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '9.9.9' } },
}));
jest.mock('@/acesso/acesso', () => ({
  useAcessoOpcional: () => ({
    modo: mockConfigurado ? 'supabase' : 'local',
    estado: 'membro',
    papel: 'admin',
  }),
}));

const sbCom = (resultado: { error: { message: string } | null }) => ({
  from: () => ({ select: async () => resultado }),
});

beforeEach(() => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://abcdefghijk.supabase.co';
});

describe('Status do servidor', () => {
  it('sem servidor configurado mostra Não e modo teste offline', async () => {
    mockConfigurado = false;
    mockSb = null;
    await render(<StatusServidor />);
    expect(screen.getByText('Teste offline')).toBeTruthy();
    expect(screen.getByText('Sem endereço do servidor neste app')).toBeTruthy();
    expect(screen.getAllByText('Não').length).toBeGreaterThan(0);
  });

  it('configurado com ping ok mostra host curto, ms e nunca a chave', async () => {
    mockConfigurado = true;
    mockSb = sbCom({ error: null });
    await render(<StatusServidor />);
    expect(screen.getByText('abcdef…supabase.co')).toBeTruthy();
    expect(screen.queryByText(/abcdefghijk/)).toBeNull();
    await waitFor(() => expect(screen.getByText(/OK, respondeu em \d+ ms/)).toBeTruthy());
    expect(screen.getByText('Papel: admin')).toBeTruthy();
    expect(screen.getByText('9.9.9')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Este aparelho está registrado')).toBeTruthy());
  });

  it('configurado com erro mostra a mensagem curta e copia o diagnóstico', async () => {
    mockConfigurado = true;
    mockSb = sbCom({ error: { message: 'Failed to fetch' } });
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    await render(<StatusServidor />);
    await waitFor(() => expect(screen.getByText('Falhou: Failed to fetch')).toBeTruthy());
    mockSb = sbCom({ error: null });
    await act(async () => {
      await fireEvent.press(screen.getByText('Testar de novo'));
    });
    await waitFor(() => expect(screen.getByText(/OK, respondeu em/)).toBeTruthy());
    await fireEvent.press(screen.getByText('Copiar diagnóstico'));
    const msg = (share.mock.calls[0]![0] as { message: string }).message;
    expect(msg).toContain('abcdef…supabase.co');
    expect(msg).not.toMatch(/@|abcdefghijk/);
  });
});
