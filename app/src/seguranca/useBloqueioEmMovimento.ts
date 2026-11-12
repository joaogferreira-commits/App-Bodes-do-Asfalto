import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

import { estadoInicialMovimento, msParaKmh, proximoEstadoMovimento } from './movimento';

/**
 * Diz se a moto está em movimento (tela travada). Só observa o GPS se a permissão
 * de localização já foi dada — nunca pede permissão por conta própria.
 */
export function useBloqueioEmMovimento(): boolean {
  const [travado, setTravado] = useState(false);
  const estado = useRef(estadoInicialMovimento);

  useEffect(() => {
    let ativo = true;
    let assinatura: Location.LocationSubscription | null = null;
    let relogio: ReturnType<typeof setInterval> | null = null;
    let ultimaKmh: number | null = null;

    const aplicar = (kmh: number | null) => {
      estado.current = proximoEstadoMovimento(estado.current, kmh, Date.now());
      if (ativo) setTravado(estado.current.travado);
    };

    void (async () => {
      const { granted } = await Location.getForegroundPermissionsAsync().catch(() => ({ granted: false }));
      if (!granted || !ativo) return;
      assinatura = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 1000, distanceInterval: 0 },
        (p) => {
          ultimaKmh = msParaKmh(p.coords.speed);
          aplicar(ultimaKmh);
        },
      ).catch(() => null);
      // Reavalia a cada segundo para liberar mesmo se o GPS parar de mandar posição com a moto parada.
      relogio = setInterval(() => aplicar(ultimaKmh), 1000);
    })();

    return () => {
      ativo = false;
      assinatura?.remove();
      if (relogio) clearInterval(relogio);
    };
  }, []);

  return travado;
}
