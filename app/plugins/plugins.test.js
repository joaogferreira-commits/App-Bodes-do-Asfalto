const { comDesugaring } = require('./withNavegacaoGoogle');

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
