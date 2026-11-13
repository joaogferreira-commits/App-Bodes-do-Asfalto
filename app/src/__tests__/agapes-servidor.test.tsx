import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ProvedorAgapes, useAgapes } from '@/estado/agapes';
import * as servico from '@/servidor/agapes';
import { clienteConsultas } from '@/servidor/consulta';

jest.mock('@/servidor/supabase', () => ({ servidorConfigurado: true, supabase: {} }));
jest.mock('@/acesso/acesso', () => ({
  useAcessoOpcional: () => ({ modo: 'supabase', estado: 'membro', papel: 'membro' }),
}));
jest.mock('@/servidor/agapes', () => ({ listarAgapes: jest.fn(), criarAgape: jest.fn() }));

const envolver = ({ children }: { children: ReactNode }) => <ProvedorAgapes>{children}</ProvedorAgapes>;
const doBanco = {
  id: 'e0000000-0000-0000-0000-0000000000a1',
  local: 'Posto Trevo',
  texto: '',
  lat: -15.5,
  lng: -56,
  horario: '19h',
  comecaEm: '1h',
  organizador: 'Zé',
  vao: ['Zé'],
};
const nova = { local: 'Posto', texto: '', horario: '1 h', organizador: 'Eu', lat: 0, lng: 0 };

beforeEach(() => clienteConsultas.clear());
afterEach(() => clienteConsultas.clear());

it('com servidor, usa só os Ágapes do banco (sem o exemplo)', async () => {
  (servico.listarAgapes as jest.Mock).mockResolvedValue([doBanco]);
  const { result } = await renderHook(() => useAgapes(), { wrapper: envolver });
  await waitFor(() => expect(result.current.agapes).toEqual([doBanco]));
});

it('migration não aplicada (lista vazia): sem Ágapes, sem erro', async () => {
  (servico.listarAgapes as jest.Mock).mockResolvedValue([]);
  const { result } = await renderHook(() => useAgapes(), { wrapper: envolver });
  await waitFor(() => expect(servico.listarAgapes).toHaveBeenCalled());
  expect(result.current.agapes).toEqual([]);
});

it('criar grava no servidor e devolve false quando o banco recusa', async () => {
  (servico.listarAgapes as jest.Mock).mockResolvedValue([]);
  (servico.criarAgape as jest.Mock).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  const { result } = await renderHook(() => useAgapes(), { wrapper: envolver });
  let a = true;
  let b = true;
  await act(async () => {
    a = (await result.current.criar(nova)) as boolean;
    b = (await result.current.criar(nova)) as boolean;
  });
  expect([a, b]).toEqual([true, false]);
  expect(servico.criarAgape).toHaveBeenCalledWith(nova);
});
