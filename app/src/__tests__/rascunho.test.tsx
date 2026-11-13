import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { AppState } from 'react-native';

import { ProvedorAcesso, useAcesso } from '@/acesso/acesso';
import Solicitacao from '@/app/acesso/solicitacao';
import { useRascunho } from '@/estado/rascunho';
import { chaveRascunho, limparTodosRascunhos } from '@/estado/rascunhoArmazem';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() } }));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});

const passar = (ms: number) => act(async () => void (await jest.advanceTimersByTimeAsync(ms)));

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

describe('useRascunho', () => {
  it('restaura o que foi digitado depois de desmontar e montar de novo', async () => {
    const a = await renderHook(() => useRascunho('t', ''));
    await passar(10);
    await act(async () => a.result.current[1]('olá'));
    await passar(500);
    await a.unmount();
    const b = await renderHook(() => useRascunho('t', ''));
    await passar(10);
    expect(b.result.current[0]).toBe('olá');
  });

  it('grava ao desmontar, sem esperar o atraso', async () => {
    const a = await renderHook(() => useRascunho('t', ''));
    await passar(10);
    await act(async () => a.result.current[1]('rápido'));
    await a.unmount();
    expect(await AsyncStorage.getItem(chaveRascunho('t'))).toContain('rápido');
  });

  it('grava ao ir para segundo plano', async () => {
    let ouvinte: ((e: string) => void) | undefined;
    const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _: string,
      cb: (e: string) => void,
    ) => {
      ouvinte = cb;
      return { remove: jest.fn() };
    }) as never);
    const d = await renderHook(() => useRascunho('v', ''));
    await passar(10);
    await act(async () => d.result.current[1]('fundo'));
    await act(async () => ouvinte?.('background'));
    expect(await AsyncStorage.getItem(chaveRascunho('v'))).toContain('fundo');
    spy.mockRestore();
  });

  it('descarta rascunho com mais de 24 h', async () => {
    const a = await renderHook(() => useRascunho('t', 'x'));
    await passar(10);
    await act(async () => a.result.current[1]('velho'));
    await passar(500);
    await a.unmount();
    const agora = Date.now();
    const spy = jest.spyOn(Date, 'now').mockReturnValue(agora + 24 * 3600 * 1000 + 1000);
    const b = await renderHook(() => useRascunho('t', 'x'));
    await passar(10);
    expect(b.result.current[0]).toBe('x');
    spy.mockRestore();
  });

  it('limpar apaga o rascunho (depois de enviar)', async () => {
    const a = await renderHook(() => useRascunho('t', ''));
    await passar(10);
    await act(async () => a.result.current[1]('abc'));
    await passar(500);
    await act(async () => a.result.current[2]());
    await a.unmount();
    expect(await AsyncStorage.getItem(chaveRascunho('t'))).toBeNull();
  });

  it('separa por conta e limpa tudo ao sair', async () => {
    const com = (email: string) =>
      function W({ children }: { children: ReactNode }) {
        return <ProvedorAcesso comecar={{ estado: 'membro', email }}>{children}</ProvedorAcesso>;
      };
    const a = await renderHook(() => useRascunho('t', ''), { wrapper: com('a@x.com') });
    await passar(10);
    await act(async () => a.result.current[1]('da conta A'));
    await passar(500);
    await a.unmount();
    const b = await renderHook(() => useRascunho('t', ''), { wrapper: com('b@x.com') });
    await passar(10);
    expect(b.result.current[0]).toBe('');
    await b.unmount();
    const a2 = await renderHook(() => useRascunho('t', ''), { wrapper: com('a@x.com') });
    await passar(10);
    expect(a2.result.current[0]).toBe('da conta A');
    await a2.unmount();

    await limparTodosRascunhos();
    expect(await AsyncStorage.getItem(chaveRascunho('t', 'a@x.com'))).toBeNull();
  });

  it('sair() da conta apaga os rascunhos', async () => {
    await AsyncStorage.setItem(chaveRascunho('t', 'a@x.com'), JSON.stringify({ v: 'z', t: Date.now() }));
    let sair: () => Promise<void> = async () => undefined;
    function Pega() {
      sair = useAcesso().sair;
      return null;
    }
    await render(
      <ProvedorAcesso comecar={{ estado: 'membro', email: 'a@x.com' }}>
        <Pega />
      </ProvedorAcesso>,
    );
    await act(async () => sair());
    expect(await AsyncStorage.getItem(chaveRascunho('t', 'a@x.com'))).toBeNull();
  });
});

describe('tela de solicitação', () => {
  it('mantém os campos digitados ao sair e voltar', async () => {
    const monta = () =>
      render(
        <ProvedorAcesso comecar={{ estado: 'semSolicitacao' }}>
          <Solicitacao />
        </ProvedorAcesso>,
      );
    const a = await monta();
    await passar(10);
    await fireEvent.changeText(screen.getByLabelText('Nome completo'), 'João da Estrada');
    await fireEvent.press(screen.getByRole('button', { name: 'Cuiabá' }));
    await a.unmount();
    await monta();
    await passar(10);
    expect(screen.getByLabelText('Nome completo').props.value).toBe('João da Estrada');
  });
});
