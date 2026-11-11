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
