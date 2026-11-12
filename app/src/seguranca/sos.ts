import { distanciaKm, type Coordenada } from '@/navegacao/destinos';

/** Texto do SOS para o WhatsApp: quem, onde (link do mapa), hora e, se houver, a ficha de emergência. */
export function mensagemSOS(o: {
  nome: string;
  posicao: Coordenada | null;
  agora: Date;
  ficha?: { sangue?: string; alergias?: string; remedios?: string; plano?: string } | null;
  textos: {
    titulo: string;
    semPosicao: string;
    sangue: string;
    alergias: string;
    remedios: string;
    plano: string;
    rodape: string;
  };
}): string {
  const hora = `${String(o.agora.getHours()).padStart(2, '0')}:${String(o.agora.getMinutes()).padStart(2, '0')}`;
  const onde = o.posicao
    ? `https://maps.google.com/?q=${o.posicao.lat.toFixed(5)},${o.posicao.lng.toFixed(5)}`
    : o.textos.semPosicao;
  const f = o.ficha ?? {};
  const linhas = [
    `${o.textos.titulo} — ${o.nome} (${hora})`,
    onde,
    f.sangue && `${o.textos.sangue}: ${f.sangue}`,
    f.alergias && `${o.textos.alergias}: ${f.alergias}`,
    f.remedios && `${o.textos.remedios}: ${f.remedios}`,
    f.plano && `${o.textos.plano}: ${f.plano}`,
    o.textos.rodape,
  ];
  return linhas.filter(Boolean).join('\n');
}

/**
 * Odômetro pelo GPS (para a manutenção): soma a distância entre leituras boas.
 * Antifraude da especificação: descarta leitura imprecisa (> 50 m) e saltos acima de 200 km/h.
 */
export type Leitura = { lat: number; lng: number; precisao: number | null; tempo: number };

export function somarTrecho(anterior: Leitura | null, atual: Leitura): { km: number; valida: boolean } {
  if (atual.precisao != null && atual.precisao > 50) return { km: 0, valida: false };
  if (!anterior) return { km: 0, valida: true };
  const km = distanciaKm(anterior, atual);
  const horas = (atual.tempo - anterior.tempo) / 3_600_000;
  if (horas <= 0) return { km: 0, valida: false };
  if (km / horas > 200) return { km: 0, valida: false };
  if (km < 0.005) return { km: 0, valida: true }; // parado (ruído do GPS)
  return { km, valida: true };
}
