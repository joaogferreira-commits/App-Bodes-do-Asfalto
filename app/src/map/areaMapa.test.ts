import { agapeRelevante, distanciaKm, minutosAteHorario } from './areaMapa';

const cuiaba = { lat: -15.5895, lng: -56.0861 };
const longe = { lat: -23.5, lng: -46.6 };
const ag = { lat: -15.5699, lng: -56.0731, horario: '19h30' };
const as = (h: number, m = 0) => new Date(2026, 10, 13, h, m).getTime();

describe('Ágape no banner do mapa', () => {
  it('distância aproximada', () => expect(distanciaKm(cuiaba, ag)).toBeLessThan(5));
  it('horário em minutos', () => {
    expect(minutosAteHorario('19h30', as(18, 30))).toBe(60);
    expect(minutosAteHorario('19h30', as(10))).toBe(570);
  });
  it('perto aparece em qualquer hora', () => expect(agapeRelevante(ag, cuiaba, as(8))).toBe(true));
  it('longe e começando em até 2 h aparece', () => expect(agapeRelevante(ag, longe, as(18))).toBe(true));
  it('longe e mais tarde que 2 h some', () => expect(agapeRelevante(ag, longe, as(10))).toBe(false));
  it('longe e já passou de 1 h some', () => expect(agapeRelevante(ag, longe, as(21))).toBe(false));
});
