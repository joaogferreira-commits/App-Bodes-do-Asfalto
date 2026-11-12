import { act, fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Share, Text } from 'react-native';

import { ProvedorAcesso, useAcesso } from '@/acesso/acesso';
import Consentimentos from '@/app/acesso/consentimentos';
import Entrada from '@/app/acesso/entrada';
import MeusDados from '@/app/acesso/meus-dados';
import Solicitacao from '@/app/acesso/solicitacao';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() } }));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});

function Estado() {
  const a = useAcesso();
  return (
    <Text testID="estado">{`${a.estado}|${a.temConsentimento('termos')}|${a.temConsentimento('dados_macons')}`}</Text>
  );
}
const estado = () => screen.getByTestId('estado').props.children as string;

describe('acesso (Etapa 1)', () => {
  it('modo demonstração (só na versão de teste) entra como membro e ainda passa pelos consentimentos', async () => {
    await render(
      <ProvedorAcesso comecar={{ estado: 'deslogado' }}>
        <Entrada />
        <Estado />
      </ProvedorAcesso>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Ver o app em modo demonstração' }));
    expect(estado()).toBe('membro|false|false');
    expect(jest.requireMock('expo-router').router.replace).toHaveBeenCalledWith('/acesso/consentimentos');
  });

  it('o link mágico só é pedido com e-mail válido', async () => {
    await render(
      <ProvedorAcesso comecar={{ estado: 'deslogado' }}>
        <Entrada />
      </ProvedorAcesso>,
    );
    expect(screen.getByRole('button', { name: 'Receber link de acesso' })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText('Seu e-mail'), 'irmao@exemplo.com');
    expect(screen.getByRole('button', { name: 'Receber link de acesso' })).toBeEnabled();
  });

  it('termos são obrigatórios; dados maçônicos são opcionais e revogáveis', async () => {
    await render(
      <ProvedorAcesso comecar={{ estado: 'semSolicitacao' }}>
        <Consentimentos />
        <Estado />
      </ProvedorAcesso>,
    );
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('switch', { name: 'Termos de uso e privacidade' }));
    await fireEvent.press(screen.getByRole('switch', { name: 'Dados maçônicos (opcional)' }));
    expect(estado()).toBe('semSolicitacao|true|true');
    // revogar dados maçônicos pede confirmação antes de apagar
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await fireEvent.press(screen.getByRole('switch', { name: 'Dados maçônicos (opcional)' }));
    expect(estado()).toBe('semSolicitacao|true|true');
    const botoes = alerta.mock.calls[0]![2]!;
    await act(async () => botoes.find((b) => b.style === 'destructive')!.onPress!());
    expect(estado()).toBe('semSolicitacao|true|false');
    alerta.mockRestore();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  it('pedido de entrada exige fotos e quem indica; depois fica pendente', async () => {
    await render(
      <ProvedorAcesso comecar={{ estado: 'semSolicitacao' }}>
        <Solicitacao />
        <Estado />
      </ProvedorAcesso>,
    );
    await fireEvent.changeText(screen.getByLabelText('Nome completo'), 'João da Estrada');
    await fireEvent.press(screen.getByRole('button', { name: 'Cuiabá' }));
    await fireEvent.changeText(screen.getByLabelText('Cidade'), 'Cuiabá');
    await fireEvent.changeText(screen.getByLabelText('Telefone com DDD'), '65 99999-0000');
    await fireEvent.changeText(screen.getByLabelText('Irmão do clube que te indica'), 'Zé Ferreira');
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar pedido' }));
    expect(estado()).toBe('semSolicitacao|false|false'); // faltam as fotos
    const galerias = screen.getAllByRole('button', { name: 'Da galeria' });
    await fireEvent.press(galerias[0]!);
    await fireEvent.press(galerias[1]!);
    await screen.findAllByLabelText('Foto sua com o colete do clube');
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar pedido' }));
    expect(estado().startsWith('pendente')).toBe(true);
  });

  it('sair apaga os dados pessoais do aparelho (fica só o tema) e muda a sessão', async () => {
    await AsyncStorage.setItem('bodes.perfil', '{"x":1}');
    await AsyncStorage.setItem('bodes.tema', 'sol');
    const ref: { sessao: number; sair: () => Promise<void> } = { sessao: -1, sair: async () => undefined };
    function Pega() {
      const a = useAcesso();
      Object.assign(ref, { sessao: a.sessao, sair: a.sair });
      return null;
    }
    await render(
      <ProvedorAcesso comecar={{ estado: 'membro' }}>
        <Pega />
      </ProvedorAcesso>,
    );
    const antes = ref.sessao;
    await act(async () => ref.sair());
    expect(ref.sessao).toBe(antes + 1);
    expect(await AsyncStorage.getItem('bodes.perfil')).toBeNull();
    expect(await AsyncStorage.getItem('bodes.tema')).toBe('sol');
  });

  it('baixar meus dados funciona mesmo com valores gravados como texto (tema)', async () => {
    await AsyncStorage.setItem('bodes.tema', 'sol');
    const compartilhar = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    await render(
      <ProvedorAcesso comecar={{ estado: 'membro' }}>
        <MeusDados />
      </ProvedorAcesso>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Baixar uma cópia dos meus dados' }));
    await act(async () => undefined);
    expect(compartilhar).toHaveBeenCalled();
    expect(compartilhar.mock.calls[0]![0].message).toContain('"bodes.tema": "sol"');
    compartilhar.mockRestore();
  });
});
