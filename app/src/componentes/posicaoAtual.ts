import * as Location from 'expo-location';

/** Lê a posição atual uma vez (para marcar Loja ou negócio no mapa). Nunca em segundo plano. */
export async function lerPosicaoAtual(): Promise<{ lat: number; lng: number } | 'semPermissao' | 'semGps'> {
  const { granted } = await Location.requestForegroundPermissionsAsync().catch(() => ({ granted: false }));
  if (!granted) return 'semPermissao';
  const p =
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null)) ??
    (await Location.getLastKnownPositionAsync().catch(() => null));
  return p ? { lat: p.coords.latitude, lng: p.coords.longitude } : 'semGps';
}
