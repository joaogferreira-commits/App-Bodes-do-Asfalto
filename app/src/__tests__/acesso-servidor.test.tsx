import { act, render, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
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

const guardar = jest.fn();
function Espiao() {
  const a = useAcesso();
  useEffect(() => guardar(a));
  return <Text testID="estado">{a.estado}</Text>;
}
const acesso = (): ReturnType<typeof useAcesso> => guardar.mock.lastCall![0];

describe('acesso com o servidor', () => {
  it('o estado vem do servidor e as ações chamam o Supabase', async () => {
    await render(
      <ProvedorAcesso>
        <Espiao />
      </ProvedorAcesso>,
    );
    await act(async () => avisar());
    expect(screen.getByTestId('estado').props.children).toBe('pendente');
    expect(acesso().modo).toBe('supabase');

    await act(async () => acesso().entrar('email', 'irmao@exemplo.com'));
    expect(servidor.pedirLinkPorEmail).toHaveBeenCalledWith('irmao@exemplo.com');

    await act(async () => acesso().consentir('termos'));
    expect(servidor.registrarConsentimento).toHaveBeenCalledWith('termos', expect.any(String));

    await act(async () => acesso().sair());
    expect(servidor.sairDoServidor).toHaveBeenCalled();
  });

  it('com o servidor ligado não existe aprovação simulada nem entrada de demonstração', async () => {
    await render(
      <ProvedorAcesso>
        <Espiao />
      </ProvedorAcesso>,
    );
    await act(async () => avisar());
    await act(async () => acesso().simularAprovacao());
    await act(async () => acesso().entrarDemonstracao());
    expect(screen.getByTestId('estado').props.children).toBe('pendente');
  });
});
