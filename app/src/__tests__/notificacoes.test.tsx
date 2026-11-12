import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import Notificacoes from '@/app/notificacoes';
import { apagarToken, registrarToken, rotaSegura, salvarPreferencia } from '@/servidor/notificacoes';

const mockUpsert = jest.fn(async (..._a: unknown[]) => ({ error: null }));
const mockEq = jest.fn(async (..._a: unknown[]) => ({ error: null }));
const mockSelect = jest.fn(async () => ({ data: [{ tipo: 'aceno', ligado: false }], error: null }));
const mockSb = {
  auth: { getUser: jest.fn(async () => ({ data: { user: { id: 'eu' } } })) },
  from: jest.fn(() => ({ upsert: mockUpsert, delete: () => ({ eq: mockEq }), select: mockSelect })),
};
jest.mock('@/servidor/supabase', () => ({
  servidorConfigurado: true,
  get supabase() {
    return mockSb;
  },
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'proj-1' } } } },
}));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[abc123xyz]' })),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  AndroidImportance: { DEFAULT: 3 },
}));

describe('notificações push', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registrar o token faz upsert em tokens_push para o irmão logado', async () => {
    await expect(registrarToken({ pedirPermissao: true })).resolves.toBe(true);
    expect(mockSb.from).toHaveBeenCalledWith('tokens_push');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ usuario_id: 'eu', token: 'ExponentPushToken[abc123xyz]' }),
      { onConflict: 'usuario_id,token' },
    );
  });

  it('sair apaga o token deste aparelho', async () => {
    await apagarToken();
    expect(mockEq).toHaveBeenCalledWith('token', 'ExponentPushToken[abc123xyz]');
  });

  it('só abre rotas conhecidas ao tocar na notificação', () => {
    expect(rotaSegura('/conversa/3f2a9c1e-1111-2222-3333-444455556666')).toContain('/conversa/');
    expect(rotaSegura('/aprovacoes')).toBe('/aprovacoes');
    expect(rotaSegura('/conversas')).toBe('/conversas');
    expect(rotaSegura('https://mau.com')).toBeNull();
    expect(rotaSegura('/papeis')).toBeNull();
  });

  it('a tela grava a preferência e mostra o que já estava desligado', async () => {
    await render(<Notificacoes />);
    const aceno = await screen.findByLabelText('Acenos');
    await waitFor(() => expect(aceno.props.value).toBe(false));
    await fireEvent(screen.getByLabelText('Mensagens'), 'valueChange', false);
    await waitFor(() =>
      expect(mockUpsert).toHaveBeenCalledWith(
        { usuario_id: 'eu', tipo: 'mensagem', ligado: false },
        { onConflict: 'usuario_id,tipo' },
      ),
    );
  });

  it('o SOS fica ligado, desabilitado e nunca é gravado como desligado', async () => {
    await render(<Notificacoes />);
    const sos = await screen.findByLabelText('SOS');
    expect(sos.props.value).toBe(true);
    expect(sos.props.disabled).toBe(true);
    await salvarPreferencia('sos', false);
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
