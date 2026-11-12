/** Cálculos das ferramentas da estrada (testados em calculos.test.ts). */

/** Autonomia e paradas para abastecer, guardando uma reserva (padrão 15 % do tanque). */
export function planoCombustivel(o: {
  distanciaKm: number;
  tanqueL: number;
  consumoKmL: number;
  precoL: number;
  reserva?: number;
}) {
  const reserva = o.reserva ?? 0.15;
  const autonomia = o.tanqueL * o.consumoKmL;
  const util = autonomia * (1 - reserva);
  const litros = o.distanciaKm / o.consumoKmL;
  const paradas = util > 0 ? Math.max(0, Math.ceil(o.distanciaKm / util) - 1) : 0;
  return {
    autonomiaKm: Math.round(autonomia),
    abastecerACadaKm: Math.round(util),
    paradas,
    litros: Math.round(litros * 10) / 10,
    custo: Math.round(litros * o.precoL * 100) / 100,
  };
}

/** Divide uma viagem longa em dias, sem passar do limite de km e de horas por dia. */
export function planoViagemLonga(o: { distanciaKm: number; kmPorDia: number; mediaKmh?: number }) {
  const media = o.mediaKmh ?? 70;
  const dias = Math.max(1, Math.ceil(o.distanciaKm / Math.max(1, o.kmPorDia)));
  const kmDia = Math.round(o.distanciaKm / dias);
  const horasDia = Math.round((kmDia / media) * 10) / 10;
  // pausa de 15 min a cada 2 h pilotando (recomendação de fadiga)
  const pausasDia = Math.floor(horasDia / 2);
  return { dias, kmDia, horasDia, pausasDia };
}

/** Progresso da meta de km do ano, e quantos km por semana faltam para chegar. */
export function progressoMeta(o: { metaKm: number; feitoKm: number; hoje: Date }) {
  const fim = new Date(o.hoje.getFullYear(), 11, 31);
  const semanas = Math.max(1, Math.ceil((fim.getTime() - o.hoje.getTime()) / (7 * 864e5)));
  const falta = Math.max(0, o.metaKm - o.feitoKm);
  return {
    fracao: o.metaKm > 0 ? Math.min(1, o.feitoKm / o.metaKm) : 0,
    falta,
    porSemana: Math.ceil(falta / semanas),
  };
}

/** Próxima manutenção: km que faltam até o próximo serviço (ex.: óleo a cada 3.000 km). */
export function proximaManutencao(o: { ultimoKm: number; intervaloKm: number; kmAtual: number }) {
  const proximo = o.ultimoKm + o.intervaloKm;
  return { proximoKm: proximo, falta: proximo - o.kmAtual, vencida: o.kmAtual >= proximo };
}

/** Link do Google Maps para mandar a posição pelo WhatsApp. */
export const linkMapa = (lat: number, lng: number) =>
  `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;

export const linkWhatsApp = (texto: string, telefone?: string) =>
  `https://wa.me/${telefone ? telefone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(texto)}`;
