import {
  formatarDuracao,
  formatarKm,
  horaChegada,
  limites,
  percentualTerra,
  trechosGeoJSON,
} from './formato';

describe('formato da rota', () => {
  it.each([
    [35, '35 min'],
    [60, '1 h'],
    [95, '1 h 35 min'],
  ])('%i minutos = %s', (min, texto) => expect(formatarDuracao(min)).toBe(texto));

  it('hora de chegada com dois dígitos', () => {
    expect(horaChegada(95, new Date(2026, 10, 12, 8, 30))).toBe('10:05');
  });

  it('km com vírgula até 100 e inteiro acima', () => {
    expect(formatarKm(31.24)).toBe('31,2');
    expect(formatarKm(280.4)).toBe('280');
  });

  it('limites e porcentagem de terra', () => {
    expect(
      limites([
        { lat: -15, lng: -56 },
        { lat: -14, lng: -55 },
      ]),
    ).toEqual([-56, -15, -55, -14]);
    expect(percentualTerra(74, 31)).toBe(42);
    expect(percentualTerra(0, 0)).toBe(0);
  });

  it('GeoJSON marca cada trecho como terra ou asfalto', () => {
    const g = trechosGeoJSON([
      {
        pontos: [
          { lat: 1, lng: 2 },
          { lat: 3, lng: 4 },
        ],
        terra: false,
      },
      {
        pontos: [
          { lat: 3, lng: 4 },
          { lat: 5, lng: 6 },
        ],
        terra: true,
      },
    ]);
    expect(g.features.map((f) => f.properties.terra)).toEqual([false, true]);
    expect(g.features[0]!.geometry.coordinates[0]).toEqual([2, 1]);
  });
});
