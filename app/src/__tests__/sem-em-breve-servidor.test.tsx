import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';

import Conquistas from '@/app/(abas)/conquistas';
import Conversas from '@/app/(abas)/conversas';
import Ferramentas from '@/app/(abas)/ferramentas';
import Feed from '@/app/(abas)/feed';
import Mapa from '@/app/(abas)/index';
import Passeios from '@/app/(abas)/passeios';
import Perfil from '@/app/(abas)/perfil';
import { ehProducao } from '@/ambiente';
import { ProvedorAgapes } from '@/estado/agapes';
import { ProvedorAvatar } from '@/estado/avatar';
import { ProvedorConversas } from '@/estado/conversas';
import { ProvedorPerfil } from '@/estado/perfil';
import { ProvedorMeusPosts } from '@/estado/meusPosts';
import { ProvedorViagem } from '@/estado/viagem';
import { clienteConsultas } from '@/servidor/consulta';
import { ferramentasVisiveis, gruposFerramentas, soExemplo } from '@/ferramentas/catalogo';
import { lugaresReais } from '@/dados/exemplos';

/**
 * Regra do dono para a versão das lojas: nada de "em breve", exemplo ou teste. Com o servidor ligado,
 * o que não está pronto fica escondido. Aqui o servidor é simulado como nos outros testes *-servidor.
 */
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), navigate: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock('expo-image', () => {
  const { View } = jest.requireActual('react-native');
  return { Image: (p: object) => <View {...p} /> };
});
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: false })),
  getForegroundPermissionsAsync: jest.fn(async () => ({ granted: false })),
  getLastKnownPositionAsync: jest.fn(async () => null),
  getCurrentPositionAsync: jest.fn(async () => null),
  watchPositionAsync: jest.fn(async () => ({ remove: jest.fn() })),
  Accuracy: { Balanced: 3 },
}));
jest.mock('@/servidor/supabase', () => ({ servidorConfigurado: true, supabase: {} }));
jest.mock('@/acesso/acesso', () => {
  const acesso = {
    modo: 'supabase',
    estado: 'membro',
    papel: 'membro',
    aprova: false,
    temConsentimento: () => false,
    sair: jest.fn(async () => undefined),
  };
  return { useAcessoOpcional: () => acesso, useAcesso: () => acesso };
});
jest.mock('@/servidor/pontos', () => ({ carregarPontosDaArea: jest.fn(async () => []) }));
jest.mock('@/servidor/chat', () => ({ acenar: jest.fn() }));
jest.mock('@/servidor/aoVivo', () => ({
  ...jest.requireActual('@/servidor/aoVivo'),
  irmaosNaArea: jest.fn(async () => []),
  publicarPosicao: jest.fn(async () => true),
  removerPosicao: jest.fn(async () => true),
  sincronizarVisibilidade: jest.fn(async () => true),
}));
jest.mock('@/servidor/passeios', () => ({
  ...jest.requireActual('@/servidor/passeios'),
  listarPasseios: jest.fn(async () => []),
}));
jest.mock('@/servidor/feed', () => ({
  TAMANHO_PAGINA: 20,
  listarPosts: jest.fn(async () => []),
  listarStories: jest.fn(async () => []),
}));
jest.mock('@/map/estilos', () => ({ useEstiloMapa: () => ({ version: 8, sources: {}, layers: [] }) }));
jest.mock('@/componentes/BotaoSOS', () => ({ BotaoSOS: () => null }));
jest.mock('@/componentes/CamadaLugares', () => ({ CamadaLugares: () => null }));
jest.mock('@maplibre/maplibre-react-native', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    Map: ({ children }: { children: unknown }) => <View>{children as never}</View>,
    Camera: React.forwardRef(function Camera() {
      return null;
    }),
    Marker: ({ children }: { children: unknown }) => <View>{children as never}</View>,
    Layer: () => null,
    GeoJSONSource: ({ children }: { children: unknown }) => <View>{children as never}</View>,
  };
});

const proibidos = [
  /em breve/i,
  /exemplo/i,
  /vers[ãa]o de teste/i,
  /simular/i,
  /\(teste\)/i,
  /chegam? (em breve|com)/i,
];

function Provedores({ children }: { children: ReactNode }) {
  return (
    <ProvedorAvatar>
      <ProvedorPerfil>
        <ProvedorAgapes>
          <ProvedorMeusPosts>
            <ProvedorViagem>
              <ProvedorConversas>{children}</ProvedorConversas>
            </ProvedorViagem>
          </ProvedorMeusPosts>
        </ProvedorAgapes>
      </ProvedorPerfil>
    </ProvedorAvatar>
  );
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_AMBIENTE = 'production';
});
afterEach(() => {
  delete process.env.EXPO_PUBLIC_AMBIENTE;
  clienteConsultas.clear();
});

describe('versão com servidor: nada de "em breve", exemplo ou teste nas abas', () => {
  it.each([
    ['Mapa', Mapa],
    ['Feed', Feed],
    ['Passeios', Passeios],
    ['Conquistas', Conquistas],
    ['Conversas', Conversas],
    ['Ferramentas', Ferramentas],
    ['Perfil', Perfil],
  ])('aba %s', async (_nome, Tela) => {
    await render(
      <Provedores>
        <Tela />
      </Provedores>,
    );
    for (const p of proibidos) expect(screen.queryByText(p)).toBeNull();
  });

  it('o catálogo de ferramentas esconde o que só tem exemplo', () => {
    const chaves = ferramentasVisiveis(true).flatMap((g) => g.itens.map((i) => i.chave));
    for (const c of soExemplo) expect(chaves).not.toContain(c);
    expect(chaves).toContain('telefones');
    expect(gruposFerramentas.flatMap((g) => g.itens).length).toBe(20);
  });

  it('o mapa do servidor não tem sede, posto ou Loja inventados', () => {
    const ids = lugaresReais.map((l) => l.id);
    for (const id of ['sede-cuiaba', 'posto-trevo', 'loja-exemplo', 'agape-trevo'])
      expect(ids).not.toContain(id);
  });

  it('o rodapé da versão continua, e só diz "teste" fora de produção', async () => {
    await render(
      <Provedores>
        <Perfil />
      </Provedores>,
    );
    expect(screen.getByText(/^Versão/)).toBeTruthy();
    expect(screen.queryByText(/teste/i)).toBeNull();
    delete process.env.EXPO_PUBLIC_AMBIENTE;
    expect(ehProducao()).toBe(false);
    process.env.EXPO_PUBLIC_AMBIENTE = 'production';
    expect(ehProducao()).toBe(true);
  });
});
