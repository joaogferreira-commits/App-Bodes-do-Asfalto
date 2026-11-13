import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { modoEfetivo, type EstadoVisibilidade } from '@/estado/visibilidadeMapa';
import {
  devePublicar,
  DISTANCIA_PUBLICAR_M,
  INTERVALO_PUBLICAR_MS,
  podePublicar,
  publicarPosicao,
  removerPosicao,
  sincronizarVisibilidade,
  type Fix,
} from '@/servidor/aoVivo';

/**
 * Publica a minha posição enquanto o app está ABERTO (nada em segundo plano nesta versão).
 * Não pede permissão (quem pede é o botão "Eu"); sem permissão ou invisível, não envia e apaga o que houver.
 */
export function usePublicarPosicao(ativo: boolean, estado: EstadoVisibilidade) {
  // força nova avaliação quando o modo temporário vence
  const [, setRelogio] = useState(0);
  const ate = estado.temporario?.ate ?? null;
  useEffect(() => {
    if (ate == null) return;
    const espera = Math.max(0, ate - Date.now()) + 50;
    const id = setTimeout(() => setRelogio((n) => n + 1), espera);
    return () => clearTimeout(id);
  }, [ate]);

  const modo = modoEfetivo(estado);
  const ultimo = useRef<Fix | null>(null);
  const estadoAtual = useRef(estado);
  useEffect(() => {
    estadoAtual.current = estado;
  }, [estado]);
  const chave = `${modo}|${estado.status}|${ate ?? ''}`;

  useEffect(() => {
    if (!ativo) return;
    ultimo.current = null;
    let vivo = true;
    let assinatura: Location.LocationSubscription | null = null;
    let aberto = AppState.currentState !== 'background';

    const enviar = async (lat: number, lon: number) => {
      const fix = { lat, lon, em: Date.now() };
      if (!devePublicar(ultimo.current, fix)) return;
      ultimo.current = fix;
      if (!(await publicarPosicao(fix, estadoAtual.current))) ultimo.current = null;
    };

    void (async () => {
      if (modo === 'invisivel') {
        await sincronizarVisibilidade(estadoAtual.current);
        return;
      }
      const perm = await Location.getForegroundPermissionsAsync().catch(() => ({ granted: false }));
      if (!vivo) return;
      if (!podePublicar(modo, perm.granted)) {
        if (!perm.granted) await removerPosicao();
        return;
      }
      void sincronizarVisibilidade(estadoAtual.current);
      const rapida = await Location.getLastKnownPositionAsync().catch(() => null);
      if (vivo && rapida) await enviar(rapida.coords.latitude, rapida.coords.longitude);
      if (!vivo) return;
      const a = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: INTERVALO_PUBLICAR_MS,
          distanceInterval: DISTANCIA_PUBLICAR_M,
        },
        (p) => {
          if (aberto) void enviar(p.coords.latitude, p.coords.longitude);
        },
      ).catch(() => null);
      if (!vivo) a?.remove();
      else assinatura = a;
    })();

    const estadoApp = AppState.addEventListener('change', (e) => {
      aberto = e === 'active';
    });
    return () => {
      vivo = false;
      assinatura?.remove();
      estadoApp.remove();
    };
    // chave resume modo/status/prazo: a escolha mudou, reavalia e republica
  }, [ativo, chave, modo]);
}
