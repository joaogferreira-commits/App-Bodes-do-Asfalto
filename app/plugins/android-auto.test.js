const fs = require('fs');
const path = require('path');

// O SDK do Google exige que a tela do carro implemente estes métodos da interface
// INavigationViewController (a classe base não os implementa na versão 0.19).
const interfaceSdk = path.join(
  __dirname,
  '..',
  'node_modules/@googlemaps/react-native-navigation-sdk/android/src/main/java/com/google/android/react/navsdk/INavigationViewController.java',
);
const baseSdk = path.join(path.dirname(interfaceSdk), 'AndroidAutoBaseScreen.java');
const tela = fs.readFileSync(path.join(__dirname, 'android-auto', 'BodesCarScreen.java'), 'utf8');

describe('tela do Android Auto', () => {
  it('implementa todos os métodos da interface que a base do SDK não implementa', () => {
    const metodos = [...fs.readFileSync(interfaceSdk, 'utf8').matchAll(/void\s+(\w+)\s*\(/g)].map(
      (m) => m[1],
    );
    const base = fs.readFileSync(baseSdk, 'utf8');
    const faltando = metodos.filter((m) => !new RegExp(`public\\s+void\\s+${m}\\s*\\(`).test(base));
    for (const m of faltando) expect(tela).toMatch(new RegExp(`public\\s+void\\s+${m}\\s*\\(`));
  });

  it('todo ícone usado na tela do carro existe e toda manobra do Google tem seta', () => {
    const pasta = path.join(__dirname, 'android-auto');
    const java = fs
      .readdirSync(pasta)
      .filter((a) => a.endsWith('.java'))
      .map((a) => fs.readFileSync(path.join(pasta, a), 'utf8'))
      .join('\n');
    const usados = new Set([...java.matchAll(/R\.drawable\.(\w+)/g)].map((m) => m[1]));
    for (const d of usados) expect(fs.existsSync(path.join(pasta, 'drawable', `${d}.xml`))).toBe(true);
    const tabela = fs.readFileSync(path.join(pasta, 'ManobraCarro.java'), 'utf8');
    const tipos = path.join(
      __dirname,
      '..',
      'node_modules/@googlemaps/react-native-navigation-sdk/src/navigation/types.ts',
    );
    const enumSdk = fs.readFileSync(tipos, 'utf8').split('export enum Maneuver')[1].split('}')[0];
    const maior = Math.max(...[...enumSdk.matchAll(/=\s*(\d+)/g)].map((m) => Number(m[1])));
    expect(maior).toBe(65); // se o Google criar manobras novas, revisar ManobraCarro.java
    expect(tabela).toContain('google >= 43 && google <= 62');
    expect(tabela).toContain('google >= 21 && google <= 42');
  });
});
