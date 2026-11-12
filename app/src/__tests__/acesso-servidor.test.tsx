import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ProvedorAcesso, useAcesso } from '@/acesso/acesso';
import * as servidor from '@/servidor/auth';

let avisar: () => void = () => undefined;
jest.mock('@/servidor/supabase', () => ({
  servidorConfigurado: true,
  supabase: {
    auth: {
      onAuthStateChange: (f: () => void) => {
        avisar = f;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      },
    },
  },
}));
jest.mock('@/servidor/auth', () => ({
  situacao: jest.fn(async () => ({ estado: 'pendente', email: 'irmao@exemplo.com' })),
  pedirLinkPorEmail: jest.fn(async () => undefined),
  entrarComGoogle: jest.fn(async () => true),
  registrarConsentimento: jest.fn(async () => undefined),
  revogarConsentimento: jest.fn(async () => undefined),
  sairDoServidor: jest.fn(async () => undefined),
  excluirContaNoServidor: jest.fn(async () => undefined),
}));

let acesso: ReturnType<typeof useAcesso>;
function Espiao() {
  acesso = useAcesso();
  return <Text testID="estado">{acesso.estado}</Text>;
}

describe('acesso com o servidor', () => {
  it('o estado vem do servidor e as ações chamam o Supabase', async () => {
    await render(
      <ProvedorAcesso>
        <Espiao />
      </ProvedorAcesso>,
    );
    await act(async () => avisar());
    expect(screen.getByTestId('estado').props.children).toBe('pendente');
    expect(acesso.modo).toBe('supabase');

    await act(async () => acesso.entrar('email', 'irmao@exemplo.com'));
    expect(servidor.pedirLinkPorEmail).toHaveBeenCalledWith('irmao@exemplo.com');

    await act(async () => acesso.consentir('termos'));
    expect(servidor.registrarConsentimento).toHaveBeenCalledWith('termos', expect.any(String));

    await act(async () => acesso.sair());
    expect(servidor.sairDoServidor).toHaveBeenCalled();
  });
});
