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
    const metodos = [...fs.readFileSync(interfaceSdk, 'utf8').matchAll(/void\s+(\w+)\s*\(/g)].map((m) => m[1]);
    const base = fs.readFileSync(baseSdk, 'utf8');
    const faltando = metodos.filter((m) => !new RegExp(`public\\s+void\\s+${m}\\s*\\(`).test(base));
    for (const m of faltando) expect(tela).toMatch(new RegExp(`public\\s+void\\s+${m}\\s*\\(`));
  });
});
