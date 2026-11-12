import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import Vitrine from '@/app/negocios/[id]';
import Guia from '@/app/negocios';
import SouMembro from '@/app/sou-membro';
import { eventosPendentes, mostrarContagem, registrarEvento } from '@/comercial/contadores';
import { negociosExemplo, ordenarGuia, planoVigente } from '@/dados/negocios';
import { ProvedorViagem } from '@/estado/viagem';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'oficina-bode' }),
}));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});

const hoje = new Date('2026-11-12T12:00:00');

describe('regras do Guia', () => {
  it('plano vencido volta a ser grátis e perde o destaque', () => {
    const pousada = negociosExemplo.find((n) => n.id === 'pousada')!;
    expect(planoVigente(pousada, hoje)).toBe('gratis');
    const ordem = ordenarGuia(negociosExemplo, hoje).map((n) => n.id);
    expect(ordem.slice(0, 2)).toEqual(['oficina-bode', 'churrascaria']);
    expect(ordem.indexOf('pousada')).toBeGreaterThan(1);
  });

  it('contadores não guardam quem foi e não repetem "visto" no mesmo dia', () => {
    const e = registrarEvento('teste', 'visto', hoje)!;
    expect(Object.keys(e).sort()).toEqual(['dia', 'negocio', 'tipo']);
    expect(registrarEvento('teste', 'visto', hoje)).toBeNull();
    expect(registrarEvento('teste', 'whatsapp', hoje)).not.toBeNull();
    expect(registrarEvento('teste', 'whatsapp', hoje)).not.toBeNull();
    expect(mostrarContagem(3)).toBe('<5');
    expect(mostrarContagem(12)).toBe('12');
  });
});

describe('telas do Guia', () => {
  it('lista mostra parceiro primeiro com selo e filtra por categoria', async () => {
    await render(
      <ProvedorViagem>
        <Guia />
      </ProvedorViagem>,
    );
    const primeiro = screen
      .getAllByRole('button')
      .find((b) => String(b.props.accessibilityLabel).includes('. '))!;
    expect(primeiro.props.accessibilityLabel).toContain('Oficina do Bode, Parceiro');
    await fireEvent.press(screen.getByRole('button', { name: 'Pouso' }));
    expect(screen.getByText('Pousada Chapadão')).toBeTruthy();
    expect(screen.queryByText('Oficina do Bode')).toBeNull();
  });

  it('vitrine: WhatsApp conta evento anônimo e Recomendo alterna', async () => {
    const abrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await render(
      <ProvedorViagem>
        <Vitrine />
      </ProvedorViagem>,
    );
    expect(screen.getByText('Benefício para irmãos')).toBeTruthy();
    const antes = eventosPendentes().length;
    await fireEvent.press(screen.getByRole('button', { name: 'WhatsApp' }));
    expect(abrir).toHaveBeenCalledWith(expect.stringContaining('wa.me'));
    expect(eventosPendentes().length).toBe(antes + 1);
    await fireEvent.press(screen.getByRole('button', { name: 'Recomendo' }));
    expect(screen.getByRole('button', { name: 'Recomendei' })).toBeTruthy();
    abrir.mockRestore();
  });

  it('carteirinha mostra membro ativo, relógio e nada maçônico', async () => {
    await render(<SouMembro />);
    expect(screen.getByText('Membro ativo')).toBeTruthy();
    expect(screen.queryByText(/Loja|Oriente|Potência/)).toBeNull();
  });
});
