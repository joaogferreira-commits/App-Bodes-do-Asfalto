// Ajustes nativos exigidos pelo Google Navigation SDK (README do pacote, Android):
// desugaring da biblioteca Java e Jetifier. A versão do Kotlin (2.3+) vem do expo-build-properties.
const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

const DESUGAR = "coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs_nio:2.1.5'";

function comDesugaring(gradle) {
  let resultado = gradle;
  if (!resultado.includes('coreLibraryDesugaringEnabled')) {
    resultado = resultado.replace(
      /android\s*\{/,
      'android {\n    compileOptions {\n        coreLibraryDesugaringEnabled true\n    }',
    );
  }
  if (!resultado.includes('desugar_jdk_libs')) {
    resultado = resultado.replace(/dependencies\s*\{/, `dependencies {\n    ${DESUGAR}`);
  }
  return resultado;
}

// Jetifier (exigido pelo SDK) e ajustes para a build caber na memória do servidor grátis do EAS:
// só arm64 (celulares atuais), menos memória e menos tarefas paralelas no Gradle.
const PROPRIEDADES = {
  'android.enableJetifier': 'true',
  reactNativeArchitectures: 'arm64-v8a',
  'org.gradle.jvmargs': '-Xmx4g -XX:MaxMetaspaceSize=1g -XX:+HeapDumpOnOutOfMemoryError',
  'org.gradle.workers.max': '2',
  'org.gradle.parallel': 'false',
};

function comPropriedades(lista) {
  const resto = lista.filter((p) => !(p.type === 'property' && p.key in PROPRIEDADES));
  return [...resto, ...Object.entries(PROPRIEDADES).map(([key, value]) => ({ type: 'property', key, value }))];
}

const withNavegacaoGoogle = (config) => {
  config = withAppBuildGradle(config, (c) => {
    c.modResults.contents = comDesugaring(c.modResults.contents);
    return c;
  });
  config = withGradleProperties(config, (c) => {
    c.modResults = comPropriedades(c.modResults);
    return c;
  });
  return config;
};

module.exports = withNavegacaoGoogle;
module.exports.comDesugaring = comDesugaring;
module.exports.comPropriedades = comPropriedades;
