import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert, Text } from 'react-native';

import { ProvedorAcesso } from '@/acesso/acesso';
import Consentimentos from '@/app/acesso/consentimentos';
import Contatos from '@/app/contatos';
import Garagem from '@/app/garagem';
import EditarPerfil from '@/app/perfil-editar';
import { normalizarPrincipal, ProvedorPerfil, usePerfil } from '@/estado/perfil';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() } }));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});

function Espiao() {
  const p = usePerfil();
  return (
    <Text testID="perfil">{JSON.stringify({ motos: p.motos, contatos: p.contatos, perfil: p.perfil })}</Text>
  );
}
const dados = () => JSON.parse(screen.getByTestId('perfil').props.children as string);

describe('garagem, contatos e perfil (Etapa 1)', () => {
  it('só uma moto é a principal', () => {
    const m = (id: string, principal: boolean) => ({
      id,
      marca: 'X',
      modelo: 'Y',
      ano: '',
      apelido: '',
      km: '',
      principal,
    });
    expect(normalizarPrincipal([m('a', false), m('b', true), m('c', true)]).map((x) => x.principal)).toEqual([
      false,
      true,
      false,
    ]);
    expect(normalizarPrincipal([m('a', false)])[0]!.principal).toBe(true);
  });

  it('cadastra a primeira moto como principal', async () => {
    await render(
      <ProvedorPerfil inicial={{}}>
        <Garagem />
        <Espiao />
      </ProvedorPerfil>,
    );
    await fireEvent.changeText(screen.getByLabelText('Marca'), 'Harley-Davidson');
    await fireEvent.changeText(screen.getByLabelText('Modelo'), 'Fat Boy');
    await fireEvent.changeText(screen.getByLabelText('Quilometragem'), '12000');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(dados().motos[0]).toMatchObject({
      marca: 'Harley-Davidson',
      modelo: 'Fat Boy',
      km: '12000',
      principal: true,
    });
  });

  it('no máximo 3 contatos de emergência', async () => {
    const c = (n: number) => ({ id: `c${n}`, nome: `C${n}`, telefone: '65999990000' });
    await render(
      <ProvedorPerfil inicial={{ contatos: [c(1), c(2), c(3)] }}>
        <Contatos />
      </ProvedorPerfil>,
    );
    expect(screen.getByText('Você já tem 3 contatos, o máximo.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Adicionar contato' })).toBeNull();
  });

  it('Loja/Oriente/Potência só com consentimento; revogar apaga', async () => {
    await render(
      <ProvedorAcesso comecar={{ estado: 'membro' }}>
        <ProvedorPerfil inicial={{}}>
          <EditarPerfil />
          <Consentimentos />
          <Espiao />
        </ProvedorPerfil>
      </ProvedorAcesso>,
    );
    expect(screen.queryByLabelText('Loja')).toBeNull();
    await fireEvent.press(screen.getByRole('switch', { name: 'Dados maçônicos (opcional)' }));
    await fireEvent.changeText(screen.getByLabelText('Loja'), 'Loja Exemplo');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Membros' })[0]!);
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(dados().perfil.macom.loja).toEqual({ valor: 'Loja Exemplo', visibilidade: 'membros' });
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await fireEvent.press(screen.getByRole('switch', { name: 'Dados maçônicos (opcional)' }));
    expect(dados().perfil.macom.loja.valor).toBe('Loja Exemplo'); // ainda não confirmou
    await act(async () => alerta.mock.calls[0]![2]!.find((b) => b.style === 'destructive')!.onPress!());
    expect(dados().perfil.macom.loja.valor).toBe('');
    alerta.mockRestore();
  });
});
