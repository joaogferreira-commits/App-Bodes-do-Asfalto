import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';

import { somarTrecho, type Leitura } from './sos';

/**
 * Enquanto o modo pilotando está aberto, soma os km rodados pelo GPS e, ao sair, acrescenta ao
 * km da moto usado pela Manutenção (bodes.motoKm) e à moto principal da garagem.
 * Só funciona com o app aberto (localização em segundo plano fica desligada, como decidido).
 */
export function useOdometro(aoTerminar?: (km: number) => void) {
  const total = useRef(0);
  useEffect(() => {
    let ativo = true;
    let assinatura: Location.LocationSubscription | null = null;
    let anterior: Leitura | null = null;
    void (async () => {
      const { granted } = await Location.getForegroundPermissionsAsync().catch(() => ({ granted: false }));
      if (!granted || !ativo) return;
      assinatura = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 20 },
        (p) => {
          const atual = {
            lat: p.coords.latitude,
            lng: p.coords.longitude,
            precisao: p.coords.accuracy,
            tempo: p.timestamp,
          };
          const r = somarTrecho(anterior, atual);
          if (r.valida) {
            total.current += r.km;
            anterior = atual;
          }
        },
      ).catch(() => null);
    })();
    return () => {
      ativo = false;
      assinatura?.remove();
      const km = Math.round(total.current);
      if (km < 1) return;
      void AsyncStorage.getItem('bodes.motoKm')
        .then((v) => {
          const atual = v ? Number(JSON.parse(v)) || 0 : 0;
          return AsyncStorage.setItem('bodes.motoKm', JSON.stringify(String(atual + km)));
        })
        .catch(() => undefined);
      aoTerminar?.(km);
    };
    // inicia uma vez por sessão de pilotagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
