import '@/i18n';

import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { ProvedorAvatar } from '@/estado/avatar';
import { ProvedorViagem } from '@/estado/viagem';
import { paletaNoite, ProvedorTema, useTema } from '@/theme';

export default function Layout() {
  const [carregou] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  if (!carregou) return <View style={{ flex: 1, backgroundColor: paletaNoite.fundo }} />;
  return (
    <ProvedorTema>
      <ProvedorAvatar>
        <ProvedorViagem>
          <Telas />
        </ProvedorViagem>
      </ProvedorAvatar>
    </ProvedorTema>
  );
}

function Telas() {
  const { modo, cores } = useTema();
  return (
    <>
      <StatusBar style={modo === 'sol' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />
    </>
  );
}
