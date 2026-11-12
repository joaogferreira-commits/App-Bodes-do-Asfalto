import { Tabs } from 'expo-router';

import { cores } from '@/theme';
import { BarraAbas, type Aba } from '@/ui';

/** Nome da rota de cada aba (a aba Mapa é a tela inicial: "index"). */
const rotaDaAba: Record<Aba, string> = {
  mapa: 'index',
  feed: 'feed',
  passeios: 'passeios',
  conquistas: 'conquistas',
  perfil: 'perfil',
};
const abaDaRota = Object.fromEntries(Object.entries(rotaDaAba).map(([a, r]) => [r, a])) as Record<
  string,
  Aba
>;

export default function LayoutAbas() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: cores.fundo } }}
      tabBar={({ state, navigateToTab }) => (
        <BarraAbas
          ativa={abaDaRota[state.routes[state.index]?.name ?? 'index'] ?? 'mapa'}
          onTrocar={(aba) => {
            const rota = state.routes.find((r) => r.name === rotaDaAba[aba]);
            if (rota) navigateToTab(rota.key);
          }}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="passeios" />
      <Tabs.Screen name="conquistas" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
