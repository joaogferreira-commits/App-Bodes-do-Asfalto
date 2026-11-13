import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export type MinhaPosicao = { posicao: [number, number] | null; rumo: number | null };

/**
 * Posição do próprio irmão no mapa. Com a tela em foco e a permissão de localização JÁ concedida,
 * acompanha o GPS (sem pedir permissão sozinho; o pedido continua no botão "Eu").
 * `atualizar` grava uma posição vinda de fora (última conhecida / leitura do botão "Eu").
 */
export function useMinhaPosicao(ativo: boolean) {
  const [estado, setEstado] = useState<MinhaPosicao>({ posicao: null, rumo: null });

  const atualizar = useCallback((lng: number, lat: number, rumo?: number | null) => {
    setEstado({ posicao: [lng, lat], rumo: rumo != null && rumo >= 0 ? rumo : null });
  }, []);

  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    let assinatura: { remove: () => void } | null = null;
    void (async () => {
      const perm = await Location.getForegroundPermissionsAsync().catch(() => ({ granted: false }));
      if (!vivo || !perm.granted) return;
      const a = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 3000 },
        (p) => {
          if (vivo) atualizar(p.coords.longitude, p.coords.latitude, p.coords.heading);
        },
      ).catch(() => null);
      if (!vivo) a?.remove();
      else assinatura = a;
    })();
    return () => {
      vivo = false;
      assinatura?.remove();
    };
  }, [ativo, atualizar]);

  return { ...estado, atualizar };
}
