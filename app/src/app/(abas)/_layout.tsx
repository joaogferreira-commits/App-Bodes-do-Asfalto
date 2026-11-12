import { router, Tabs, useSegments } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TelaEmMovimento } from '@/seguranca/TelaEmMovimento';
import { useBloqueioEmMovimento } from '@/seguranca/useBloqueioEmMovimento';
import { useCores } from '@/theme';
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

/**
 * Abas do app. Com a moto andando (≥ 8 km/h), tudo que não é o mapa fica coberto
 * pela tela "Moto em movimento" (R3); a barra continua para voltar ao mapa.
 */
export default function LayoutAbas() {
  const cores = useCores();
  const emMovimento = useBloqueioEmMovimento();
  const segmentos = useSegments() as string[];
  const { bottom } = useSafeAreaInsets();
  const aba = segmentos[segmentos.length - 1];
  const naoEhMapa = !!aba && aba !== '(abas)' && aba !== 'index';
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: cores.fundo } }}
        tabBar={({ state, navigateToTab }) => (
          <BarraAbas
            ativa={abaDaRota[state.routes[state.index]?.name ?? 'index'] ?? 'mapa'}
            onTrocar={(destino) => {
              const rota = state.routes.find((r) => r.name === rotaDaAba[destino]);
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
      {emMovimento && naoEhMapa && (
        // Cobre a tela da aba, mas deixa a barra inferior livre (altura da barra + margem segura).
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 62 + Math.max(bottom, 8) }}>
          <TelaEmMovimento aoIrAoMapa={() => router.navigate('/')} />
        </View>
      )}
    </View>
  );
}
