import type { Coordenada } from '@/navegacao/destinos';

/** Decodifica uma polyline codificada (Google/Valhalla). Valhalla usa precisão 6. */
export function decodificarPolyline(texto: string, precisao = 6): Coordenada[] {
  const fator = Math.pow(10, precisao);
  const pontos: Coordenada[] = [];
  let i = 0;
  let lat = 0;
  let lng = 0;
  const proximo = () => {
    let resultado = 0;
    let deslocamento = 0;
    let byte: number;
    do {
      byte = texto.charCodeAt(i++) - 63;
      resultado |= (byte & 0x1f) << deslocamento;
      deslocamento += 5;
    } while (byte >= 0x20);
    return resultado & 1 ? ~(resultado >> 1) : resultado >> 1;
  };
  while (i < texto.length) {
    lat += proximo();
    lng += proximo();
    pontos.push({ lat: lat / fator, lng: lng / fator });
  }
  return pontos;
}

/** Codifica (usada nos testes e para reenviar a forma ao servidor). */
export function codificarPolyline(pontos: Coordenada[], precisao = 6): string {
  const fator = Math.pow(10, precisao);
  let saida = '';
  let latAnt = 0;
  let lngAnt = 0;
  const escrever = (valor: number) => {
    let v = valor < 0 ? ~(valor << 1) : valor << 1;
    while (v >= 0x20) {
      saida += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    saida += String.fromCharCode(v + 63);
  };
  for (const p of pontos) {
    const lat = Math.round(p.lat * fator);
    const lng = Math.round(p.lng * fator);
    escrever(lat - latAnt);
    escrever(lng - lngAnt);
    latAnt = lat;
    lngAnt = lng;
  }
  return saida;
}
