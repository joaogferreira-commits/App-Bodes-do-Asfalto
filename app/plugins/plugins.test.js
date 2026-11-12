const { comDesugaring, comPropriedades } = require('./withNavegacaoGoogle');

const gradle = `apply plugin: "com.android.application"
android {
    namespace 'com.bodesdoasfalto.app'
}
dependencies {
    implementation("com.facebook.react:react-android")
}
`;

describe('withNavegacaoGoogle', () => {
  it('liga o desugaring e adiciona a dependência', () => {
    const r = comDesugaring(gradle);
    expect(r).toContain('coreLibraryDesugaringEnabled true');
    expect(r).toContain('desugar_jdk_libs_nio:2.1.5');
  });

  it('ajusta o Gradle para caber na memória do EAS e mantém o Jetifier', () => {
    const base = [
      { type: 'property', key: 'reactNativeArchitectures', value: 'armeabi-v7a,arm64-v8a,x86,x86_64' },
      { type: 'property', key: 'newArchEnabled', value: 'true' },
    ];
    const r = Object.fromEntries(comPropriedades(comPropriedades(base)).map((p) => [p.key, p.value]));
    expect(r.reactNativeArchitectures).toBe('arm64-v8a');
    expect(r['android.enableJetifier']).toBe('true');
    expect(r['org.gradle.workers.max']).toBe('2');
    expect(r.newArchEnabled).toBe('true');
    expect(comPropriedades(comPropriedades(base))).toHaveLength(6);
  });

  it('não duplica se rodar duas vezes', () => {
    const r = comDesugaring(comDesugaring(gradle));
    expect(r.match(/coreLibraryDesugaringEnabled/g)).toHaveLength(1);
    expect(r.match(/desugar_jdk_libs/g)).toHaveLength(1);
  });
});

describe('withAndroidAuto', () => {
  const { adicionarAoManifesto } = require('./withAndroidAuto');
  const manifesto = () => ({
    manifest: { $: {}, application: [{ $: { 'android:name': '.MainApplication' } }] },
  });

  it('registra o serviço de navegação do carro, as permissões e o descritor', () => {
    const m = adicionarAoManifesto(manifesto(), 'com.bodesdoasfalto.app');
    const app = m.manifest.application[0];
    const servico = app.service[0];
    expect(servico.$['android:name']).toBe('com.bodesdoasfalto.app.auto.BodesCarAppService');
    expect(servico['intent-filter'][0].category[0].$['android:name']).toBe('androidx.car.app.category.NAVIGATION');
    expect(m.manifest['uses-permission'].map((p) => p.$['android:name'])).toEqual(
      expect.arrayContaining(['androidx.car.app.NAVIGATION_TEMPLATES', 'androidx.car.app.ACCESS_SURFACE']),
    );
    expect(app['meta-data'].map((x) => x.$['android:name'])).toContain('com.google.android.gms.car.application');
  });

  it('não duplica ao rodar duas vezes', () => {
    const m = adicionarAoManifesto(adicionarAoManifesto(manifesto(), 'com.x'), 'com.x');
    expect(m.manifest.application[0].service).toHaveLength(1);
    expect(m.manifest['uses-permission']).toHaveLength(2);
  });
});

describe('tela do carro: recursos', () => {
  const fs = require('fs');
  const path = require('path');
  const tela = fs.readFileSync(path.join(__dirname, 'android-auto', 'BodesCarScreen.java'), 'utf8');
  const desenhos = fs.readdirSync(path.join(__dirname, 'android-auto', 'drawable')).map((f) => f.replace('.xml', ''));
  const plugin = fs.readFileSync(path.join(__dirname, 'withAndroidAuto.js'), 'utf8');

  it('todo ícone usado pela tela existe como desenho vetorial', () => {
    const usados = [...tela.matchAll(/R\.drawable\.(\w+)/g)].map((m) => m[1]);
    expect(usados.length).toBe(4);
    for (const u of usados) expect(desenhos).toContain(u);
  });

  it('todo texto usado pela tela existe nos três idiomas', () => {
    const usados = [...new Set([...tela.matchAll(/R\.string\.(\w+)/g)].map((m) => m[1]))];
    for (const u of usados) expect(plugin.match(new RegExp(`${u}:`, 'g'))).toHaveLength(3);
  });

  it('no máximo 4 botões na faixa de ações (regra do Android Auto)', () => {
    expect(tela.match(/\.addAction\(botao\(/g)).toHaveLength(4);
  });
});

describe('desenhos vetoriais do carro', () => {
  const fs = require('fs');
  const path = require('path');
  const pasta = path.join(__dirname, 'android-auto', 'drawable');
  it('arcos com bandeiras separadas por espaço (o Android não lê a forma compacta)', () => {
    for (const f of fs.readdirSync(pasta)) {
      const xml = fs.readFileSync(path.join(pasta, f), 'utf8');
      for (const [, d] of xml.matchAll(/pathData="([^"]+)"/g)) {
        expect(d).not.toMatch(/[aA][\d.]+ [\d.]+ [-\d.]+ [01][01]/);
        expect(d).not.toMatch(/ 0 ?[01][01][-\d]/);
      }
    }
  });
});
