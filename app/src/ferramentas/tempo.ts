/** Previsão do tempo pelo Open-Meteo (gratuito, sem chave; uso comercial exige plano — rever no lançamento). */
export const SERVIDOR_TEMPO = 'https://api.open-meteo.com/v1/forecast';

export type Tempo = {
  horas: { hora: string; temperatura: number; chuva: number; vento: number }[];
  chuvaMaxima: number;
  nascer: string;
  por: string;
};

type Resposta = {
  current?: { time?: string };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
  };
  daily?: { sunrise: string[]; sunset: string[] };
};

type Buscar = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

const hhmm = (iso: string) => iso.slice(11, 16);

export async function buscarTempo(
  lat: number,
  lng: number,
  buscar: Buscar = fetch as unknown as Buscar,
  agora = new Date(),
): Promise<Tempo> {
  const q = new URLSearchParams({
    latitude: lat.toFixed(3),
    longitude: lng.toFixed(3),
    hourly: 'temperature_2m,precipitation_probability,wind_speed_10m',
    daily: 'sunrise,sunset',
    timezone: 'auto',
    forecast_days: '2',
  });
  const r = await buscar(`${SERVIDOR_TEMPO}?${q.toString()}`);
  if (!r.ok) throw new Error('tempo');
  const d = (await r.json()) as Resposta;
  const h = d.hourly;
  if (!h || !d.daily) throw new Error('tempo');
  const horaAtual = agora.getHours();
  const inicio = Math.max(
    0,
    h.time.findIndex((x) => Number(x.slice(11, 13)) >= horaAtual),
  );
  const horas = h.time.slice(inicio, inicio + 8).map((x, i) => ({
    hora: hhmm(x),
    temperatura: Math.round(h.temperature_2m[inicio + i] ?? 0),
    chuva: Math.round(h.precipitation_probability[inicio + i] ?? 0),
    vento: Math.round(h.wind_speed_10m[inicio + i] ?? 0),
  }));
  return {
    horas,
    chuvaMaxima: Math.max(0, ...horas.map((x) => x.chuva)),
    nascer: hhmm(d.daily.sunrise[0] ?? ''),
    por: hhmm(d.daily.sunset[0] ?? ''),
  };
}
