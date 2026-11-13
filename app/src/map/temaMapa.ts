/**
 * Dia e noite automático do mapa (proposta de 12/11/2026, item 8).
 * Nascer e pôr do sol calculados no aparelho, só com latitude e longitude (sem rede e sem enviar a posição).
 * Funções puras; o hook `useModoMapaAutomatico` só junta o relógio com elas.
 */
import { useEffect, useState } from 'react';

export type ModoMapa = 'sol' | 'noite';

const RAD = Math.PI / 180;
const DIA_MS = 86_400_000;
/** Zênite oficial do nascer/pôr do sol (inclui refração). */
const ZENITE = 90.833;

/** Margem (minutos) após o pôr/antes do nascer para trocar: evita piscar no limiar. */
export const HISTERESE_MIN = 20;

export type SolDoDia = { nascer: Date; por: Date } | null;

/** Algoritmo NOAA simplificado. Retorna null em dia polar (sem nascer ou pôr). */
export function nascerEPorDoSol(data: Date, lat: number, lon: number): SolDoDia {
  const inicioUtc = Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate());
  const diaDoAno = Math.floor((inicioUtc - Date.UTC(data.getUTCFullYear(), 0, 0)) / DIA_MS);

  const evento = (nascer: boolean): Date | null => {
    const lonHora = lon / 15;
    const t = diaDoAno + ((nascer ? 6 : 18) - lonHora) / 24;
    const m = 0.9856 * t - 3.289;
    let l = m + 1.916 * Math.sin(m * RAD) + 0.02 * Math.sin(2 * m * RAD) + 282.634;
    l = ((l % 360) + 360) % 360;
    let ra = Math.atan(0.91764 * Math.tan(l * RAD)) / RAD;
    ra = ((ra % 360) + 360) % 360;
    ra += Math.floor(l / 90) * 90 - Math.floor(ra / 90) * 90;
    ra /= 15;
    const senDec = 0.39782 * Math.sin(l * RAD);
    const cosDec = Math.cos(Math.asin(senDec));
    const cosH = (Math.cos(ZENITE * RAD) - senDec * Math.sin(lat * RAD)) / (cosDec * Math.cos(lat * RAD));
    if (cosH > 1 || cosH < -1) return null;
    const h = (nascer ? 360 - Math.acos(cosH) / RAD : Math.acos(cosH) / RAD) / 15;
    const tLocal = h + ra - 0.06571 * t - 6.622;
    const utc = (((tLocal - lonHora) % 24) + 24) % 24;
    return new Date(inicioUtc + utc * 3_600_000);
  };

  const n = evento(true);
  const p = evento(false);
  if (!n || !p) return null;
  // Garante nascer antes do pôr no mesmo ciclo de 24 h (o dia UTC pode cortar o pôr no fuso do Brasil).
  while (p.getTime() < n.getTime()) p.setTime(p.getTime() + DIA_MS);
  while (p.getTime() - n.getTime() > DIA_MS) p.setTime(p.getTime() - DIA_MS);
  return { nascer: n, por: p };
}

/** True se o sol está acima do horizonte em `agora` (considera o dia anterior e o seguinte). */
export function ehDeDia(agora: Date, lat: number, lon: number, margemMin = 0): boolean {
  const margem = margemMin * 60_000;
  const t = agora.getTime();
  for (const delta of [-1, 0, 1]) {
    const sol = nascerEPorDoSol(new Date(t + delta * DIA_MS), lat, lon);
    if (!sol) continue;
    if (t >= sol.nascer.getTime() + margem && t <= sol.por.getTime() - margem) return true;
  }
  return false;
}

/**
 * Modo do mapa com histerese: só troca quando o sol passou do horizonte por `HISTERESE_MIN` minutos.
 * Sem posição conhecida (`lat`/`lon` nulos), mantém o modo anterior ou usa o horário do aparelho (6h–18h).
 */
export function modoDoMapa(
  agora: Date,
  pos: { lat: number; lon: number } | null,
  anterior: ModoMapa | null,
): ModoMapa {
  if (!pos) {
    if (anterior) return anterior;
    const h = agora.getHours();
    return h >= 6 && h < 18 ? 'sol' : 'noite';
  }
  const dentro = ehDeDia(agora, pos.lat, pos.lon, HISTERESE_MIN);
  const fora = !ehDeDia(agora, pos.lat, pos.lon, -HISTERESE_MIN);
  if (dentro) return 'sol';
  if (fora) return 'noite';
  // Faixa de histerese: mantém o que estava (ou escolhe pelo sol puro na primeira vez).
  return anterior ?? (ehDeDia(agora, pos.lat, pos.lon) ? 'sol' : 'noite');
}

/**
 * Hook: reavalia a cada minuto. `pos` = última posição conhecida do irmão (pode ser aproximada: o erro é de minutos).
 * Retorna null enquanto `ativo` for false (tema escolhido manualmente), para o chamador manter o tema do app.
 */
export function useModoMapaAutomatico(
  pos: { lat: number; lon: number } | null,
  ativo = true,
): ModoMapa | null {
  const [modo, setModo] = useState<ModoMapa | null>(null);
  const lat = pos?.lat;
  const lon = pos?.lon;
  useEffect(() => {
    if (!ativo) return;
    const atualizar = () =>
      setModo((ant) =>
        modoDoMapa(new Date(), lat !== undefined && lon !== undefined ? { lat, lon } : null, ant),
      );
    atualizar();
    const id = setInterval(atualizar, 60_000);
    return () => clearInterval(id);
  }, [lat, lon, ativo]);
  return ativo ? modo : null;
}
